import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject
} from '@angular/core';
import { Router } from '@angular/router';
import {
  IonicModule,
  IonItemSliding,
  RefresherCustomEvent,
  ToastController
} from '@ionic/angular';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { Business } from 'swissparl';
import { detailPath } from '@parlwatch/shared/parliament/models';
import { BusinessCardComponent } from '../business-card/business-card.component';
import { BusinessChange, WatchedBusiness } from '../../models/watched-business';
import { WatchedBusinessStore } from '../../store/watched/watched.store';

const KIND_KEYS: Record<BusinessChange['kind'], [string, string]> = {
  status: ['status', 'status'],
  decision: ['decision', 'decisions'],
  committee: ['committee', 'committees'],
  step: ['step', 'steps'],
  vote: ['vote', 'votes'],
  document: ['document', 'documents'],
  debate: ['debate', 'debate']
};

@Component({
  selector: 'app-watched-list',
  templateUrl: './watched-list.component.html',
  styleUrls: ['./watched-list.component.scss'],
  imports: [IonicModule, TranslocoDirective, BusinessCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class WatchedListComponent {
  readonly store = inject(WatchedBusinessStore);
  private readonly router = inject(Router);
  private readonly transloco = inject(TranslocoService);
  private readonly toastController = inject(ToastController);

  private refreshEvent?: RefresherCustomEvent;

  readonly lastCheckDate = computed(() => {
    const check = this.store.lastCheck();
    return check
      ? new Date(check.at).toLocaleString('de-CH', {
          day: 'numeric',
          month: 'numeric',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      : '';
  });

  constructor() {
    effect(() => {
      if (!this.store.checking()) {
        this.refreshEvent?.target.complete().catch(console.error);
        this.refreshEvent = undefined;
      }
    });
  }

  readonly cards = computed(() =>
    this.store.entries().map((entry) => ({
      entry,
      business: {
        ID: entry.id,
        Title: entry.title,
        BusinessShortNumber: entry.shortNumber,
        BusinessTypeName: entry.typeName
      } as Business,
      lines: this.changeLines(entry.changes)
    }))
  );

  private changeLines(changes: BusinessChange[]): string[] {
    const byKind = new Map<BusinessChange['kind'], BusinessChange[]>();
    for (const change of changes) {
      byKind.set(change.kind, [...(byKind.get(change.kind) ?? []), change]);
    }

    return [...byKind.entries()].map(([kind, ofKind]) => {
      const [single, counted] = KIND_KEYS[kind];
      return this.transloco.translate(
        `business.following.change.${ofKind.length === 1 ? single : counted}`,
        { value: ofKind[0].value, count: ofKind.length }
      );
    });
  }

  handleRefresh(event: RefresherCustomEvent) {
    this.refreshEvent = event;
    void this.store.check({ force: true });
  }

  open(entry: WatchedBusiness) {
    this.router
      .navigate(detailPath('business', entry.parliament, entry.id))
      .catch(console.error);
  }

  async unfollow(entry: WatchedBusiness, sliding: IonItemSliding) {
    await sliding.close();
    this.store.unfollow(entry.parliament, entry.id);

    const toast = await this.toastController.create({
      message: this.transloco.translate('business.following.unfollowed'),
      duration: 4000,
      position: 'bottom',
      buttons: [
        {
          text: this.transloco.translate('business.following.undo'),
          handler: () => this.store.restore(entry)
        }
      ]
    });
    await toast.present();
  }
}
