export type PriorityLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type ActionStatus = 'TODO' | 'DOING' | 'DONE';

export interface ActionItem {
    id: string; // UUID
    questionId: string;
    questionText: string; // Snapshot text in case question changes

    category: string;
    section?: string; // New field for Section Title (used for Color Coding)

    priority: PriorityLevel;
    status: ActionStatus;

    owner?: string; // Name or Role
    comments?: string;

    startDate: string; // ISO
    dueDate: string; // ISO

    // Links back to assessment
    proofLink?: string;
    proofPhoto?: string;
}

export interface ActionPlan {
    id: string; // matches assessment storage key suffix usually
    context: {
        country: string;
        base: string;
        evaluationMonth: string;
    };

    actions: ActionItem[];

    createdAt: string;
    updatedAt: string;
}
