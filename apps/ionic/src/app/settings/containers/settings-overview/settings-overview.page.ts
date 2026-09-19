import { Component, inject } from '@angular/core';
import { Browser } from '@capacitor/browser';
import { IonicModule } from '@ionic/angular';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { CantonPickerComponent } from '../../../parliament/components/canton-picker/canton-picker.component';
import { ParliamentStore } from '../../../parliament/store/parliament.store';

@Component({
  selector: 'app-settings-overview',
  templateUrl: './settings-overview.page.html',
  styleUrls: ['./settings-overview.page.scss'],
  imports: [IonicModule, TranslocoDirective, CantonPickerComponent]
})
export class SettingsOverviewPage {
  private translocoService = inject(TranslocoService);
  readonly parliamentStore = inject(ParliamentStore);

  surveyClicked() {
    Browser.open({
      url: 'https://forms.gle/pesghE51E89XnNXa7',
      presentationStyle: 'popover'
    });
  }

  languageChanged(event: any) {
    this.translocoService.setActiveLang(event.target.value);
  }
}
