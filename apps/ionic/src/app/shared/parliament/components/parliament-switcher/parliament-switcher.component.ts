import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input
} from '@angular/core';
import { IonicModule, NavController } from '@ionic/angular';
import { TranslocoDirective } from '@jsverse/transloco';
import {
  isCantonal,
  isParliamentKey,
  ParliamentKey
} from '../../models/parliament.model';
import { listPath, ParliamentFeature } from '../../models/parliament-routes';
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
  private readonly navController = inject(NavController);

  readonly feature = input.required<ParliamentFeature>();
  readonly selected = input.required<ParliamentKey>();

  readonly isCantonal = isCantonal;

  onChange(event: CustomEvent<{ value?: unknown }>) {
    const parliament = event.detail.value;
    if (!isParliamentKey(parliament) || parliament === this.selected()) return;

    this.parliamentStore.setActiveParliament(parliament);
    this.navController
      .navigateRoot(listPath(this.feature(), parliament))
      .catch(console.error);
  }
}
