export interface AssessmentData {
    generatedAt: string;
    sections: AssessmentSection[];
    transversalComponents: string[];
}

export interface AssessmentSection {
    id: string;
    title: string;
    title_en?: string;
    questions: AssessmentQuestion[];
}

export interface AssessmentQuestion {
    id: string;
    category: string;
    category_en?: string;
    text: string;
    text_en?: string;
    verification?: string;
    verification_en?: string;
    weight: number;
    responseType?: string;
    transversalTags: string[];
    options?: AssessmentOption[];
}

export interface AssessmentOption {
    label: string;
    label_en?: string;
    value: number;
    color: string;
}

// Runtime state interface
export interface AssessmentContext {
    country: string;
    base: string;
    date: string; // ISO Date
    evaluationMonth: string; // YYYY-MM
}

export type AssessmentStatus = 'DRAFT' | 'SUBMITTED' | 'VALIDATED';

export interface AssessmentState {
    status: AssessmentStatus;
    answers: Record<string, number>; // questionId -> value (0.0 to 1.0)
    comments: Record<string, string>; // questionId -> comment
    proofLinks?: Record<string, string>; // questionId -> URL
    proofPhotos?: Record<string, string>; // questionId -> URL (Cloudinary) or Base64
    context?: AssessmentContext;

    // Lifecycle Metadata
    createdAt: string;
    updatedAt: string;

    // Sync
    id?: string;
    synced?: boolean;

    // Scoring
    score?: number;

    // Logs
    submittedBy?: string;
    submittedAt?: string;
    validatedBy?: string;
    validatedAt?: string;

    // Detailed History
    history?: AssessmentHistoryItem[];
}

export interface AssessmentHistoryItem {
    date: string;
    user: string;
    action: string;
    details?: string;
}
