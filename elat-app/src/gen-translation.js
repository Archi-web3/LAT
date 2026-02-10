const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, './assets/data/assessment-data.json');
const rawData = fs.readFileSync(filePath, 'utf8');
const data = JSON.parse(rawData);

const DICTIONARY = {
    // Categories
    "Documentation & sensibilisation": "Documentation & Awareness",
    "Préparation & planification": "Preparation & Planning",
    "Suivi des mouvements": "Movement Tracking",
    "Identification & visibilité": "Identification & Visibility",
    "identification & visibilité": "Identification & Visibility",
    "Gestion des incidents": "Incident Management",
    "Équipements de sécurité": "Safety Equipment",
    "Général": "General",
    "Moyens de communication": "Communication Means",
    "Sécurité des locaux": "Premises Security",
    "Implication projet": "Project Involvement",
    "Reporting": "Reporting",
    "Stratégie & préparation": "Strategy & Preparation",
    "Évaluation des capacités": "Capacity Assessment",
    "Coordination financière": "Financial Coordination",
    "Sélection & contractualisation": "Selection & Contracting",
    "Renforcement des capacités": "Capacity Building",
    "Collaboration régulière": "Regular Collaboration",
    "Préparation & outils": "Preparation & Tools",
    "Évaluation terrain": "Field Assessment",
    "Reporting en urgence": "Emergency Reporting",
    "Clôture de projet": "Project Closure",
    "Structure & autorisations": "Structure & Authorizations",

    // Options
    "Conforme": "Compliant",
    "Partiellement conforme": "Partially Compliant",
    "Non conforme": "Non Compliant",
    "N/A": "N/A",
    "Traçabilité complète": "Full Traceability",
    "Traçabilité partielle": "Partial Traceability",
    "Aucune traçabilité": "No Traceability",
    "Présent / Disponible": "Present / Available",
    "Partiellement présent": "Partially Present",
    "Absent": "Absent",
    "Forte implication": "Strong Involvement",
    "Implication moyenne": "Medium Involvement",
    "Faible implication": "Low Involvement",
    "Performance élevée": "High Performance",
    "Performance moyenne": "Medium Performance",
    "Faible performance": "Low Performance",
    "Maîtrisé": "Mastered",
    "Partiellement maîtrisé": "Partially Mastered",
    "Non maîtrisé": "Not Mastered",

    // Questions (Section 1)
    "Le LSOP Sécurité est disponible, lu et compris par l’équipe logistique.": "The Security LSOP is available, read, and understood by the logistics team.",
    "Le plan de contingence est à jour et couvre les éléments essentiels (zones & salles sécurité, kits, eau, etc.).": "The contingency plan is up to date and covers essential elements (safe zones/rooms, kits, water, etc.).",
    "Les mouvements terrain sont suivis et les contacts d’urgence sont définis (app de suivi, tableau blanc, opérateur radio, traceurs...).": "Field movements are tracked and emergency contacts defined (tracking app, whiteboard, radio operator, trackers...).",
    "Les règles d’identification (bâtiments, véhicules, personnel) sont définies et appliquées.": "Identification rules (buildings, vehicles, personnel) are defined and applied.",
    "Le système de signalement et de gestion des incidents (notamment incidents véhicule/électrique/incendie) est en place et connu du personnel logistique concerné. P.ex : un incident lié à la sécurité électrique doit donné lieu à des mesures correctives.": "The incident reporting and management system (especially vehicle/electrical/fire incidents) is in place and known to relevant logistics staff. E.g., an electrical safety incident must lead to corrective measures.",
    "Des trousses médicales (trousse de premiers secours + kit PEP) sont-elles présentes sur la base, contrôlées et non périmées ?": "Are medical kits (first aid + PEP kit) present on base, checked and not expired?",
    "Les équipements de sûreté sont en place et fonctionnels : extincteurs, détecteurs de fumée, CO2, bac à sable, etc.": "Safety equipment is in place and functional: fire extinguishers, smoke detectors, CO2, sand buckets, etc.",
    "Les moyens de communication disponibles sont-ils conformes au LSOP sécurité et fonctionnels ?": "Are available communication means compliant with the Security LSOP and functional?",
    "La sécurité des locaux est-elle assurée pour l'ensemble des bâtiments et conformément aux règles définies dans le LSOP Sécurité ?": "Is premises security ensured for all buildings and in accordance with rules defined in the Security LSOP?",

    // Questions (Section 2)
    "La logistique est impliquée dans la conception des propositions de projets, conformément au manuel de gestion de projet terrain.": "Logistics is involved in project proposal design, in accordance with the field project management manual.",
    "Le rapport logistique mensuel est envoyé à temps et contient toutes les informations nécessaires.": "The monthly logistics report is sent on time and contains all necessary information.",
    "La stratégie logistique est définie, alignée avec celle du bureau pays, et inclut la préparation aux urgences.": "The logistics strategy is defined, aligned with the country office strategy, and includes emergency preparedness.",
    "L’évaluation des capacités logistiques est réalisée et partagée sur NHF.": "Logistics capacity assessment is conducted and shared on NHF.",
    "La logistique contribue à l’élaboration du plan financier (volume, fréquence, prix).": "Logistics contributes to the development of the financial plan (volume, frequency, price).",
    "La logistique est impliquée dans la mise à jour des BFU et échange régulièrement avec la finance.": "Logistics is involved in BFU updates and regularly exchanges with finance.",

    // Questions (Section 3)
    "La logistique est impliquée dans l’évaluation et la sélection des partenaires locaux. Les documents logistiques requis sont annexés au contrat signé avec le partenaire.": "Logistics is involved in the assessment and selection of local partners. Required logistics documents are annexed to the contract signed with the partner.",
    "Le personnel logistique participe à la formation et au renforcement des capacités du partenaire, idéalement via un plan annuel.": "Logistics staff participates in partner training and capacity building, ideally via an annual plan.",
    "Un mécanisme de collaboration régulière avec les partenaire est en place, en accord avec MoU (visites mensuelles, validation des achats...).": "A regular collaboration mechanism with partners is in place, in accordance with the MoU (monthly visits, purchase validation...).",

    // Questions (Section 4)
    "Le plan de préparation aux urgences est en place et actualisé (stock, contrats, télécom, entrepôts, staff list, etc) et le SLU est connu du personnel logistique. ": "The emergency preparedness plan is in place and updated (stock, contracts, telecom, warehouses, staff list, etc.) and the SLU is known to logistics staff.",
    "La logistique est impliquée dans les évaluations terrain et utilise les outils adaptés.": "Logistics is involved in field assessments and uses adapted tools.",
    "Durant une reponse d'urgence, le rythme de rapport est defini, adapté et respecté.": "During an emergency response, reporting frequency is defined, adapted, and respected.",
    "À la fin d’une urgence, les ressources logistiques sont mobilisées pour une fermeture efficace (tri, inventaire, réallocation).": "At the end of an emergency, logistics resources are mobilized for effective closure (sorting, inventory, reallocation).",

    // Questions (Section 5)
    "Le tableau des signatures est à jour et les droits LINK sont paramétrés. Ils sont conformes à l’organigramme, et accessibles. Les anciennes versions sont archivées.": "The signature table is up to date and LINK rights are configured. They are consistent with the org chart and accessible. Old versions are archived.",

    // Titles
    "1 - Sécurité - opérationnelle": "1 - Security - Operational",
    "2 - Gestion de Cycle de Projet & Coordination": "2 - Project Cycle Management & Coordination",
    "3 - Partenariat et localisation": "3 - Partnership & Localization",
    "4 - Urgence": "4 - Emergency",
    "5 - Chaîne d'approvisionnement": "5 - Supply Chain"
};

const fuzzyMatch = (text) => {
    // Simple normalization for categories with slight variations
    const normalized = text.trim();
    return DICTIONARY[normalized] || DICTIONARY[normalized.replace(/\s+$/, '')];
};

let count = 0;
let missing = 0;

data.sections.forEach(section => {
    if (DICTIONARY[section.title]) {
        section.title_en = DICTIONARY[section.title];
    } else {
        console.log(`Missing Title: "${section.title}"`);
        section.title_en = section.title + " (EN)"; // Fallback
    }

    section.questions.forEach(q => {
        // Text
        if (DICTIONARY[q.text]) {
            q.text_en = DICTIONARY[q.text];
            count++;
        } else {
            console.log(`Missing Text: "${q.text.substring(0, 50)}..."`);
            q.text_en = "[EN] " + q.text; // Fallback
            missing++;
        }

        // Category
        if (DICTIONARY[q.category]) {
            q.category_en = DICTIONARY[q.category];
        } else {
            q.category_en = q.category;
        }

        // Verification
        q.verification_en = q.verification; // Usually already in English or technical terms

        // Options
        if (q.options) {
            q.options.forEach(opt => {
                if (DICTIONARY[opt.label]) {
                    opt.label_en = DICTIONARY[opt.label];
                } else {
                    opt.label_en = opt.label;
                }
            });
        }
    });

});

console.log(`Translated: ${count}, Missing: ${missing}`);

fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
console.log('Done!');
