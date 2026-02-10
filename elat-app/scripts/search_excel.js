const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, '../../LAT2025_6.xlsx');

try {
    const workbook = XLSX.readFile(filePath);

    workbook.SheetNames.forEach(sheetName => {
        const ws = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(ws, { header: 1 });

        data.forEach((row, rowIndex) => {
            if (!row) return;
            row.forEach((cell, colIndex) => {
                if (typeof cell === 'string' && cell.toLowerCase().includes('conforme')) {
                    console.log(`Found 'conforme' in ${sheetName} [${rowIndex}, ${colIndex}]:`, cell);
                }
            });
        });
    });

} catch (error) {
    console.error("Error searching file:", error);
}
