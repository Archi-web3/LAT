const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, '../../LAT2025_6.xlsx');

try {
    const workbook = XLSX.readFile(filePath);
    const scoringSheet = workbook.Sheets['Scoring'];
    const scoringData = XLSX.utils.sheet_to_json(scoringSheet, { header: 1 });

    // Check first few rows for headers. Sometimes they are in row 0 or 1.
    const headers = scoringData[1] || [];
    console.log('Row 1 Headers:', headers.map((h, i) => `${i}: ${h}`));

} catch (error) {
    console.error("Error reading file:", error);
}
