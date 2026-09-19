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
  coatOfArmsPath,
  isCantonal,
  isParliamentKey,
  ParliamentKey
} from '../../models/parliament.model';
import { ParliamentStore } from '../../store/parliament.store';

/**
 * The segment at the top of a list page: "Bund" first, then each canton of
 * interest with its coat of arms. Only rendered while the user follows at
 * least one canton, so the app is unchanged for everyone else.
 */
@Component({
  selector: 'app-parliament-switcher',
  templateUrl: './parliament-switcher.component.html',
  styleUrls: ['./parliament-switcher.component.scss'],
  imports: [IonicModule, TranslocoDirective],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ParliamentSwitcherComponent {
  readonly parliamentStore = inject(ParliamentStore);

  /** The parliament the page currently shows. */
  readonly selected = input.required<ParliamentKey>();
  readonly parliamentChange = output<ParliamentKey>();

  readonly isCantonal = isCantonal;
  readonly coatOfArmsPath = coatOfArmsPath;

  onChange(event: CustomEvent<{ value?: unknown }>) {
    const value = event.detail.value;
    if (isParliamentKey(value) && value !== this.selected()) {
      this.parliamentChange.emit(value);
    }
  }
}
