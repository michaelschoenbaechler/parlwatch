// PROTOTYPE for #55, variant D: B's pattern for the whole following view.
// «Geschäfte» is one more chip next to the topics, always there and not
// removable. The selected chip picks the list: followed businesses, or the
// new businesses in that topic by day. A digest push opens this view with
// its first topic selected (?topic=<id>), so there is no separate digest page.
import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { detailPath } from '@parlwatch/shared/parliament/models';
import { DigestPrototypeService, formatDay } from './digest-prototype.service';

const BUSINESSES = 0;

@Component({
  selector: 'app-following-d',
  imports: [IonicModule],
  template: `
    <div class="chip-strip">
      <ion-chip
        [outline]="selected() !== BUSINESSES"
        [class.on]="selected() === BUSINESSES"
        (click)="selected.set(BUSINESSES)"
      >
        <ion-icon name="eye" />
        <ion-label>Geschäfte</ion-label>
        @if (changedCount() > 0) {
          <span class="count">{{ changedCount() }}</span>
        }
      </ion-chip>
      @for (tag of proto.followedTags(); track tag.id) {
        <ion-chip
          [outline]="selected() !== tag.id"
          [class.on]="selected() === tag.id"
          (click)="selected.set(tag.id)"
        >
          <ion-label>{{ tag.name }}</ion-label>
          @if (newCount(tag.id) > 0) {
            <span class="count">{{ newCount(tag.id) }}</span>
          }
        </ion-chip>
      }
      <ion-chip outline (click)="pickerOpen.set(true)">
        <ion-icon name="add" />
        <ion-label>Thema</ion-label>
      </ion-chip>
    </div>

    @if (selected() === BUSINESSES) {
      <ion-list lines="full" class="compact">
        @for (f of proto.federal(); track f.id) {
          <ion-item button detail="false" (click)="open(f.id)">
            <ion-label class="ion-text-wrap">
              <p class="meta">{{ f.shortNumber }} · {{ f.typeName }}</p>
              <h3>{{ f.title }}</h3>
              @for (line of f.changes; track line) {
                <p class="change">{{ line }}</p>
              }
            </ion-label>
            <ion-button
              slot="end"
              fill="clear"
              aria-label="Nicht mehr beobachten"
              (click)="$event.stopPropagation(); proto.toggleBusiness(f.id)"
            >
              <ion-icon slot="icon-only" name="eye" />
            </ion-button>
          </ion-item>
        }
      </ion-list>

      @if (proto.cantonal().length > 0) {
        <h3 class="group">
          <ion-icon name="notifications-off-outline" /> Kantonal
        </h3>
        <p class="group-note">
          Ohne Mitteilungen. Änderungen siehst du, wenn du die App öffnest.
        </p>
        <ion-list lines="full" class="compact">
          @for (f of proto.cantonal(); track f.id) {
            <ion-item detail="false">
              <ion-label class="ion-text-wrap">
                <p class="meta">
                  {{ f.parliament }} · {{ f.shortNumber }} · {{ f.typeName }}
                </p>
                <h3>{{ f.title }}</h3>
                @for (line of f.changes; track line) {
                  <p class="change">{{ line }}</p>
                }
              </ion-label>
            </ion-item>
          }
        </ion-list>
      }

      @if (proto.finished().length > 0) {
        <h3 class="group">
          <ion-icon name="checkmark-done-outline" /> Erledigt
        </h3>
        <p class="group-note">Werden nicht mehr aktualisiert.</p>
        <ion-list lines="full" class="compact finished">
          @for (f of proto.finished(); track f.id) {
            <ion-item button detail="false" (click)="open(f.id)">
              <ion-label>
                <h3>{{ f.shortNumber }} · {{ f.title }}</h3>
                <p>Erledigt am {{ f.finishedAt }}</p>
              </ion-label>
            </ion-item>
          }
        </ion-list>
      }
    } @else {
      @for (day of topicDays(); track day.date) {
        <h3 class="group">{{ formatDay(day.date) }}</h3>
        <ion-list lines="full" class="compact">
          @for (b of day.businesses; track b.id) {
            <ion-item button detail="false" (click)="open(b.id)">
              <ion-label class="ion-text-wrap">
                <p class="meta">{{ b.shortNumber }} · {{ b.typeName }}</p>
                <h3>{{ b.title }}</h3>
                @if (b.submittedBy) {
                  <p>{{ b.submittedBy }}</p>
                }
              </ion-label>
              <ion-button
                slot="end"
                fill="clear"
                [attr.aria-label]="
                  proto.isFollowed(b.id)
                    ? 'Nicht mehr beobachten'
                    : 'Beobachten'
                "
                (click)="$event.stopPropagation(); proto.toggleBusiness(b.id)"
              >
                <ion-icon
                  slot="icon-only"
                  [name]="proto.isFollowed(b.id) ? 'eye' : 'eye-outline'"
                />
              </ion-button>
            </ion-item>
          }
        </ion-list>
      } @empty {
        <p class="group-note">In den letzten 30 Tagen nichts Neues.</p>
      }
    }

    <ion-modal
      [isOpen]="pickerOpen()"
      [initialBreakpoint]="0.75"
      [breakpoints]="[0, 0.75, 1]"
      (didDismiss)="pickerOpen.set(false)"
    >
      <ng-template>
        <ion-header>
          <ion-toolbar>
            <ion-title>Beobachten</ion-title>
            <ion-buttons slot="end">
              <ion-button (click)="pickerOpen.set(false)">Fertig</ion-button>
            </ion-buttons>
          </ion-toolbar>
        </ion-header>
        <ion-content class="ion-padding">
          <ion-chip color="primary" disabled>
            <ion-icon name="lock-closed" />
            <ion-label>Geschäfte</ion-label>
          </ion-chip>
          <p class="group-note">
            Einzelne Geschäfte beobachtest du mit dem Auge in jeder Liste. Für
            Themen bekommst du um 08:00 eine Mitteilung, wenn neue Geschäfte
            eingereicht wurden.
          </p>
          @for (tag of proto.tags(); track tag.id) {
            <ion-chip
              [outline]="!proto.isTopicFollowed(tag.id)"
              [color]="proto.isTopicFollowed(tag.id) ? 'primary' : undefined"
              (click)="toggleTopic(tag.id)"
            >
              @if (proto.isTopicFollowed(tag.id)) {
                <ion-icon name="checkmark" />
              }
              <ion-label>{{ tag.name }}</ion-label>
            </ion-chip>
          }
        </ion-content>
      </ng-template>
    </ion-modal>
  `,
  styles: `
    :host {
      display: block;
      padding-bottom: 6rem;
    }
    .chip-strip {
      display: flex;
      overflow-x: auto;
      margin: 0 -1rem 0.5rem;
      padding: 0 1rem;
      ion-chip {
        flex-shrink: 0;
      }
      ion-chip.on {
        --background: var(--ion-color-primary);
        --color: #fff;
        font-weight: 600;
      }
    }
    .count {
      margin-left: 0.4rem;
      padding: 0 6px;
      border-radius: 999px;
      background: var(--ion-color-danger);
      color: #fff;
      font-size: 12px;
      font-weight: 700;
    }
    .compact .meta {
      font-size: 12px;
    }
    .compact h3 {
      font-weight: 600;
    }
    .change {
      color: var(--ion-color-primary) !important;
      font-weight: 600;
    }
    .finished h3 {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      color: #666;
    }
    .group {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      margin: 1.5rem 0 0 0;
      font-size: 17px;
    }
    .group-note {
      margin: 0.25rem 0 0.5rem;
      font-size: 13px;
      color: #666;
    }
  `
})
export class FollowingDComponent {
  readonly proto = inject(DigestPrototypeService);
  private readonly router = inject(Router);
  readonly BUSINESSES = BUSINESSES;
  readonly formatDay = formatDay;
  readonly pickerOpen = signal(false);
  readonly selected = signal(
    +(inject(ActivatedRoute).snapshot.queryParamMap.get('topic') ?? BUSINESSES)
  );

  readonly changedCount = computed(
    () => this.proto.active().filter((f) => f.changes.length > 0).length
  );

  readonly topicDays = computed(() =>
    this.proto.digestDates
      .map((date) => ({
        date,
        businesses: this.proto
          .digest(date)
          .filter((b) => b.tagIds.includes(this.selected()))
      }))
      .filter((day) => day.businesses.length > 0)
  );

  newCount(tagId: number): number {
    const latest = this.proto.digestDates[0];
    return this.proto.digest(latest).filter((b) => b.tagIds.includes(tagId))
      .length;
  }

  toggleTopic(id: number) {
    this.proto.toggleTopic(id);
    if (this.selected() === id) this.selected.set(BUSINESSES);
  }

  open(id: number) {
    void this.router.navigate(detailPath('business', 'ch', id));
  }
}
