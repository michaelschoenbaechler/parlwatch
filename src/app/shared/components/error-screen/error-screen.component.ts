import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-error-screen',
  templateUrl: './error-screen.component.html',
  styleUrls: ['./error-screen.component.scss']
})
export class ErrorScreenComponent {
  @Output() retry: EventEmitter<void> = new EventEmitter();

  constructor() {}

  retryClicked() {
    this.retry.emit();
  }
}
