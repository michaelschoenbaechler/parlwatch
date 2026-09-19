/**
 * The parliament a page shows its data for.
 *
 * `ch` is the federal parliament, served by the existing OData source. Every
 * other key is a canton abbreviation and is served by OpenParlData, which uses
 * the same string as its `body_key`. All "is this cantonal?" decisions derive
 * from the key; there is no separate flag.
 */

export const FEDERAL_PARLIAMENT_KEY = 'ch';

export type FederalParliamentKey = typeof FEDERAL_PARLIAMENT_KEY;

export type CantonKey =
  | 'AG'
  | 'AI'
  | 'AR'
  | 'BE'
  | 'BL'
  | 'BS'
  | 'FR'
  | 'GE'
  | 'GL'
  | 'GR'
  | 'JU'
  | 'LU'
  | 'NE'
  | 'NW'
  | 'OW'
  | 'SG'
  | 'SH'
  | 'SO'
  | 'SZ'
  | 'TG'
  | 'TI'
  | 'UR'
  | 'VD'
  | 'VS'
  | 'ZG'
  | 'ZH';

export type ParliamentKey = FederalParliamentKey | CantonKey;

/** What the app knows about a canton without asking any API. */
export interface Canton {
  key: CantonKey;
  /** German name, the only UI language the app ships. */
  name: string;
  /**
   * The two heraldic colours, as CSS colours. Not available from any API, so
   * they ship with the app. A canton whose arms are a single tincture repeats
   * it with white.
   */
  colours: [string, string];
  /** The cantonal parliament's official website. */
  websiteUrl: string;
  /**
   * The language the parliament keeps its records in, which is where a
   * transcript is looked for. Bilingual cantons record in German first.
   */
  language: 'de' | 'fr' | 'it';
}

const WHITE = '#ffffff';

/**
 * The 26 cantons in the order the settings list shows them: alphabetical by
 * German name.
 */
export const CANTONS: readonly Canton[] = [
  {
    key: 'AG',
    name: 'Aargau',
    colours: ['#000000', '#0066b3'],
    websiteUrl: 'https://www.ag.ch/grossrat',
    language: 'de'
  },
  {
    key: 'AR',
    name: 'Appenzell Ausserrhoden',
    colours: ['#000000', WHITE],
    websiteUrl: 'https://www.ar.ch/kantonsrat',
    language: 'de'
  },
  {
    key: 'AI',
    name: 'Appenzell Innerrhoden',
    colours: ['#000000', WHITE],
    websiteUrl: 'https://www.ai.ch/politik/grosser-rat',
    language: 'de'
  },
  {
    key: 'BL',
    name: 'Basel-Landschaft',
    colours: ['#e30613', WHITE],
    websiteUrl: 'https://www.baselland.ch/politik-und-behorden/landrat',
    language: 'de'
  },
  {
    key: 'BS',
    name: 'Basel-Stadt',
    colours: ['#000000', WHITE],
    websiteUrl: 'https://grosserrat.bs.ch',
    language: 'de'
  },
  {
    key: 'BE',
    name: 'Bern',
    colours: ['#e30613', '#000000'],
    websiteUrl: 'https://www.gr.be.ch',
    language: 'de'
  },
  {
    key: 'FR',
    name: 'Freiburg',
    colours: ['#000000', WHITE],
    websiteUrl: 'https://www.fr.ch/gc',
    language: 'de'
  },
  {
    key: 'GE',
    name: 'Genf',
    colours: ['#e30613', '#ffd500'],
    websiteUrl: 'https://ge.ch/grandconseil',
    language: 'fr'
  },
  {
    key: 'GL',
    name: 'Glarus',
    colours: ['#e30613', '#000000'],
    websiteUrl: 'https://www.gl.ch/politik/landrat.html',
    language: 'de'
  },
  {
    key: 'GR',
    name: 'Graubünden',
    colours: ['#0066b3', '#000000'],
    websiteUrl: 'https://www.gr.ch/DE/institutionen/parlament',
    language: 'de'
  },
  {
    key: 'JU',
    name: 'Jura',
    colours: ['#e30613', WHITE],
    websiteUrl: 'https://www.jura.ch/plt',
    language: 'fr'
  },
  {
    key: 'LU',
    name: 'Luzern',
    colours: ['#0066b3', WHITE],
    websiteUrl: 'https://www.lu.ch/kr',
    language: 'de'
  },
  {
    key: 'NE',
    name: 'Neuenburg',
    colours: ['#008c3c', '#e30613'],
    websiteUrl: 'https://www.ne.ch/autorites/GC',
    language: 'fr'
  },
  {
    key: 'NW',
    name: 'Nidwalden',
    colours: ['#e30613', WHITE],
    websiteUrl: 'https://www.nw.ch/landrat',
    language: 'de'
  },
  {
    key: 'OW',
    name: 'Obwalden',
    colours: ['#e30613', WHITE],
    websiteUrl: 'https://www.ow.ch/kantonsrat',
    language: 'de'
  },
  {
    key: 'SH',
    name: 'Schaffhausen',
    colours: ['#000000', '#ffd500'],
    websiteUrl:
      'https://sh.ch/CMS/Webseite/Kanton-Schaffhausen/Beh-rde/Parlament-3897-DE.html',
    language: 'de'
  },
  {
    key: 'SZ',
    name: 'Schwyz',
    colours: ['#e30613', WHITE],
    websiteUrl: 'https://www.sz.ch/behoerden/kantonsrat',
    language: 'de'
  },
  {
    key: 'SO',
    name: 'Solothurn',
    colours: ['#e30613', WHITE],
    websiteUrl: 'https://www.so.ch/kantonsrat',
    language: 'de'
  },
  {
    key: 'SG',
    name: 'St. Gallen',
    colours: ['#008c3c', WHITE],
    websiteUrl: 'https://www.ratsinfo.sg.ch',
    language: 'de'
  },
  {
    key: 'TI',
    name: 'Tessin',
    colours: ['#e30613', '#0066b3'],
    websiteUrl: 'https://www4.ti.ch/poteri/gc',
    language: 'it'
  },
  {
    key: 'TG',
    name: 'Thurgau',
    colours: ['#008c3c', WHITE],
    websiteUrl: 'https://grosserrat.tg.ch',
    language: 'de'
  },
  {
    key: 'UR',
    name: 'Uri',
    colours: ['#ffd500', '#000000'],
    websiteUrl: 'https://www.ur.ch/landrat',
    language: 'de'
  },
  {
    key: 'VD',
    name: 'Waadt',
    colours: ['#008c3c', WHITE],
    websiteUrl: 'https://www.vd.ch/gc',
    language: 'fr'
  },
  {
    key: 'VS',
    name: 'Wallis',
    colours: ['#e30613', WHITE],
    websiteUrl: 'https://parlement.vs.ch',
    language: 'de'
  },
  {
    key: 'ZG',
    name: 'Zug',
    colours: ['#0066b3', WHITE],
    websiteUrl: 'https://www.zg.ch/behoerden/kantonsrat',
    language: 'de'
  },
  {
    key: 'ZH',
    name: 'Zürich',
    colours: ['#0066b3', WHITE],
    websiteUrl: 'https://www.kantonsrat.zh.ch',
    language: 'de'
  }
];

const CANTONS_BY_KEY: ReadonlyMap<string, Canton> = new Map(
  CANTONS.map((canton) => [canton.key, canton])
);

/**
 * Whether a string names one of the 26 cantons.
 * @param value Candidate key, typically a route segment or a stored value
 * @returns True when it is a canton abbreviation the app knows
 */
export function isCantonKey(value: unknown): value is CantonKey {
  return typeof value === 'string' && CANTONS_BY_KEY.has(value);
}

/**
 * Whether a string is a parliament key the app can route to.
 * @param value Candidate key
 * @returns True for `ch` and every canton abbreviation
 */
export function isParliamentKey(value: unknown): value is ParliamentKey {
  return value === FEDERAL_PARLIAMENT_KEY || isCantonKey(value);
}

/**
 * Whether a parliament key names a canton rather than the federal parliament.
 * @param key The parliament key
 * @returns True for every key except `ch`
 */
export function isCantonal(key: ParliamentKey): key is CantonKey {
  return key !== FEDERAL_PARLIAMENT_KEY;
}

/**
 * Turn an untrusted value into a parliament key.
 *
 * Old stored navigation state and recent entries carry no key at all, and a
 * deep link can carry anything; both fall back to the federal parliament so
 * nothing the user had before the update stops working.
 * @param value Candidate key, or nothing
 * @returns The key when it is valid, otherwise `ch`
 */
export function toParliamentKey(value: unknown): ParliamentKey {
  return isParliamentKey(value) ? value : FEDERAL_PARLIAMENT_KEY;
}

/**
 * Look a canton up by key.
 * @param key The canton's abbreviation
 * @returns The canton
 */
export function cantonOf(key: CantonKey): Canton {
  // The key type guarantees the entry exists; the map lookup is only typed loosely.
  return CANTONS_BY_KEY.get(key) as Canton;
}

/**
 * Path of a canton's coat of arms. The arms ship with the app, so cantonal
 * pages render their badge without a network round trip.
 * @param key The canton's abbreviation
 * @returns Path under `assets/`
 */
export function coatOfArmsPath(key: CantonKey): string {
  return `/assets/cantons/${key.toLowerCase()}.svg`;
}

/** Everything a cantonal page needs to dress itself in its canton. */
export interface CantonTheme {
  key: CantonKey;
  name: string;
  colours: [string, string];
  coatOfArms: string;
}

/**
 * The theme a parliament's pages use.
 * @param key The parliament key of the page
 * @returns The canton's theme, or null for the federal parliament, whose pages
 * keep their existing look
 */
export function cantonTheme(key: ParliamentKey): CantonTheme | null {
  if (!isCantonal(key)) return null;

  const canton = cantonOf(key);
  return {
    key,
    name: canton.name,
    colours: canton.colours,
    coatOfArms: coatOfArmsPath(key)
  };
}
