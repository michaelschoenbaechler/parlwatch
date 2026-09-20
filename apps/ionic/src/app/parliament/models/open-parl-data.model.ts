export type Localized = Partial<Record<string, string | null>>;

const LANGUAGE_PREFERENCE = ['de', 'fr', 'it', 'rm', 'en'];

export function languageQuery(lang: string): {
  lang: string;
  lang_fallback: string;
} {
  return {
    lang,
    lang_fallback: LANGUAGE_PREFERENCE.filter((l) => l !== lang).join(',')
  };
}

const NATURAL_SEARCH_MIN_LENGTH = 4;

export function searchQuery(
  term: string | undefined,
  scope: 'metadata' | 'metadata,docs' = 'metadata'
): { search?: string; search_scope?: string; search_mode?: string } {
  const search = term?.trim();
  if (!search) return {};

  const stems =
    search.includes(' ') || search.length >= NATURAL_SEARCH_MIN_LENGTH;
  return {
    search,
    search_scope: scope,
    search_mode: stems ? 'natural' : 'partial'
  };
}

export function localized(
  value: Localized | undefined | null,
  lang: string
): string {
  if (!value) return '';

  for (const candidate of [lang, ...LANGUAGE_PREFERENCE]) {
    const text = value[candidate]?.trim();
    if (text) return text;
  }

  return '';
}

export function singleRecord<T>(rows: T[]): T {
  const record = rows[0];
  if (record === undefined) {
    throw new Error('OpenParlData returned no record');
  }
  return record;
}

export type Relation<T> = { data?: T[] } | T[] | null | undefined;

export function relationList<T>(value: Relation<T>): T[] {
  if (Array.isArray(value)) return value;
  const data = value?.data;
  return Array.isArray(data) ? data : [];
}

export function toODataDate(value: string | null | undefined): string {
  if (!value) return '';

  const hasOffset = /(Z|[+-]\d{2}:?\d{2})$/.test(value);
  const ticks = Date.parse(hasOffset ? value : `${value}Z`);

  return Number.isNaN(ticks) ? '' : `/Date(${ticks})/`;
}
