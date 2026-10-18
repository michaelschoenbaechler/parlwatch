import { Component, inject } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { ParliamentThemeService } from '@parlwatch/shared/parliament/services';
import { PrototypeSwitcherComponent } from './shared/prototype-insights/prototype-switcher.component';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  imports: [IonicModule, PrototypeSwitcherComponent]
})
export class AppComponent {
  constructor() {
    inject(ParliamentThemeService);
  }
}
