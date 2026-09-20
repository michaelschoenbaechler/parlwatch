import { ActivatedRoute } from '@angular/router';
import {
  isParliamentKey,
  ParliamentKey,
  toParliamentKey
} from './parliament.model';

export type ParliamentFeature = 'business' | 'votes' | 'council-member';

/** Every tab URL reads `/layout/<feature>/<parliament>/...`. */
const FEATURE_SEGMENT = 2;
const PARLIAMENT_SEGMENT = 3;

const segmentsOf = (url: string): string[] => url.split('?')[0].split('/');

export function routeParliament(route: ActivatedRoute): ParliamentKey {
  return toParliamentKey(route.snapshot.paramMap.get('parliament'));
}

export function urlParliament(url: string): ParliamentKey | null {
  const segment = segmentsOf(url)[PARLIAMENT_SEGMENT];
  return isParliamentKey(segment) ? segment : null;
}

export function withUrlParliament(
  url: string,
  parliament: ParliamentKey
): string {
  const segments = url.split('/');
  segments[PARLIAMENT_SEGMENT] = parliament;
  return segments.join('/');
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
  const segments = segmentsOf(currentUrl).slice(0, PARLIAMENT_SEGMENT + 1);
  const tabRoot = segments.join('/');

  return segments[FEATURE_SEGMENT] === feature
    ? [tabRoot, 'detail', id]
    : [tabRoot, feature, 'detail', id];
}
