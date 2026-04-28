require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function deleteData() {
    console.log('Deleting ORDER FLOW 1.5 data...');
    
    // Check what the exact names are before deleting
    const { data: before } = await supabase.from('trades').select('id, strategy').in('strategy', ['ORDER FLOW 1.5', 'ORDER FLOW 1:1.5', 'Order Flow 1.5', 'ORDER FLOW 1.5 ']);
    
    console.log(`Found ${before?.length || 0} trades to delete.`);
    
    if (before && before.length > 0) {
        const { error } = await supabase
            .from('trades')
            .delete()
            .in('strategy', ['ORDER FLOW 1.5', 'ORDER FLOW 1:1.5', 'Order Flow 1.5', 'ORDER FLOW 1.5 ']);
            
        if (error) {
            console.error('Error deleting:', error);
        } else {
            console.log('Deletion successful.');
        }
    } else {
        // Fallback: Delete with wildcard via text filter if there's any stray spaces
        const { data: wildcard } = await supabase.from('trades').select('id, strategy').like('strategy', '%1.5%');
        console.log(`Found ${wildcard?.length || 0} trades to delete via LIKE %1.5%.`);
        
        if (wildcard && wildcard.length > 0) {
            const { error: error2 } = await supabase.from('trades').delete().like('strategy', '%1.5%');
            if (error2) console.error('Error with LIKE:', error2);
            else console.log('Deleted via LIKE.');
        }
    }
}

deleteData();
