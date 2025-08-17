import { Component, computed, inject, input, OnInit } from '@angular/core';
import { Vote, Voting } from 'swissparl';
import { TranslocoDirective } from '@jsverse/transloco';
import { TextCardComponent } from '../../../shared/components/text-card/text-card.component';
import { ODataDateTimePipe } from '../../../shared/pipes/o-data-date-time.pipe';
import { VoteStore } from '../../store/vote';

@Component({
  selector: 'app-vote-card',
  templateUrl: './vote-card.component.html',
  styleUrls: ['./vote-card.component.scss'],
  imports: [TextCardComponent, ODataDateTimePipe, TranslocoDirective]
})
export class VoteCardComponent implements OnInit {
  readonly store = inject(VoteStore);

  vote = input.required<Vote>();

  ngOnInit(): void {
    this.store.loadVoting(this.vote().ID);
  }

  private voteCountsByDecision = computed(() => {
    const raw = this.vote()?.Votings as unknown;
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

  voteCount = computed(() => {
    const counts = this.voteCountsByDecision();
    const total = Object.values(counts).reduce((acc, c) => acc + c, 0);
    const safeDiv = (n: number) => (total > 0 ? (n / total) * 100 : 0);
    return [
      { decision: 'yes', percentage: safeDiv(counts['yes']) },
      { decision: 'no', percentage: safeDiv(counts['no']) },
      { decision: 'no-vote', percentage: safeDiv(counts['no-vote']) }
    ];
  });

  getLeftPosition(decision: string): number {
    const parts = this.voteCount();
    let position = 0;
    for (const vote of parts) {
      if (vote.decision === decision) break;
      position += vote.percentage;
    }
    return position;
  }
}
