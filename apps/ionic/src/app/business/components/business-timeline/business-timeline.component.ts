import {
  ChangeDetectionStrategy,
  Component,
  input,
  output
} from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { TranslocoDirective } from '@jsverse/transloco';
import { ODataDateTimePipe } from '@parlwatch/shared/common/pipes';
import { TimelineStep } from '../../models/business-timeline';

@Component({
  selector: 'app-business-timeline',
  templateUrl: './business-timeline.component.html',
  styleUrls: ['./business-timeline.component.scss'],
  imports: [IonicModule, ODataDateTimePipe, TranslocoDirective],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BusinessTimelineComponent {
  readonly steps = input.required<TimelineStep[]>();
  /** Adds the open next step that offers to watch the business; null leaves it out. */
  readonly watched = input<boolean | null>(null);
  readonly watchToggled = output<void>();
}
