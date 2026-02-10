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

  constructor() {
    this.loadData();
    this.restoreLastContext();
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
    this.saveAssessmentSnapshot('Reset');
    this.saveState();
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
        this.sections.set(sections);
        this.fetchDefaultTransversal();
        console.log('Loaded custom assessment config from storage (Legacy)');
        return;
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

      // Save logs
      submittedBy: this.submittedBy(),
      submittedAt: this.submittedAt(),
      validatedBy: this.validatedBy(),
      validatedAt: this.validatedAt()
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

        console.log(`Loaded state for ${key}`, state);
      } catch (e) {
        console.error('Failed to parse saved state', e);
        this.resetToEmpty();
      }
    } else {
      console.log(`No saved state for ${key}, starting fresh.`);
      this.resetToEmpty();
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

  getHistory(): any[] {
    const saved = localStorage.getItem('elat-history');
    return saved ? JSON.parse(saved) : [];
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
    const sections = this.sections();
    if (sections.length === 0) return 0;

    let totalPoints = 0;
    let maxPoints = 0;

    sections.forEach(s => {
      s.questions.forEach(q => {
        const val = this.answers()[q.id];
        if (val !== undefined && val !== -1) {
          totalPoints += (val * q.weight);
          maxPoints += (1 * q.weight);
        }
      });
    });

    return maxPoints > 0 ? Math.round((totalPoints / maxPoints) * 100) : 0;
  }

  getSectionProgress(sectionId: string): number {
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

    let totalPoints = 0;
    let maxPoints = 0;

    section.questions.forEach(q => {
      const val = this.answers()[q.id];
      if (val !== undefined && val !== -1) {
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
    console.log('Attempting sync...');
    if (!navigator.onLine) {
      console.log('Offline: Skipping sync');
      return;
    }

    const history = this.getHistory();
    const unsynced = history.filter((h: any) => !h.synced);

    if (unsynced.length === 0) {
      console.log('Nothing to sync');
      return;
    }

    console.log(`Found ${unsynced.length} items to sync`);
    const token = localStorage.getItem('token');
    if (!token) {
      console.log('No token: Cannot sync');
      return;
    }

    try {
      const headers = { 'x-auth-token': token };
      this.http.post(`${this.apiUrl}/sync`, unsynced, { headers })
        .subscribe({
          next: (res: any) => {
            console.log('Sync successful!', res);
            const updatedHistory = history.map((h: any) => {
              if (!h.synced) return { ...h, synced: true };
              return h;
            });
            localStorage.setItem('elat-history', JSON.stringify(updatedHistory));
          },
          error: (err) => console.error('Sync failed', err)
        });
    } catch (e) {
      console.error('Sync error', e);
    }
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
