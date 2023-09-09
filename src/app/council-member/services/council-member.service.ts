import { Injectable } from '@angular/core';
import { from, Observable } from 'rxjs';
import { map, retry, timeout } from 'rxjs/operators';
import { MemberCouncil, fetchCollection, Voting } from 'swissparl';

@Injectable({
  providedIn: 'root'
})
export class CouncilMemberService {
  constructor() {}

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
          PartyAbbreviation: searchTerm
        }
      ];
    }

    return from(
      fetchCollection<MemberCouncil>('MemberCouncil', {
        top,
        skip,
        filter,
        orderby: { property: 'LastName' }
      })
    ).pipe(timeout(5000), retry(3));
  }

  getMemberById(id: number): Observable<MemberCouncil> {
    return from(
      fetchCollection<MemberCouncil>('MemberCouncil', {
        filter: { eq: [{ ID: id, Language: 'DE' }] }
      })
    ).pipe(
      timeout(5000),
      retry(3),
      map((list) => list[0])
    );
  }

  getVotes(id: number): Observable<Voting[]> {
    return from(
      fetchCollection<Voting>('Voting', {
        top: 100,
        filter: { eq: [{ PersonNumber: id, Language: 'DE' }] },
        orderby: { property: 'VoteEnd', order: 'desc' }
      })
    ).pipe(timeout(5000), retry(3));
  }
}
