import { Component, computed, input } from '@angular/core';
import { Voting } from 'swissparl';

interface VotingBarSegment {
  decision: string;
  percentage: number;
  left: number;
}

@Component({
  selector: 'app-voting-bar',
  templateUrl: './voting-bar.component.html',
  styleUrls: ['./voting-bar.component.scss']
})
export class VotingBarComponent {
  readonly votings = input<Voting[]>(undefined);

  private readonly voteCountsByDecision = computed(() => {
    const raw = this.votings() as unknown;
    const votings = Array.isArray(raw) ? (raw as Voting[]) : [];

    const accumulator = votings.reduce(
      (acc, voting) => {
        const vote = { '1': 'yes', '2': 'no' }[voting.Decision] || 'no-vote';
        acc[vote] = (acc[vote] || 0) + 1;
        return acc;
      },
      {} as { [key: string]: number }
    );

    return {
      yes: accumulator['yes'] || 0,
      no: accumulator['no'] || 0,
      'no-vote': accumulator['no-vote'] || 0
    } as const;
  });

  readonly segments = computed<VotingBarSegment[]>(() => {
    const counts = this.voteCountsByDecision();
    const total = Object.values(counts).reduce((acc, c) => acc + c, 0);
    const percentage = (n: number) => (total > 0 ? (n / total) * 100 : 0);

    let left = 0;
    return (['yes', 'no', 'no-vote'] as const).map((decision) => {
      const segment = {
        decision,
        percentage: percentage(counts[decision]),
        left
      };
      left += segment.percentage;
      return segment;
    });
  });
}
