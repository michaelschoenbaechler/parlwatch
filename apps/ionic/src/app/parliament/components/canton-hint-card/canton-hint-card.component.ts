import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { TranslocoDirective } from '@jsverse/transloco';
import { ParliamentStore } from '../../store/parliament.store';

/**
 * The one-time card telling an existing user they can now follow their
 * canton. Shown at the top of every list page until it is dismissed or a
 * canton is picked; dismissing it once covers all tabs.
 */
@Component({
  selector: 'app-canton-hint-card',
  templateUrl: './canton-hint-card.component.html',
  styleUrls: ['./canton-hint-card.component.scss'],
  imports: [IonicModule, TranslocoDirective],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CantonHintCardComponent {
  readonly parliamentStore = inject(ParliamentStore);
  private readonly router = inject(Router);

  openSettings() {
    this.router.navigate(['/layout/settings']).catch(console.error);
  }

  dismiss() {
    this.parliamentStore.dismissHint();
  }
}
