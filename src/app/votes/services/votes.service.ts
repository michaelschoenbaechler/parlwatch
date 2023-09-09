import { Injectable } from '@angular/core';
import { from, Observable } from 'rxjs';
import { map, retry, timeout } from 'rxjs/operators';
import { fetchCollection, Vote, Voting } from 'swissparl';

@Injectable({
  providedIn: 'root'
})
export class VoteService {
  constructor() {}

  getVotes({
    top,
    skip,
    searchTerm,
    businessNumber
  }: {
    top: number;
    skip?: number;
    searchTerm?: string;
    businessNumber?: number;
  }): Observable<Vote[]> {
    const filter: {
      eq: { Language: string; BusinessNumber?: number }[];
      ne: { BusinessShortNumber: string }[];
      substringOf?: { BusinessTitle: string }[];
    } = {
      eq: [{ Language: 'DE' }],
      ne: [{ BusinessShortNumber: '00.000' }]
    };

    if (businessNumber) {
      filter.eq = [{ Language: 'DE', BusinessNumber: businessNumber }];
    }

    if (searchTerm) {
      if (searchTerm.startsWith('BN:')) {
        filter.eq = [
          { Language: 'DE', BusinessNumber: parseInt(searchTerm.substring(3)) }
        ];
      } else {
        filter.substringOf = [{ BusinessTitle: searchTerm }];
      }
    }

    return from(
      fetchCollection<Vote>('Vote', {
        top,
        skip,
        filter,
        orderby: { property: 'VoteEnd', order: 'desc' }
      })
    ).pipe(timeout(5000), retry(3));
  }

  getVote(id: number): Observable<Vote> {
    return from(
      fetchCollection<Vote>(
        'Vote',
        {
          filter: { eq: [{ ID: id, Language: 'DE' }] },
          expand: ['Votings']
        },
        { deepParse: true }
      )
    ).pipe(
      timeout(5000),
      retry(3),
      map((list) => list[0])
    );
  }

  getVotings(id: number): Observable<Voting[]> {
    return from(
      fetchCollection<Voting>('Voting', {
        filter: { eq: [{ IdVote: id, Language: 'DE' }] }
      })
    ).pipe(timeout(5000), retry(3));
  }
}
