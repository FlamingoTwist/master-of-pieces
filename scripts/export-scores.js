const fs = require('fs');
const path = require('path');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://sklanvjgzfrhndlazhcb.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY || 'sb_publishable_3lAGqD5TwO64zI0OyVSA9Q_kNzoQerE';

async function exportScores() {
  const url = `${SUPABASE_URL}/rest/v1/scores?select=id,initials,score,created_at&order=score.desc,created_at.asc`;
  const res = await fetch(url, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`
    }
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch scores: ${res.status} ${res.statusText}`);
  }

  const rows = await res.json();
  console.log(`Fetched ${rows.length} scores from Supabase.`);

  // Build CSV
  const headers = ['Rank', 'Player Initials', 'Profit Score', 'Submitted Date (UTC)', 'Score ID'];
  const csvLines = [headers.join(',')];

  rows.forEach((row, index) => {
    const rank = index + 1;
    const initials = `"${(row.initials || '').replace(/"/g, '""')}"`;
    const score = row.score || 0;
    const date = `"${(row.created_at || '').replace(/"/g, '""')}"`;
    const id = row.id;
    csvLines.push([rank, initials, score, date, id].join(','));
  });

  const targetPath = path.join(__dirname, '..', 'High Scores Weekly Export.csv');
  fs.writeFileSync(targetPath, csvLines.join('\n'), 'utf8');
  console.log(`Successfully written to: ${targetPath}`);
}

exportScores().catch(err => {
  console.error('Export failed:', err);
  process.exit(1);
});
