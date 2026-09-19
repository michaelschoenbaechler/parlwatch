import { ActivatedRoute } from '@angular/router';
import { ParliamentKey, toParliamentKey } from './parliament.model';

export type ParliamentFeature = 'business' | 'votes' | 'council-member';

export function routeParliament(route: ActivatedRoute): ParliamentKey {
  return toParliamentKey(route.snapshot.paramMap.get('parliament'));
}

export function listPath(
  feature: ParliamentFeature,
  parliament: ParliamentKey
): string[] {
  return ['/layout', feature, parliament];
}

export function detailPath(
  feature: ParliamentFeature,
  parliament: ParliamentKey,
  id: number
): (string | number)[] {
  return ['/layout', feature, parliament, 'detail', id];
}

export function detailPathInTab(
  currentUrl: string,
  feature: ParliamentFeature,
  id: number
): (string | number)[] {
  const segments = currentUrl.split('?')[0].split('/').slice(0, 4);
  const tabRoot = segments.join('/');

  return segments[2] === feature
    ? [tabRoot, 'detail', id]
    : [tabRoot, feature, 'detail', id];
}
