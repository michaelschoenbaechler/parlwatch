import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Business, BusinessStatus, BusinessType } from 'swissparl';
import { TranslocoService } from '@jsverse/transloco';
import { SwissParlService } from '../../shared/services/swissparl.service';

export type BusinessFilter = {
  top: number;
  skip?: number;
  searchTerm?: string;
  businessTypes?: BusinessType[];
  businessStatuses?: BusinessStatus[];
};

@Injectable({
  providedIn: 'root'
})
export class BusinessService {
  translocoService = inject(TranslocoService);
  swissparlService = inject(SwissParlService);

  getBusinesses({
    top,
    skip,
    searchTerm,
    businessTypes,
    businessStatuses
  }: BusinessFilter): Observable<Business[]> {
    const businessTypeIds = businessTypes.map((bt) => bt.ID);
    const businessTypeFilterArray = [];
    if (businessTypeIds && businessTypes.length > 0) {
      businessTypeIds.forEach((id) => {
        businessTypeFilterArray.push({ BusinessType: id });
      });
    }

    const businessStatusIds = businessStatuses.map((bs) => bs.BusinessStatusId);
    const businessStatusFilterArray = [];
    if (businessStatusIds && businessStatuses.length > 0) {
      businessStatusIds.forEach((id) => {
        businessStatusFilterArray.push({ BusinessStatus: id });
      });
    }

    const filter: {
      eq: { Language?: string; ID?: number }[];
      ne: { BusinessShortNumber: string }[];
      substringOf?: {
        Title: string;
        TagNames: string;
      }[];
    } = {
      eq: [
        { Language: this.translocoService.getActiveLang().toUpperCase() },
        ...businessTypeFilterArray,
        ...businessStatusFilterArray
      ],
      ne: [{ BusinessShortNumber: '00.000' }]
    };

    if (searchTerm) {
      const businessNumber =
        this.detectShortBusinessNumberAndConvert(searchTerm);
      if (businessNumber) {
        // If the search term is a short business number, we need
        // to change the filter as ID is indexed and therefore faster
        filter.eq.push({ ID: businessNumber });
        filter.ne.pop();
      } else {
        filter.substringOf = [
          {
            Title: searchTerm,
            TagNames: searchTerm
          }
        ];
      }
    }

    return this.swissparlService.fetchCollection<Business>('Business', {
      top,
      skip,
      filter,
      orderby: { property: 'SubmissionDate', order: 'desc' }
    });
  }

  getBusinessStatus(): Observable<BusinessStatus[]> {
    return this.swissparlService.fetchCollection<BusinessStatus>(
      'BusinessStatus',
      {
        select: ['BusinessStatusId', 'BusinessStatusName'],
        filter: {
          eq: [
            { Language: this.translocoService.getActiveLang().toUpperCase() }
          ]
        }
      }
    );
  }

  getBusinessTypes(): Observable<BusinessType[]> {
    return this.swissparlService.fetchCollection<BusinessType>('BusinessType', {
      select: ['ID', 'BusinessTypeName'],
      filter: {
        eq: [{ Language: this.translocoService.getActiveLang().toUpperCase() }]
      }
    });
  }

  getBusiness(id: number): Observable<Business> {
    return this.swissparlService
      .fetchCollection<Business>(
        'Business',
        {
          filter: {
            eq: [
              {
                ID: id,
                Language: this.translocoService.getActiveLang().toUpperCase()
              }
            ]
          },
          expand: ['Votes']
        },
        { deepParse: true }
      )
      .pipe(map((list) => list[0]));
  }

  private detectShortBusinessNumberAndConvert(str: string) {
    const regex = /^(\d{1,2})\.(\d{1,4})$/;
    const match = str.match(regex);

    if (match) {
      let firstGroup = parseInt(match[1], 10) + 2000;

      let secondGroup = match[2];
      while (secondGroup.length < 4) {
        secondGroup = `0${secondGroup}`;
      }

      return parseInt(`${firstGroup}${secondGroup}`, 10);
    }

    return null;
  }
}
