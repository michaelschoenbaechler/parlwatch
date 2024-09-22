import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { SwissParlService } from '../../shared/services/swissparl.service';
import { MemberCouncil, Voting } from 'swissparl';

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
  constructor(private swissParlService: SwissParlService) {}

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
    var councilFilterArray = [];
    if (council && council.length > 0) {
      council.forEach((id) => {
        councilFilterArray.push({ Council: id });
      });
    }

    const filter: {
      eq: { Language?: string; Active?: boolean }[];
      substringOf?: {
        LastName?: string;
        FirstName?: string;
        PartyAbbreviation?: string;
        CantonName?: string;
        CantonAbbreviation?: string;
      }[];
    } = {
      eq: [{ Language: 'DE' }, ...councilFilterArray]
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
        filter: { eq: [{ ID: id, Language: 'DE' }] }
      })
      .pipe(map((list) => list[0]));
  }

  getVotes(id: number): Observable<Voting[]> {
    return this.swissParlService.fetchCollection<Voting>('Voting', {
      top: 100,
      filter: { eq: [{ PersonNumber: id, Language: 'DE' }] },
      orderby: { property: 'VoteEnd', order: 'desc' }
    });
  }
}
