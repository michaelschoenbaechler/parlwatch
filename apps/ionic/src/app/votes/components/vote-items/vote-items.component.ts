import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  output
} from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { TranslocoDirective } from '@jsverse/transloco';
import { ODataDateTimePipe } from '@parlwatch/shared/common/pipes';
import { VoteStore } from '../../store/vote';
import { LoadedVote } from '../../models/loaded-vote';
import { VotingBarComponent } from '../voting-bar/voting-bar.component';

/**
 * The rows of a vote list: one tappable item per vote, with its subject, date
 * and tally bar. Kept separate from `app-vote-group-card` so the business
 * detail page can render the same rows under its own heading.
 */
@Component({
  selector: 'app-vote-items',
  templateUrl: './vote-items.component.html',
  styleUrls: ['./vote-items.component.scss'],
  imports: [
    IonicModule,
    VotingBarComponent,
    ODataDateTimePipe,
    TranslocoDirective
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class VoteItemsComponent {
  readonly store = inject(VoteStore);

  readonly votes = input.required<LoadedVote[]>();
  readonly voteSelected = output<number>();

  tallyOf(vote: LoadedVote) {
    if (vote.tally) return vote.tally;
    return vote.ID === undefined ? undefined : this.store.tallies()[vote.ID];
  }

  /**
   * Open a vote's detail page, ignoring taps on a vote without an id.
   * @param vote The vote the tapped row renders
   */
  onVoteSelected(vote: LoadedVote) {
    if (vote.ID !== undefined) {
      this.voteSelected.emit(vote.ID);
    }
  }
}
