import { Component, Input } from '@angular/core';
import { Browser } from '@capacitor/browser';
import { Business } from 'swissparl';
import { IonicModule } from '@ionic/angular';
import { TranslocoDirective } from '@jsverse/transloco';
import { TextCardComponent } from '../../../shared/components/text-card/text-card.component';

@Component({
  selector: 'app-business-detail-text',
  templateUrl: './business-detail-text.component.html',
  styleUrls: ['./business-detail-text.component.scss'],
  standalone: true,
  imports: [IonicModule, TextCardComponent, TranslocoDirective]
})
export class BusinessDetailTextComponent {
  @Input() business: Business;

  constructor() {}

  openFurtherInformation() {
    Browser.open({
      url:
        'https://www.parlament.ch/de/ratsbetrieb/suche-curia-vista/geschaeft?AffairId=' +
        this.business.ID,
      presentationStyle: 'popover'
    });
  }
}
