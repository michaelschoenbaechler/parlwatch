import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { gunzipSync } from 'node:zlib';

const [from, to] = process.argv.slice(2);
if (!from || !to) {
  console.error('usage: node diff.mjs <night-dir> <night-dir>');
  process.exit(1);
}

const files = {
  transcripts: (r) => r.ID,
  meetings: (r) => r.ID,
  'subject-business': (r) => `${r.IdSubject}|${r.BusinessNumber}`,
};
const ignored = new Set(['Modified', 'StartTimeWithTimezone', 'EndTimeWithTimezone']);

async function load(dir, name, keyOf) {
  const text = gunzipSync(await readFile(join(dir, `${name}.ndjson.gz`))).toString();
  return new Map(text.trim().split('\n').filter(Boolean).map((l) => {
    const r = JSON.parse(l);
    return [keyOf(r), r];
  }));
}

for (const [name, keyOf] of Object.entries(files)) {
  const a = await load(from, name, keyOf);
  const b = await load(to, name, keyOf);
  const added = [...b.keys()].filter((k) => !a.has(k));
  const removed = [...a.keys()].filter((k) => !b.has(k));
  const fieldCounts = {};
  let touched = 0;
  const changed = [];
  for (const [k, row] of b) {
    const old = a.get(k);
    if (!old) continue;
    if (old.Modified !== row.Modified) touched++;
    const fields = Object.keys({ ...old, ...row }).filter(
      (f) => !ignored.has(f) && JSON.stringify(old[f]) !== JSON.stringify(row[f]),
    );
    if (fields.length === 0) continue;
    changed.push({ key: k, fields });
    for (const f of fields) fieldCounts[f] = (fieldCounts[f] ?? 0) + 1;
  }
  console.log(
    `${name}: ${a.size} → ${b.size}, +${added.length} −${removed.length}, ` +
      `Modified bumped ${touched}, content changed ${changed.length}`,
  );
  if (Object.keys(fieldCounts).length) console.log('  fields:', fieldCounts);
  if (process.env.VERBOSE) {
    for (const k of added) console.log('  +', k);
    for (const k of removed) console.log('  −', k);
    for (const c of changed) console.log('  ~', c.key, c.fields.join(','));
  }
}
