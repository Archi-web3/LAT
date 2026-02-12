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
    roadmap?: RoadmapItem[];
}

export interface RoadmapItem {
    id: string;
    category: 'TECH' | 'FEATURE' | 'UX';
    title: string;
    description: string;
    status: 'TODO' | 'DONE';
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
    ],
    roadmap: [
        // Robustesse & Mode Hors-Ligne
        { id: 'pwa-offline', category: 'TECH', title: 'Mode Hors-Ligne Avancé (PWA)', description: 'Configuration agressive du Service Worker pour cache total données + assets.', status: 'DONE' },
        { id: 'sync-bidir', category: 'TECH', title: 'Synchronisation Bidirectionnelle', description: 'Permettre l\'envoi et la réception de données (push/pull) pour travail collaboratif.', status: 'TODO' },
        { id: 'conflict-mgmt', category: 'TECH', title: 'Gestion des Conflits', description: 'Mécanisme pour gérer les écrasements de données si plusieurs utilisateurs éditent.', status: 'TODO' },

        // Analyse & Reporting
        { id: 'dashboard-hq', category: 'FEATURE', title: 'Tableau de Bord Siège', description: 'Vue agrégée de toutes les bases/pays pour comparaison globale.', status: 'TODO' },
        { id: 'export-pdf', category: 'FEATURE', title: 'Export PDF Professionnel', description: 'Génération de rapports PDF propres pour partage externe.', status: 'TODO' },
        { id: 'history-trends', category: 'FEATURE', title: 'Historique & Tendances', description: 'Graphiques visuels de l\'évolution des scores dans le temps.', status: 'TODO' },

        // Expérience Utilisateur
        { id: 'interactive-plan', category: 'UX', title: 'Plan d\'Action Interactif', description: 'Assignation de tâches aux utilisateurs, notifications email.', status: 'TODO' },
        { id: 'bulk-import', category: 'UX', title: 'Import/Export en Masse', description: 'Import CSV des utilisateurs et configurations.', status: 'TODO' },
        { id: 'photo-gallery', category: 'UX', title: 'Galerie Photo Avancée', description: 'Meilleure gestion des preuves photos (galerie, zoom, compression).', status: 'TODO' }
    ]
};
