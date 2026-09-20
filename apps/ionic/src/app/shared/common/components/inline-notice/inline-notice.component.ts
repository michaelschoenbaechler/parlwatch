import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { IonicModule } from '@ionic/angular';

export type InlineNoticeTone = 'info';

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
  readonly linkLabel = input<string>('');
  readonly linkUrl = input<string>('');
}
