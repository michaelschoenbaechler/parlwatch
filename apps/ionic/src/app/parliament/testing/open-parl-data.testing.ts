import { of } from 'rxjs';
import {
  OpenParlDataPage,
  OpenParlDataQuery,
  OpenParlDataService
} from '../services/open-parl-data.service';

/** A recorded response, as the fixture files hold it. */
type Recorded = { data?: unknown[]; meta?: unknown } | Record<string, unknown>;

/**
 * Build the OpenParlData seam for a spec: a `fetch` spy that answers from
 * recorded responses by resource path, the way `SwissParlService.fetchCollection`
 * is stubbed for federal specs.
 * @param responses Recorded responses keyed by the resource the service asks for
 * @returns The spy, ready to be provided in place of the service
 */
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

/**
 * Normalise a recorded response the way the real service does: a list is
 * handed back as is, a single record becomes a one-row page.
 * @param recorded The fixture
 * @returns The page a caller of `fetch` sees
 */
export function toPage<T>(recorded: Recorded): OpenParlDataPage<T> {
  if (Array.isArray(recorded['data'])) {
    return {
      data: recorded['data'] as T[],
      meta: (recorded['meta'] as OpenParlDataPage<T>['meta']) ?? {}
    };
  }
  return { data: [recorded as T], meta: {} };
}

/**
 * The query the most recent `fetch` call carried.
 * @param spy The seam
 * @returns Resource and query of the last call
 */
export function lastFetch(spy: jasmine.SpyObj<OpenParlDataService>): {
  resource: string;
  query: OpenParlDataQuery;
} {
  const [resource, query] = spy.fetch.calls.mostRecent().args;
  return { resource, query: query ?? {} };
}

/**
 * Every `fetch` call so far, oldest first.
 * @param spy The seam
 * @returns Resource and query per call
 */
export function allFetches(spy: jasmine.SpyObj<OpenParlDataService>): {
  resource: string;
  query: OpenParlDataQuery;
}[] {
  return spy.fetch.calls
    .allArgs()
    .map(([resource, query]) => ({ resource, query: query ?? {} }));
}
