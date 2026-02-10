export interface AdminConfig {
    priorityThresholds: {
        critical: number; // Percentage (e.g., 50)
        high: number;     // Percentage (e.g., 80)
    };
}

export const DEFAULT_CONFIG: AdminConfig = {
    priorityThresholds: {
        critical: 50,
        high: 80
    }
};
