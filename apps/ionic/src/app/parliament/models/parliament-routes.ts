import { ActivatedRoute } from '@angular/router';
import { ParliamentKey, toParliamentKey } from './parliament.model';

/** The three tabs whose routes carry a parliament. */
export type ParliamentFeature = 'business' | 'votes' | 'council-member';

/**
 * Read the parliament a page was opened for.
 *
 * The `:parliament` segment sits on a componentless parent route, whose
 * parameters the pages inherit. Anything unexpected reads as federal, though
 * the route guard already redirects such URLs before a page sees them.
 * @param route The page's activated route
 * @returns The parliament key
 */
export function routeParliament(route: ActivatedRoute): ParliamentKey {
  return toParliamentKey(route.snapshot.paramMap.get('parliament'));
}

/**
 * The list URL of a feature in a parliament.
 * @param feature The tab
 * @param parliament The parliament
 * @returns Router commands
 */
export function listPath(
  feature: ParliamentFeature,
  parliament: ParliamentKey
): string[] {
  return ['/layout', feature, parliament];
}

/**
 * The detail URL of a record, at the root of its own tab.
 * @param feature The tab the record belongs to
 * @param parliament The record's parliament
 * @param id The record's id
 * @returns Router commands
 */
export function detailPath(
  feature: ParliamentFeature,
  parliament: ParliamentKey,
  id: number
): (string | number)[] {
  return ['/layout', feature, parliament, 'detail', id];
}

/**
 * The detail URL of a record without leaving the current tab, so the tab bar
 * stays put. A tab carries its own detail at its root and every other
 * feature's detail one level in, e.g. `/layout/votes/ZH/business/detail/5`.
 * @param currentUrl The router's current URL
 * @param feature The tab the record belongs to
 * @param id The record's id
 * @returns Router commands
 */
export function detailPathInTab(
  currentUrl: string,
  feature: ParliamentFeature,
  id: number
): (string | number)[] {
  // `/layout/<feature>/<parliament>` is the stack root of the current tab.
  const segments = currentUrl.split('?')[0].split('/').slice(0, 4);
  const tabRoot = segments.join('/');

  return segments[2] === feature
    ? [tabRoot, 'detail', id]
    : [tabRoot, feature, 'detail', id];
}
