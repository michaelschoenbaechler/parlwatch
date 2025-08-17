import { Component, output } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { TranslocoDirective } from '@jsverse/transloco';

@Component({
  selector: 'app-error-screen',
  templateUrl: './error-screen.component.html',
  styleUrls: ['./error-screen.component.scss'],
  imports: [IonicModule, TranslocoDirective]
})
export class ErrorScreenComponent {
  readonly retry = output<void>();

  constructor() {}

  retryClicked() {
    this.retry.emit();
  }
}
