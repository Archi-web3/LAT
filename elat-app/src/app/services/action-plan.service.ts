import { Injectable, signal, inject } from '@angular/core';
import { ActionPlan, ActionItem, PriorityLevel } from '../models/action-plan.model';
import { AdminConfig, DEFAULT_CONFIG } from '../models/admin-config.model';
import { AssessmentState } from '../models/assessment.model';
import { AssessmentService } from './assessment.service';

@Injectable({
    providedIn: 'root'
})
export class ActionPlanService {
    private assessmentService = inject(AssessmentService);

    // Current Plan State
    currentPlan = signal<ActionPlan | null>(null);

    // --- Generation Logic ---
    generatePlan(assessment: AssessmentState): ActionPlan {
        // 1. Load Config
        const configRaw = localStorage.getItem('elat-admin-config');
        const config: AdminConfig = configRaw ? JSON.parse(configRaw) : DEFAULT_CONFIG;

        const actions: ActionItem[] = [];
        const now = new Date(); // Start Date = Today

        // 2. Iterate Sections
        const sections = this.assessmentService.sections();

        sections.forEach(section => {
            section.questions.forEach(q => {
                const score = assessment.answers[q.id];

                // If answer exists and is valid (not N/A -1)
                if (score !== undefined && score !== -1) {
                    const percentage = score * 100;
                    let priority: PriorityLevel | null = null;
                    let monthsToAdd = 0;

                    // Priority Rules from Config
                    if (percentage < config.priorityThresholds.critical) {
                        priority = 'CRITICAL';
                        monthsToAdd = 1;
                    } else if (percentage < config.priorityThresholds.high) {
                        priority = 'HIGH';
                        monthsToAdd = 3;
                    }
                    // Optional: Medium priority if < 100? For now keep it simple based on user request.
                    // User said: <50 Critical, 50-80 High. >80 OK.

                    if (priority) {
                        // Due Date Calculation
                        const due = new Date(now);
                        due.setMonth(due.getMonth() + monthsToAdd);

                        actions.push({
                            id: crypto.randomUUID(),
                            questionId: q.id,
                            questionText: q.text,
                            category: q.category || section.title,
                            section: section.title, // Populate Section Title
                            priority: priority,
                            status: 'TODO',
                            startDate: now.toISOString(),
                            dueDate: due.toISOString(),
                            proofLink: assessment.proofLinks?.[q.id],
                            proofPhoto: assessment.proofPhotos?.[q.id]
                        });
                    }
                }
            });
        });

        const context = assessment.context!;

        const plan: ActionPlan = {
            id: `plan-${context.country}-${context.base}-${context.evaluationMonth}`,
            context: context,
            actions: actions,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        return plan;
    }

    // --- Persistence ---

    private getStorageKey(context: any): string {
        return `elat-plan-${context.country}-${context.base}-${context.evaluationMonth}`.replace(/\s+/g, '_');
    }

    loadPlan(context: any) {
        const key = this.getStorageKey(context);
        const saved = localStorage.getItem(key);
        if (saved) {
            this.currentPlan.set(JSON.parse(saved));
        } else {
            this.currentPlan.set(null);
        }
    }

    saveCurrentPlan() {
        const plan = this.currentPlan();
        if (!plan) return;

        plan.updatedAt = new Date().toISOString();
        const key = this.getStorageKey(plan.context);
        localStorage.setItem(key, JSON.stringify(plan));
    }

    // Called when user clicks "Generate Action Plan" button
    initializePlanFromAssessment() {
        const assessmentState = {
            answers: this.assessmentService.answers(),
            context: this.assessmentService.context(),
            proofLinks: this.assessmentService.proofLinks(),
            proofPhotos: this.assessmentService.proofPhotos()
        } as any; // Partial mock of AssessmentState

        if (!assessmentState.context) return;

        // Check if plan already exists?
        // For now, we overwrite or maybe warn? 
        // User request implies "Generating". Let's generate a FRESH one but merge if possible? 
        // Simplest: Generate new -> if existing, maybe keep manual edits? Too complex.
        // Strategy: Generate NEW.

        const newPlan = this.generatePlan(assessmentState);
        this.currentPlan.set(newPlan);
        this.saveCurrentPlan();
    }
    updateAction(updatedAction: ActionItem) {
        const plan = this.currentPlan();
        if (!plan) return;

        const index = plan.actions.findIndex(a => a.id === updatedAction.id);
        if (index !== -1) {
            // Immutable Update: Create new array
            const newActions = [...plan.actions];
            newActions[index] = updatedAction;

            console.log('[DEBUG] Service Updating Action:', JSON.stringify(updatedAction, null, 2));

            // Trigger signal update with new object and new actions array
            this.currentPlan.set({
                ...plan,
                actions: newActions,
                updatedAt: new Date().toISOString()
            });

            this.saveCurrentPlan();
        } else {
            console.error('[DEBUG] Update Failed: Action ID not found in current plan.', updatedAction.id, 'Available IDs:', plan.actions.map(a => a.id));
        }
    }

    reorderActions(newOrder: ActionItem[]) {
        const plan = this.currentPlan();
        if (!plan) return;

        // Immutable update of the action list order
        this.currentPlan.set({
            ...plan,
            actions: newOrder,
            updatedAt: new Date().toISOString()
        });

        this.saveCurrentPlan();
    }
}
