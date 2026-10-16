const fs = require('fs');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://sklanvjgzfrhndlazhcb.supabase.co';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_KEY) {
  console.error('Error: SUPABASE_SERVICE_ROLE_KEY environment variable is required.');
  process.exit(1);
}

async function pruneDuplicates() {
  const isDryRun = process.argv.includes('--dry-run') || process.env.DRY_RUN === 'true';

  // Fetch all scores ordered by score desc, created_at asc
  const fetchUrl = `${SUPABASE_URL}/rest/v1/scores?select=*&order=score.desc,created_at.asc`;
  const res = await fetch(fetchUrl, {
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`
    }
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch scores: ${res.status} ${res.statusText}`);
  }

  const allScores = await res.json();
  console.log(`Found ${allScores.length} total score entries in Supabase.`);

  const bestByInitials = new Map();
  const idsToDelete = [];

  for (const s of allScores) {
    const init = (s.initials || '???').toUpperCase();
    if (!bestByInitials.has(init)) {
      // First time seeing this initials (since ordered by score.desc, this is their personal best!)
      bestByInitials.set(init, s);
    } else {
      // Duplicate, lower score for this player -> mark for pruning
      idsToDelete.push(s);
    }
  }

  console.log('\n--- HIGHEST SCORES KEPT PER PERSON ---');
  let rank = 1;
  for (const [init, s] of bestByInitials.entries()) {
    console.log(`  #${rank++} [${init}] - £${s.score.toLocaleString()} (ID: ${s.id}, Date: ${s.created_at})`);
  }

  if (idsToDelete.length === 0) {
    console.log('\nNo duplicate scores found. Leaderboard is already 100% clean!');
    return;
  }

  console.log(`\n--- DUPLICATES TO PRUNE (${idsToDelete.length} entries) ---`);
  for (const s of idsToDelete) {
    console.log(`  Pruning [${s.initials}] - £${s.score.toLocaleString()} (ID: ${s.id})`);
  }

  if (isDryRun) {
    console.log('\n[DRY RUN] No records were deleted.');
    return;
  }

  // Delete duplicate IDs
  const idList = idsToDelete.map(s => s.id);
  const deleteUrl = `${SUPABASE_URL}/rest/v1/scores?id=in.(${idList.join(',')})`;
  const delRes = await fetch(deleteUrl, {
    method: 'DELETE',
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      Prefer: 'return=representation'
    }
  });

  if (!delRes.ok) {
    const errText = await delRes.text();
    throw new Error(`Failed to delete duplicates: ${delRes.status} ${errText}`);
  }

  const deletedRows = await delRes.json();
  console.log(`\nSuccessfully pruned ${deletedRows.length} duplicate score entries.`);
  console.log('Leaderboard is now deduplicated!');
}

pruneDuplicates().catch(err => {
  console.error('Prune failed:', err);
  process.exit(1);
});
