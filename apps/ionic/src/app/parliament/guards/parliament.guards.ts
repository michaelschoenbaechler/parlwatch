import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import {
  FEDERAL_PARLIAMENT_KEY,
  isParliamentKey
} from '../models/parliament.model';
import { withUrlParliament } from '../models/parliament-routes';
import { ParliamentStore } from '../store/parliament.store';

export const parliamentKeyGuard: CanActivateFn = (route, state) => {
  if (isParliamentKey(route.paramMap.get('parliament'))) return true;

  return inject(Router).parseUrl(
    withUrlParliament(state.url, FEDERAL_PARLIAMENT_KEY)
  );
};

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

/**
 * Ionic tabs reopen on the URL they last showed, which may name a parliament
 * the user has since switched away from or removed in the settings. A list
 * page therefore only opens for the active parliament; anything else is sent
 * to the active one's list.
 */
export const activeParliamentListGuard: CanActivateFn = async (
  route,
  state
): Promise<boolean | UrlTree> => {
  const store = inject(ParliamentStore);
  const router = inject(Router);

  await store.whenReady();

  const active = store.activeParliament();
  if (route.paramMap.get('parliament') === active) return true;

  return router.parseUrl(withUrlParliament(state.url, active));
};
