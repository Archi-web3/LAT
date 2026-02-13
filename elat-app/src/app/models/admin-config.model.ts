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
        { id: 'pwa-offline', category: 'TECH', title: 'Mode Hors-Ligne Avancé (PWA)', description: 'DONE: Cache complet Assets/Data, Synchro auto au retour connexion, Indicateurs UI (Offline/Syncing).', status: 'DONE' },
        { id: 'branding', category: 'UX', title: 'Branding & Identité', description: 'DONE: Nouveau Logo LAT (Engrenage), Animation Flip Login (ACF->LAT), Renommage Application.', status: 'DONE' },
        { id: 'mobile-ux', category: 'UX', title: 'Expérience Mobile', description: 'DONE: Menu latéral responsive (Overlay), Adaptation Layout, Icones PWA corrigées.', status: 'DONE' },
        { id: 'tech-docs', category: 'TECH', title: 'Documentation Technique', description: 'DONE: Onglet dédié avec Architecture, Dépannage et Infos Maintenance.', status: 'DONE' },

        { id: 'sync-bidir', category: 'TECH', title: 'Synchronisation Bidirectionnelle', description: 'DONE: Envoi/Réception des données (push/pull), Création de copies en cas de conflit.', status: 'DONE' },
        { id: 'conflict-mgmt', category: 'TECH', title: 'Gestion des Conflits', description: 'Mécanisme pour gérer les écrasements de données si plusieurs utilisateurs éditent.', status: 'TODO' },

        // Analyse & Reporting
        { id: 'dashboard-hq', category: 'FEATURE', title: 'Tableau de Bord Siège', description: 'Vue agrégée de toutes les bases/pays pour comparaison globale.', status: 'TODO' },
        { id: 'export-pdf', category: 'FEATURE', title: 'Export PDF Professionnel', description: 'DONE: Génération de rapports PDF propres pour partage externe.', status: 'DONE' },
        { id: 'audit-log', category: 'FEATURE', title: 'Historique d\'Audit', description: 'DONE: Traçabilité complète des actions (Création, Soumission, Validation).', status: 'DONE' },
        { id: 'history-trends', category: 'FEATURE', title: 'Tendances & Scores', description: 'Graphiques visuels de l\'évolution des scores dans le temps.', status: 'TODO' },

        // Expérience Utilisateur
        { id: 'interactive-plan', category: 'UX', title: 'Plan d\'Action Interactif', description: 'Assignation de tâches aux utilisateurs, notifications email.', status: 'TODO' },
        { id: 'bulk-import', category: 'UX', title: 'Import/Export en Masse', description: 'Import CSV des utilisateurs et configurations.', status: 'TODO' },
        { id: 'photo-gallery', category: 'UX', title: 'Galerie Photo Avancée', description: 'Meilleure gestion des preuves photos (galerie, zoom, compression).', status: 'TODO' }
    ]
};
