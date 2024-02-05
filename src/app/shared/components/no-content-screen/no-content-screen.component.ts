import { Component, EventEmitter, Output } from '@angular/core';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-no-content-screen',
  templateUrl: './no-content-screen.component.html',
  styleUrls: ['./no-content-screen.component.scss'],
  standalone: true,
  imports: [IonicModule]
})
export class NoContentScreenComponent {
  @Output() resetFilter: EventEmitter<void> = new EventEmitter();

  constructor() {}

  resetClicked() {
    this.resetFilter.emit();
  }
}
