import { of } from 'rxjs';
import {
  OpenParlDataPage,
  OpenParlDataQuery,
  OpenParlDataService
} from '../services/open-parl-data.service';

type Recorded = { data?: unknown[]; meta?: unknown } | Record<string, unknown>;

export function createOpenParlDataSpy(
  responses: Record<string, Recorded> = {}
): jasmine.SpyObj<OpenParlDataService> {
  const spy = jasmine.createSpyObj<OpenParlDataService>('OpenParlDataService', [
    'fetch'
  ]);

  const answer = (resource: string) =>
    of(toPage(responses[resource] ?? { data: [], meta: {} }));
  spy.fetch.and.callFake(answer as OpenParlDataService['fetch']);

  return spy;
}

export function toPage<T>(recorded: Recorded): OpenParlDataPage<T> {
  if (Array.isArray(recorded['data'])) {
    return {
      data: recorded['data'] as T[],
      meta: (recorded['meta'] as OpenParlDataPage<T>['meta']) ?? {}
    };
  }
  return { data: [recorded as T], meta: {} };
}

export function lastFetch(spy: jasmine.SpyObj<OpenParlDataService>): {
  resource: string;
  query: OpenParlDataQuery;
} {
  const [resource, query] = spy.fetch.calls.mostRecent().args;
  return { resource, query: query ?? {} };
}

export function allFetches(spy: jasmine.SpyObj<OpenParlDataService>): {
  resource: string;
  query: OpenParlDataQuery;
}[] {
  return spy.fetch.calls
    .allArgs()
    .map(([resource, query]) => ({ resource, query: query ?? {} }));
}
