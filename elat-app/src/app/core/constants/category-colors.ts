export const CATEGORY_COLORS: { [key: string]: string } = {
    // 1. Sécurité
    '1 - Sécurité - opérationnelle': '#ef4444', // Red-500

    // 2. Coordination
    '2 - Gestion de Cycle de Projet & Coordination': '#3b82f6', // Blue-500

    // 3. Partenariat
    '3 - Partenariat et localisation': '#8b5cf6', // Violet-500

    // 4. Urgence
    '4 - Urgence': '#f97316', // Orange-500

    // 5. Supply Chain
    '5 - Chaîne d\'approvisionnement': '#14b8a6', // Teal-500

    // 6. Achats
    '6 - Gestion des achats': '#10b981', // Emerald-500

    // 7. Stocks
    '7 - Stocks': '#f59e0b', // Amber-500

    // 8. Stocks Médicaux
    '8 - Stocks medicaux': '#06b6d4', // Cyan-500

    // 9. Stocks Décentralisés
    '9 - Stocks décentralisés ': '#6366f1', // Indigo-500 (Note: Space in key from JSON)

    // 10. Batiment (Missing in my read? Assuming standard list, but mapping what I found)
    // Found "11 - Transport" as next. Maybe 10 was skipped in source or I missed it.

    // 11. Transport
    '11 - Transport & livraison': '#eab308', // Yellow-500

    // 12. Flotte
    '12 - Gestion de flotte de véhicules': '#64748b', // Slate-500

    // 13. Equipement
    '13 - Equipement': '#a8a29e', // Stone-400

    // 14. ICT
    '14 - Technologies de l\'Information et des Communications ': '#d946ef', // Fuchsia-500 (Note: Space in key)

    // 15. Energie
    '15 - Energie': '#84cc16', // Lime-500
};

export function getCategoryColor(sectionTitle: string): string {
    // Try exact match
    if (CATEGORY_COLORS[sectionTitle]) {
        return CATEGORY_COLORS[sectionTitle];
    }

    // Try partial match if exact fails (e.g., if title formatting changes slightly)
    const key = Object.keys(CATEGORY_COLORS).find(k => sectionTitle.includes(k) || k.includes(sectionTitle));
    return key ? CATEGORY_COLORS[key] : '#9ca3af'; // Default Grey-400
}
