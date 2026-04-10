require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function fixWeekends() {
    const { data: trades, error } = await supabase.from('trades').select('*');
    if (error) {
        console.error('Error fetching trades:', error);
        return;
    }
    
    let updatedCount = 0;
    
    for (const trade of trades) {
        const dateObj = new Date(trade.date);
        const day = dateObj.getDay(); // 0 is Sunday, 6 is Saturday
        
        let needsUpdate = false;
        if (day === 0) {
            // Sunday -> Monday
            dateObj.setDate(dateObj.getDate() + 1);
            needsUpdate = true;
        } else if (day === 6) {
            // Saturday -> Friday (subtract 1 day to stay on Friday)
            dateObj.setDate(dateObj.getDate() - 1);
            needsUpdate = true;
        }
        
        if (needsUpdate) {
            const { error: updateError } = await supabase
                .from('trades')
                .update({ date: dateObj.toISOString() })
                .eq('id', trade.id);
                
            if (updateError) {
                console.error(`Failed to update trade ${trade.id}:`, updateError);
            } else {
                updatedCount++;
            }
        }
    }
    
    console.log(`Successfully fixed weekend dates for ${updatedCount} trades.`);
}

fixWeekends();
