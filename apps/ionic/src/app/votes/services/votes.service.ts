import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Vote, Voting } from 'swissparl';
import { TranslocoService } from '@jsverse/transloco';
import { SwissParlService } from '../../shared/services/swissparl.service';

export type VoteFilter = {
  top: number;
  skip?: number;
  searchTerm?: string;
};

@Injectable({
  providedIn: 'root'
})
export class VoteService {
  swissParlService = inject(SwissParlService);
  translocoService = inject(TranslocoService);

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
      eq: [{ Language: this.translocoService.getActiveLang().toUpperCase() }],
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
          filter: {
            eq: [
              {
                ID: id,
                Language: this.translocoService.getActiveLang().toUpperCase()
              }
            ]
          },
          expand: ['Votings']
        },
        { deepParse: true }
      )
      .pipe(map((list) => list[0]));
  }

  getVotings(id: number): Observable<Voting[]> {
    return this.swissParlService.fetchCollection<Voting>('Voting', {
      filter: {
        eq: [
          {
            IdVote: id,
            Language: this.translocoService.getActiveLang().toUpperCase()
          }
        ]
      }
    });
  }
}
