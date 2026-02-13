import { ActionItem } from './assessment.model';

export type { ActionItem, PriorityLevel, ActionStatus } from './assessment.model';

export interface ActionPlan {
    id: string;
    context: {
        country: string;
        base: string;
        evaluationMonth: string;
    };
    actions: ActionItem[];
    createdAt: string;
    updatedAt: string;
}
