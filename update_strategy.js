const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://nwcoixiensqfvzbhurlm.supabase.co';
const supabaseKey = 'sb_publishable_UsecuBF_cKa1pdvR5QWaWg_kD62vRWl'; 

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('Fetching trades...');
  const { data, error } = await supabase.from('trades').select('id, strategy');
  if (error) {
    console.error('Error fetching:', error);
    return;
  }
  
  const toUpdate = data.filter(t => {
      const s = t.strategy ? t.strategy.toUpperCase() : '';
      return s.includes('ORDER FLOW 1.5') || s.includes('ORDER FLOW 1:1.5') || s === 'ORDER FLOW 1.5';
  });

  console.log(`Found ${toUpdate.length} trades to update.`);
  
  for (const trade of toUpdate) {
      const { error: updateError } = await supabase.from('trades').update({ strategy: 'FIBONACCI FRACTAL' }).eq('id', trade.id);
      if (updateError) {
          console.error(`Error updating trade ${trade.id}:`, updateError);
      } else {
          console.log(`Updated trade ${trade.id}`);
      }
  }
  
  console.log('Update complete.');
}

main();
