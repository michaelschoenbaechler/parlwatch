import { Component, computed, input } from '@angular/core';
import { TranslocoDirective } from '@jsverse/transloco';
import {
  createEmptyTally,
  VOTE_DECISIONS,
  VoteDecision,
  VoteTally
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
  /** Undefined while the counts for this vote are still loading. */
  readonly tally = input<VoteTally | undefined>(undefined);

  /** Renders the counts per decision underneath the bar. */
  readonly showCounts = input(false);

  readonly segments = computed<VotingBarSegment[]>(() => {
    const tally = this.tally() ?? createEmptyTally();
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
