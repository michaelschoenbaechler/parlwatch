import { Injectable } from '@angular/core';
import { Observable, of, retry, switchMap, timeout } from 'rxjs';
import { fetchCollection } from 'swissparl';
import { Collection, SwissParlEntity } from 'swissparl/dist/models';

type FilterOptions<T> =
  | { eq: T[] }
  | { ne: T[] }
  | { gt: T[] }
  | { lt: T[] }
  | { ge: T[] }
  | { le: T[] }
  | { substringOf: T[] };

interface QueryOptions<T extends SwissParlEntity> {
  filter?: FilterOptions<T>;
  expand?: Array<keyof T>;
  select?: Array<keyof T>;
  skip?: number;
  top?: number;
  orderby?: {
    property: keyof T;
    order?: 'asc' | 'desc';
  };
}

interface Config {
  deepParse?: boolean;
  maxResults?: number;
}

/**
 * The parliament API is usually fast but stalls sporadically for ~20s. Without
 * a deadline a stalled request keeps the page on its loading spinner
 * indefinitely, so cap each attempt and retry only once before surfacing the
 * error screen, which offers the user a retry button anyway.
 */
export const REQUEST_TIMEOUT_MS = 15000;
export const RETRY_COUNT = 1;
export const RETRY_DELAY_MS = 500;

@Injectable({
  providedIn: 'root'
})
export class SwissParlService {
  constructor() {}

  fetchCollection<T extends SwissParlEntity>(
    collection: keyof typeof Collection,
    options: QueryOptions<T>,
    config?: Config
  ): Observable<T[]> {
    return of(null).pipe(
      switchMap(() => fetchCollection<T>(collection, options, config)),
      timeout(REQUEST_TIMEOUT_MS),
      retry({ count: RETRY_COUNT, delay: RETRY_DELAY_MS })
    );
  }
}
