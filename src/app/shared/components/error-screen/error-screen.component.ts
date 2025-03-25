import { Component, EventEmitter, Output } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { TranslocoDirective } from '@jsverse/transloco';

@Component({
  selector: 'app-error-screen',
  templateUrl: './error-screen.component.html',
  styleUrls: ['./error-screen.component.scss'],
  standalone: true,
  imports: [IonicModule, TranslocoDirective]
})
export class ErrorScreenComponent {
  @Output() retry: EventEmitter<void> = new EventEmitter();

  constructor() {}

  retryClicked() {
    this.retry.emit();
  }
}
