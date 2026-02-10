const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, '../../LAT2025_6.xlsx');
console.log(`Reading file: ${filePath}`);

try {
    const workbook = XLSX.readFile(filePath);
    console.log('Sheet Names:', workbook.SheetNames);

    // Sample the first meaningful sheet (skipping maybe specific ones if they look like metadata, but checking first 3 is safe)
    workbook.SheetNames.slice(0, 3).forEach(name => {
        console.log(`\n--- Sheet: ${name} ---`);
        const ws = workbook.Sheets[name];
        const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
        if(data.length > 0) {
            data.slice(0, 5).forEach((row, i) => console.log(`Row ${i}:`, row));
        } else {
            console.log("Empty sheet");
        }
    });

} catch (error) {
    console.error("Error reading file:", error.message);
}
