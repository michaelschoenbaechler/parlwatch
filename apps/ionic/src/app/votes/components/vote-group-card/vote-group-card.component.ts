import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  input,
  output
} from '@angular/core';
import { IonicModule } from '@ionic/angular';
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

  /** Votes whose votings have already been requested, to avoid duplicate loads. */
  private readonly requestedVoteIds = new Set<number>();

  constructor() {
    // A group grows while paging through the list, so load the votings of every
    // vote that joins it, but only once per vote.
    effect(() => {
      for (const vote of this.group().votes) {
        if (!this.requestedVoteIds.has(vote.ID)) {
          this.requestedVoteIds.add(vote.ID);
          this.store.loadVoting(vote.ID);
        }
      }
    });
  }
}
