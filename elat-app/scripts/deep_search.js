const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, '../../LAT2025_6.xlsx');

try {
    const workbook = XLSX.readFile(filePath);

    // 1. Check wider columns in Scoring
    const scoringSheet = workbook.Sheets['Scoring'];
    const scoringData = XLSX.utils.sheet_to_json(scoringSheet, { header: 1 });
    const row1 = scoringData[1] || [];
    console.log('--- Scoring Sheet Row 1 (indexes 0-20) ---');
    for (let i = 0; i < 20; i++) {
        console.log(`Index ${i}: ${row1[i]}`);
    }

    // 2. Search for "Non conforme" or "Partiellement" in any sheet
    console.log('\n--- Searching for values ---');
    workbook.SheetNames.forEach(sheetName => {
        const ws = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
        data.forEach((row, rowIndex) => {
            if (!row) return;
            row.forEach((cell, colIndex) => {
                if (typeof cell === 'string') {
                    if (cell.toLowerCase().includes('non conforme') || cell.toLowerCase().includes('partiellement')) {
                        console.log(`Found value in ${sheetName} [${rowIndex}, ${colIndex}]:`, cell);
                    }
                }
            });
        });
    });

} catch (error) {
    console.error("Error:", error);
}
