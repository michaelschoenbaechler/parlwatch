import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Business, BusinessType } from 'swissparl';
import {
  isCantonal,
  ParliamentKey
} from '../../parliament/models/parliament.model';
import { LoadedBusiness } from '../models/cantonal-business';
import { BusinessFilter, BusinessService } from './business.service';
import { CantonalBusinessService } from './cantonal-business.service';

/**
 * Picks the federal or the cantonal business source from the parliament key,
 * so the store and the pages are written once against one surface.
 */
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
}
