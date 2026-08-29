import {
  ChangeDetectionStrategy,
  Component,
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
}
