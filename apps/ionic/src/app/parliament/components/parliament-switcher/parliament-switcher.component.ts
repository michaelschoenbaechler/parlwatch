import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  output
} from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { TranslocoDirective } from '@jsverse/transloco';
import {
  isCantonal,
  isParliamentKey,
  ParliamentKey
} from '../../models/parliament.model';
import { ParliamentStore } from '../../store/parliament.store';

@Component({
  selector: 'app-parliament-switcher',
  templateUrl: './parliament-switcher.component.html',
  styleUrls: ['./parliament-switcher.component.scss'],
  imports: [IonicModule, TranslocoDirective],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ParliamentSwitcherComponent {
  readonly parliamentStore = inject(ParliamentStore);

  readonly selected = input.required<ParliamentKey>();
  readonly parliamentChange = output<ParliamentKey>();

  readonly isCantonal = isCantonal;

  onChange(event: CustomEvent<{ value?: unknown }>) {
    const value = event.detail.value;
    if (isParliamentKey(value) && value !== this.selected()) {
      this.parliamentChange.emit(value);
    }
  }
}
