import {
  ChangeDetectionStrategy,
  Component,
  input,
  output
} from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { Voting } from 'swissparl';
import { ODataDateTimePipe } from '@parlwatch/shared/common/pipes/o-data-date-time.pipe';
import { VoteDecisionIconDirective } from '@parlwatch/shared/common/directives/vote-decision-icon.directive';

@Component({
  selector: 'app-voting-record-list',
  template: `
    <ion-list>
      @for (voting of votings(); track voting.ID ?? $index) {
        <ion-item
          button
          detail="false"
          (click)="votingSelected.emit(voting)"
          [disabled]="voting.Decision !== 1 && voting.Decision !== 2"
        >
          <ion-icon
            size="small"
            slot="start"
            [appVoteDecisionIcon]="voting.Decision"
          />
          <ion-label class="ion-text-wrap">
            {{ voting.BusinessTitle }}
            <p>{{ voting.Subject || (voting.VoteEnd | oDataDateTime) }}</p>
          </ion-label>
        </ion-item>
      }
    </ion-list>
  `,
  imports: [IonicModule, ODataDateTimePipe, VoteDecisionIconDirective],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class VotingRecordListComponent {
  readonly votings = input.required<Voting[]>();
  readonly votingSelected = output<Voting>();
}
