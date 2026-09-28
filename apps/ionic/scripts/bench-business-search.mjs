#!/usr/bin/env node
/**
 * Times the business list's text search against ws.parlament.ch.
 *
 * Every variant sends the same request shape BusinessService.getBusinesses
 * builds (select, top 20, ordered by SubmissionDate), and changes one thing at
 * a time, so the numbers say what actually makes the search slow.
 *
 *   node apps/ionic/scripts/bench-business-search.mjs
 *   node apps/ionic/scripts/bench-business-search.mjs --runs 3 --terms Schule,Klima
 *   node apps/ionic/scripts/bench-business-search.mjs --variants all-sessions,since-4y
 */

const BASE = 'https://ws.parlament.ch/odata.svc';
const TIMEOUT_MS = 45000;

const args = Object.fromEntries(
  process.argv
    .slice(2)
    .reduce((pairs, arg, i, all) => {
      if (arg.startsWith('--')) pairs.push([arg.slice(2), all[i + 1]]);
      return pairs;
    }, [])
);
const RUNS = Number(args.runs ?? 2);
const LANG = (args.lang ?? 'DE').toUpperCase();
// A term with no hits is the worst case: the server cannot stop after 20 rows.
const TERMS = (args.terms ?? 'Schule,Klima,AHV,Xylophon').split(',');

const SELECT = [
  'ID',
  'BusinessShortNumber',
  'BusinessTypeName',
  'BusinessStatusText',
  'BusinessStatusDate',
  'Title',
  'TagNames'
].join(',');

const quote = (s) => `'${s.replace(/'/g, "''")}'`;
const since = (years) => {
  const d = new Date();
  d.setFullYear(d.getFullYear() - years);
  return `datetime'${d.toISOString().slice(0, 10)}T00:00:00'`;
};

async function odata(collection, params, timeoutMs = TIMEOUT_MS) {
  const query = Object.entries({ $format: 'json', ...params })
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join('&');
  const url = `${BASE}/${collection}?${query}`;
  const started = performance.now();
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) });
    const body = await res.json();
    const ms = performance.now() - started;
    if (!res.ok) return { ms, error: `HTTP ${res.status}` };
    return { ms, rows: body.d?.results ?? body.d ?? [] };
  } catch (e) {
    return {
      ms: performance.now() - started,
      error: e.name === 'TimeoutError' ? 'timeout' : e.message
    };
  }
}

async function latestSession() {
  const { rows, error } = await odata('Session', {
    $filter: `Language eq '${LANG}'`,
    $orderby: 'StartDate desc',
    $select: 'ID,SessionName,StartDate,LegislativePeriodNumber',
    $top: '1'
  });
  if (error) throw new Error(`Could not load sessions: ${error}`);
  return rows[0];
}

function variants(session) {
  const base = (term, { titleOnly = false } = {}) => [
    `Language eq '${LANG}'`,
    `BusinessShortNumber ne '00.000'`,
    titleOnly
      ? `substringof(${quote(term)}, Title) eq true`
      : `(substringof(${quote(term)}, Title) or substringof(${quote(term)}, TagNames)) eq true`
  ];
  const req = (filter, extra = {}) => ({
    $filter: filter.join(' and '),
    $orderby: 'SubmissionDate desc',
    $select: SELECT,
    $top: '20',
    ...extra
  });

  return {
    // What the app sends today with "all sessions".
    'all-sessions': (t) => req(base(t)),
    // What the app sends today with the default (latest) session.
    'current-session': (t) =>
      req([...base(t), `SubmissionSession eq ${session.ID}`]),
    'all-sessions-page-2': (t) => req(base(t), { $skip: '20' }),
    'title-only': (t) => req(base(t, { titleOnly: true })),
    'no-orderby': (t) => {
      const r = req(base(t));
      delete r.$orderby;
      return r;
    },
    'since-1y': (t) => req([...base(t), `SubmissionDate ge ${since(1)}`]),
    'since-4y': (t) => req([...base(t), `SubmissionDate ge ${since(4)}`]),
    'since-10y': (t) => req([...base(t), `SubmissionDate ge ${since(10)}`]),
    'current-legislature': (t) =>
      req([
        ...base(t),
        `SubmissionLegislativePeriod eq ${session.LegislativePeriodNumber}`
      ]),
    'since-4y-title-only': (t) =>
      req([...base(t, { titleOnly: true }), `SubmissionDate ge ${since(4)}`])
  };
}

const fmt = (ms) => `${(ms / 1000).toFixed(1)}s`.padStart(6);

async function main() {
  const session = await latestSession();
  console.log(
    `Latest session: ${session.SessionName} (ID ${session.ID}, legislature ${session.LegislativePeriodNumber})`
  );
  console.log(`Language ${LANG}, ${RUNS} run(s) per cell, timeout ${TIMEOUT_MS / 1000}s\n`);

  const all = variants(session);
  const picked = args.variants ? args.variants.split(',') : Object.keys(all);

  const table = [];
  for (const name of picked) {
    for (const term of TERMS) {
      const times = [];
      let rows = '?';
      let errors = [];
      for (let i = 0; i < RUNS; i++) {
        const r = await odata('Business', all[name](term));
        times.push(r.ms);
        if (r.error) errors.push(r.error);
        else rows = r.rows.length;
      }
      times.sort((a, b) => a - b);
      const line = {
        variant: name,
        term,
        min: fmt(times[0]),
        median: fmt(times[Math.floor(times.length / 2)]),
        max: fmt(times[times.length - 1]),
        rows: String(rows),
        errors: errors.join(',')
      };
      table.push(line);
      console.log(
        `${name.padEnd(22)} ${term.padEnd(10)} min ${line.min}  median ${line.median}  max ${line.max}  rows ${line.rows.padStart(2)}  ${line.errors}`
      );
    }
  }

  if (args.json) {
    const { writeFile } = await import('node:fs/promises');
    await writeFile(args.json, JSON.stringify(table, null, 2));
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
