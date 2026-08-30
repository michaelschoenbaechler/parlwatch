import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  output
} from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { Vote } from 'swissparl';
import { TranslocoDirective } from '@jsverse/transloco';
import { TextCardComponent } from '../../../shared/components/text-card/text-card.component';
import { ODataDateTimePipe } from '../../../shared/pipes/o-data-date-time.pipe';
import { VoteBusinessGroupVm, VoteStore } from '../../store/vote';
import { VotingBarComponent } from '../voting-bar/voting-bar.component';

@Component({
  selector: 'app-vote-group-card',
  templateUrl: './vote-group-card.component.html',
  styleUrls: ['./vote-group-card.component.scss'],
  imports: [
    IonicModule,
    TextCardComponent,
    VotingBarComponent,
    ODataDateTimePipe,
    TranslocoDirective
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class VoteGroupCardComponent {
  readonly store = inject(VoteStore);

  readonly group = input.required<VoteBusinessGroupVm>();
  readonly voteSelected = output<number>();

  /**
   * Counts for a vote, or undefined while its batch is still loading. Every
   * field of the API model is optional, so an id-less vote has no tally.
   * @param vote The vote the row renders
   * @returns The vote's tally, when it is already known
   */
  tallyOf(vote: Vote) {
    return vote.ID === undefined ? undefined : this.store.tallies()[vote.ID];
  }

  /**
   * Open a vote's detail page, ignoring taps on a vote without an id.
   * @param vote The vote the tapped row renders
   */
  onVoteSelected(vote: Vote) {
    if (vote.ID !== undefined) {
      this.voteSelected.emit(vote.ID);
    }
  }
}
