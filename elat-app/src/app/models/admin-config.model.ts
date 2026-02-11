export interface AdminConfig {
    priorityThresholds: {
        critical: number; // Percentage (e.g., 50)
        high: number;     // Percentage (e.g., 80)
    };
    transversalExpertises: {
        id: string;
        label_fr: string;
        label_en: string;
    }[];
}

export const DEFAULT_CONFIG: AdminConfig = {
    priorityThresholds: {
        critical: 50,
        high: 80
    },
    transversalExpertises: [
        { id: 'Sécurité', label_fr: 'Sécurité', label_en: 'Security' },
        { id: 'Stratégie', label_fr: 'Stratégie', label_en: 'Strategy' },
        { id: 'Performance', label_fr: 'Performance', label_en: 'Performance' },
        { id: 'Audit', label_fr: 'Audit', label_en: 'Audit' },
        { id: 'Environnement', label_fr: 'Environnement', label_en: 'Environment' },
        { id: 'Traçabilité', label_fr: 'Traçabilité', label_en: 'Traceability' },
        { id: 'Contrôle qualité', label_fr: 'Contrôle qualité', label_en: 'Quality Control' },
        { id: 'Qualité de rapport', label_fr: 'Qualité de rapport', label_en: 'Report Quality' },
        { id: 'Maîtrise du risque financier', label_fr: 'Maîtrise du risque financier', label_en: 'Financial Risk Control' }
    ]
};
