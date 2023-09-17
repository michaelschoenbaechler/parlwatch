import { Injectable } from '@angular/core';
import { Observable, of, retry, switchMap } from 'rxjs';
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

@Injectable({
  providedIn: 'root'
})
export class SwissParlService {
  constructor() {}

  fetchCollection<T>(
    collection: keyof typeof Collection,
    options: QueryOptions<T>,
    config?: Config
  ): Observable<T[]> {
    return of(null).pipe(
      switchMap(() => fetchCollection<T>(collection, options, config)),
      retry(3)
    );
  }
}
