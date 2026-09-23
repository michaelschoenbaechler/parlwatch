import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output
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
  /** An entry after the parliaments for a view that spans all of them. */
  readonly extraLabel = input('');
  readonly extraIcon = input('');
  readonly extraBadge = input(0);
  readonly extraSelected = input(false);
  readonly extraChosen = output<void>();
  readonly parliamentChosen = output<ParliamentKey>();

  readonly isCantonal = isCantonal;
  readonly EXTRA = 'extra';

  /** Past Bund and two cantons the extra entry's label no longer fits beside them. */
  readonly compact = computed(
    () =>
      !!this.extraLabel() && this.parliamentStore.switcherEntries().length > 3
  );

  onChange(event: CustomEvent<{ value?: unknown }>) {
    const value = event.detail.value;
    if (value === this.EXTRA) {
      this.extraChosen.emit();
      return;
    }

    const parliament = value;
    if (!isParliamentKey(parliament)) return;
    this.parliamentChosen.emit(parliament);
    if (parliament === this.selected()) return;

    this.parliamentStore.setActiveParliament(parliament);
    this.navController
      .navigateRoot(listPath(this.feature(), parliament))
      .catch(console.error);
  }
}
