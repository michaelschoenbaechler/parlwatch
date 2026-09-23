import { Component, output } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { TranslocoDirective } from '@jsverse/transloco';

interface Feature {
  key: string;
  icon: string;
}

@Component({
  selector: 'app-intro',
  templateUrl: './intro.component.html',
  styleUrls: ['./intro.component.scss'],
  imports: [IonicModule, TranslocoDirective],
  host: { class: 'ion-page' }
})
export class IntroComponent {
  readonly done = output<void>();

  readonly features: Feature[] = [
    { key: 'overview', icon: 'podium-outline' },
    { key: 'cantons', icon: 'map-outline' },
    { key: 'watch', icon: 'eye-outline' },
    { key: 'openSource', icon: 'code-slash-outline' }
  ];
}
