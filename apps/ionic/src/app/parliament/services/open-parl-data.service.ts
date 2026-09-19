import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, retry, timeout } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  REQUEST_TIMEOUT_MS,
  RETRY_COUNT,
  RETRY_DELAY_MS
} from '../../shared/services/swissparl.service';

export const OPEN_PARL_DATA_BASE_URL = 'https://api.openparldata.ch/v1/';

/** Query parameters as the API takes them; `undefined` entries are dropped. */
export type OpenParlDataQuery = Record<
  string,
  string | number | boolean | undefined
>;

export interface OpenParlDataMeta {
  offset?: number;
  limit?: number;
  total_records?: number;
  has_more?: boolean;
}

export interface OpenParlDataPage<T> {
  data: T[];
  meta: OpenParlDataMeta;
}

/**
 * The one place cantonal data enters the app.
 *
 * Everything cantonal comes from OpenParlData and only from there, through
 * this single method, so that tests have exactly one seam to stub and the
 * request policy (deadline, retry) is applied in exactly one place. The
 * policy mirrors the federal service's: the API is quick but a stalled
 * request must not leave a page on its spinner forever.
 */
@Injectable({
  providedIn: 'root'
})
export class OpenParlDataService {
  private readonly http = inject(HttpClient);

  /**
   * Fetch a resource.
   * @param resource Path under the API root: a collection (`affairs`), a
   * record (`affairs/91382`) or an aggregation (`affairs/group_by/types_harmonized`)
   * @param query Query parameters
   * @returns The parsed `data` rows and the page `meta`. A single record is
   * returned as a one-row page so every caller reads the same shape.
   */
  fetch<T>(
    resource: string,
    query: OpenParlDataQuery = {}
  ): Observable<OpenParlDataPage<T>> {
    let params = new HttpParams();
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === '') continue;
      params = params.set(key, String(value));
    }

    // Bare collections live under a trailing slash; without it the API
    // answers with a redirect, which costs a round trip per request.
    const path = resource.includes('/') ? resource : `${resource}/`;

    return this.http
      .get<unknown>(`${OPEN_PARL_DATA_BASE_URL}${path}`, { params })
      .pipe(
        timeout(REQUEST_TIMEOUT_MS),
        retry({ count: RETRY_COUNT, delay: RETRY_DELAY_MS }),
        map((body) => toPage<T>(body))
      );
  }
}

/**
 * Normalise a response body to a page.
 * @param body The parsed JSON body
 * @returns The rows and meta
 */
function toPage<T>(body: unknown): OpenParlDataPage<T> {
  const envelope = body as { data?: unknown; meta?: OpenParlDataMeta } | null;

  if (envelope && Array.isArray(envelope.data)) {
    return { data: envelope.data as T[], meta: envelope.meta ?? {} };
  }

  return { data: envelope ? [envelope as T] : [], meta: {} };
}
