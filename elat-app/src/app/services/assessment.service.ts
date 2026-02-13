import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, of, tap } from 'rxjs';
import { AssessmentData, AssessmentSection } from '../models/assessment.model';
import { AuthService } from '../core/auth/auth.service';
import { environment } from '../../environments/environment';

import { AdminService } from '../core/admin/admin.service';

@Injectable({
  providedIn: 'root'
})
export class AssessmentService {
  private dataUrl = 'assets/data/assessment-data.json';
  private apiUrl = `${environment.apiUrl}/api/assessments`;

  // Dependencies
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private adminService = inject(AdminService);

  // Signals for state
  sections = signal<AssessmentSection[]>([]);
  transversalComponents = signal<string[]>([]);

  // Current state
  status = signal<import('../models/assessment.model').AssessmentStatus>('DRAFT');
  answers = signal<Record<string, number>>({});
  comments = signal<Record<string, string>>({});
  proofLinks = signal<Record<string, string>>({});
  proofPhotos = signal<Record<string, string>>({});
  context = signal<import('../models/assessment.model').AssessmentContext | null>(null);

  // Metadata Signals
  submittedBy = signal<string | undefined>(undefined);
  submittedAt = signal<string | undefined>(undefined);
  validatedBy = signal<string | undefined>(undefined);
  validatedAt = signal<string | undefined>(undefined);

  // History Log
  history = signal<import('../models/assessment.model').AssessmentHistoryItem[]>([]);

  constructor() {
    this.loadData();
    this.restoreLastContext();

    // Auto-Sync on Reconnect
    window.addEventListener('online', () => {
      console.log('🌐 Network restored! Attempting auto-sync...');
      this.sync();
    });
  }

  private restoreLastContext() {
    const last = localStorage.getItem('elat-last-context');
    if (last) {
      try {
        const ctx = JSON.parse(last);
        if (ctx && ctx.country && ctx.base) {
          console.log('Restoring last context:', ctx);
          this.initializeAssessment(ctx);
        }
      } catch (e) {
        console.error('Failed to restore last context', e);
      }
    }
  }

  /**
   * Clears the active context (e.g. when returning to the dashboard list).
   * Does NOT delete the data from storage, just clears the in-memory session.
   */
  clearActiveContext() {
    this.context.set(null);
    this.answers.set({});
    this.comments.set({});
    this.status.set('DRAFT');
    this.submittedBy.set(undefined);
    this.submittedAt.set(undefined);
    this.validatedBy.set(undefined);
    this.validatedAt.set(undefined);
    this.history.set([]);
  }

  initializeAssessment(ctx: import('../models/assessment.model').AssessmentContext) {
    this.context.set(ctx);
    this.loadStateForContext(ctx);
  }

  // Generate unique key based on Context
  private getStorageKey(ctx: import('../models/assessment.model').AssessmentContext): string {
    // Key format: elat-assessment-{country}-{base}-{month}
    return `elat-assessment-${ctx.country}-${ctx.base}-${ctx.evaluationMonth}`.replace(/\s+/g, '_');
  }

  resetAnswers() {
    const currentAnswers = this.answers();
    const reset: Record<string, number> = {};

    // Clear all answers (uncheck everything)
    this.sections().forEach(section => {
      section.questions.forEach(q => {
        reset[q.id] = null as any;
      });
    });

    this.answers.set(reset);
    this.status.set('DRAFT'); // Reset status to draft
    this.addToHistory('RESET', 'All answers reset to N/A');
    this.saveAssessmentSnapshot('Reset');
    this.saveState();
  }

  // --- History Helper ---
  private addToHistory(action: string, details?: string) {
    const user = this.authService.currentUser();
    const userName = user ? `${user.name} (${user.role})` : 'System/Offline';

    const entry: import('../models/assessment.model').AssessmentHistoryItem = {
      date: new Date().toISOString(),
      user: userName,
      action: action,
      details: details
    };

    this.history.update(h => [...h, entry]);
    // Note: We don't saveState here automatically to avoid recursion if called from saveState-related logic,
    // but in most cases consumption should follow with saveState() or be part of it.
  }

  private loadData() {
    // 1. Attempt to load from Backend
    this.adminService.getConfig().subscribe({
      next: (config) => {
        if (config && config.sections && config.sections.length > 0) {
          console.log('✅ Loaded configuration from Backend');
          this.sections.set(config.sections);
          // Fetch transversal components from default JSON as they change rarely
          this.fetchDefaultTransversal();
        } else {
          console.log('⚠️ No backend config found, checking LocalStorage/Default...');
          this.loadFromLocalOrDefault();
        }
      },
      error: (err) => {
        console.error('❌ Failed to load backend config', err);
        this.loadFromLocalOrDefault();
      }
    });
  }

  private fetchDefaultTransversal() {
    this.http.get<AssessmentData>(this.dataUrl).pipe(
      tap(data => this.transversalComponents.set(data.transversalComponents)),
      catchError(() => of(null))
    ).subscribe();
  }

  private loadFromLocalOrDefault() {
    // Try to load custom config from LocalStorage first
    const customSections = localStorage.getItem('elat-config-sections');
    if (customSections) {
      try {
        const sections = JSON.parse(customSections);
        if (Array.isArray(sections) && sections.length > 0) {
          this.sections.set(sections);
          this.fetchDefaultTransversal();
          console.log('Loaded custom assessment config from storage (Legacy)');
          return;
        }
        console.warn('Found custom config in storage but it was empty/invalid. Falling back to default.');
      } catch (e) {
        console.error('Failed to parse custom config', e);
      }
    }

    // Default to JSON file
    this.http.get<AssessmentData>(this.dataUrl).pipe(
      tap(data => {
        this.sections.set(data.sections);
        this.transversalComponents.set(data.transversalComponents);
        console.log('Assessment data loaded from Default JSON');
      }),
      catchError(err => {
        console.error('Failed to load assessment data', err);
        return of(null);
      })
    ).subscribe();
  }

  setAnswer(questionId: string, value: number) {
    if (this.status() === 'SUBMITTED' || this.status() === 'VALIDATED') {
      console.warn('Cannot edit a submitted/validated assessment');
      return;
    }
    this.answers.update(current => ({ ...current, [questionId]: value }));
    this.saveState();
  }

  setComment(questionId: string, value: string) {
    if (this.status() === 'SUBMITTED' || this.status() === 'VALIDATED') return;
    this.comments.update(current => ({ ...current, [questionId]: value }));
    this.saveState();
  }

  setProofLink(questionId: string, value: string) {
    if (this.status() === 'SUBMITTED' || this.status() === 'VALIDATED') return;
    this.proofLinks.update(current => ({ ...current, [questionId]: value }));
    this.saveState();
  }

  setProofPhoto(questionId: string, value: string) {
    if (this.status() === 'SUBMITTED' || this.status() === 'VALIDATED') return;
    this.proofPhotos.update(current => ({ ...current, [questionId]: value }));
    this.saveState();
  }

  // --- Lifecycle Actions ---

  submitAssessment() {
    if (confirm('Confirm submission? You will not be able to edit answers anymore.')) {
      this.status.set('SUBMITTED');

      const user = this.authService.currentUser();
      const name = user ? user.name : 'Unknown User';
      const role = user ? user.role : 'Unknown Role';

      this.submittedBy.set(`${name} (${role})`);
      this.submittedAt.set(new Date().toISOString());

      this.addToHistory('SUBMITTED', 'Assessment submitted for validation');
      this.saveState();
      this.saveAssessmentSnapshot('Submission'); // Trigger sync
    }
  }

  validateAssessment() {
    if (confirm('Validate this assessment? This marks the evaluation as final.')) {
      this.status.set('VALIDATED');

      const user = this.authService.currentUser();
      const name = user ? user.name : 'Unknown User';
      const role = user ? user.role : 'Unknown Role';

      this.validatedBy.set(`${name} (${role})`);
      this.validatedAt.set(new Date().toISOString());

      this.addToHistory('VALIDATED', 'Assessment validated and finalized');
      this.saveState();
      this.saveAssessmentSnapshot('Validation'); // Trigger sync
    }
  }

  unlockAssessment() {
    if (confirm('Unlock assessment? This will revert status to DRAFT and allow editing. NOTE: Submission logs will be cleared.')) {
      this.status.set('DRAFT');

      // Clear logs
      this.submittedBy.set(undefined);
      this.submittedAt.set(undefined);
      this.validatedBy.set(undefined);
      this.validatedAt.set(undefined);

      this.addToHistory('UNLOCKED', 'Assessment unlocked (reverted to Draft)');
      this.saveState();
    }
  }

  private saveState() {
    const ctx = this.context();
    if (!ctx) return;

    const state: import('../models/assessment.model').AssessmentState = {
      status: this.status(),
      answers: this.answers(),
      comments: this.comments(),
      proofLinks: this.proofLinks(),
      proofPhotos: this.proofPhotos(),
      context: ctx,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),

      // Save Calculated Score
      score: this.getGlobalScore(),

      // Save logs
      submittedBy: this.submittedBy(),
      submittedAt: this.submittedAt(),
      validatedBy: this.validatedBy(),
      validatedAt: this.validatedAt(),

      // History
      history: this.history()
    };

    const key = this.getStorageKey(ctx);
    localStorage.setItem(key, JSON.stringify(state));

    localStorage.setItem('elat-last-context', JSON.stringify(ctx));
  }

  private loadStateForContext(ctx: import('../models/assessment.model').AssessmentContext) {
    const key = this.getStorageKey(ctx);
    const saved = localStorage.getItem(key);

    if (saved) {
      try {
        const state = JSON.parse(saved);
        this.answers.set(state.answers || {});
        this.comments.set(state.comments || {});
        this.proofLinks.set(state.proofLinks || {});
        this.proofPhotos.set(state.proofPhotos || {});
        this.status.set(state.status || 'DRAFT');

        // Load Logs
        this.submittedBy.set(state.submittedBy);
        this.submittedAt.set(state.submittedAt);
        this.validatedBy.set(state.validatedBy);
        this.validatedAt.set(state.validatedAt);
        this.history.set(state.history || []);

        console.log(`Loaded state for ${key}`, state);
      } catch (e) {
        console.error('Failed to parse saved state', e);
        this.resetToEmpty();
      }
    } else {
      console.log(`No saved state for ${key}, starting fresh.`);
      this.resetToEmpty();
      this.addToHistory('CREATED', 'New assessment started');
      this.saveState();
    }
  }

  private resetToEmpty() {
    this.answers.set({});
    this.comments.set({});
    this.proofLinks.set({});
    this.proofPhotos.set({});
    this.status.set('DRAFT');

    // Clear logs
    this.submittedBy.set(undefined);
    this.submittedAt.set(undefined);
    this.validatedBy.set(undefined);
    this.validatedAt.set(undefined);
    this.history.set([]);
  }

  // --- List Management ---
  getAllSavedAssessments(): import('../models/assessment.model').AssessmentState[] {
    const assessments: import('../models/assessment.model').AssessmentState[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('elat-assessment-')) {
        try {
          const raw = localStorage.getItem(key);
          if (raw) {
            const state = JSON.parse(raw);
            // valid state has context
            if (state.context) {
              assessments.push(state);
            }
          }
        } catch (e) {
          console.error('Error parsing assessment key', key, e);
        }
      }
    }

    // Sort by updatedAt descending
    if (assessments.length > 0) {
      assessments.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    }

    // --- Data Isolation Filter ---
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        console.log('Assessment Filter - User:', user);

        // Super Admins see everything
        if (user.role === 'SUPER_ADMIN') return assessments;

        // Coordinators see everything in their assignments
        if (user.role.includes('COORDINATOR')) {
          // Determine Allowed Countries (Handle empty array issue)
          let allowedCountries: string[] = [];
          if (Array.isArray(user.assignedCountries) && user.assignedCountries.length > 0) {
            allowedCountries = user.assignedCountries;
          } else if (user.assignedCountry) {
            allowedCountries = [user.assignedCountry];
          }

          console.log('Assessment Filter - Coordinator Allowed Countries:', allowedCountries);

          const filtered = assessments.filter(a => {
            const match = a.context && allowedCountries.includes(a.context.country);
            console.log(`Checking ${a.context?.country}: ${match ? 'KEEP' : 'DROP'}`);
            return match;
          });
          return filtered;
        }

        // Users see only their Base
        if (user.role === 'USER') {
          return assessments.filter(a =>
            a.context &&
            a.context.country === user.assignedCountry &&
            a.context.base === user.assignedBase
          );
        }
      }
    } catch (e) {
      console.error('Error filtering assessments', e);
    }

    return assessments;
  }

  // History management
  saveAssessmentSnapshot(name: string = 'Auto-save') {
    const history = this.getHistory();
    const snapshot = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      name: name,
      score: this.getGlobalScore(),
      answers: this.answers(),
      synced: false,
      country: this.context()?.country || 'Unknown',
      base: this.context()?.base || 'Unknown',
      evaluationMonth: this.context()?.evaluationMonth || ''
    };
    history.push(snapshot);
    localStorage.setItem('elat-history', JSON.stringify(history));

    this.sync();
  }

  hasUnsyncedChanges() {
    const history = this.getHistory();
    return history.some((h: any) => !h.synced);
  }

  getHistory(): any[] {
    const saved = localStorage.getItem('elat-history');
    return saved ? JSON.parse(saved) : [];
  }

  // --- Scoring Helper ---
  private calculateScore(answers: Record<string, number>, sections: AssessmentSection[]): number {
    if (!sections || sections.length === 0) return 0;

    let totalPoints = 0;
    let maxPoints = 0;

    sections.forEach(s => {
      s.questions.forEach(q => {
        const val = answers[q.id];
        // Robust check for NA
        if (val !== undefined && val != -1) {
          totalPoints += (val * q.weight);
          maxPoints += (1 * q.weight);
        }
      });
    });

    return maxPoints > 0 ? Math.round((totalPoints / maxPoints) * 100) : 0;
  }

  // --- Scoring & Progress Logic ---

  getGlobalProgress(): number {
    const sections = this.sections();
    if (sections.length === 0) return 0;

    let totalQuestions = 0;
    let answeredQuestions = 0;

    sections.forEach(s => {
      s.questions.forEach(q => {
        totalQuestions++;
        const val = this.answers()[q.id];
        if (val !== undefined && val !== null) {
          answeredQuestions++;
        }
      });
    });

    return totalQuestions > 0 ? Math.round((answeredQuestions / totalQuestions) * 100) : 0;
  }

  getGlobalScore(): number {
    return this.calculateScore(this.answers(), this.sections());
  }

  getSectionProgress(sectionId: string): number {
    // ... existing implementation ...
    const section = this.sections().find(s => s.id === sectionId);
    if (!section) return 0;

    let total = section.questions.length;
    let answered = 0;

    section.questions.forEach(q => {
      const val = this.answers()[q.id];
      if (val !== undefined && val !== null) answered++;
    });

    return total > 0 ? Math.round((answered / total) * 100) : 0;
  }

  getSectionScore(sectionId: string): number {
    const section = this.sections().find(s => s.id === sectionId);
    if (!section) return 0;
    // Reuse helper logic for single section? Or keep as is.
    // Keeping as is for minimal diff, but logic is same.
    let totalPoints = 0;
    let maxPoints = 0;

    section.questions.forEach(q => {
      const val = this.answers()[q.id];
      if (val !== undefined && val != -1) {
        totalPoints += (val * q.weight);
        maxPoints += (1 * q.weight);
      }
    });

    return maxPoints > 0 ? Math.round((totalPoints / maxPoints) * 100) : 0;
  }

  // Legacy support
  getCompletionPercentage(): number {
    return this.getGlobalScore();
  }

  // --- NA Calculation ---
  getGlobalNArate(): number {
    const sections = this.sections();
    if (sections.length === 0) return 0;
    let total = 0;
    let naCount = 0;
    sections.forEach(s => {
      s.questions.forEach(q => {
        total++;
        if (this.answers()[q.id] === -1) naCount++;
      });
    });
    return total > 0 ? Math.round((naCount / total) * 100) : 0;
  }

  getSectionNArate(sectionId: string): number {
    const section = this.sections().find(s => s.id === sectionId);
    if (!section) return 0;
    let total = section.questions.length;
    let naCount = 0;
    section.questions.forEach(q => {
      if (this.answers()[q.id] === -1) naCount++;
    });
    return total > 0 ? Math.round((naCount / total) * 100) : 0;
  }





  // --- Synchronization Logic ---

  async sync() {
    console.log('🔄 Attempting Bidirectional Sync...');
    if (!navigator.onLine) {
      console.log('❌ Offline: Skipping sync');
      return;
    }

    const unsynced = this.getAllSavedAssessments().filter(a => !a.synced);

    // We always sync, even if unsynced is empty, to PULL server updates
    console.log(`📤 Push: Found ${unsynced.length} items to sync`);

    const token = localStorage.getItem('token');
    if (!token) {
      console.log('⚠️ No token: Cannot sync');
      return;
    }

    try {
      const headers = { 'x-auth-token': token };
      const lastSyncTimestamp = localStorage.getItem('elat-last-sync-timestamp');

      // Prepare payload with calculated scores if missing
      const changes = unsynced.map(a => {
        let score = a.score;
        if (score === undefined) {
          console.log(`Calculating missing score for ${a.id || 'unsynced item'}`);
          score = this.calculateScore(a.answers, this.sections());
        }

        return {
          ...a,
          id: a.id || crypto.randomUUID(), // Ensure ID
          score: score, // Enforce score presence
          userId: this.authService.currentUser()?.id
        };
      });

      const payload = {
        changes: changes,
        lastSyncTimestamp: lastSyncTimestamp || null
      };

      this.http.post<any>(`${this.apiUrl}/sync`, payload, { headers })
        .subscribe({
          next: (res) => {
            console.log('✅ Sync successful!', res);

            // 1. Mark Applied as Synced
            if (res.applied && res.applied.length > 0) {
              res.applied.forEach((syncedId: string) => {
                this.markAsSynced(syncedId);
              });
            }

            // 2. Apply Server Updates (Pull)
            if (res.serverUpdates && res.serverUpdates.length > 0) {
              console.log(`📥 Pull: Received ${res.serverUpdates.length} updates from server`);
              this.applyServerUpdates(res.serverUpdates);
            }

            // 3. Update Sync Timestamp
            localStorage.setItem('elat-last-sync-timestamp', res.timestamp);

            // 4. Force UI Refresh
            // If the current context was updated, reload it
            const currentCtx = this.context();
            if (currentCtx) {
              const key = this.getStorageKey(currentCtx);
              const currentId = localStorage.getItem(key + '_id');
              // We might need a better way to check if current doc was updated
              // For now, re-load state if we suspect changes
              this.loadStateForContext(currentCtx);
            }
          },
          error: (err) => console.error('❌ Sync failed', err)
        });
    } catch (e) {
      console.error('❌ Sync error', e);
    }
  }

  // Helper: Mark local item as synced
  private markAsSynced(idOrContextKey: string) {
    // We store by Context Key in LocalStorage, but Server sends IDs
    // We need to find the LocalStorage key for this ID
    // Naive approach: Iterate all
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('elat-assessment-')) {
        try {
          const raw = localStorage.getItem(key);
          if (raw) {
            const state = JSON.parse(raw);
            // Match by ID if present, or we can assume the server returned the ID we sent
            if (state.id === idOrContextKey || !state.id) {
              // If no ID locally, we assume it was the one we just sent. 
              // In reality, we should store IDs locally.
              // Let's blindly mark as synced if it was in the 'unsynced' list we sent.
              state.synced = true;
              state.id = idOrContextKey; // Update ID if server assigned one
              localStorage.setItem(key, JSON.stringify(state));
            }
          }
        } catch (e) { }
      }
    }
  }

  // Helper: Apply Server Updates
  private applyServerUpdates(updates: any[]) {
    updates.forEach(serverDoc => {
      if (!serverDoc.context) return;

      const key = this.getStorageKey(serverDoc.context);
      const localJson = localStorage.getItem(key);

      if (localJson) {
        const localDoc = JSON.parse(localJson);

        // Conflict Detection
        // If local is dirty (unsynced) and updated recently
        if (!localDoc.synced) {
          console.warn(`⚠️ Conflict detected for ${key}. Server has newer version.`);
          // Strategy: Save Server version as Main, Move Local to "Conflict Copy"
          const conflictKey = key + '_CONFLICT_' + Date.now();
          localStorage.setItem(conflictKey, JSON.stringify(localDoc));
          console.log(`Saved local conflict to ${conflictKey}`);

          this.addToHistory('CONFLICT', `Detected conflict with server. Local copy saved to ${conflictKey}`);
          this.checkConflicts(); // Update signal
        }
      }

      // Overwrite Local with Server
      serverDoc.synced = true;
      localStorage.setItem(key, JSON.stringify(serverDoc));
      this.addToHistory('SYNC', 'Assessment merged with server update');
    });
  }

  // --- Conflict Management ---
  conflicts = signal<{ key: string, date: Date, originalKey: string }[]>([]);

  checkConflicts() {
    const list: { key: string, date: Date, originalKey: string }[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.includes('_CONFLICT_')) {
        // key format: elat-assessment-..._CONFLICT_123456789
        const parts = key.split('_CONFLICT_');
        const originalKey = parts[0];
        const timestamp = parseInt(parts[1]);
        list.push({ key, date: new Date(timestamp), originalKey });
      }
    }
    this.conflicts.set(list.sort((a, b) => b.date.getTime() - a.date.getTime()));
  }

  restoreConflict(conflict: { key: string, originalKey: string }) {
    const raw = localStorage.getItem(conflict.key);
    if (raw) {
      // 1. Restore content to original key
      const data = JSON.parse(raw);
      data.synced = false; // Mark as unsynced so it pushes to server
      localStorage.setItem(conflict.originalKey, JSON.stringify(data));

      // 2. Remove conflict file
      localStorage.removeItem(conflict.key);

      // 3. Update UI
      this.checkConflicts();
      this.addToHistory('RESOLVED', 'Restored local conflict version.');

      // 4. Reload if current context
      const currentCtx = this.context();
      if (currentCtx && this.getStorageKey(currentCtx) === conflict.originalKey) {
        this.loadStateForContext(currentCtx);
        alert('Conflict version restored. Please Sync to push changes.');
      }
    }
  }

  discardConflict(key: string) {
    localStorage.removeItem(key);
    this.checkConflicts();
  }

  getRemoteHistory() {
    const token = localStorage.getItem('token');
    const headers = { 'x-auth-token': token || '' };
    return this.http.get<any[]>(`${this.apiUrl}/history`, { headers });
  }

  deleteRemoteAssessment(id: string) {
    const token = localStorage.getItem('token');
    const headers = { 'x-auth-token': token || '' };
    return this.http.delete(`${this.apiUrl}/${id}`, { headers });
  }

  // --- Export Logic ---
  exportToCSV() {
    const context = this.context();
    const sections = this.sections();
    const answers = this.answers();
    const proofLinks = this.proofLinks();
    const proofPhotos = this.proofPhotos();

    if (!context) {
      alert('No assessment context found. Cannot export.');
      return;
    }

    let user = 'Unknown';
    try {
      const userData = localStorage.getItem('user');
      if (userData) user = JSON.parse(userData).name;
    } catch (e) { }

    let csvContent = "Country,Base,EvaluationMonth,Date,User,Section,QuestionID,QuestionText,Weight,Answer,Score,MaxScore,Comment,ProofLink,ProofPhoto\n";

    sections.forEach((section: AssessmentSection) => {
      section.questions.forEach((q: any) => {
        const answerVal = answers[q.id];
        let score = 0;
        let maxScore = 0;
        let answerText = "N/A";

        if (answerVal !== undefined && answerVal !== -1) {
          score = answerVal * q.weight;
          maxScore = 1 * q.weight;
          answerText = answerVal.toString();
        } else if (answerVal === -1) {
          answerText = "N/A";
        } else {
          answerText = "";
        }

        const comment = (this.comments()[q.id] || "").replace(/,/g, " ").replace(/\n/g, " ");
        const link = (proofLinks[q.id] || "").replace(/,/g, " ");

        let photo = proofPhotos[q.id] || "";
        if (photo.length > 200 && !photo.startsWith('http')) {
          photo = "(Offline Photo)";
        }

        const qText = q.text.replace(/,/g, " ");
        const sTitle = section.title.replace(/,/g, " ");

        const row = [
          context.country,
          context.base,
          context.evaluationMonth,
          context.date,
          user,
          sTitle,
          q.id,
          qText,
          q.weight,
          answerText,
          score,
          maxScore,
          comment,
          link,
          photo
        ].join(",");

        csvContent += row + "\n";
      });
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    const filename = `ELAT_Export_${context.base}_${context.evaluationMonth}.csv`;

    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
