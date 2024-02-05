import { Component } from '@angular/core';
import { Browser } from '@capacitor/browser';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-settings-overview',
  templateUrl: './settings-overview.page.html',
  styleUrls: ['./settings-overview.page.scss'],
  standalone: true,
  imports: [IonicModule]
})
export class SettingsOverviewPage {
  constructor() {}

  surveyClicked() {
    Browser.open({
      url: 'https://forms.gle/pesghE51E89XnNXa7',
      presentationStyle: 'popover'
    });
  }
}
