import { Component, Input, OnInit } from '@angular/core';
import { Vote, Voting } from 'swissparl';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { map } from 'rxjs/operators';
import { VoteService } from '../../services/votes.service';
import { TextCardComponent } from '../../../shared/components/text-card/text-card.component';
import { ODataDateTimePipe } from '../../../shared/pipes/o-data-date-time.pipe';

@UntilDestroy()
@Component({
  selector: 'app-vote-card',
  templateUrl: './vote-card.component.html',
  styleUrls: ['./vote-card.component.scss'],
  standalone: true,
  imports: [TextCardComponent, ODataDateTimePipe]
})
export class VoteCardComponent implements OnInit {
  @Input() vote: Vote;

  voteCount: { decision: string; percentage: number }[] = [];

  constructor(private voteService: VoteService) {}

  ngOnInit() {
    this.voteService
      .getVotings(this.vote.ID)
      .pipe(
        untilDestroyed(this),
        map((votings) =>
          this.calculatePercentageOfDecision(
            this.getVoteCountByDecision(votings)
          )
        )
      )
      .subscribe((voteCountsByDecision) => {
        this.voteCount = voteCountsByDecision;
      });
  }

  getVoteCountByDecision(votings: Voting[]): { [key: string]: number } {
    const accumulator = votings.reduce(
      (acc, voting) => {
        const vote = { '1': 'yes', '2': 'no' }[voting.Decision] || 'no-vote';
        acc[vote] = (acc[vote] || 0) + 1;
        return acc;
      },
      {} as { [key: string]: number }
    );

    // sort
    return {
      yes: accumulator['yes'] || 0,
      no: accumulator['no'] || 0,
      'no-vote': accumulator['no-vote'] || 0
    };
  }

  calculatePercentageOfDecision(voteCountsByDecision: {
    [key: string]: number;
  }) {
    const total = Object.values(voteCountsByDecision).reduce(
      (acc, count) => acc + count
    );
    return Object.keys(voteCountsByDecision).map((decision) => ({
      decision,
      percentage: (voteCountsByDecision[decision] / total) * 100
    }));
  }

  getLeftPosition(decision: string): number {
    let position = 0;
    for (const vote of this.voteCount) {
      if (vote.decision === decision) {
        break;
      }
      position += vote.percentage;
    }
    return position;
  }
}
