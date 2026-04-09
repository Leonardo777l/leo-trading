const fs = require('fs');

const csvPath = '/Users/leonardovidal/Documents/PYTON/LEO TRADING/TRADES TOTALES.csv';

function process() {
    const content = fs.readFileSync(csvPath, 'utf8');
    const lines = content.split('\n').filter(l => l.trim() !== '');
    const header = lines[0].split(',');
    
    // Helper to find column index
    const idx = (name) => header.indexOf(name);
    
    const rawRows = lines.slice(1).map(line => {
        // Simple CSV splitter (doesn't handle commas in quotes but CSV seems clean)
        return line.split(',');
    });

    const finalTrades = [];

    rawRows.forEach(row => {
        const date = row[idx('Date')];
        const result = row[idx('Result')]; // TP, SL, BE
        const netPL = parseFloat(row[idx('Net P&L')]);
        const asset = 'MNQ'; // Force MNQ
        const account = row[idx('Account')] || 'PERSONAL';
        const direction = row[idx('Direction')];
        const contracts = parseInt(row[idx('Contracts')]) || 1;
        const targetTicks = parseInt(row[idx('Target Ticks')]) || 0;
        const stopTicks = parseInt(row[idx('Stop Ticks')]) || 0;
        const note = row[idx('Notes')] || '';
        const mental = row[idx('Mental State')] || 'Calm';

        // 1:3 Variant
        const trade1p3 = {
            date,
            direction,
            outcome: result,
            ticksTarget: targetTicks,
            stopTicks: stopTicks,
            contracts,
            netProfit: netPL,
            estadoMental: mental,
            account,
            instrument: asset,
            strategy: 'ORDER FLOW 1:3',
            notes: note
        };
        finalTrades.push(trade1p3);

        // 1:1.5 Variant
        let outcome1p5 = result;
        let netProfit1p5 = netPL;

        if (result === 'TP') {
            outcome1p5 = 'TP';
            netProfit1p5 = netPL * 0.5;
        } else if (result === 'BE') {
            outcome1p5 = 'TP';
            // Risk * 1.5 - Commission
            // MNQ Risk = stopTicks * 0.5 * contracts
            const risk = stopTicks * 0.5 * contracts;
            const commissions = contracts * 1.20;
            netProfit1p5 = (risk * 1.5) - commissions;
        } else if (result === 'SL') {
            outcome1p5 = 'SL';
            netProfit1p5 = netPL;
        }

        const trade1p5 = {
            date,
            direction,
            outcome: outcome1p5,
            ticksTarget: targetTicks / 2,
            stopTicks: stopTicks,
            contracts,
            netProfit: netProfit1p5,
            estadoMental: mental,
            account,
            instrument: asset,
            strategy: 'ORDER FLOW 1:1.5',
            notes: note
        };
        finalTrades.push(trade1p5);
    });

    fs.writeFileSync('scratch/trades_to_upload.json', JSON.stringify(finalTrades, null, 2));
    console.log(`Successfully processed ${rawRows.length} rows into ${finalTrades.length} strategy variants.`);
}

process();
