/**
 * Reads the weekly Lobbywatch export (https://lobbywatch.ch/datenexport/) and
 * indexes council members' interests by the parliament's PersonNumber.
 *
 * Lobbywatch data is CC BY-SA 4.0: credit Lobbywatch.ch, and publish results
 * that mainly build on it under the same licence. Only current data is in the
 * public export; historical data needs Lobbywatch's consent.
 */

import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { inflateRawSync } from 'node:zlib';

export const LOBBYWATCH_EXPORT_URL =
  'https://cms.lobbywatch.ch/sites/lobbywatch.ch/files/exports/lobbywatch_export_flat.csv.zip';
// The export is regenerated early on Monday mornings.
const MAX_CACHE_AGE_MS = 24 * 60 * 60 * 1000;

/**
 * Which official parliament topics (`Business.TagNames`) each Lobbywatch
 * branch touches. Lobbywatch aligns its branches with the committees, so this
 * follows what each committee deals with. Sport has no parliament topic.
 */
export const BRANCH_TOPICS = {
  Gesundheit: ['Gesundheit'],
  'Soziale Sicherheit': [
    'Soziale Fragen',
    'Sozialer Schutz',
    'Beschäftigung und Arbeit'
  ],
  Energie: ['Energie'],
  Umwelt: ['Umwelt', 'Raumplanung und Wohnungswesen'],
  Verkehr: ['Verkehr'],
  Bildung: ['Bildung', 'Wissenschaft und Forschung'],
  Kultur: ['Kultur'],
  Wirtschaft: [
    'Wirtschaft',
    'Finanzwesen',
    'Steuer',
    'Beschäftigung und Arbeit'
  ],
  'Aussenpolitik/Aussenwirtschaft': [
    'Internationale Politik',
    'Europapolitik',
    'Internationales Recht',
    'Menschenrechte'
  ],
  'Staatspolitik/Staatswirtschaft': [
    'Staatspolitik',
    'Parlament',
    'Recht Allgemein',
    'Zivilrecht',
    'Strafrecht',
    'Gerichtswesen',
    'Migration'
  ],
  Landwirtschaft: ['Landwirtschaft'],
  Sicherheit: ['Sicherheitspolitik'],
  Sport: [],
  Kommunikation: ['Medien und Kommunikation']
};

/**
 * Finer topics for the interest groups of broad branches. "Wirtschaft" alone
 * spans 37 groups from banks to IT, so matching on the branch would tie an IT
 * mandate to a banking bill. Groups mapped to [] touch no specific topic.
 */
export const GROUP_TOPICS = {
  // Wirtschaft
  Banken: ['Finanzwesen'],
  Vermögensverwaltung: ['Finanzwesen'],
  Investmentgesellschaften: ['Finanzwesen'],
  Versicherungen: ['Finanzwesen'],
  Pensionskassen: ['Finanzwesen', 'Sozialer Schutz'],
  'Abgaben und Steuern': ['Steuer'],
  'Advokaturen/Treuhand': ['Steuer', 'Recht Allgemein'],
  'Immobilien/Hauseigentümer:innen': ['Raumplanung und Wohnungswesen'],
  'Mieter:innen': ['Raumplanung und Wohnungswesen'],
  Architektur: ['Raumplanung und Wohnungswesen'],
  Bauhauptgewerbe: ['Raumplanung und Wohnungswesen', 'Wirtschaft'],
  Baunebengewerbe: ['Raumplanung und Wohnungswesen', 'Wirtschaft'],
  'Arbeitnehmer:innenorganisationen': [
    'Beschäftigung und Arbeit',
    'Sozialer Schutz'
  ],
  'KMU/Gewerbe/Arbeitgeber:innen': ['Wirtschaft', 'Beschäftigung und Arbeit'],
  Nahrungsmittel: ['Landwirtschaft', 'Wirtschaft'],
  Cleantech: ['Umwelt', 'Energie'],
  'Holz- und Waldwirtschaft': ['Umwelt', 'Wirtschaft'],
  Tabak: ['Wirtschaft', 'Gesundheit'],
  Glücksspiel: ['Wirtschaft'],
  'Think Tanks': [],
  Zünfte: [],
  'Verbindungen und Serviceclubs': [],
  // Staatspolitik/Staatswirtschaft
  'Kantone/Regionen': ['Staatspolitik'],
  Städte: ['Staatspolitik'],
  Gemeinden: ['Staatspolitik'],
  Berggebiete: ['Staatspolitik', 'Raumplanung und Wohnungswesen'],
  Parteien: [],
  Religion: [],
  Migration: ['Migration'],
  Zuwanderungskritik: ['Migration'],
  Justiz: ['Recht Allgemein', 'Gerichtswesen', 'Zivilrecht', 'Strafrecht']
};

/** The parliament topics an interest group touches. */
export function topicsOfGroup(group, branch) {
  if (group in GROUP_TOPICS) return GROUP_TOPICS[group];
  // The remaining Wirtschaft groups (industry, trade, IT, ...) only touch
  // economic policy in general, not its finance or tax subtopics.
  if (branch === 'Wirtschaft') return ['Wirtschaft'];
  return BRANCH_TOPICS[branch] ?? [];
}

/** Extracts the stored and deflated entries of a zip archive. */
export function unzip(buffer) {
  const files = new Map();
  // The end of central directory record sits in the last 64 KiB + 22 bytes.
  let eocd = buffer.length - 22;
  while (eocd >= 0 && buffer.readUInt32LE(eocd) !== 0x06054b50) eocd--;
  if (eocd < 0) throw new Error('Not a zip archive');
  const count = buffer.readUInt16LE(eocd + 10);
  let offset = buffer.readUInt32LE(eocd + 16);
  for (let i = 0; i < count; i++) {
    const method = buffer.readUInt16LE(offset + 10);
    const compressedSize = buffer.readUInt32LE(offset + 20);
    const nameLength = buffer.readUInt16LE(offset + 28);
    const extraLength = buffer.readUInt16LE(offset + 30);
    const commentLength = buffer.readUInt16LE(offset + 32);
    const localOffset = buffer.readUInt32LE(offset + 42);
    const name = buffer.toString('utf8', offset + 46, offset + 46 + nameLength);
    offset += 46 + nameLength + extraLength + commentLength;

    const dataStart =
      localOffset +
      30 +
      buffer.readUInt16LE(localOffset + 26) +
      buffer.readUInt16LE(localOffset + 28);
    const data = buffer.subarray(dataStart, dataStart + compressedSize);
    if (method === 0) files.set(name, data);
    else if (method === 8) files.set(name, inflateRawSync(data));
  }
  return files;
}

/** Parses Lobbywatch's tab separated files, whose text fields are quoted. */
export function parseTsv(text) {
  const records = [];
  let record = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"' && field === '') quoted = true;
    else if (c === '\t') {
      record.push(field);
      field = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      record.push(field);
      records.push(record);
      record = [];
      field = '';
    } else field += c;
  }
  if (field || record.length) {
    record.push(field);
    records.push(record);
  }
  const [header, ...rows] = records;
  return rows
    .filter((r) => r.length > 1)
    .map((r) => Object.fromEntries(header.map((h, i) => [h, r[i] ?? ''])));
}

/**
 * Lobbywatch's yearly compensation: below 0 a paying member, 0 unpaid, 1 paid
 * with the amount unknown, above 1 the amount in CHF per year.
 */
export function compensation(value) {
  if (value === undefined || value === '')
    return { paid: null, label: 'unklar' };
  const chf = Number(value);
  if (chf < 0) return { paid: false, label: 'bezahlendes Mitglied' };
  if (chf === 0) return { paid: false, label: 'ehrenamtlich' };
  if (chf === 1) return { paid: true, label: 'bezahlt, Betrag unbekannt' };
  return { paid: true, chf, label: `CHF ${chf.toLocaleString('de-CH')}/Jahr` };
}

async function readExport(cacheFile) {
  try {
    const { mtimeMs } = await stat(cacheFile);
    if (Date.now() - mtimeMs < MAX_CACHE_AGE_MS) return readFile(cacheFile);
  } catch {
    // No cached export yet.
  }
  const res = await fetch(LOBBYWATCH_EXPORT_URL, {
    signal: AbortSignal.timeout(120000)
  });
  if (!res.ok) throw new Error(`Lobbywatch export: ${res.status}`);
  const buffer = Buffer.from(await res.arrayBuffer());
  await mkdir(dirname(cacheFile), { recursive: true });
  await writeFile(cacheFile, buffer);
  return buffer;
}

/**
 * Returns `members`, a Map from the parliament's PersonNumber (Lobbywatch's
 * `parlament_biografie_id`) to the member's current interests, and the date
 * the export was made.
 */
export async function loadLobbywatch(cacheFile) {
  const files = unzip(await readExport(cacheFile));
  const docu = files
    .get('export/docu/flat_parlamentarier.csv.md')
    ?.toString('utf8');
  const exportDate = /Datum:\s*([\d.]+)/.exec(docu ?? '')?.[1] ?? null;
  const table = (name) => {
    const file = files.get(`${name}.csv`);
    if (!file) throw new Error(`Lobbywatch export lacks ${name}.csv`);
    return parseTsv(file.toString('utf8'));
  };

  const branches = new Map(table('flat_branche').map((b) => [b.id, b.name]));
  const groups = new Map(
    table('flat_interessengruppe').map((g) => [
      g.id,
      { name: g.name, branch: branches.get(g.branche_id) }
    ])
  );
  const organisations = new Map(
    table('flat_organisation').map((o) => [
      o.id,
      {
        name: o.name_de || o.name,
        groups: [
          o.interessengruppe_id,
          o.interessengruppe2_id,
          o.interessengruppe3_id
        ]
          .map((id) => groups.get(id))
          .filter(Boolean)
      }
    ])
  );

  const latestYear = new Map();
  for (const y of table('flat_interessenbindung_jahr')) {
    const current = latestYear.get(y.interessenbindung_id);
    if (!current || Number(y.jahr) > Number(current.jahr)) {
      latestYear.set(y.interessenbindung_id, y);
    }
  }

  const byLobbywatchId = new Map();
  for (const ib of table('flat_interessenbindung')) {
    if (ib.bis) continue;
    const organisation = organisations.get(ib.organisation_id);
    const year = latestYear.get(ib.id);
    const list = byLobbywatchId.get(ib.parlamentarier_id) ?? [];
    list.push({
      organisation: organisation?.name ?? `#${ib.organisation_id}`,
      kind: ib.art,
      role: ib.funktion_im_gremium,
      mainOccupation: ib.hauptberuflich === '1',
      // Lobbywatch also records mandates it found itself, mostly in the
      // commercial register, that are missing from the official register.
      inOfficialRegister: ib.status === 'deklariert',
      groups: organisation?.groups.map((g) => g.name) ?? [],
      branches: [
        ...new Set(organisation?.groups.map((g) => g.branch) ?? [])
      ].filter(Boolean),
      topics: [
        ...new Set(
          organisation?.groups.flatMap((g) =>
            topicsOfGroup(g.name, g.branch)
          ) ?? []
        )
      ],
      compensationYear: year ? Number(year.jahr) : null,
      compensation: compensation(year?.verguetung)
    });
    byLobbywatchId.set(ib.parlamentarier_id, list);
  }

  const members = new Map();
  for (const p of table('flat_parlamentarier')) {
    if (!p.parlament_biografie_id) continue;
    members.set(Number(p.parlament_biografie_id), {
      lobbywatchId: Number(p.id),
      interests: byLobbywatchId.get(p.id) ?? []
    });
  }
  return { members, exportDate };
}

/** The paid interests that touch one of the business's topics. */
export function paidInterestsAffectedBy(interests, tagNames) {
  const topics = new Set((tagNames ?? '').split('|').filter(Boolean));
  return interests.filter(
    (i) => i.compensation.paid && i.topics.some((t) => topics.has(t))
  );
}
