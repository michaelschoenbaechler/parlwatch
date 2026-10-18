import { mkdir, readFile, writeFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';

const BASE = 'https://ws.parlament.ch/odata.svc';
const SESSION_NAME = process.env.SESSION_NAME ?? 'Wintersession 2026';
const LANGUAGE = process.env.LANGUAGE ?? 'DE';
const OUT = process.env.OUT ?? './data';
const DAYS_AFTER_FINAL = Number(process.env.DAYS_AFTER_FINAL ?? 14);

async function fetchAll(entity, filter) {
  const rows = [];
  let url = `${BASE}/${entity}?$filter=${encodeURIComponent(filter)}&$format=json`;
  while (url) {
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error(`${res.status} ${url}`);
    const { d } = await res.json();
    rows.push(...(Array.isArray(d) ? d : d.results));
    url = Array.isArray(d) ? null : d.__next && `${d.__next}&$format=json`;
  }
  return rows.map(strip);
}

function strip(row) {
  return Object.fromEntries(
    Object.entries(row)
      .filter(([k, v]) => k !== '__metadata' && !v?.__deferred)
      .sort(([a], [b]) => a.localeCompare(b)),
  );
}

const key = (...fields) => (r) => fields.map((f) => String(r[f]).padStart(12, '0')).join('|');

async function save(dir, name, rows, keyOf) {
  rows.sort((a, b) => keyOf(a).localeCompare(keyOf(b)));
  const ndjson = rows.map((r) => JSON.stringify(r)).join('\n') + '\n';
  await writeFile(join(dir, `${name}.ndjson.gz`), gzipSync(ndjson));
}

const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Zurich' });

const [session] = await fetchAll(
  'Session',
  `Language eq '${LANGUAGE}' and SessionName eq '${SESSION_NAME}'`,
);
if (!session) {
  console.log(`${today}: ${SESSION_NAME} not in the API yet`);
  process.exit(0);
}

const root = join(OUT, String(session.ID));
await mkdir(root, { recursive: true });
const finalMarker = join(root, 'final-since');
const finalSince = await readFile(finalMarker, 'utf8').catch(() => null);
if (finalSince) {
  const days = (Date.parse(today) - Date.parse(finalSince.trim())) / 86_400_000;
  if (days > DAYS_AFTER_FINAL) {
    console.log(`${today}: ${session.ID} final since ${finalSince.trim()}, done`);
    process.exit(0);
  }
}

const meetings = await fetchAll('Meeting', `Language eq '${LANGUAGE}' and IdSession eq ${session.ID}`);
if (meetings.length === 0) {
  console.log(`${today}: ${session.ID} has no meetings yet`);
  process.exit(0);
}
const transcripts = await fetchAll(
  'Transcript',
  `Language eq '${LANGUAGE}' and IdSession eq '${session.ID}'`,
);
const links = await fetchAll(
  'SubjectBusiness',
  `Language eq '${LANGUAGE}' and Subjects/Meetings/IdSession eq ${session.ID}`,
);

const dir = join(root, today);
await mkdir(dir, { recursive: true });
await save(dir, 'meetings', meetings, key('ID'));
await save(dir, 'transcripts', transcripts, key('ID'));
await save(dir, 'subject-business', links, key('IdSubject', 'BusinessNumber'));

const drafts = meetings.filter((m) => m.PublicationStatus !== 'final').length;
if (drafts === 0 && !finalSince) await writeFile(finalMarker, `${today}\n`);

const nights = (await readdir(root)).filter((n) => /^\d{4}-/.test(n)).length;
console.log(
  `${today}: ${session.ID} meetings=${meetings.length} draft=${drafts} transcripts=${transcripts.length} links=${links.length} nights=${nights}`,
);
