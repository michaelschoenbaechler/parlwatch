import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-no-content-screen',
  templateUrl: './no-content-screen.component.html',
  styleUrls: ['./no-content-screen.component.scss']
})
export class NoContentScreenComponent {
  @Output() resetFilter: EventEmitter<void> = new EventEmitter();

  constructor() {}

  resetClicked() {
    this.resetFilter.emit();
  }
}
