const { createClient } = require('@supabase/supabase-js');

const supabase = createClient('https://nwcoixiensqfvzbhurlm.supabase.co', 'sb_publishable_UsecuBF_cKa1pdvR5QWaWg_kD62vRWl');

async function check() {
  const { data, error } = await supabase.from('trades').select('*');
  if (error) {
    console.error('Error fetching trades:', error);
    return;
  }
  
  console.log(`Total trades in DB: ${data.length}`);
  
  const strategyStats = {};
  data.forEach(t => {
    const s = t.strategy || 'NO_STRATEGY';
    strategyStats[s] = (strategyStats[s] || 0) + 1;
  });
  
  console.log('\nStrategy Breakdown:');
  console.log(JSON.stringify(strategyStats, null, 2));

  // Check for potential duplicates
  const groups = {};
  data.forEach(t => {
    // Round to nearest second for date to avoid tiny mismatch if any
    const d = new Date(t.date).getTime();
    const key = `${d}_${t.instrument}_${t.contracts}_${t.notes || ''}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(t);
  });

  console.log('\nDuplicate Analysis:');
  let multiGroups = 0;
  Object.entries(groups).slice(0, 5).forEach(([key, trades]) => {
     console.log(`Key: ${key} -> ${trades.length} trades`);
     trades.forEach(tr => console.log(`  - ${tr.strategy}: ${tr.id}`));
  });

  const toBeDeleted = [];
  Object.entries(groups).forEach(([key, trades]) => {
     const ones1p5 = trades.filter(t => t.strategy === 'ORDER FLOW 1:1.5');
     const ones1p3 = trades.filter(t => t.strategy === 'ORDER FLOW 1:3');
     
     // We expect 1 of each. If we have multiple 1:1.5, we delete the extras.
     if (ones1p5.length > 1) {
         // Keep the first one, delete the rest
         for (let i = 1; i < ones1p5.length; i++) {
             toBeDeleted.push(ones1p5[i].id);
         }
     }
     
     // Also check if we have multiple 1:3 (shouldn't happen but just in case)
     if (ones1p3.length > 1) {
         for (let i = 1; i < ones1p3.length; i++) {
             toBeDeleted.push(ones1p3[i].id);
         }
     }
  });

  console.log(`\nTotal IDs identified for deletion: ${toBeDeleted.length}`);
}

check();
