const fs = require('fs');

function parseCSV(content) {
    const lines = content.split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    return lines.slice(1).filter(l => l.trim()).map(line => {
        const values = [];
        let current = '';
        let inQuotes = false;
        for (let char of line) {
            if (char === '"') inQuotes = !inQuotes;
            else if (char === ',' && !inQuotes) {
                values.push(current);
                current = '';
            } else current += char;
        }
        values.push(current);

        const obj = {};
        headers.forEach((h, i) => {
            obj[h] = values[i] ? values[i].trim() : '';
        });
        return obj;
    });
}

const monthsMap = {
    'enero': 0, 'febrero': 1, 'marzo': 2, 'abril': 3, 'mayo': 4, 'junio': 5,
    'julio': 6, 'agosto': 7, 'septiembre': 8, 'octubre': 9, 'noviembre': 10, 'diciembre': 11
};

function parseSpanishDate(dateStr) {
    // "10 de febrero de 2026"
    const parts = dateStr.toLowerCase().split(' de ');
    if (parts.length === 3) {
        const day = parseInt(parts[0]);
        const month = monthsMap[parts[1]];
        const year = parseInt(parts[2]);
        if (day && month !== undefined && year) {
            return new Date(year, month, day).toISOString();
        }
    }
    return new Date().toISOString(); 
}

const csvData = fs.readFileSync('RR NEGATIVO.csv', 'utf8');
const rawTrades = parseCSV(csvData);

const ACCOUNT_SIZE = 50000;
const SL_AMOUNT = -500;
const TP_AMOUNT = 350;

const processed = [];

rawTrades.forEach(t => {
    const plRaw = t['P/L (1)'] || '';
    // Clean string: "0,7 %" -> 0.7
    const percentage = parseFloat(plRaw.replace('%', '').replace(',', '.').trim());

    if (isNaN(percentage)) return;
    if (percentage === 0.2) return; // Rule: exclude 0.2%

    const isTarget = t['RR NEGATIVO'] === 'Yes';
    let outcome = isTarget ? 'TP' : 'SL';
    if (percentage === 0) outcome = 'BE';

    const direction = t.Direction.toUpperCase().includes('LARGO') ? 'Long' : 'Short';
    const date = parseSpanishDate(t.Date);
    const image = (t.IMAGEN || '').replace(/^"/, '').replace(/"$/, '').trim();
    const notes = (t.COMENTARIOS || '').replace(/^"/, '').replace(/"$/, '').trim();

    const baseTrade = {
        date,
        direction,
        outcome,
        ticksTarget: 0,
        stopTicks: 0,
        contracts: 1,
        netProfit: 0,
        estadoMental: 'Calm',
        imageLink: image,
        account: 'TESTING',
        instrument: 'MNQ',
        strategy: 'RR NEGATIVO',
        notes
    };

    if (percentage === 1.4) {
        // Rule: Two trades of 0.7% ($350 each)
        processed.push({ ...baseTrade, netProfit: TP_AMOUNT, outcome: 'TP', notes: (notes + ' (Split 1/2)').trim() });
        processed.push({ ...baseTrade, netProfit: TP_AMOUNT, outcome: 'TP', notes: (notes + ' (Split 2/2)').trim() });
    } else if (percentage === 0.7) {
        processed.push({ ...baseTrade, netProfit: TP_AMOUNT, outcome: 'TP' });
    } else if (percentage === -1) {
        processed.push({ ...baseTrade, netProfit: SL_AMOUNT, outcome: 'SL' });
    } else if (percentage === 0) {
        processed.push({ ...baseTrade, netProfit: 0, outcome: 'BE' });
    } else {
        // Fallback for any other targets just in case
        const actualProfit = parseFloat((ACCOUNT_SIZE * (percentage / 100)).toFixed(2));
        processed.push({ ...baseTrade, netProfit: actualProfit, outcome: actualProfit > 0 ? 'TP' : (actualProfit < 0 ? 'SL' : 'BE') });
    }
});

console.log(`Successfully processed ${processed.length} trades for RR NEGATIVO.`);
fs.writeFileSync('public/rrNegativoData.json', JSON.stringify(processed, null, 2));
console.log('Saved to public/rrNegativoData.json');
