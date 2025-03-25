import { Component } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { TranslocoDirective } from '@jsverse/transloco';

@Component({
  selector: 'app-tab-layout',
  templateUrl: 'tab-layout.page.html',
  styleUrls: ['tab-layout.page.scss'],
  standalone: true,
  imports: [IonicModule, TranslocoDirective]
})
export class TabLayoutPage {
  constructor() {}
}
