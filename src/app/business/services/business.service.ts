import { Injectable } from '@angular/core';
import { from, Observable } from 'rxjs';
import { map, retry, timeout } from 'rxjs/operators';
import {
  Business,
  BusinessStatus,
  BusinessType,
  fetchCollection
} from 'swissparl';

@Injectable({
  providedIn: 'root'
})
export class BusinessService {
  constructor() {}

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

    return from(
      fetchCollection<Business>('Business', {
        top,
        skip,
        filter,
        orderby: { property: 'SubmissionDate', order: 'desc' }
      })
    ).pipe(timeout(5000), retry(3));
  }

  getBusinessStatus(): Observable<BusinessStatus[]> {
    return from(
      fetchCollection<BusinessStatus>('BusinessStatus', {
        select: ['BusinessStatusId', 'BusinessStatusName'],
        filter: { eq: [{ Language: 'DE' }] }
      })
    ).pipe(timeout(5000), retry(3));
  }

  getBusinessTypes(): Observable<BusinessType[]> {
    return from(
      fetchCollection<BusinessType>('BusinessType', {
        select: ['ID', 'BusinessTypeName'],
        filter: { eq: [{ Language: 'DE' }] }
      })
    ).pipe(timeout(5000), retry(3));
  }

  getBusiness(id: number): Observable<Business> {
    return from(
      fetchCollection<Business>(
        'Business',
        {
          filter: { eq: [{ ID: id, Language: 'DE' }] },
          expand: ['Votes']
        },
        { deepParse: true }
      )
    ).pipe(
      timeout(5000),
      retry(3),
      map((list) => list[0])
    );
  }
}
