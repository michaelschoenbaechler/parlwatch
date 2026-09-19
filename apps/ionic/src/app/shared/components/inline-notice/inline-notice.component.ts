import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { IonicModule } from '@ionic/angular';

export type InlineNoticeTone = 'info';

/**
 * A short notice inside the page flow, for things the reader should know but
 * that are not errors: Ionic ships no banner component. The `info` tone is
 * used where a parliament simply does not publish the data a tab shows.
 */
@Component({
  selector: 'app-inline-notice',
  templateUrl: './inline-notice.component.html',
  styleUrls: ['./inline-notice.component.scss'],
  imports: [IonicModule],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InlineNoticeComponent {
  readonly tone = input<InlineNoticeTone>('info');
  readonly message = input.required<string>();
  /** Optional link shown under the message. */
  readonly linkLabel = input<string>('');
  readonly linkUrl = input<string>('');
}
