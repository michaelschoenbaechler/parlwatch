import { Component } from '@angular/core';
import { Browser } from '@capacitor/browser';

@Component({
  selector: 'app-settings-overview',
  templateUrl: './settings-overview.component.html',
  styleUrls: ['./settings-overview.component.scss']
})
export class SettingsOverviewComponent {
  constructor() {}

  surveyClicked() {
    Browser.open({
      url: 'https://forms.gle/pesghE51E89XnNXa7',
      presentationStyle: 'popover'
    });
  }
}
