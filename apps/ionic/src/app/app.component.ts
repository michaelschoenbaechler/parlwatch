import { Component, inject } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { ParliamentThemeService } from '@parlwatch/shared/parliament/services/parliament-theme.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  imports: [IonicModule]
})
export class AppComponent {
  constructor() {
    inject(ParliamentThemeService);
  }
}
