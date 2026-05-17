const ODATA_DATE_RE = /^\/Date\((-?\d+)/;

/**
 * Parses an OData date string (/Date(ms)/ or /Date(ms+offset)/)
 * and returns an ISO 8601 date string (YYYY-MM-DD), or null if unparseable.
 */
export function formatODataDate(value: string | undefined | null): string | null {
  if (!value) return null;
  const match = ODATA_DATE_RE.exec(value);
  if (!match || !match[1]) return null;
  const date = new Date(parseInt(match[1], 10));
  return date.toISOString().slice(0, 10);
}
