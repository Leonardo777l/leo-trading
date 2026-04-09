import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://nwcoixiensqfvzbhurlm.supabase.co', 'sb_publishable_UsecuBF_cKa1pdvR5QWaWg_kD62vRWl');

async function check() {
  const { data, error } = await supabase.from('trades').select('*');
  if (error) console.error(error);
  
  console.log(`Total trades: ${data.length}`);
  
  const strategyCounts = {};
  for (const trade of data) {
    const s = trade.strategy || 'empty';
    strategyCounts[s] = (strategyCounts[s] || 0) + 1;
  }
  console.log(strategyCounts);
}
check();
