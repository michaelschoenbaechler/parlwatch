#!/usr/bin/env node
/**
 * Proof of concept for the insights service (see docs/research/poc-findings.md).
 *
 * For one session it measures how long each council member spoke on each
 * business, sets that against the member's paid interests, and flags the
 * speeches in which the speaker discloses their interests (Art. 11 Abs. 3
 * ParlG). Speeches come from ws.parlament.ch; mandates, their branch and
 * compensation from the weekly Lobbywatch export, which is cached in --out for
 * a day. Nothing is classified by an LLM yet, so the report only puts facts
 * side by side.
 *
 *   node scripts/insights/speaking-time.mjs
 *   node scripts/insights/speaking-time.mjs --session 5215 --out ./insights-out
 *   node scripts/insights/speaking-time.mjs --top 30
 *   node scripts/insights/speaking-time.mjs --no-lobbywatch
 */

import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { loadLobbywatch, paidInterestsAffectedBy } from './lobbywatch.mjs';

const BASE = 'https://ws.parlament.ch/odata.svc';
const TIMEOUT_MS = 60000;
const PAGE_SIZE = 1000;
// Keeps the or-chained filters well below the URL length the server accepts.
const BATCH_SIZE = 25;
// A single transcript entry longer than this is a broken timestamp, not a speech.
const MAX_SPEECH_SECONDS = 60 * 60;

const args = Object.fromEntries(
  process.argv.slice(2).reduce((pairs, arg, i, all) => {
    if (arg.startsWith('--')) pairs.push([arg.slice(2), all[i + 1]]);
    return pairs;
  }, [])
);
const LANG = (args.lang ?? 'DE').toUpperCase();
const OUT_DIR = args.out ?? 'insights-out';
const TOP = Number(args.top ?? 20);
const WITH_LOBBYWATCH = !('no-lobbywatch' in args);
// A business with many topics touches nearly every branch; leave it out of
// the list of speeches without a disclosure, which would otherwise be noise.
const MAX_TOPICS_FOR_MATCH = 3;

/**
 * The speaker's role in this entry. `Function` describes the role the entry
 * was spoken in, `SpeakerFunction` the person's office: a vice president who
 * speaks from their seat has `Function: 'Mit-M'` and `SpeakerFunction: '1VP-M'`.
 * `*` marks the commission rapporteur. Parliamentary group speakers are not
 * marked and count as members.
 */
export function speechRole(fn) {
  if (!fn) return 'other';
  if (fn === '*') return 'rapporteur';
  if (fn.startsWith('Mit')) return 'member';
  // Bundesrat, Bundespräsident(in), Vizepräsident(in) des Bundesrates, Bundeskanzler(in).
  if (/^(BR|BPR|VPBR|BK)-/.test(fn)) return 'federal-council';
  // Ratspräsident(in) and the two vice presidents chairing the sitting.
  if (/^(P|1VP|2VP)-/.test(fn)) return 'chair';
  return 'other';
}

// German, French and Italian phrasings of "I disclose my interests".
const DISCLOSURE = [
  /interessen\w*\s+(offen|bekannt)/i,
  /(lege|gebe)\s+(ich\s+)?(hier\s+)?(meine\s+)?interessen/i,
  /interessenbindung/i,
  /(mes|mon|de mes)\s+(liens?|conflits?)\s+d['’]int[ée]r[êe]ts?/i,
  /(d[ée]clare|annonce|signale)\s+(mes|mon)\s+(liens?|int[ée]r[êe]ts?)/i,
  /(i\s+)?miei\s+(legami|conflitti)\s+d['’]?interess/i,
  /dichiaro\s+(i\s+)?miei\s+interessi/i
];

/** The sentence in which the speaker discloses their interests, or null. */
export function disclosureSnippet(text) {
  for (const re of DISCLOSURE) {
    const match = re.exec(text);
    if (!match) continue;
    const from = text.lastIndexOf('.', match.index) + 1;
    const to = text.indexOf('.', match.index + match[0].length);
    return text
      .slice(from, to < 0 ? undefined : to + 1)
      .trim()
      .slice(0, 300);
  }
  return null;
}

export function plainText(html) {
  return html
    .replace(/\[[A-Z]{2}\]/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export const odataDate = (value) =>
  value ? Number(/\d+/.exec(value)?.[0]) : null;

async function odata(collection, params) {
  const query = Object.entries({ $format: 'json', ...params })
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join('&');
  const url = `${BASE}/${collection}?${query}`;
  for (let attempt = 1; ; attempt++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      const body = await res.json();
      return body.d.results ?? body.d;
    } catch (err) {
      if (attempt >= 3) throw new Error(`${collection}: ${err.message}`);
      await new Promise((r) => setTimeout(r, 1000 * attempt));
    }
  }
}

async function odataAll(collection, params) {
  const rows = [];
  for (let skip = 0; ; skip += PAGE_SIZE) {
    const page = await odata(collection, {
      ...params,
      $top: PAGE_SIZE,
      $skip: skip
    });
    rows.push(...page);
    if (page.length < PAGE_SIZE) return rows;
  }
}

/** Fetches rows whose `field` matches any of `values`, BATCH_SIZE at a time. */
async function odataIn(collection, field, values, literal, params = {}) {
  const rows = [];
  const unique = [...new Set(values)];
  for (let i = 0; i < unique.length; i += BATCH_SIZE) {
    const ors = unique
      .slice(i, i + BATCH_SIZE)
      .map((v) => `${field} eq ${literal(v)}`)
      .join(' or ');
    const extra = params.$filter ? ` and ${params.$filter}` : '';
    rows.push(
      ...(await odataAll(collection, {
        ...params,
        $filter: `Language eq '${LANG}' and (${ors})${extra}`
      }))
    );
  }
  return rows;
}

async function resolveSession() {
  const filter = args.session
    ? `Language eq '${LANG}' and ID eq ${Number(args.session)}`
    : `Language eq '${LANG}' and StartDate le datetime'${new Date().toISOString().slice(0, 19)}'`;
  const [session] = await odata('Session', {
    $filter: filter,
    $orderby: 'StartDate desc',
    $top: 1,
    $select: 'ID,SessionName,StartDate,EndDate'
  });
  if (!session) throw new Error(`No session found for ${args.session}`);
  return session;
}

const minutes = (seconds) => Math.round((seconds / 60) * 10) / 10;

function addTo(map, key, seconds) {
  map.set(key, (map.get(key) ?? 0) + seconds);
}

async function main() {
  const session = await resolveSession();
  console.error(`Session ${session.ID}: ${session.SessionName}`);

  const transcripts = await odataAll('Transcript', {
    $filter: `Language eq '${LANG}' and IdSession eq '${session.ID}' and Type eq 1`,
    $select: [
      'ID',
      'PersonNumber',
      'SpeakerFullName',
      'ParlGroupAbbreviation',
      'CantonAbbreviation',
      'MeetingCouncilAbbreviation',
      'Function',
      'Start',
      'End',
      'IdSubject',
      'Text'
    ].join(',')
  });
  console.error(`${transcripts.length} speeches`);

  const subjectIds = transcripts.map((t) => t.IdSubject).filter(Boolean);
  const subjectBusinesses = await odataIn(
    'SubjectBusiness',
    'IdSubject',
    subjectIds,
    (v) => `${v}L`,
    { $select: 'IdSubject,BusinessNumber,BusinessShortNumber,Title' }
  );
  const businessesBySubject = new Map();
  for (const sb of subjectBusinesses) {
    const list = businessesBySubject.get(sb.IdSubject) ?? [];
    list.push(sb.BusinessNumber);
    businessesBySubject.set(sb.IdSubject, list);
  }

  const businessRows = await odataIn(
    'Business',
    'ID',
    subjectBusinesses.map((sb) => sb.BusinessNumber),
    (v) => v,
    {
      $select:
        'ID,BusinessShortNumber,Title,TagNames,BusinessTypeAbbreviation,ResponsibleDepartmentAbbreviation'
    }
  );
  const businesses = new Map(businessRows.map((b) => [b.ID, b]));

  const people = new Map();
  for (const t of transcripts) {
    if (!t.PersonNumber || people.has(t.PersonNumber)) continue;
    people.set(t.PersonNumber, {
      personNumber: t.PersonNumber,
      name: t.SpeakerFullName,
      parlGroup: t.ParlGroupAbbreviation,
      canton: t.CantonAbbreviation,
      council: t.MeetingCouncilAbbreviation,
      secondsByRole: new Map(),
      secondsByBusiness: new Map(),
      speeches: 0,
      disclosures: [],
      paidInterests: [],
      lobbywatchInterests: null
    });
  }

  let lobbywatchDate = null;
  if (WITH_LOBBYWATCH) {
    const lobbywatch = await loadLobbywatch(
      join(OUT_DIR, 'lobbywatch-flat.csv.zip')
    );
    lobbywatchDate = lobbywatch.exportDate;
    for (const [number, person] of people) {
      person.lobbywatchInterests =
        lobbywatch.members.get(number)?.interests ?? null;
    }
    const missing = [...people.values()].filter(
      (p) => p.lobbywatchInterests === null
    );
    console.error(
      `Lobbywatch export of ${lobbywatchDate}: ${people.size - missing.length} of ${people.size} speakers found`
    );
  }

  const interests = await odataIn(
    'PersonInterest',
    'PersonNumber',
    [...people.keys()],
    (v) => v,
    {
      $filter: 'Paid eq true',
      $select:
        'PersonNumber,InterestName,InterestTypeText,FunctionInAgencyText,OrganizationTypeText'
    }
  );
  for (const i of interests) {
    people.get(i.PersonNumber)?.paidInterests.push({
      name: i.InterestName,
      type: i.InterestTypeText,
      body: i.OrganizationTypeText,
      function: i.FunctionInAgencyText
    });
  }

  let skipped = 0;
  const businessTotals = new Map();
  for (const t of transcripts) {
    const person = people.get(t.PersonNumber);
    const start = odataDate(t.Start);
    const end = odataDate(t.End);
    const seconds = start && end ? (end - start) / 1000 : NaN;
    if (!person || !(seconds > 0) || seconds > MAX_SPEECH_SECONDS) {
      skipped++;
      continue;
    }
    const role = speechRole(t.Function);
    // The joint assembly (V) is not a council; rank people by the council they sit in.
    if (person.council === 'V') person.council = t.MeetingCouncilAbbreviation;
    person.speeches++;
    addTo(person.secondsByRole, role, seconds);

    // A subject can cover several businesses debated together; split the
    // speech evenly so the per-business totals add up to the speaking time.
    const numbers = businessesBySubject.get(t.IdSubject) ?? [];
    for (const number of numbers) {
      const share = seconds / numbers.length;
      addTo(businessTotals, number, share);
      if (role === 'member') addTo(person.secondsByBusiness, number, share);
    }

    const snippet =
      role === 'member' ? disclosureSnippet(plainText(t.Text ?? '')) : null;
    if (snippet) {
      person.disclosures.push({
        transcriptId: t.ID,
        businesses: numbers,
        snippet
      });
    }
  }
  console.error(`${skipped} entries without a person or a usable duration`);

  const report = buildReport(
    session,
    people,
    businesses,
    businessTotals,
    lobbywatchDate
  );
  await mkdir(OUT_DIR, { recursive: true });
  const base = join(OUT_DIR, `speaking-time-${session.ID}`);
  await writeFile(`${base}.json`, JSON.stringify(report.data, null, 2));
  await writeFile(`${base}.md`, report.markdown);
  console.error(`Wrote ${base}.json and ${base}.md`);
}

const formatInterest = (i) => {
  const details = [
    i.groups.join('/'),
    i.compensation.chf ? i.compensation.label : null
  ]
    .filter(Boolean)
    .join(', ');
  const register = i.inOfficialRegister ? '' : ' ⚠ nicht im Register';
  return `${i.organisation}${details ? ` (${details})` : ''}${register}`;
};

function buildReport(
  session,
  people,
  businesses,
  businessTotals,
  lobbywatchDate
) {
  const label = (number) => {
    const b = businesses.get(number);
    return b
      ? `${b.BusinessShortNumber} ${b.Title.split('\n')[0]}`
      : `${number}`;
  };

  const tagsOf = (short) =>
    [...businesses.values()].find((b) => b.BusinessShortNumber === short)
      ?.TagNames;

  const persons = [...people.values()].map((p) => ({
    personNumber: p.personNumber,
    name: p.name,
    parlGroup: p.parlGroup,
    canton: p.canton,
    council: p.council,
    speeches: p.speeches,
    minutesByRole: Object.fromEntries(
      [...p.secondsByRole].map(([role, s]) => [role, minutes(s)])
    ),
    memberMinutesByBusiness: Object.fromEntries(
      [...p.secondsByBusiness]
        .sort((a, b) => b[1] - a[1])
        .map(([number, s]) => [
          businesses.get(number)?.BusinessShortNumber ?? number,
          minutes(s)
        ])
    ),
    paidInterests: p.paidInterests,
    lobbywatchInterests: p.lobbywatchInterests,
    disclosures: p.disclosures
  }));

  // Paid Lobbywatch mandates in a branch the business touches, per business.
  for (const p of persons) {
    p.affectedPaidInterests = Object.fromEntries(
      Object.keys(p.memberMinutesByBusiness)
        .map((short) => [
          short,
          paidInterestsAffectedBy(p.lobbywatchInterests ?? [], tagsOf(short))
        ])
        .filter(([, list]) => list.length)
    );
  }
  const paidCount = (p) =>
    p.lobbywatchInterests
      ? p.lobbywatchInterests.filter((i) => i.compensation.paid).length
      : p.paidInterests.length;

  const members = persons
    .filter((p) => p.minutesByRole.member)
    .sort((a, b) => b.minutesByRole.member - a.minutesByRole.member);

  const lines = [
    `# Sprechzeit ${session.SessionName}`,
    '',
    'Quelle: ws.parlament.ch (Transcript, SubjectBusiness, Business, PersonInterest).',
    'Gezählt ist nur die Zeit als **Ratsmitglied** (ohne Kommissionsberichterstattung,',
    'Ratspräsidium und Bundesrat). Fraktionssprecher sind in den Daten nicht markiert',
    'und deshalb mitgezählt. Ein Zusammenhang zwischen Mandat und Votum ist damit',
    '**nicht** belegt.',
    '',
    'Der Ständerat kennt keine Redezeitbeschränkung, seine Mitglieder sprechen pro Votum',
    'rund doppelt so lang. Die Ranglisten sind deshalb pro Rat getrennt.'
  ];
  if (lobbywatchDate) {
    lines.push(
      '',
      `Mandate, Lobbygruppen, Branchen und Vergütungen: [Lobbywatch.ch](https://lobbywatch.ch),`,
      `Export vom ${lobbywatchDate}, lizenziert unter CC BY-SA 4.0. Es sind die **heutigen** Mandate;`,
      'für ältere Sessionen können sie abweichen. ⚠ markiert Mandate, die Lobbywatch',
      'recherchiert hat und die im offiziellen Register fehlen.'
    );
  }

  for (const [council, councilName] of [
    ['N', 'Nationalrat'],
    ['S', 'Ständerat']
  ]) {
    const inCouncil = members.filter((p) => p.council === council);
    const total = inCouncil.reduce((sum, p) => sum + p.minutesByRole.member, 0);
    lines.push(
      '',
      `## ${councilName}: Top ${TOP} Sprechzeit als Ratsmitglied`,
      '',
      '| Ratsmitglied | Fraktion | Minuten | Anteil | Voten | bezahlte Mandate | Offenlegungen | meiste Zeit bei |',
      '|---|---|---:|---:|---:|---:|---:|---|'
    );
    for (const p of inCouncil.slice(0, TOP)) {
      const [topBusiness] = Object.keys(p.memberMinutesByBusiness);
      const share = ((p.minutesByRole.member / total) * 100).toFixed(1);
      lines.push(
        `| ${p.name} | ${p.parlGroup ?? ''} | ${p.minutesByRole.member} | ${share} % | ${p.speeches} | ${paidCount(p)} | ${p.disclosures.length} | ${topBusiness ?? ''} |`
      );
    }
  }

  const roleTotals = {};
  for (const p of persons) {
    for (const [role, m] of Object.entries(p.minutesByRole)) {
      roleTotals[role] = minutes((roleTotals[role] ?? 0) * 60 + m * 60);
    }
  }
  lines.push(
    '',
    '## Sprechzeit nach Rolle (Minuten)',
    '',
    '| Rolle | Minuten |',
    '|---|---:|'
  );
  for (const [role, m] of Object.entries(roleTotals).sort(
    (a, b) => b[1] - a[1]
  )) {
    lines.push(`| ${role} | ${m} |`);
  }

  const topBusinesses = [...businessTotals]
    .sort((a, b) => b[1] - a[1])
    .slice(0, TOP);
  lines.push('', `## Top ${TOP}: meistdiskutierte Geschäfte`, '');
  for (const [number, seconds] of topBusinesses) {
    const tags = businesses.get(number)?.TagNames?.replace(/\|/g, ', ') ?? '';
    lines.push(
      `### ${label(number)}`,
      '',
      `${minutes(seconds)} Min. total · Themen: ${tags || '–'}`,
      ''
    );
    const speakers = members
      .filter(
        (p) =>
          p.memberMinutesByBusiness[businesses.get(number)?.BusinessShortNumber]
      )
      .sort(
        (a, b) =>
          b.memberMinutesByBusiness[
            businesses.get(number).BusinessShortNumber
          ] -
          a.memberMinutesByBusiness[businesses.get(number).BusinessShortNumber]
      )
      .slice(0, 5);
    if (!speakers.length) continue;
    lines.push(
      lobbywatchDate
        ? '| Ratsmitglied | Fraktion | Minuten | bezahlte Mandate zum Thema | offengelegt |'
        : '| Ratsmitglied | Fraktion | Minuten | bezahlte Mandate (Auszug) | offengelegt |',
      '|---|---|---:|---|---|'
    );
    for (const p of speakers) {
      const short = businesses.get(number).BusinessShortNumber;
      const disclosed = p.disclosures.some((d) =>
        d.businesses.includes(number)
      );
      const shown = lobbywatchDate
        ? (p.affectedPaidInterests[short] ?? []).map(formatInterest)
        : p.paidInterests.map((i) => i.name);
      const sample = shown.slice(0, 3).join('; ');
      const more = shown.length > 3 ? ` (+${shown.length - 3})` : '';
      lines.push(
        `| ${p.name} | ${p.parlGroup ?? ''} | ${p.memberMinutesByBusiness[short]} | ${sample}${more} | ${disclosed ? 'ja' : ''} |`
      );
    }
    lines.push('');
  }

  if (lobbywatchDate) {
    const undisclosed = [];
    for (const p of members) {
      for (const [short, affected] of Object.entries(p.affectedPaidInterests)) {
        const tags = (tagsOf(short) ?? '').split('|').filter(Boolean);
        if (tags.length > MAX_TOPICS_FOR_MATCH) continue;
        const number = [...businesses.values()].find(
          (b) => b.BusinessShortNumber === short
        )?.ID;
        if (p.disclosures.some((d) => d.businesses.includes(number))) continue;
        undisclosed.push({ p, short, affected, tags });
      }
    }
    undisclosed.sort(
      (a, b) =>
        b.p.memberMinutesByBusiness[b.short] -
        a.p.memberMinutesByBusiness[a.short]
    );
    lines.push(
      '',
      '## Voten mit bezahltem Mandat zum Thema, ohne erkannte Offenlegung',
      '',
      `${undisclosed.length} Fälle, hier die ${Math.min(TOP, undisclosed.length)} mit der längsten Sprechzeit.`,
      `Nur Geschäfte mit höchstens ${MAX_TOPICS_FOR_MATCH} Themen. Lobbygruppe und Thema passen grob zusammen;`,
      'ob das Mandat das Geschäft wirklich betrifft, ist damit nicht geprüft. Art. 11 Abs. 3 ParlG',
      'verlangt den Hinweis nur bei unmittelbarer Betroffenheit, und er kann auch in einem',
      'früheren Votum oder in der Kommission erfolgt sein.',
      '',
      '| Ratsmitglied | Fraktion | Geschäft | Themen | Minuten | bezahlte Mandate zum Thema |',
      '|---|---|---|---|---:|---|'
    );
    for (const { p, short, affected, tags } of undisclosed.slice(0, TOP)) {
      lines.push(
        `| ${p.name} | ${p.parlGroup ?? ''} | ${short} | ${tags.join(', ')} | ${p.memberMinutesByBusiness[short]} | ${affected.map(formatInterest).join('; ')} |`
      );
    }
  }

  lines.push('', '## Offenlegungen der Interessen (Art. 11 Abs. 3 ParlG)', '');
  for (const p of persons) {
    for (const d of p.disclosures) {
      const numbers = d.businesses
        .map((n) => businesses.get(n)?.BusinessShortNumber ?? n)
        .join(', ');
      lines.push(
        `- **${p.name}** (${p.parlGroup ?? ''}, ${numbers || '–'}): ${d.snippet}`
      );
    }
  }

  return {
    data: { session, generatedAt: new Date().toISOString(), persons },
    markdown: lines.join('\n') + '\n'
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
