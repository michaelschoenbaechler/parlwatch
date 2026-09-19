import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import {
  FEDERAL_PARLIAMENT_KEY,
  isParliamentKey
} from '../models/parliament.model';
import { ParliamentStore } from '../store/parliament.store';

const PARLIAMENT_SEGMENT = 3;

export const parliamentKeyGuard: CanActivateFn = (route, state) => {
  if (isParliamentKey(route.paramMap.get('parliament'))) return true;

  const segments = state.url.split('/');
  segments[PARLIAMENT_SEGMENT] = FEDERAL_PARLIAMENT_KEY;
  return inject(Router).parseUrl(segments.join('/'));
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
