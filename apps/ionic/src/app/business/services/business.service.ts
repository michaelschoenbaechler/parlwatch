import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Business, BusinessType, Session, Tags } from 'swissparl';
import { TranslocoService } from '@jsverse/transloco';
import { SwissParlService } from '../../shared/services/swissparl.service';
import { BusinessStatusOption } from '../models/business-status';

export type BusinessFilter = {
  top: number;
  skip?: number;
  searchTerm?: string;
  businessTypes?: BusinessType[];
  businessStatuses?: BusinessStatusOption[];
  /** Ids from the `Tags` collection; a business matches if it carries any of them. */
  tagIds?: number[];
  /**
   * `undefined` while the default session is still being resolved, `null` for
   * "all sessions", otherwise the session to restrict the list to.
   */
  sessionId?: number | null;
};

/**
 * Only the fields the business cards render. Without this the API ships every
 * long text field per business (~4.4 KB a row instead of ~0.5 KB).
 */
const LIST_FIELDS: Array<keyof Business> = [
  'ID',
  'BusinessShortNumber',
  'BusinessTypeName',
  'BusinessStatusText',
  'BusinessStatusDate',
  'Title',
  'TagNames'
];

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
    businessStatuses,
    tagIds,
    sessionId
  }: BusinessFilter): Observable<Business[]> {
    const businessTypeFilterArray = (businessTypes ?? [])
      .map((type) => type.ID)
      .filter((id): id is number => id !== undefined)
      .map((id) => ({ BusinessType: id }));

    // One option can cover several API ids, e.g. 27 and 229 are both "Erledigt".
    const businessStatusFilterArray = (businessStatuses ?? [])
      .flatMap((status) => status.ids)
      .map((id) => ({ BusinessStatus: id }));

    const sessionFilterArray =
      typeof sessionId === 'number' ? [{ SubmissionSession: sessionId }] : [];

    // `Business.Tags` is a pipe-delimited list of tag ids ("15|52|2841"), so
    // padding both sides turns substringof into an exact token match: '|5|'
    // then cannot match '|52|'. Passing the whole group as an `eq` key is the
    // same escape hatch the swissparl filter builder uses for substringof, and
    // it keeps the group ANDed with the search term instead of OR-ed into it.
    const tagFilterArray = (tagIds ?? []).length
      ? [
          {
            [`(${(tagIds ?? [])
              .map(
                (id) => `substringof('|${id}|', concat('|',concat(Tags,'|')))`
              )
              .join(' or ')})`]: true
          }
        ]
      : [];

    const filter: {
      eq: Record<string, string | number | boolean>[];
      ne: { BusinessShortNumber: string }[];
      substringOf?: {
        Title: string;
        TagNames: string;
      }[];
    } = {
      eq: [
        { Language: this.translocoService.getActiveLang().toUpperCase() },
        ...businessTypeFilterArray,
        ...businessStatusFilterArray,
        ...sessionFilterArray,
        ...tagFilterArray
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
      select: LIST_FIELDS,
      // Ordering by the indexed SubmissionDate is also what keeps text search
      // usable: the same search runs in ~2s with it and ~24s without.
      orderby: { property: 'SubmissionDate', order: 'desc' }
    });
  }

  getTags(): Observable<Tags[]> {
    return this.swissparlService.fetchCollection<Tags>('Tags', {
      top: 100,
      select: ['ID', 'TagName'],
      filter: {
        eq: [{ Language: this.translocoService.getActiveLang().toUpperCase() }]
      }
    });
  }

  getSessions(): Observable<Session[]> {
    return this.swissparlService.fetchCollection<Session>('Session', {
      top: 200,
      select: ['ID', 'SessionName', 'StartDate'],
      filter: {
        eq: [{ Language: this.translocoService.getActiveLang().toUpperCase() }]
      },
      orderby: { property: 'StartDate', order: 'desc' }
    });
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
          // The detail page's timeline lives in three collections. `Resolutions`
          // sits one level below `Bills`, which swissparl's `deepParse` does
          // not unwrap, hence `odataList` on the way out.
          expand: [
            'Votes',
            'Bills/Resolutions',
            'Preconsultations',
            'RelatedBusinesses'
          ] as Array<keyof Business>
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
