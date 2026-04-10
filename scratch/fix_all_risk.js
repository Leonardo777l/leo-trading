const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    console.log('Fetching all trades...');
    const { data: allTrades, error } = await supabase.from('trades').select('*');
    if (error) {
        console.error('Error fetching trades:', error);
        return;
    }
    
    console.log(`Found ${allTrades.length} trades total.`);
    
    let updatedCount = 0;
    
    for (const t of allTrades) {
        const s = (t.strategy || '').toUpperCase();
        let expectedNetProfit = null;
        
        if (s.includes('RR NEGATIVO')) {
            if (t.outcome === 'TP') expectedNetProfit = 350;
            else if (t.outcome === 'SL') expectedNetProfit = -500;
            else expectedNetProfit = 0;
        } else if (s.includes('ORDER FLOW 1.5') || s.includes('1:1.5')) {
            if (t.outcome === 'TP') expectedNetProfit = 750;
            else if (t.outcome === 'SL') expectedNetProfit = -500;
            else expectedNetProfit = 0;
        } else if (s.includes('ORDER FLOW')) {
            if (t.outcome === 'TP') expectedNetProfit = 1500;
            else if (t.outcome === 'SL') expectedNetProfit = -500;
            else expectedNetProfit = 0;
        }

        if (expectedNetProfit !== null && t.netProfit !== expectedNetProfit) {
            console.log(`Updating Trade ${t.id} (${t.strategy} / ${t.outcome}): ${t.netProfit} -> ${expectedNetProfit}`);
            const { error: updErr } = await supabase.from('trades').update({ netProfit: expectedNetProfit }).eq('id', t.id);
            if (updErr) {
                console.error('Error updating trade', t.id, updErr);
            } else {
                updatedCount++;
            }
        }
    }
    
    console.log(`Successfully updated ${updatedCount} trades to fixed risk logic.`);
}

run();
