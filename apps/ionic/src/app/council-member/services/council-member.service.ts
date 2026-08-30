import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { MemberCouncil, PersonInterest, Voting } from 'swissparl';
import { TranslocoService } from '@jsverse/transloco';
import { SwissParlService } from '../../shared/services/swissparl.service';

export type CouncilMemberFilter = {
  top: number;
  skip?: number;
  searchTerm?: string;
  council?: number[];
  showInactive?: boolean;
};

@Injectable({
  providedIn: 'root'
})
export class CouncilMemberService {
  translocoService = inject(TranslocoService);
  swissParlService = inject(SwissParlService);

  getMembers({
    top,
    skip,
    searchTerm,
    council,
    showInactive
  }: {
    top: number;
    skip?: number;
    searchTerm?: string;
    council?: number[];
    showInactive?: boolean;
  }): Observable<MemberCouncil[]> {
    const councilFilterArray: { Council: number }[] = (council ?? []).map(
      (id) => ({ Council: id })
    );

    const filter: {
      eq: { Language?: string; Active?: boolean; Council?: number }[];
      substringOf?: {
        LastName?: string;
        FirstName?: string;
        PartyAbbreviation?: string;
        CantonName?: string;
        CantonAbbreviation?: string;
      }[];
    } = {
      eq: [
        { Language: this.translocoService.getActiveLang().toUpperCase() },
        ...councilFilterArray
      ]
    };

    if (!showInactive) {
      filter.eq.push({ Active: true });
    }

    if (searchTerm) {
      filter.substringOf = [
        {
          LastName: searchTerm,
          FirstName: searchTerm,
          PartyAbbreviation: searchTerm,
          CantonName: searchTerm,
          CantonAbbreviation: searchTerm
        }
      ];
    }

    return this.swissParlService.fetchCollection<MemberCouncil>(
      'MemberCouncil',
      { top, skip, filter, orderby: { property: 'LastName', order: 'asc' } }
    );
  }

  getMemberById(id: number): Observable<MemberCouncil> {
    return this.swissParlService
      .fetchCollection<MemberCouncil>('MemberCouncil', {
        filter: {
          eq: [
            {
              ID: id,
              Language: this.translocoService.getActiveLang().toUpperCase()
            }
          ]
        }
      })
      .pipe(map((list) => list[0]));
  }

  /**
   * Fetch a member's entries in the register of interests.
   *
   * `Agency` is a flag rather than a name in this collection, so the
   * organisation is read from `InterestName`.
   * @param id The member's `PersonNumber`
   * @returns The member's registered ties, in the register's own order
   */
  getInterests(id: number): Observable<PersonInterest[]> {
    return this.swissParlService.fetchCollection<PersonInterest>(
      'PersonInterest',
      {
        top: 200,
        select: [
          'ID',
          'InterestName',
          'InterestType',
          'InterestTypeText',
          'OrganizationType',
          'OrganizationTypeText',
          'FunctionInAgency',
          'FunctionInAgencyText',
          'Paid',
          'SortOrder'
        ],
        filter: {
          eq: [
            {
              PersonNumber: id,
              Language: this.translocoService.getActiveLang().toUpperCase()
            }
          ]
        },
        orderby: { property: 'SortOrder', order: 'asc' }
      }
    );
  }

  getVotes(id: number): Observable<Voting[]> {
    return this.swissParlService.fetchCollection<Voting>('Voting', {
      top: 100,
      filter: {
        eq: [
          {
            PersonNumber: id,
            Language: this.translocoService.getActiveLang().toUpperCase()
          }
        ]
      },
      orderby: { property: 'VoteEnd', order: 'desc' }
    });
  }
}
