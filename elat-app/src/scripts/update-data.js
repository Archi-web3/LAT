const fs = require('fs');
const path = require('path');

const dataPath = '/home/jonathan/Documents/App/LAT/elat-app/src/assets/data/assessment-data.json';
const rawData = fs.readFileSync(dataPath);
const data = JSON.parse(rawData);

// Mapping from Screenshot analysis
const updates = {
    "q-1-1": { verification: "Security LSOP", tags: ["Stratégie", "Sécurité"] },
    "q-1-2": { verification: "Contingency Plan", tags: ["Stratégie", "Performance", "Sécurité"] },
    "q-1-3": { verification: "Movement Follow-up", tags: ["Sécurité", "Traçabilité"] },
    "q-1-4": { verification: "Visibility in place", tags: ["Contrôle qualité", "Sécurité"] },
    "q-1-5": { verification: "Incident report", tags: ["Qualité de rapport", "Traçabilité", "Sécurité"] },
    "q-1-6": { verification: "Medical kits with updated packing list", tags: ["Contrôle qualité", "Performance", "Sécurité"] },
    "q-1-7": { verification: "Safety equipment in place", tags: ["Contrôle qualité", "Performance", "Sécurité"] },
    "q-1-8": { verification: "Communication means", tags: ["Contrôle qualité", "Performance", "Sécurité"] },
    "q-1-9": { verification: "Security compound", tags: ["Contrôle qualité", "Environnement", "Sécurité"] },

    "q-2-1": { verification: "Project Proposal & PLP", tags: ["Stratégie", "Performance", "Maîtrise du risque financier"] },
    "q-2-2": { verification: "Monthly Log report (MLR)", tags: ["Qualité de rapport", "Performance", "Traçabilité"] },
    "q-2-3": { verification: "Logistics Strategy", tags: ["Stratégie", "Performance"] },
    "q-2-4": { verification: "LCA", tags: ["Stratégie", "Performance"] },
    "q-2-5": { verification: "Financial Plan", tags: ["Stratégie", "Performance", "Maîtrise du risque financier"] },
    "q-2-6": { verification: "BFU & interdep meeting", tags: ["Stratégie", "Performance", "Maîtrise du risque financier", "Traçabilité"] },

    "q-3-1": { verification: "Log evaluation / Loc partner table", tags: ["Audit", "Stratégie", "Performance", "Maîtrise du risque financier"] },
    "q-3-2": { verification: "Partner training plan", tags: ["Stratégie", "Performance"] },
    "q-3-3": { verification: "Partner validation table", tags: ["Audit", "Maîtrise du risque financier", "Traçabilité"] },

    "q-4-1": { verification: "Briefing SLU, PERU", tags: ["Stratégie", "Performance"] },
    "q-4-2": { verification: "Log assessment report", tags: ["Stratégie", "Performance"] },
    "q-4-3": { verification: "Log Sitrep", tags: ["Environnement", "Performance"] },
    "q-4-4": { verification: "Closure of project or end of ACT QQP", tags: ["Performance", "Maîtrise du risque financier", "Traçabilité"] },

    "q-5-1": { verification: "Authorization signature table", tags: ["Contrôle qualité", "Maîtrise du risque financier", "Traçabilité"] },
    "q-5-2": { verification: "PPP", tags: ["Contrôle qualité", "Performance", "Maîtrise du risque financier"] },
    "q-5-3": { verification: "PA", tags: ["Stratégie", "Performance", "Maîtrise du risque financier"] },
    "q-5-4": { verification: "ESC Matrix", tags: ["Stratégie", "Performance", "Maîtrise du risque financier"] },
    "q-5-5": { verification: "Weekly meeting planning", tags: ["Stratégie", "Performance", "Traçabilité"] },
    "q-5-6": { verification: "Framework Agreement (FA)", tags: ["Stratégie", "Maîtrise du risque financier"] },
    "q-5-7": { verification: "Checked quality", tags: ["Contrôle qualité", "Sécurité"] },
    "q-5-8": { verification: "Suivi DEN / LINK", tags: ["Contrôle qualité", "Maîtrise du risque financier", "Traçabilité"] },
    "q-5-9": { verification: "Archiving", tags: ["Contrôle qualité", "Traçabilité"] },

    "q-6-1": { verification: "Market Survey", tags: ["Contrôle qualité", "Performance", "Maîtrise du risque financier"] },
    "q-6-2": { verification: "Purchase Line (PL)", tags: ["Contrôle qualité", "Performance", "Traçabilité"] },
    "q-6-3": { verification: "LINK", tags: ["Contrôle qualité", "Maîtrise du risque financier", "Traçabilité"] },
    "q-6-4": { verification: "LINK", tags: ["Contrôle qualité", "Maîtrise du risque financier", "Traçabilité"] },
    "q-6-5": { verification: "LINK", tags: ["Contrôle qualité", "Maîtrise du risque financier", "Traçabilité"] },
    "q-6-6": { verification: "", tags: ["Audit", "Contrôle qualité", "Performance", "Maîtrise du risque financier", "Traçabilité"] },
    "q-6-7": { verification: "Supplier database & evaluation", tags: ["Stratégie", "Performance", "Traçabilité"] },

    "q-7-1": { verification: "QEE - WAT", tags: ["Contrôle qualité", "Stratégie", "Performance"] },
    "q-7-2": { verification: "Numbering & labelling", tags: ["Contrôle qualité", "Performance", "Traçabilité"] },
    "q-7-3": { verification: "Stock card and Stock report", tags: ["Contrôle qualité", "Performance", "Traçabilité"] },
    "q-7-4": { verification: "Stock card", tags: ["Audit", "Contrôle qualité", "Performance", "Traçabilité"] },
    "q-7-5": { verification: "Physical separation", tags: ["Contrôle qualité", "Environnement", "Sécurité"] },
    "q-7-6": { verification: "", tags: ["Audit", "Environnement"] },
    "q-7-7": { verification: "Dead stock", tags: ["Performance", "Maîtrise du risque financier"] },
    "q-7-8": { verification: "Quality control", tags: ["Audit", "Contrôle qualité", "Stratégie", "Traçabilité", "Sécurité"] },
    "q-7-9": { verification: "SFU/Link", tags: ["Qualité de rapport", "Performance", "Traçabilité"] },
    "q-7-10": { verification: "Last inventory", tags: ["Audit", "Contrôle qualité", "Performance"] },

    "q-8-1": { verification: "Controlled temperatures", tags: ["Contrôle qualité", "Sécurité"] },
    "q-8-2": { verification: "Temperature FU sheet", tags: ["Qualité de rapport", "Traçabilité", "Sécurité"] },
    "q-8-3": { verification: "", tags: ["Stratégie", "Performance", "Sécurité"] },
    "q-8-4": { verification: "Security Stock set up", tags: ["Stratégie", "Maîtrise du risque financier", "Sécurité"] },
    "q-8-5": { verification: "Cold Chain rules & contingency plan", tags: ["Contrôle qualité", "Stratégie", "Performance", "Sécurité"] },

    "q-9-1": { verification: "", tags: ["Audit", "Performance"] },
    "q-9-2": { verification: "", tags: ["Stratégie", "Performance"] },
    "q-9-3": { verification: "Stock report", tags: ["Performance", "Traçabilité"] },
    "q-9-4": { verification: "Inventory result", tags: ["Contrôle qualité", "Traçabilité"] },
    "q-9-5": { verification: "Rapport BJ", tags: ["Performance"] },
    "q-9-6": { verification: "Previous claims", tags: ["Qualité de rapport", "Traçabilité"] },

    "q-11-1": { verification: "Supply Plan", tags: ["Environnement", "Performance", "Maîtrise du risque financier"] },
    "q-11-2": { verification: "Customs Procedures folder", tags: ["Stratégie", "Performance", "Traçabilité"] },
    "q-11-3": { verification: "Transport services fol", tags: ["Qualité de rapport", "Performance", "Traçabilité"] },
    "q-11-4": { verification: "Claims", tags: ["Contrôle qualité", "Performance", "Maîtrise du risque financier", "Traçabilité"] },

    "q-12-1": { verification: "Fleet analysis", tags: ["Stratégie", "Maîtrise du risque financier", "Traçabilité"] },
    "q-12-2": { verification: "Movement management & planning", tags: ["Performance", "Traçabilité", "Sécurité"] },
    "q-12-3": { verification: "Drivers training list / Vehicles kits in the car", tags: ["Environnement", "Maîtrise du risque financier", "Sécurité"] },
    "q-12-4": { verification: "", tags: ["Environnement", "Sécurité"] },
    "q-12-5": { verification: "Trip, fuel & maintenance logbook available", tags: ["Contrôle qualité", "Performance", "Traçabilité", "Sécurité"] },
    "q-12-6": { verification: "Fuel consumption FU", tags: ["Qualité de rapport", "Performance", "Traçabilité"] },
    "q-12-7": { verification: "Fuel & safety", tags: ["Maîtrise du risque financier", "Traçabilité", "Sécurité"] },

    "q-13-1": { verification: "Labelling & Inventory", tags: ["Traçabilité"] },
    "q-13-2": { verification: "Owner rules respected", tags: ["Contrôle qualité", "Maîtrise du risque financier", "Traçabilité"] },
    "q-13-3": { verification: "Disposal plan", tags: ["Contrôle qualité", "Environnement", "Traçabilité"] },
    "q-13-4": { verification: "Repairing & maintenance plan", tags: ["Contrôle qualité", "Stratégie", "Performance", "Maîtrise du risque financier", "Traçabilité"] },

    "q-14-1": { verification: "Backup system + Backup log (export / capture écran)", tags: ["Sécurité"] },
    "q-14-2": { verification: "Shared nas folder + Capture permissions + arborescence", tags: ["Sécurité"] },
    "q-14-3": { verification: "Antivirus HQ + Capture mise à jour antivirus", tags: ["Sécurité"] },
    "q-14-4": { verification: "Standard infra kit + Checklist infra rigide", tags: ["Sécurité"] },
    "q-14-5": { verification: "ICT officer + Registre des interventions ICT (base)", tags: ["Sécurité"] },
    "q-14-6": { verification: "Communication tools + Suivi des coûts (dossier base)", tags: ["Sécurité"] },
    "q-14-7": { verification: "Field movement comms + historique des tests", tags: ["Sécurité"] },
    "q-14-8": { verification: "Satellite kits check + Checklist trimestrielle signée", tags: ["Sécurité"] },
    "q-14-9": { verification: "Communication inter-bases + Liste équipements, tests", tags: ["Sécurité"] },
    "q-14-10": { verification: "Radios: Photos installation, tests radio", tags: ["Sécurité"] },
    "q-14-11": { verification: "Internet + backup: factures, schéma réseau, tests", tags: ["Sécurité"] },
    "q-14-12": { verification: "Standards ordinateurs: Inventaire, standard (L), log/...", tags: ["Sécurité"] },
    "q-14-13": { verification: "Licences logicielles: Registre licences, factures", tags: ["Sécurité"] },
    "q-14-14": { verification: "Protection électrique: Photos UPS, tests, registre", tags: ["Sécurité"] },

    "q-15-1": { verification: "Energy sizing tool", tags: ["Maîtrise du risque financier", "Sécurité"] },
    "q-15-2": { verification: "Reliable energy sources & backup", tags: ["Performance", "Traçabilité", "Sécurité"] },
    "q-15-3": { verification: "Date of last Elec diag tool", tags: ["Environnement", "Sécurité"] },
    "q-15-4": { verification: "Stabilizers presence", tags: ["Sécurité"] },
    "q-15-5": { verification: "Maintenance planning", tags: ["Contrôle qualité", "Sécurité"] },
    "q-15-6": { verification: "Follow up gl mo gen / reports", tags: ["Contrôle qualité", "Sécurité"] }, // Adjusted from analysis
    "q-15-7": { verification: "", tags: ["Environnement", "Sécurité"] }, // Guessed from pattern
    "q-15-8": { verification: "Documentation", tags: ["Stratégie", "Traçabilité"] },

    "q-16-1": { verification: "Log Organigramme & JDs", tags: ["Stratégie", "Performance"] },
    "q-16-2": { verification: "Training plan and FU", tags: ["Stratégie", "Performance"] },
    "q-16-3": { verification: "Evaluation & objectives", tags: ["Stratégie", "Performance"] },
    "q-16-4": { verification: "Holidays & meeting planning", tags: ["Stratégie", "Performance"] },
    "q-16-5": { verification: "Expression & well-being", tags: ["Stratégie", "Performance", "Traçabilité"] },
    "q-16-6": { verification: "Archiving", tags: ["Stratégie", "Performance", "Traçabilité"] }
};

// Apply updates
data.sections.forEach(section => {
    section.questions.forEach(q => {
        const update = updates[q.id];
        if (update) {
            // Update Verif - Only if not empty in update source, else keep existing or empty? 
            // The user wants what's in excel. If excel is empty, it means " - " or nothing.
            // I'll update it.
            q.verification = update.verification || "";
            q.verification_en = update.verification || ""; // Use same english verif for now as excel was mostly EN

            // Update Tags - Override existing
            q.transversalTags = update.tags;
        }
    });
});

fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
console.log('Successfully updated assessment data with tags and verifications.');
