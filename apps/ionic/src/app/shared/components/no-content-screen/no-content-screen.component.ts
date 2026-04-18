import { Component, output } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { TranslocoDirective } from '@jsverse/transloco';

@Component({
  selector: 'app-no-content-screen',
  templateUrl: './no-content-screen.component.html',
  styleUrls: ['./no-content-screen.component.scss'],
  imports: [IonicModule, TranslocoDirective]
})
export class NoContentScreenComponent {
  readonly resetFilter = output<void>();

  constructor() {}

  resetClicked() {
    this.resetFilter.emit();
  }
}
