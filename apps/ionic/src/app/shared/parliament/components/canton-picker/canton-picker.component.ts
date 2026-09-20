import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { TranslocoDirective } from '@jsverse/transloco';
import {
  CANTONS,
  CantonKey,
  coatOfArmsPath
} from '../../models/parliament.model';
import {
  MAX_CANTONS_OF_INTEREST,
  ParliamentStore
} from '../../store/parliament.store';

@Component({
  selector: 'app-canton-picker',
  templateUrl: './canton-picker.component.html',
  styleUrls: ['./canton-picker.component.scss'],
  imports: [IonicModule, TranslocoDirective],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CantonPickerComponent {
  readonly parliamentStore = inject(ParliamentStore);

  readonly cantons = CANTONS;
  readonly coatOfArmsPath = coatOfArmsPath;
  readonly maxCantons = MAX_CANTONS_OF_INTEREST;

  isSelected(key: CantonKey): boolean {
    return this.parliamentStore.cantonsOfInterest().includes(key);
  }

  isDisabled(key: CantonKey): boolean {
    return !this.isSelected(key) && !this.parliamentStore.canAddCanton();
  }

  toggle(key: CantonKey) {
    this.parliamentStore.toggleCanton(key);
  }
}
