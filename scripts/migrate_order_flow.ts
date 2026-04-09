import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const calculateNetProfit = (outcome: string, ticks: number, stop: number, contracts: number, instrument?: string) => {
    let tickValue = 0.50; // Default MNQ
    let commissionPerContract = 1.20; // Default MNQ

    switch (instrument?.toUpperCase()) {
        case 'NQ':
            tickValue = 5.00;
            commissionPerContract = 4.10;
            break;
        case 'ES':
            tickValue = 12.50;
            commissionPerContract = 4.10;
            break;
        case 'MES':
            tickValue = 1.25;
            commissionPerContract = 1.20;
            break;
        case 'CL':
        case 'GC':
            tickValue = 10.00;
            commissionPerContract = 4.50;
            break;
        case 'MNQ':
        default:
            tickValue = 0.50;
            commissionPerContract = 1.20;
            break;
    }

    let gross = 0;
    
    if (outcome === 'TP') {
        gross = ticks * tickValue * contracts;
    } else if (outcome === 'SL') {
        gross = -(stop * tickValue * contracts);
    } else {
        gross = 0; // BE
    }

    const totalCommissions = contracts * commissionPerContract;
    return gross - totalCommissions;
};

async function migrate() {
    console.log('Fetching all trades...');
    const { data: allTrades, error: fetchError } = await supabase.from('trades').select('*');
    
    if (fetchError) {
        console.error('Error fetching trades:', fetchError);
        return;
    }
    
    // Find valid candidates: usually strategy = 'Order Flow' or null/empty (if default)
    // Actually we'll target EXACTLY 'Order Flow' or null (which is historically Order Flow in the app)
    const candidates = allTrades.filter(t => !t.strategy || t.strategy.trim().toLowerCase() === 'order flow');
    console.log(`Found ${candidates.length} candidates for migration.`);

    for (let trade of candidates) {
        // Renaming old to 'ORDER FLOW 1:3'
        const { error: updateError } = await supabase
            .from('trades')
            .update({ strategy: 'ORDER FLOW 1:3' })
            .eq('id', trade.id);

        if (updateError) {
            console.error(`Error updating trade ${trade.id}:`, updateError);
            continue;
        }

        // Create the 1:1.5 variant
        let newOutcome = trade.outcome;
        if (trade.outcome === 'BE' || trade.outcome === 'TP') {
            newOutcome = 'TP';
        }

        // Ticks Target logic
        // For 1:1.5, we just halve the 1:3 ticksTarget, OR do stopTicks * 1.5
        // We'll trust stopTicks * 1.5 if stopTicks > 0, else ticksTarget / 2.
        let newTicksTarget = trade.ticksTarget > 0 ? trade.ticksTarget / 2 : 0;
        
        let newNetProfit = calculateNetProfit(
            newOutcome,
            newTicksTarget,
            trade.stopTicks,
            trade.contracts,
            trade.instrument
        );

        // Omit id so id is auto-generated
        const { id, ...tradeWithoutId } = trade;
        const newTrade = {
            ...tradeWithoutId,
            strategy: 'ORDER FLOW 1:1.5',
            outcome: newOutcome,
            ticksTarget: newTicksTarget,
            netProfit: newNetProfit
        };

        const { error: insertError } = await supabase
            .from('trades')
            .insert([newTrade]);

        if (insertError) {
            console.error(`Error inserting new trade cloned from ${trade.id}:`, insertError);
        } else {
            console.log(`Successfully migrated trade ${trade.id} into 1:3 and cloned as 1:1.5`);
        }
    }
    
    console.log('Migration complete.');
}

migrate();
