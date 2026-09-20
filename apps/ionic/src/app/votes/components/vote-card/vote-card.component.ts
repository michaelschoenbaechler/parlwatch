import { Component, computed, input } from '@angular/core';
import { TranslocoDirective } from '@jsverse/transloco';
import { TextCardComponent } from '../../../shared/common/components/text-card/text-card.component';
import { ODataDateTimePipe } from '../../../shared/common/pipes/o-data-date-time.pipe';
import { tallyVotings } from '../../../shared/common/models/vote-decision';
import { LoadedVote } from '../../models/loaded-vote';
import { VotingBarComponent } from '../voting-bar/voting-bar.component';

@Component({
  selector: 'app-vote-card',
  templateUrl: './vote-card.component.html',
  styleUrls: ['./vote-card.component.scss'],
  imports: [
    TextCardComponent,
    VotingBarComponent,
    ODataDateTimePipe,
    TranslocoDirective
  ]
})
export class VoteCardComponent {
  vote = input.required<LoadedVote>();

  readonly tally = computed(
    () => this.vote()?.tally ?? tallyVotings(this.vote()?.Votings)
  );

  /**
   * What a yes/no vote stood for. The API stores these once in whichever
   * language they were entered, so they are not translated with the app.
   */
  readonly meaningYes = computed(() => this.vote()?.MeaningYes?.trim() ?? '');
  readonly meaningNo = computed(() => this.vote()?.MeaningNo?.trim() ?? '');
}
