import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  isCantonal,
  ParliamentKey
} from '../../parliament/models/parliament.model';
import { LoadedVote } from '../models/loaded-vote';
import { CantonalVoteService } from './cantonal-votes.service';
import { VoteFilter, VoteService } from './votes.service';

@Injectable({
  providedIn: 'root'
})
export class VoteFacade {
  private readonly federal = inject(VoteService);
  private readonly cantonal = inject(CantonalVoteService);

  getVotes(filter: VoteFilter): Observable<LoadedVote[]> {
    return isCantonal(filter.parliament)
      ? this.cantonal.getVotes(filter)
      : this.federal.getVotes(filter);
  }

  getVote(parliament: ParliamentKey, id: number): Observable<LoadedVote> {
    return isCantonal(parliament)
      ? this.cantonal.getVote(parliament, id)
      : this.federal.getVote(id);
  }
}
