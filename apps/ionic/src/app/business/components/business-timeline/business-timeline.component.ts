import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TranslocoDirective } from '@jsverse/transloco';
import { ODataDateTimePipe } from '../../../shared/pipes/o-data-date-time.pipe';
import { TimelineStep } from '../../models/business-timeline';

@Component({
  selector: 'app-business-timeline',
  templateUrl: './business-timeline.component.html',
  styleUrls: ['./business-timeline.component.scss'],
  imports: [ODataDateTimePipe, TranslocoDirective],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BusinessTimelineComponent {
  readonly steps = input.required<TimelineStep[]>();
}
