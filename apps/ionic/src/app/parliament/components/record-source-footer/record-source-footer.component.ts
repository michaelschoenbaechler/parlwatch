import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Browser } from '@capacitor/browser';
import { IonicModule } from '@ionic/angular';
import { TranslocoDirective } from '@jsverse/transloco';
import { ODataDateTimePipe } from '../../../shared/pipes/o-data-date-time.pipe';
import { RecordSource } from '../../models/record-source';

/**
 * Closes every cantonal detail page: the attribution OpenParlData's licence
 * asks for, the date the record was last refreshed so staleness is visible,
 * and the way back to the canton's own page.
 */
@Component({
  selector: 'app-record-source-footer',
  templateUrl: './record-source-footer.component.html',
  styleUrls: ['./record-source-footer.component.scss'],
  imports: [IonicModule, TranslocoDirective, ODataDateTimePipe],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RecordSourceFooterComponent {
  readonly source = input.required<RecordSource>();

  openOfficialPage() {
    const url = this.source().url;
    if (!url) return;
    Browser.open({ url, presentationStyle: 'popover' }).catch(console.error);
  }
}
