import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import {
  FEDERAL_PARLIAMENT_KEY,
  isParliamentKey
} from '../models/parliament.model';
import { ParliamentStore } from '../store/parliament.store';

/**
 * Position of the parliament key in every feature URL:
 * `/layout/<feature>/<parliament>/...`, so index 3 once split on `/`.
 */
const PARLIAMENT_SEGMENT = 3;

/**
 * Guards the `:parliament` segment of a feature route.
 *
 * Anything that is not `ch` or a known canton abbreviation is sent to the
 * federal equivalent of the same URL, so a mistyped or outdated deep link
 * lands on a working page rather than an error.
 * @param route The route carrying the `parliament` parameter
 * @param state The router state being activated
 * @returns True to proceed, or the federal URL to redirect to
 */
export const parliamentKeyGuard: CanActivateFn = (route, state) => {
  if (isParliamentKey(route.paramMap.get('parliament'))) return true;

  const segments = state.url.split('/');
  segments[PARLIAMENT_SEGMENT] = FEDERAL_PARLIAMENT_KEY;
  return inject(Router).parseUrl(segments.join('/'));
};

/**
 * Sends a key-less list URL (`/layout/business`) to the list of the active
 * parliament. This is where the tab bar lands, so switching to Zürich in one
 * tab shows Zürich in the next tab too.
 * @param _route Unused
 * @param state The router state being activated
 * @returns The list URL of the active parliament
 */
export const activeParliamentRedirectGuard: CanActivateFn = async (
  _route,
  state
): Promise<UrlTree> => {
  const store = inject(ParliamentStore);
  const router = inject(Router);

  await store.whenReady();

  const base = state.url.split('?')[0].replace(/\/$/, '');
  return router.parseUrl(`${base}/${store.activeParliament()}`);
};
