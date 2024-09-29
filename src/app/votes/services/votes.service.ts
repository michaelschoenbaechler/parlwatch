import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Vote, Voting } from 'swissparl';
import { SwissParlService } from '../../shared/services/swissparl.service';

@Injectable({
  providedIn: 'root'
})
export class VoteService {
  constructor(private swissParlService: SwissParlService) {}

  getVotes({
    top,
    skip,
    searchTerm
  }: {
    top: number;
    skip?: number;
    searchTerm?: string;
  }): Observable<Vote[]> {
    const filter: {
      eq: { Language: string; BusinessNumber?: number }[];
      ne: { BusinessShortNumber: string }[];
      substringOf?: { BusinessTitle: string; BusinessShortNumber: string }[];
    } = {
      eq: [{ Language: 'DE' }],
      ne: [{ BusinessShortNumber: '00.000' }]
    };

    if (searchTerm) {
      filter.substringOf = [
        {
          BusinessTitle: searchTerm,
          BusinessShortNumber: searchTerm
        }
      ];
    }

    return this.swissParlService.fetchCollection<Vote>('Vote', {
      top,
      skip,
      filter,
      orderby: { property: 'VoteEnd', order: 'desc' }
    });
  }

  getVote(id: number): Observable<Vote> {
    return this.swissParlService
      .fetchCollection<Vote>(
        'Vote',
        {
          filter: { eq: [{ ID: id, Language: 'DE' }] },
          expand: ['Votings']
        },
        { deepParse: true }
      )
      .pipe(map((list) => list[0]));
  }

  getVotings(id: number): Observable<Voting[]> {
    return this.swissParlService.fetchCollection<Voting>('Voting', {
      filter: { eq: [{ IdVote: id, Language: 'DE' }] }
    });
  }
}
