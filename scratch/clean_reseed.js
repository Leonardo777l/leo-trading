const fs = require('fs');

function parseCSV(content) {
    const rows = [];
    let curRow = [];
    let curField = '';
    let inQuote = false;
    
    for (let i = 0; i < content.length; i++) {
        const char = content[i];
        const nextChar = content[i+1];
        
        if (char === '"') {
            if (inQuote && nextChar === '"') {
                // Handle escaped quotes ""
                curField += '"';
                i++;
            } else {
                inQuote = !inQuote;
            }
        } else if (char === ',' && !inQuote) {
            curRow.push(curField.trim());
            curField = '';
        } else if ((char === '\n' || char === '\r') && !inQuote) {
            if (curField || curRow.length > 0) {
                curRow.push(curField.trim());
                rows.push(curRow);
                curRow = [];
                curField = '';
            }
            if (char === '\r' && nextChar === '\n') i++; // Skip \n after \r
        } else {
            curField += char;
        }
    }
    
    if (curField || curRow.length > 0) {
        curRow.push(curField.trim());
        rows.push(curRow);
    }
    
    const headers = rows[0];
    return rows.slice(1).map(r => {
        const row = {};
        headers.forEach((h, i) => {
            row[h] = r[i] || '';
        });
        return row;
    });
}

const csvContent = fs.readFileSync('TRADES TOTALES.csv', 'utf8');
const rows = parseCSV(csvContent);

const trades = rows.map(row => {
    if (!row['Date']) return null;

    return {
        date: row['Date'],
        direction: row['Direction'],
        outcome: row['Result'],
        ticksTarget: parseFloat(row['Target Ticks']),
        stopTicks: parseFloat(row['Stop Ticks']),
        contracts: parseInt(row['Contracts']),
        netProfit: parseFloat(row['Net P&L']),
        estadoMental: row['Mental State'] || 'Calm',
        account: (row['Account'] || 'PERSONAL').toUpperCase(),
        instrument: 'MNQ',
        strategy: 'Order Flow',
        notes: row['Notes'] || ''
    };
}).filter(t => t !== null);

fs.writeFileSync('public/reseedData.json', JSON.stringify(trades, null, 2));
console.log(`Successfully generated ${trades.length} trades in public/reseedData.json`);
