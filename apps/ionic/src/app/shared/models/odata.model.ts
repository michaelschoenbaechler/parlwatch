/**
 * Helpers for the shapes the parliament's OData service returns.
 */

/** A collection that was not expanded comes back as a deferred reference. */
interface ODataCollection<T> {
  results?: T[];
}

/**
 * Read an OData collection property as a plain array.
 *
 * The same property arrives in three shapes: an array when swissparl's
 * `deepParse` unwrapped it, a `{ results: [] }` envelope when it was expanded
 * but nested one level deeper than `deepParse` looks, and a deferred reference
 * when it was not expanded at all.
 * @param value The navigation property as the service returned it
 * @returns The rows, or an empty array when there are none
 */
export function odataList<T>(value: T[] | ODataCollection<T> | undefined): T[] {
  if (Array.isArray(value)) return value;
  const results = (value as ODataCollection<T> | undefined)?.results;
  return Array.isArray(results) ? results : [];
}

/**
 * Parse an OData date string (`/Date(1234567890)/`) into milliseconds.
 * @param value The OData date string to parse
 * @returns Milliseconds since epoch, or 0 when the value is unusable
 */
export function odataTimestamp(value: string | undefined): number {
  const parsed = parseInt(
    (value ?? '').replace('/Date(', '').replace(')/', ''),
    10
  );
  return Number.isNaN(parsed) ? 0 : parsed;
}
