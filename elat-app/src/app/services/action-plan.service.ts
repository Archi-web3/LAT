import { Injectable, signal, inject, computed } from '@angular/core';
import { AssessmentService } from './assessment.service';
import { AdminService } from '../core/admin/admin.service';
import { AdminConfig, DEFAULT_CONFIG } from '../models/admin-config.model';
import { ActionItem, PriorityLevel, AssessmentState } from '../models/assessment.model';

export interface ActionPlan {
    id: string;
    context: any;
    actions: ActionItem[];
    updatedAt: string;
}

@Injectable({
    providedIn: 'root'
})
export class ActionPlanService {
    private assessmentService = inject(AssessmentService);
    private adminService = inject(AdminService);

    // Derived State from AssessmentService
    currentPlan = computed(() => {
        const ctx = this.assessmentService.context();
        const actions = this.assessmentService.actionPlan();

        if (!ctx) return null;

        return {
            id: `plan-${ctx.country}-${ctx.base}-${ctx.evaluationMonth}`,
            context: ctx,
            actions: actions,
            updatedAt: new Date().toISOString()
        } as ActionPlan;
    });

    // --- Generation Logic ---
    generatePlan(assessment: any): ActionItem[] {
        // 1. Load Config
        let config: AdminConfig = this.adminService.config();
        if (!config) {
            const configRaw = localStorage.getItem('elat-admin-config');
            config = configRaw ? JSON.parse(configRaw) : DEFAULT_CONFIG;
        }

        const actions: ActionItem[] = [];
        const now = new Date();

        // 2. Iterate Sections
        const sections = this.assessmentService.sections();

        sections.forEach(section => {
            section.questions.forEach(q => {
                const score = assessment.answers[q.id];

                // If score exists and likely bad? Logic depends on thresholds.
                if (score !== undefined && score !== -1) {
                    const percentage = score * 100;
                    let priority: PriorityLevel | null = null;
                    let monthsToAdd = 0;

                    if (percentage < config.priorityThresholds.critical) {
                        priority = 'CRITICAL';
                        monthsToAdd = 1;
                    } else if (percentage < config.priorityThresholds.high) {
                        priority = 'HIGH';
                        monthsToAdd = 3;
                    }

                    if (priority) {
                        const due = new Date(now);
                        due.setMonth(due.getMonth() + monthsToAdd);

                        actions.push({
                            id: crypto.randomUUID(),
                            questionId: q.id,
                            questionText: q.text,
                            category: q.category || section.title,
                            section: section.title,
                            priority: priority,
                            status: 'TODO',
                            startDate: now.toISOString(),
                            dueDate: due.toISOString(),
                            proofLink: assessment.proofLinks?.[q.id],
                            proofPhoto: assessment.proofPhotos?.[q.id],
                            owner: '',
                            comments: ''
                        });
                    }
                }
            });
        });

        return actions;
    }

    // --- Actions ---

    initializePlanFromAssessment() {
        // Construct a partial state to pass to generate
        const state = {
            answers: this.assessmentService.answers(),
            proofLinks: this.assessmentService.proofLinks(),
            proofPhotos: this.assessmentService.proofPhotos()
        } as any;
        // Context is required but not used in generatePlan loop (only for return obj)
        // We just needed the answers.

        const newActions = this.generatePlan(state);
        this.assessmentService.setActionPlan(newActions);
    }

    updateAction(updatedAction: ActionItem) {
        this.assessmentService.updateAction(updatedAction.id, updatedAction);
    }

    reorderActions(newOrder: ActionItem[]) {
        this.assessmentService.setActionPlan(newOrder);
    }

    // save() method removed as explicit save is handled by AssessmentService methods

    // Legacy support methods (removed logic, just proxies or empty)
    loadPlan(ctx: any) { /* No-op, managed by AssessmentService */ }
}
