import {
  ChangeDetectionStrategy,
  Component,
  input,
  output
} from '@angular/core';
import { TranslocoDirective } from '@jsverse/transloco';
import { TextCardComponent } from '@parlwatch/shared/common/components';
import { ODataDateTimePipe } from '@parlwatch/shared/common/pipes';
import { VoteBusinessGroupVm } from '../../store/vote';
import { VoteItemsComponent } from '../vote-items/vote-items.component';

@Component({
  selector: 'app-vote-group-card',
  templateUrl: './vote-group-card.component.html',
  imports: [
    TextCardComponent,
    VoteItemsComponent,
    ODataDateTimePipe,
    TranslocoDirective
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class VoteGroupCardComponent {
  readonly group = input.required<VoteBusinessGroupVm>();
  readonly voteSelected = output<number>();
}
