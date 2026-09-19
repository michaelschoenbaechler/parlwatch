/**
 * Helpers for the shapes OpenParlData returns.
 */

/**
 * A translated field as the API's default `nested` format ships it: one entry
 * per language the record carries, and nothing for languages it lacks. A
 * Zürich affair has only `de`, a Bernese one `de` and `fr`, a Vaud one `fr`.
 */
export type Localized = Partial<Record<string, string | null>>;

/** The languages OpenParlData records are kept in, in the app's preference order. */
const LANGUAGE_PREFERENCE = ['de', 'fr', 'it', 'rm', 'en'];

/**
 * The query parameters that ask for the app's language with fallbacks.
 *
 * Titles are read with {@link localized} anyway, so this mainly documents
 * intent towards the API; it also lets the service pick the right language
 * where the API itself has to choose, e.g. in `group_by` labels.
 * @param lang The app's active language
 * @returns `lang` and `lang_fallback` parameters
 */
export function languageQuery(lang: string): {
  lang: string;
  lang_fallback: string;
} {
  return {
    lang,
    lang_fallback: LANGUAGE_PREFERENCE.filter((l) => l !== lang).join(',')
  };
}

/**
 * Read a translated field in the app's language, falling back through the
 * other national languages so a French-speaking canton's business still
 * shows its title rather than a blank.
 * @param value The field as the API returned it
 * @param lang The app's active language
 * @returns The best available text, or an empty string
 */
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

/**
 * An expanded relation as the API ships it. Detail endpoints wrap the rows in
 * a page (`{ meta, data }`), list endpoints with a `fields` selection hand
 * back a bare array, and an unexpanded relation is missing altogether.
 */
export type Relation<T> = { data?: T[] } | T[] | null | undefined;

/**
 * Read an expanded relation as a plain array, whichever shape it arrived in.
 * @param value The relation as the API returned it
 * @returns The rows, or an empty array when there are none
 */
export function relationList<T>(value: Relation<T>): T[] {
  if (Array.isArray(value)) return value;
  const data = value?.data;
  return Array.isArray(data) ? data : [];
}

/**
 * Convert an OpenParlData timestamp to the `/Date(ms)/` form the rest of the
 * app formats.
 *
 * The API writes local wall-clock time without an offset (`2026-09-14T07:42:13`).
 * The app's date pipe formats OData ticks in UTC precisely so that a stored
 * wall-clock time is echoed back unchanged, so the same trick applies here:
 * read the timestamp as UTC and hand over the ticks.
 * @param value ISO-like timestamp, or nothing
 * @returns An OData date string, or an empty string when there is no date
 */
export function toODataDate(value: string | null | undefined): string {
  if (!value) return '';

  const hasOffset = /(Z|[+-]\d{2}:?\d{2})$/.test(value);
  const ticks = Date.parse(hasOffset ? value : `${value}Z`);

  return Number.isNaN(ticks) ? '' : `/Date(${ticks})/`;
}
