import { Component, EventEmitter, Output } from '@angular/core';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-error-screen',
  templateUrl: './error-screen.component.html',
  styleUrls: ['./error-screen.component.scss'],
  standalone: true,
  imports: [IonicModule]
})
export class ErrorScreenComponent {
  @Output() retry: EventEmitter<void> = new EventEmitter();

  constructor() {}

  retryClicked() {
    this.retry.emit();
  }
}
