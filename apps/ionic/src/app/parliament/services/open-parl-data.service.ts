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

@Injectable({
  providedIn: 'root'
})
export class OpenParlDataService {
  private readonly http = inject(HttpClient);

  fetch<T>(
    resource: string,
    query: OpenParlDataQuery = {}
  ): Observable<OpenParlDataPage<T>> {
    let params = new HttpParams();
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === '') continue;
      params = params.set(key, String(value));
    }

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

function toPage<T>(body: unknown): OpenParlDataPage<T> {
  const envelope = body as { data?: unknown; meta?: OpenParlDataMeta } | null;

  if (envelope && Array.isArray(envelope.data)) {
    return { data: envelope.data as T[], meta: envelope.meta ?? {} };
  }

  return { data: envelope ? [envelope as T] : [], meta: {} };
}
