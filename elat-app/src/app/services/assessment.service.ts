import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, of, tap } from 'rxjs';
import { AssessmentData, AssessmentSection } from '../models/assessment.model';
import { AuthService } from '../core/auth/auth.service';
import { environment } from '../../environments/environment';

import { AdminService } from '../core/admin/admin.service';
import { ConnectivityService } from '../core/services/connectivity.service';

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
  private connectivityService = inject(ConnectivityService);

  // Signals for state
  sections = signal<AssessmentSection[]>([]);
  transversalComponents = signal<string[]>([]);
  lastSyncedAt = signal<Date | null>(null);

  // Current state
  status = signal<import('../models/assessment.model').AssessmentStatus>('DRAFT');
  answers = signal<Record<string, number>>({});
  comments = signal<Record<string, string>>({});
  proofLinks = signal<Record<string, string>>({});
  proofPhotos = signal<Record<string, string>>({});
  context = signal<import('../models/assessment.model').AssessmentContext | null>(null);

  // Metadata Signals
  userId = signal<string | undefined>(undefined);
  submittedBy = signal<string | undefined>(undefined);
  submittedAt = signal<string | undefined>(undefined);
  validatedBy = signal<string | undefined>(undefined);
  validatedAt = signal<string | undefined>(undefined);

  // History Log
  history = signal<import('../models/assessment.model').AssessmentHistoryItem[]>([]);

  // Action Plan
  actionPlan = signal<import('../models/assessment.model').ActionItem[]>([]);

  // UX State
  isSyncing = signal<boolean>(false);
  lastSaved = signal<Date | null>(null);
  allAssessments = signal<import('../models/assessment.model').AssessmentState[]>([]);

  constructor() {
    this.loadData();
    this.refreshAllAssessments();
  }

  refreshAllAssessments(remoteData?: import('../models/assessment.model').AssessmentState[]) {
    const local = this.getAllSavedAssessments();
    
    if (!remoteData) {
      this.allAssessments.set(local);
      return;
    }

    // MERGE LOGIC:
    // 1. Start with remote data as base
    // 2. Identify local versions by context key
    // 3. If local is newer OR unsynced, keep local. Otherwise use remote.
    
    const mergedMap = new Map<string, import('../models/assessment.model').AssessmentState>();
    
    // Add remote first
    remoteData.forEach(rem => {
      const anyRem = rem as any;
      // Server doesn't use 'context' object sometimes? Reconstruct for keying
      const ctx: import('../models/assessment.model').AssessmentContext = rem.context || { 
        country: anyRem.country, 
        base: anyRem.base, 
        evaluationMonth: anyRem.evaluationMonth,
        date: anyRem.updatedAt || anyRem.date || new Date().toISOString()
      };
      const key = this.getStorageKey(ctx);
      mergedMap.set(key, { ...rem, context: ctx, synced: true });
    });

    // Merge local
    const currentUser = this.authService.currentUser();
    local.forEach(loc => {
      if (!loc.context) return;
      const key = this.getStorageKey(loc.context);
      const existing = mergedMap.get(key);

      // --- CRITICAL METADATA PROTECTION ---
      // If we have a remote version (existing) and a local version (loc)
      if (existing) {
          // 1. Normalize IDs to strings for robust comparison
          const locUid = loc.userId?.toString();
          const extUid = existing.userId?.toString();
          
          // 2. If it's MY assessment (local knows better), force my metadata into the remote object
          if (currentUser && (locUid === currentUser.id || loc.submittedBy === currentUser.name)) {
              existing.userId = currentUser.id;
              existing.submittedBy = currentUser.name;
          } else {
              // 3. Otherwise, just fill gaps
              if (!existing.submittedBy && loc.submittedBy) existing.submittedBy = loc.submittedBy;
              if (!existing.userId && loc.userId) existing.userId = loc.userId;
          }
      }

      if (!existing || !loc.synced || new Date(loc.updatedAt).getTime() > new Date(existing.updatedAt).getTime()) {
        mergedMap.set(key, loc);
      }
    });

    // Final sorting and normalization pass on the resulting array
    const final = Array.from(mergedMap.values()).map(a => {
        // Force userId to string to avoid MongoDB object leakage
        if (a.userId && typeof a.userId !== 'string') {
            a.userId = (a.userId as any).toString();
        }
        return a;
    }).sort((a, b) => 
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );

    this.allAssessments.set(final);
  }

  // ... existing code ...



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
    
    // Load any existing saved state first
    this.loadStateForContext(ctx);

    // Then set owner info: overwrite only if missing (new assessment or old one with no author)
    const currentUser = this.authService.currentUser();
    if (currentUser) {
        if (!this.userId()) this.userId.set(currentUser.id);
        if (!this.submittedBy()) this.submittedBy.set(currentUser.name);
        // Always save to persist author if it was missing
        this.saveState();
    }
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
      details: details,
      score: this.getGlobalScore() // Snapshot of score
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

  // --- Action Plan Management ---

  addAction(item: Omit<import('../models/assessment.model').ActionItem, 'id'>) {
    if (this.status() === 'SUBMITTED' || this.status() === 'VALIDATED') return;

    const newAction: import('../models/assessment.model').ActionItem = {
      ...item,
      id: crypto.randomUUID()
    };

    this.actionPlan.update(plan => [...plan, newAction]);
    this.saveState();
  }

  updateAction(id: string, updates: Partial<import('../models/assessment.model').ActionItem>) {
    if (this.status() === 'SUBMITTED' || this.status() === 'VALIDATED') return;

    this.actionPlan.update(plan => plan.map(a => a.id === id ? { ...a, ...updates } : a));
    this.saveState();
  }

  deleteAction(id: string) {
    if (this.status() === 'SUBMITTED' || this.status() === 'VALIDATED') return;

    this.actionPlan.update(plan => plan.filter(a => a.id !== id));
    this.saveState();
  }

  setActionPlan(actions: import('../models/assessment.model').ActionItem[]) {
    if (this.status() === 'SUBMITTED' || this.status() === 'VALIDATED') return;
    this.actionPlan.set(actions);
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

    const existingRaw = localStorage.getItem(this.getStorageKey(ctx));
    let existingId: string | undefined;
    let existingUserId: string | undefined;
    let existingCreatedAt: string | undefined;

    if (existingRaw) {
        try {
            const parsed = JSON.parse(existingRaw);
            existingId = parsed.id;
            existingUserId = parsed.userId;
            existingCreatedAt = parsed.createdAt;
        } catch (e) {}
    }

    const state: import('../models/assessment.model').AssessmentState = {
      id: existingId, // Preserve existing ID or let it be assigned by server
      status: this.status(),
      answers: this.answers(),
      comments: this.comments(),
      proofLinks: this.proofLinks(),
      proofPhotos: this.proofPhotos(),
      context: ctx,
      createdAt: existingCreatedAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      synced: false, // Mark as dirty

      // Save Calculated Score
      score: this.getGlobalScore(),

      // Save logs
      userId: this.userId() || existingUserId,
      submittedBy: this.submittedBy(),
      submittedAt: this.submittedAt(),
      validatedBy: this.validatedBy(),
      validatedAt: this.validatedAt(),

      // History
      history: this.history(),
      actionPlan: this.actionPlan()
    };

    const key = this.getStorageKey(ctx);
    localStorage.setItem(key, JSON.stringify(state));

    localStorage.setItem('elat-last-context', JSON.stringify(ctx));
    this.lastSaved.set(new Date());
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
        this.userId.set(state.userId);
        this.submittedBy.set(state.submittedBy);
        this.submittedAt.set(state.submittedAt);
        this.validatedBy.set(state.validatedBy);
        this.validatedAt.set(state.validatedAt);
        this.history.set(state.history || []);
        this.actionPlan.set(state.actionPlan || []);

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
    // NOTE: Do NOT reset userId/submittedBy here - they are set by initializeAssessment after this call
    this.submittedAt.set(undefined);
    this.validatedBy.set(undefined);
    this.validatedAt.set(undefined);
    this.history.set([]);
    this.actionPlan.set([]);
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

  deleteAssessment(assessment: import('../models/assessment.model').AssessmentState) {
    if (!assessment.context) return;
    const key = this.getStorageKey(assessment.context);
    
    // Attempt local removal
    localStorage.removeItem(key);
    
    // If it has an ID, request server deletion (ignoring any online/offline check for simplicity, or we can use navigator.onLine)
    if (navigator.onLine && assessment.id) {
       this.http.delete(`${this.apiUrl}/${assessment.id}`).subscribe({
           next: () => console.log('Successfully deleted draft on server'),
           error: (err) => console.error('Failed to delete on server', err)
       });
    }

    this.refreshAllAssessments();
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
      evaluationMonth: this.context()?.evaluationMonth || '',
      actionPlan: this.actionPlan()
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
    if (!this.connectivityService.isOnline()) {
      console.log('❌ Offline: Skipping sync');
      return;
    }

    this.isSyncing.set(true); // Start Spinner

    const token = localStorage.getItem('token');
    const headers = { 'x-auth-token': token || '' };

    const unsynced = this.getAllSavedAssessments().filter(a => !a.synced);
    console.log(`📤 Push: Found ${unsynced.length} items to sync`);

    // 1. PUSH Local Changes
    if (unsynced.length > 0) {
      // Flatten context for server compatibility
      const payload = unsynced.map(a => ({
        ...a,
        country: a.context?.country,
        base: a.context?.base,
        evaluationMonth: a.context?.evaluationMonth,
      }));
      this.http.post(this.apiUrl + '/sync', payload, { headers }).subscribe({
        next: (res: any) => {
          console.log('✅ Sync successful:', res);

          // Mark as synced
          if (res.applied && res.applied.length > 0) {
            res.applied.forEach((id: string) => this.markAsSynced(id));
          }

          // Pull updates after push
          if (res.serverUpdates && res.serverUpdates.length > 0) {
            this.applyServerUpdates(res.serverUpdates);
            this.refreshAllAssessments(res.serverUpdates);
          } else {
            this.refreshAllAssessments();
          }
          this.lastSyncedAt.set(new Date());
          this.isSyncing.set(false); // Stop Spinner
        },
        error: (err) => {
          console.error('❌ Sync failed:', err);
          this.isSyncing.set(false); // Stop Spinner
        }
      });
    } else {
      // Just Pull (if nothing to push)
      this.http.get<any[]>(this.apiUrl + '/history', { headers }).subscribe({
        next: (remoteAssessments) => {
          if (remoteAssessments && remoteAssessments.length > 0) {
            this.applyServerUpdates(remoteAssessments);
          }
          this.refreshAllAssessments(remoteAssessments);
          this.lastSyncedAt.set(new Date());
          this.isSyncing.set(false);
        },
        error: (err) => {
          console.error('Failed to pull updates', err);
          this.isSyncing.set(false);
        }
      });
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
      // Reconstruct context from flat server fields if missing
      if (!serverDoc.context && serverDoc.country) {
        serverDoc.context = {
          country: serverDoc.country,
          base: serverDoc.base,
          evaluationMonth: serverDoc.evaluationMonth
        };
      }
      if (!serverDoc.context) return;

      const key = this.getStorageKey(serverDoc.context);
      const localJson = localStorage.getItem(key);

      if (localJson) {
        const localDoc = JSON.parse(localJson);
        const serverTime = new Date(serverDoc.updatedAt || 0).getTime();
        const localTime = new Date(localDoc.updatedAt || 0).getTime();

        // If local is dirty and server is actually older than what we have locally
        // (Should be rare since backend is supposed to return the latest merged version)
        if (!localDoc.synced && localTime > serverTime) {
          console.log(`⏭️ Local version is newer for ${key}, keeping local.`);
          return;
        }

        // If there was a conflict (both dirty), the backend merged them.
        // We'll trust the server version as the 'Merged Truth' but we can log it.
        if (!localDoc.synced) {
          console.log(`🤝 Merged conflict for ${key} resolved by server.`);
          // Optional: we could still save a backup of localDoc if we are paranoid
        }
      }

      // Save server version locally — but preserve critical local metadata
      // that the server may not have or may return in a different format.
      serverDoc.synced = true;
      if (!serverDoc.updatedAt) {
        serverDoc.updatedAt = new Date().toISOString();
      }

      // === KEY FIX: Preserve local userId and submittedBy ===
      // Always normalize to strings and prioritize current user session info
      const currentUser = this.authService.currentUser();
      if (localJson) {
        try {
          const localDoc = JSON.parse(localJson);
          
          // Robust mapping: if local says it's mine, keep it mine
          if (currentUser && (localDoc.userId === currentUser.id || localDoc.submittedBy === currentUser.name)) {
             serverDoc.userId = currentUser.id;
             serverDoc.submittedBy = currentUser.name;
          } else {
             // Fallback to localDoc values if server is missing them
             if (!serverDoc.userId) serverDoc.userId = localDoc.userId;
             if (!serverDoc.submittedBy) serverDoc.submittedBy = localDoc.submittedBy;
          }
        } catch (e) {}
      }
      
      // Safety: Ensure userId is always a string after sync
      if (serverDoc.userId && typeof serverDoc.userId !== 'string') {
          serverDoc.userId = (serverDoc.userId as any).toString();
      }

      localStorage.setItem(key, JSON.stringify(serverDoc));
      console.log(`✅ Applied server update for ${key}`);
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

    if (!context || !sections) return;

    // 1. Flatten Data
    let csvContent = '\uFEFF'; // BOM
    csvContent += 'Section,Category,Question,Weight,Score,Comment\n';

    sections.forEach(section => {
      section.questions.forEach(q => {
        const score = answers[q.id] ?? 'N/A';
        const comment = (this.comments()[q.id] || "").replace(/,/g, ' '); // Escape commas
        const line = `"${section.title}","${q.category || ''}","${q.text.replace(/"/g, '""')}",${q.weight},${score},"${comment}"\n`;
        csvContent += line;
      });
    });

    // 2. Download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `LAT_${context.country}_${context.base}_${context.evaluationMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}


