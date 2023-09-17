import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { SwissParlService } from '../../shared/services/swissparl.service';
import { Business, BusinessStatus, BusinessType } from 'swissparl';

@Injectable({
  providedIn: 'root'
})
export class BusinessService {
  constructor(private swissparlService: SwissParlService) {}

  getBusinesses({
    top,
    skip,
    searchTerm,
    businessTypes,
    businessStatuses
  }: {
    top: number;
    skip?: number;
    searchTerm?: string;
    businessTypes?: number[];
    businessStatuses?: number[];
  }): Observable<Business[]> {
    var businessTypeFilterArray = [];
    if (businessTypes && businessTypes.length > 0) {
      businessTypes.forEach((id) => {
        businessTypeFilterArray.push({ BusinessType: id });
      });
    }

    var businessStatusFilterArray = [];
    if (businessStatuses && businessStatuses.length > 0) {
      businessStatuses.forEach((id) => {
        businessStatusFilterArray.push({ BusinessStatus: id });
      });
    }

    const filter: {
      eq: { Language: string }[];
      ne: { BusinessShortNumber: string }[];
      substringOf?: {
        Title: string;
        TagNames: string;
      }[];
    } = {
      eq: [
        { Language: 'DE' },
        ...businessTypeFilterArray,
        ...businessStatusFilterArray
      ],
      ne: [{ BusinessShortNumber: '00.000' }]
    };

    if (searchTerm) {
      filter.substringOf = [
        {
          Title: searchTerm,
          TagNames: searchTerm
        }
      ];
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
        filter: { eq: [{ Language: 'DE' }] }
      }
    );
  }

  getBusinessTypes(): Observable<BusinessType[]> {
    return this.swissparlService.fetchCollection<BusinessType>('BusinessType', {
      select: ['ID', 'BusinessTypeName'],
      filter: { eq: [{ Language: 'DE' }] }
    });
  }

  getBusiness(id: number): Observable<Business> {
    return this.swissparlService
      .fetchCollection<Business>(
        'Business',
        {
          filter: { eq: [{ ID: id, Language: 'DE' }] },
          expand: ['Votes']
        },
        { deepParse: true }
      )
      .pipe(map((list) => list[0]));
  }
}
