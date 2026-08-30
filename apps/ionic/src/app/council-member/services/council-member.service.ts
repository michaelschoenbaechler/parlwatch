import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  Canton,
  MemberCouncil,
  ParlGroup,
  PersonInterest,
  Voting
} from 'swissparl';
import { TranslocoService } from '@jsverse/transloco';
import { SwissParlService } from '../../shared/services/swissparl.service';

export type CouncilMemberFilter = {
  top: number;
  skip?: number;
  searchTerm?: string;
  council?: number[];
  /** Canton numbers; a member matches if they sit for any of them. */
  cantons?: number[];
  /** Faction numbers; a member matches if they belong to any of them. */
  parlGroups?: number[];
  /** Party numbers; a member matches if they belong to any of them. */
  parties?: number[];
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
    cantons,
    parlGroups,
    parties,
    showInactive
  }: CouncilMemberFilter): Observable<MemberCouncil[]> {
    // Repeated keys are OR-ed by the query builder and different keys AND-ed,
    // so each of these narrows the result while widening its own dimension.
    const councilFilterArray = (council ?? []).map((id) => ({ Council: id }));
    const cantonFilterArray = (cantons ?? []).map((id) => ({ Canton: id }));
    const parlGroupFilterArray = (parlGroups ?? []).map((id) => ({
      ParlGroupNumber: id
    }));
    const partyFilterArray = (parties ?? []).map((id) => ({ Party: id }));

    const filter: {
      eq: {
        Language?: string;
        Active?: boolean;
        Council?: number;
        Canton?: number;
        ParlGroupNumber?: number;
        Party?: number;
      }[];
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
        ...councilFilterArray,
        ...cantonFilterArray,
        ...parlGroupFilterArray,
        ...partyFilterArray
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
   * Cantons, for the member list's canton filter.
   * @returns All 26 cantons
   */
  getCantons(): Observable<Canton[]> {
    return this.swissParlService.fetchCollection<Canton>('Canton', {
      top: 50,
      select: ['CantonNumber', 'CantonName', 'CantonAbbreviation'],
      filter: {
        eq: [{ Language: this.translocoService.getActiveLang().toUpperCase() }]
      }
    });
  }

  /**
   * The factions currently sitting, for the member list's faction filter.
   * @returns The active parliamentary groups
   */
  getParlGroups(): Observable<ParlGroup[]> {
    return this.swissParlService.fetchCollection<ParlGroup>('ParlGroup', {
      top: 50,
      select: ['ParlGroupNumber', 'ParlGroupName', 'ParlGroupAbbreviation'],
      filter: {
        eq: [
          {
            Language: this.translocoService.getActiveLang().toUpperCase(),
            IsActive: true
          }
        ]
      }
    });
  }

  /**
   * Sitting members reduced to their party, the source for the party filter's
   * options. The `Party` collection itself is mostly defunct parties.
   * @returns One row per sitting member, carrying only the party
   */
  getSeatedMemberParties(): Observable<MemberCouncil[]> {
    return this.swissParlService.fetchCollection<MemberCouncil>(
      'MemberCouncil',
      {
        top: 300,
        select: ['Party', 'PartyAbbreviation', 'PartyName'],
        filter: {
          eq: [
            {
              Language: this.translocoService.getActiveLang().toUpperCase(),
              Active: true
            }
          ]
        }
      }
    );
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
