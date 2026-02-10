const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const INPUT_FILE = path.join(__dirname, '../../LAT2025_6.xlsx');
const OUTPUT_FILE = path.join(__dirname, '../public/assets/data/assessment-data.json');
const OUTPUT_DIR = path.dirname(OUTPUT_FILE);

console.log(`Reading file: ${INPUT_FILE}`);

try {
    const workbook = XLSX.readFile(INPUT_FILE);
    const sheetName = 'LAT';
    const ws = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(ws, { header: 1 });

    if (!data || data.length === 0) {
        throw new Error("Sheet 'LAT' is empty or not found");
    }

    // --- Step 1: Parse Headers (Row 0) ---
    const headers = data[0];
    const transversalStartIndex = 9; // Based on inspection: "Qualité de rapport" is at index 9
    const transversalComponents = [];

    // Identify transversal columns
    for (let i = transversalStartIndex; i < headers.length; i++) {
        if (headers[i]) {
            transversalComponents.push({ index: i, name: headers[i] });
        }
    }
    console.log('Transversal Components detected:', transversalComponents.map(t => t.name));

    // --- Step 2: Scale Definitions (Manual Mapping) ---
    const SCALE_DEFINITIONS = {
        'Échelle de conformité': [
            { label: 'Conforme', value: 1.0, color: 'green' },
            { label: 'Partiellement conforme', value: 0.5, color: 'orange' },
            { label: 'Non conforme', value: 0.0, color: 'red' },
            { label: 'N/A', value: -1, color: 'grey' }
        ],
        'Échelle de traçabilité': [
            { label: 'Traçabilité complète', value: 1.0, color: 'green' },
            { label: 'Traçabilité partielle', value: 0.5, color: 'orange' },
            { label: 'Aucune traçabilité', value: 0.0, color: 'red' },
            { label: 'N/A', value: -1, color: 'grey' }
        ],
        'Échelle de présence': [
            { label: 'Présent / Disponible', value: 1.0, color: 'green' },
            { label: 'Partiellement présent', value: 0.5, color: 'orange' },
            { label: 'Absent', value: 0.0, color: 'red' },
            { label: 'N/A', value: -1, color: 'grey' }
        ],
        'Échelle d’implication': [
            { label: 'Forte implication', value: 1.0, color: 'green' },
            { label: 'Implication moyenne', value: 0.5, color: 'orange' },
            { label: 'Faible implication', value: 0.0, color: 'red' },
            { label: 'N/A', value: -1, color: 'grey' }
        ],
        'Échelle de performance': [
            { label: 'Performance élevée', value: 1.0, color: 'green' },
            { label: 'Performance moyenne', value: 0.5, color: 'orange' },
            { label: 'Faible performance', value: 0.0, color: 'red' },
            { label: 'N/A', value: -1, color: 'grey' }
        ],
        'Échelle de maîtrise': [
            { label: 'Maîtrisé', value: 1.0, color: 'green' },
            { label: 'Partiellement maîtrisé', value: 0.5, color: 'orange' },
            { label: 'Non maîtrisé', value: 0.0, color: 'red' },
            { label: 'N/A', value: -1, color: 'grey' }
        ],
        'Échelle de qualité': [
            { label: 'Bonne', value: 1.0, color: 'green' },
            { label: 'Moyenne', value: 0.5, color: 'orange' },
            { label: 'Mauvaise', value: 0.0, color: 'red' },
            { label: 'N/A', value: -1, color: 'grey' }
        ],
        'Échelle simplifiée': [
            { label: 'Oui', value: 1.0, color: 'green' },
            { label: 'Partiellement', value: 0.5, color: 'orange' },
            { label: 'Non', value: 0.0, color: 'red' },
            { label: 'N/A', value: -1, color: 'grey' }
        ],
        'Yes_no': [
            { label: 'Oui', value: 1.0, color: 'green' },
            { label: 'Non', value: 0.0, color: 'red' },
            { label: 'N/A', value: -1, color: 'grey' }
        ]
    };

    // Default fallback scale
    const DEFAULT_SCALE = [
        { label: 'Oui', value: 1.0, color: 'green' },
        { label: 'Partiellement', value: 0.5, color: 'orange' },
        { label: 'Non', value: 0.0, color: 'red' },
        { label: 'N/A', value: -1, color: 'grey' }
    ];

    // --- Step 3: Iterate Rows ---
    const sections = [];
    let currentSection = null;

    // Start from Row 1
    for (let i = 1; i < data.length; i++) {
        const row = data[i];
        if (!row || row.length === 0) continue;

        const col0 = row[0]; // Category / Sub-category
        const col1 = row[1]; // Question / Section Title
        const typeResp = row[4]; // Response Type

        // Logic to detect Section Header:
        // Col 0 is empty AND Col 1 starts with a number (e.g., "1 - Sécurité")
        // Note: Sometimes Col 0 might be undefined/null effectively
        const isSectionHeader = (!col0) && (typeof col1 === 'string' && /^\d+\s*-/.test(col1));

        if (isSectionHeader) {
            // New Section
            currentSection = {
                id: `section-${sections.length + 1}`,
                title: col1,
                questions: []
            };
            sections.push(currentSection);
        } else if (currentSection && col1) {
            // New Question (must have a current section)
            // Parse Weight "3 - (Important triple)" -> 3
            let weight = 0;
            if (row[3]) {
                const match = row[3].toString().match(/^(\d+)/);
                if (match) weight = parseInt(match[1], 10);
            }

            // Identify Transversal Tags
            const tags = [];
            transversalComponents.forEach(comp => {
                if (row[comp.index] && row[comp.index].toString().toUpperCase().includes('X')) {
                    tags.push(comp.name);
                }
            });

            // Map Options
            let options = DEFAULT_SCALE;
            if (typeResp && SCALE_DEFINITIONS[typeResp]) {
                options = SCALE_DEFINITIONS[typeResp];
            } else if (typeResp) {
                // Try fuzzy match or default
                console.log(`Warning: Unknown response type "${typeResp}", using default.`);
            }

            const question = {
                id: `q-${sections.length}-${currentSection.questions.length + 1}`,
                category: col0 || 'Général', // Default category if missing
                text: col1,
                verification: row[2],
                weight: weight,
                responseType: typeResp,
                transversalTags: tags,
                options: options
            };

            currentSection.questions.push(question);
        }
    }

    // --- Step 3: Parse Scales (from Scoring sheet) ---
    // For now, let's define a standard scale map manually or verify against 'Scoring' sheet later.
    // For MVP, we pass the structure.

    const outputData = {
        generatedAt: new Date().toISOString(),
        sections: sections,
        transversalComponents: transversalComponents.map(t => t.name)
    };

    // Ensure output dir exists
    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(outputData, null, 2));
    console.log(`Successfully wrote data to ${OUTPUT_FILE}`);
    console.log(`Extracted ${sections.length} sections and ${sections.reduce((acc, s) => acc + s.questions.length, 0)} questions.`);

} catch (error) {
    console.error("Error extracted data:", error);
    process.exit(1);
}
