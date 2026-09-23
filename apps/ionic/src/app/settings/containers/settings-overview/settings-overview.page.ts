import { Component, inject, OnInit, signal } from '@angular/core';
import { Browser } from '@capacitor/browser';
import { IonicModule } from '@ionic/angular';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { IntroComponent } from '@parlwatch/shared/common/components';
import { CantonPickerComponent } from '@parlwatch/shared/parliament/components';
import { ParliamentStore } from '@parlwatch/shared/parliament/store';

@Component({
  selector: 'app-settings-overview',
  templateUrl: './settings-overview.page.html',
  styleUrls: ['./settings-overview.page.scss'],
  imports: [
    IonicModule,
    TranslocoDirective,
    CantonPickerComponent,
    IntroComponent
  ]
})
export class SettingsOverviewPage implements OnInit {
  private translocoService = inject(TranslocoService);
  readonly parliamentStore = inject(ParliamentStore);

  readonly introOpen = signal(false);
  presentingElement: HTMLElement | null = null;

  ngOnInit() {
    this.presentingElement = document.querySelector('ion-router-outlet');
  }

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
