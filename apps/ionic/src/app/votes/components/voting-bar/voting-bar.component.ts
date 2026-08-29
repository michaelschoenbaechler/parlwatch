import { Component, computed, input } from '@angular/core';
import { Voting } from 'swissparl';
import { TranslocoDirective } from '@jsverse/transloco';
import {
  tallyVotings,
  VOTE_DECISIONS,
  VoteDecision
} from '../../models/vote-decision';

interface VotingBarSegment {
  decision: VoteDecision;
  count: number;
  percentage: number;
  left: number;
}

@Component({
  selector: 'app-voting-bar',
  templateUrl: './voting-bar.component.html',
  styleUrls: ['./voting-bar.component.scss'],
  imports: [TranslocoDirective]
})
export class VotingBarComponent {
  readonly votings = input<Voting[]>(undefined);

  /** Renders the counts per decision underneath the bar. */
  readonly showCounts = input(false);

  readonly segments = computed<VotingBarSegment[]>(() => {
    const tally = tallyVotings(this.votings());
    let left = 0;

    return VOTE_DECISIONS.map((decision) => {
      const percentage =
        tally.total > 0 ? (tally[decision] / tally.total) * 100 : 0;
      const segment = { decision, count: tally[decision], percentage, left };
      left += percentage;
      return segment;
    });
  });
}
