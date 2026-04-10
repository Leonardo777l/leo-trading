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
    const parts = dateStr.toLowerCase().split(' de ');
    if (parts.length === 3) {
        const day = parseInt(parts[0]);
        const month = monthsMap[parts[1]];
        const year = parseInt(parts[2]);
        if (day && month !== undefined && year) {
            return new Date(year, month, day);
        }
    }
    return new Date();
}

function moveToWeekday(date) {
    if (!date || isNaN(date.getTime())) {
        return null;
    }
    const d = new Date(date);
    const day = d.getDay();
    if (day === 0) { // Sunday -> Monday
        d.setDate(d.getDate() + 1);
    } else if (day === 6) { // Saturday -> Friday
        d.setDate(d.getDate() - 1);
    }
    return d.toISOString();
}

const processedTrades = [];

// 1. Process RR NEGATIVO.csv
if (fs.existsSync('RR NEGATIVO.csv')) {
    const rrData = fs.readFileSync('RR NEGATIVO.csv', 'utf8');
    const rrRows = parseCSV(rrData);
    rrRows.forEach(row => {
        const plRaw = row['P/L (1)'] || '';
        const percentage = parseFloat(plRaw.replace('%', '').replace(',', '.').trim());
        if (isNaN(percentage)) return;
        if (percentage === 0.2) return; // Legacy exclude rule

        const isTarget = row['RR NEGATIVO'] === 'Yes';
        let outcome = isTarget ? 'TP' : 'SL';
        if (percentage === 0) outcome = 'BE';

        const direction = row.Direction.toUpperCase().includes('LARGO') ? 'Long' : 'Short';
        const rawDate = parseSpanishDate(row.Date);
        const date = moveToWeekday(rawDate);
        
        if (!date) return;
        
        const image = (row.IMAGEN || '').replace(/^"/, '').replace(/"$/, '').trim();
        const notes = (row.COMENTARIOS || '').replace(/^"/, '').replace(/"$/, '').trim();

        // 50k base organic calculation if net profit not explicitly provided
        let netProfit = parseFloat((50000 * (percentage / 100)).toFixed(2));

        const baseTrade = {
            date,
            direction,
            outcome,
            ticksTarget: parseInt(row.PUNTOS) || 0,
            stopTicks: 0,
            contracts: 1,
            netProfit,
            estadoMental: 'Calm',
            imageLink: image,
            account: 'BACK TESTING',
            instrument: 'MNQ',
            strategy: 'RR NEGATIVO',
            notes
        };

        if (percentage === 1.4) {
            // Split as before
            processedTrades.push({ ...baseTrade, netProfit: netProfit / 2, notes: (notes + ' (Split 1/2)').trim() });
            processedTrades.push({ ...baseTrade, netProfit: netProfit / 2, notes: (notes + ' (Split 2/2)').trim() });
        } else {
            processedTrades.push(baseTrade);
        }
    });
}

// 2. Process ESTRATEGIA 2.csv
if (fs.existsSync('ESTRATEGIA 2.csv')) {
    const e2Data = fs.readFileSync('ESTRATEGIA 2.csv', 'utf8');
    const e2Rows = parseCSV(e2Data);
    e2Rows.forEach(row => {
        if (!row.Date) return;
        const rawDate = new Date(row.Date);
        const date = moveToWeekday(rawDate);
        
        if (!date) return;
        
        const outcome = row.Result === 'BE' ? 'BE' : (row.Result === 'TP' ? 'TP' : 'SL');
        const netProfit = parseFloat(row['Net P&L']) || 0;

        const baseTrade = {
            date,
            direction: row.Direction || 'Long',
            outcome,
            ticksTarget: parseInt(row['Target Ticks']) || 0,
            stopTicks: parseInt(row['Stop Ticks']) || 0,
            contracts: parseInt(row.Contracts) || 1,
            netProfit,
            estadoMental: row['Mental State'] || 'Calm',
            imageLink: '',
            account: 'BACK TESTING',
            instrument: row.Asset || 'MNQ',
            strategy: row.Strategy || 'Other',
            notes: (row.Notes || '').replace(/^"/, '').replace(/"$/, '').trim()
        };

        processedTrades.push(baseTrade);

        // Handle Order Flow variants if desired
        if (row.Strategy === 'Order Flow') {
            // 1:1.5 Variant
            let v15Outcome = outcome;
            let v15Profit = netProfit;
            
            if (outcome === 'TP') {
                v15Profit = netProfit / 2;
            } else if (outcome === 'BE') {
                v15Outcome = 'TP';
                v15Profit = 748.80; // Standardized for the variant as it's a "simulated" win
            }

            processedTrades.push({
                ...baseTrade,
                strategy: 'ORDER FLOW 1.5',
                outcome: v15Outcome,
                netProfit: v15Profit,
                notes: (baseTrade.notes + ' (Variant 1.5)').trim()
            });

            // Rename original for clarity in selector
            baseTrade.strategy = 'ORDER FLOW 1:3';
        }
    });
}

fs.writeFileSync('public/restored_backtesting.json', JSON.stringify(processedTrades, null, 2));
console.log(`Successfully prepared ${processedTrades.length} trades for restoration.`);
