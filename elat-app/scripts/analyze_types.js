const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, '../../LAT2025_6.xlsx');
console.log(`Reading file: ${filePath}`);

try {
    const workbook = XLSX.readFile(filePath);

    // 1. Analyze 'LAT' sheet for unique 'Type de réponse'
    const latSheet = workbook.Sheets['LAT'];
    const latData = XLSX.utils.sheet_to_json(latSheet, { header: 1 });
    const uniqueTypes = new Set();

    // Column 4 (index 4) seems to be 'Type de réponse' based on previous analysis
    // Row 0 is headers
    for (let i = 1; i < latData.length; i++) {
        const row = latData[i];
        if (row && row[4]) {
            uniqueTypes.add(row[4]);
        }
    }
    console.log('\nUnique Response Types found in LAT:', Array.from(uniqueTypes));

    // 2. Analyze 'Scoring' sheet
    const scoringSheet = workbook.Sheets['Scoring'];
    const scoringData = XLSX.utils.sheet_to_json(scoringSheet, { header: 1 });

    if (scoringData.length > 0) {
        console.log('\n--- Scoring Sheet Headers ---');
        console.log(scoringData[1]); // Row 1 seems to be headers based on previous dump
        console.log('\n--- Sample Scoring Data ---');
        scoringData.slice(2, 6).forEach(row => console.log(row));
    }

} catch (error) {
    console.error("Error extracted data:", error);
}
