import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Vote, Voting } from 'swissparl';
import { TranslocoService } from '@jsverse/transloco';
import { SwissParlService } from '../../shared/services/swissparl.service';

/**
 * Only the fields the vote cards render. Without this the API ships every
 * field of every vote in the list.
 */
const LIST_FIELDS: Array<keyof Vote> = [
  'ID',
  'BusinessNumber',
  'BusinessShortNumber',
  'BusinessTitle',
  'BusinessAuthor',
  'BillTitle',
  'Subject',
  'SessionName',
  'MeaningYes',
  'MeaningNo',
  'VoteEnd'
];

/** Headroom per vote when sizing a batched ballot request (200 seats today). */
const MAX_VOTINGS_PER_VOTE = 300;

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
      select: LIST_FIELDS,
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

  /**
   * Fetch just the decision of every ballot for a set of votes, in one request.
   *
   * The list only needs per-vote counts, and pulling `Vote?$expand=Votings`
   * per card costs ~257 KB each. Repeated `IdVote` filters are OR-ed by the
   * query builder, so one request covers a whole page of votes.
   * @param voteIds Votes to fetch ballots for
   * @returns Ballots carrying only IdVote and Decision
   */
  getVoteTallies(voteIds: number[]): Observable<Voting[]> {
    return this.swissParlService.fetchCollection<Voting>('Voting', {
      top: voteIds.length * MAX_VOTINGS_PER_VOTE,
      select: ['IdVote', 'Decision'],
      filter: {
        eq: [
          { Language: this.translocoService.getActiveLang().toUpperCase() },
          ...voteIds.map((id) => ({ IdVote: id }))
        ]
      }
    });
  }
}
