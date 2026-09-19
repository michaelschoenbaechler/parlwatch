import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import {
  CANTONS,
  CantonKey,
  coatOfArmsPath
} from '../../models/parliament.model';
import { ParliamentStore } from '../../store/parliament.store';

/**
 * The "Meine Kantone" multi-select: all 26 cantons, coat of arms and German
 * name, alphabetical. Every tick writes straight to the parliament store,
 * which is the only switch the cantonal feature has. Shared between the
 * settings page and the welcome flow.
 */
@Component({
  selector: 'app-canton-picker',
  templateUrl: './canton-picker.component.html',
  styleUrls: ['./canton-picker.component.scss'],
  imports: [IonicModule],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CantonPickerComponent {
  readonly parliamentStore = inject(ParliamentStore);

  readonly cantons = CANTONS;
  readonly coatOfArmsPath = coatOfArmsPath;

  isSelected(key: CantonKey): boolean {
    return this.parliamentStore.cantonsOfInterest().includes(key);
  }

  toggle(key: CantonKey) {
    this.parliamentStore.toggleCanton(key);
  }
}
