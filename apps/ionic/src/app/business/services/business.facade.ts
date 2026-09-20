import { inject, Injectable } from '@angular/core';
import { forkJoin, Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Business, BusinessType } from 'swissparl';
import { isCantonal, ParliamentKey } from '@parlwatch/shared/parliament/models';
import { LoadedBusiness } from '../models/cantonal-business';
import {
  BusinessHead,
  BusinessHeads,
  BusinessRef
} from '../models/watched-business';
import { BusinessFilter, BusinessService } from './business.service';
import { CantonalBusinessService } from './cantonal-business.service';

@Injectable({
  providedIn: 'root'
})
export class BusinessFacade {
  private readonly federal = inject(BusinessService);
  private readonly cantonal = inject(CantonalBusinessService);

  getBusinesses(filter: BusinessFilter): Observable<Business[]> {
    return isCantonal(filter.parliament)
      ? this.cantonal.getBusinesses(filter)
      : this.federal.getBusinesses(filter);
  }

  getBusinessTypes(parliament: ParliamentKey): Observable<BusinessType[]> {
    return isCantonal(parliament)
      ? this.cantonal.getBusinessTypes(parliament)
      : this.federal.getBusinessTypes();
  }

  getBusiness(
    parliament: ParliamentKey,
    id: number
  ): Observable<LoadedBusiness> {
    return isCantonal(parliament)
      ? this.cantonal.getBusiness(parliament, id)
      : this.federal.getBusiness(id);
  }

  /** One request for all federal refs, one per cantonal ref; a failed request drops its heads. */
  getBusinessHeads(refs: BusinessRef[]): Observable<BusinessHeads> {
    const federalIds = refs
      .filter((ref) => !isCantonal(ref.parliament))
      .map((ref) => ref.id);

    const requests: Observable<BusinessHead[]>[] = [
      ...(federalIds.length
        ? [this.federal.getBusinessHeads(federalIds).pipe(map(toFederalHeads))]
        : []),
      ...refs.flatMap((ref) =>
        isCantonal(ref.parliament)
          ? [
              this.cantonal
                .getBusinessHead(ref.parliament, ref.id)
                .pipe(map((head) => [head]))
            ]
          : []
      )
    ];

    if (requests.length === 0) return of({ heads: [], failed: false });

    return forkJoin(
      requests.map((request) =>
        request.pipe(
          map((heads) => ({ heads, failed: false })),
          catchError(() => of({ heads: [] as BusinessHead[], failed: true }))
        )
      )
    ).pipe(
      map((results) => ({
        heads: results.flatMap((result) => result.heads),
        failed: results.some((result) => result.failed)
      }))
    );
  }
}

function toFederalHeads(businesses: Business[]): BusinessHead[] {
  return businesses
    .filter(
      (business): business is Business & { ID: number } =>
        business.ID !== undefined
    )
    .map((business) => ({
      parliament: 'ch',
      id: business.ID,
      modified: business.Modified ?? '',
      status: String(business.BusinessStatus ?? '')
    }));
}
