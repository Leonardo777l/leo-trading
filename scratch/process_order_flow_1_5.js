const fs = require('fs');

function parseCSV(content) {
    const lines = content.split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    return lines.slice(1).filter(l => l.trim()).map(line => {
        // Handle potential commas in quotes if any, but this CSV looks simple
        const values = line.split(',');
        const obj = {};
        headers.forEach((h, i) => {
            obj[h] = values[i] ? values[i].trim() : '';
        });
        return obj;
    });
}

const csvData = fs.readFileSync('ESTRATEGIA 2.csv', 'utf8');
const trades = parseCSV(csvData);

const ACCOUNT_SIZE = 50000;
const RISK_PERCENT = 0.01;
const REWARD_PERCENT = 0.015;
const MNQ_COMM = 1.20;

const transformed = trades
    .filter(t => t.Strategy === 'Order Flow') // Only the Order Flow trades from the backup
    .map(t => {
        const contracts = parseInt(t.Contracts) || 1;
        let outcome = t.Result;
        let netProfit = parseFloat(t['Net P&L']);

        if (outcome === 'TP') {
            // Rule 1: TP gains are halved (Risk/Reward 1:1.5 instead of 1:3)
            netProfit = netProfit / 2;
        } else if (outcome === 'BE') {
            // Rule 2: BEs become TPs
            outcome = 'TP';
            // Rule 3: Use the 1.5% profit target for these newly converted TPs
            // $750 target - commissions
            netProfit = (ACCOUNT_SIZE * REWARD_PERCENT) - (contracts * MNQ_COMM);
        }

        return {
            date: new Date(t.Date).toISOString(),
            direction: t.Direction,
            outcome: outcome,
            ticksTarget: parseInt(t['Target Ticks']) || 0,
            stopTicks: parseInt(t['Stop Ticks']) || 0,
            contracts: contracts,
            netProfit: parseFloat(netProfit.toFixed(2)),
            estadoMental: t['Mental State'] || 'Calm',
            imageLink: '',
            account: t.Account || 'PERSONAL',
            instrument: 'MNQ', // Normalized as requested
            strategy: 'ORDER FLOW 1.5', // New Workspace name
            notes: (t.Notes || '').replace(/^"/, '').replace(/"$/, '').trim()
        };
    });

console.log(`Successfully transformed ${transformed.length} trades.`);
console.log(`Example TP:`, transformed.find(t => t.outcome === 'TP'));

fs.writeFileSync('public/orderFlow1_5Data.json', JSON.stringify(transformed, null, 2));
console.log('Saved to public/orderFlow1_5Data.json');
