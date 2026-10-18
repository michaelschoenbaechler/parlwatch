// PROTOTYPE for #55, variant B: one feed. Topic chips on top (+ opens a
// picker), the latest digest as a card, then the businesses; cantonal follows
// and finished businesses get their own headed groups at the bottom.
import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { detailPath } from '@parlwatch/shared/parliament/models';
import { BusinessCardComponent } from '../components/business-card/business-card.component';
import {
  asBusiness,
  DigestPrototypeService,
  formatDay,
  ProtoFollow
} from './digest-prototype.service';

@Component({
  selector: 'app-following-b',
  imports: [IonicModule, BusinessCardComponent],
  template: `
    <div class="topic-strip">
      @for (tag of proto.followedTags(); track tag.id) {
        <ion-chip color="primary">{{ tag.name }}</ion-chip>
      }
      <ion-chip outline (click)="pickerOpen.set(true)">
        <ion-icon name="add" />
        <ion-label>Thema</ion-label>
      </ion-chip>
    </div>

    @if (proto.digestGroups(latest).length > 0) {
      <ion-card button class="digest-card" (click)="openDigest(latest)">
        <ion-card-header>
          <ion-card-subtitle>{{ day(latest) }}</ion-card-subtitle>
          <ion-card-title>
            {{ proto.digestCount(latest) }} neue Geschäfte in deinen Themen
          </ion-card-title>
        </ion-card-header>
        <ion-card-content>
          @for (group of proto.digestGroups(latest); track group.tag.id) {
            <span class="count">
              {{ group.tag.name }}
              <strong>{{ group.businesses.length }}</strong>
            </span>
          }
          <p class="more">Alle ansehen ›</p>
        </ion-card-content>
      </ion-card>
    }

    @for (f of proto.federal(); track f.id) {
      <ion-item button detail="false" (click)="open(f)">
        <app-business-card [business]="business(f)">
          <ul class="changes">
            @for (line of f.changes; track line) {
              <li>{{ line }}</li>
            }
          </ul>
        </app-business-card>
      </ion-item>
    }

    @if (proto.cantonal().length > 0) {
      <h3 class="group">
        <ion-icon name="notifications-off-outline" /> Kantonal
      </h3>
      <p class="group-note">
        Ohne Mitteilungen. Änderungen siehst du, wenn du die App öffnest.
      </p>
      @for (f of proto.cantonal(); track f.id) {
        <ion-item button detail="false">
          <app-business-card
            [business]="business(f)"
            [parliament]="f.parliament"
          >
            <ul class="changes">
              @for (line of f.changes; track line) {
                <li>{{ line }}</li>
              }
            </ul>
          </app-business-card>
        </ion-item>
      }
    }

    @if (proto.finished().length > 0) {
      <h3 class="group"><ion-icon name="checkmark-done-outline" /> Erledigt</h3>
      <p class="group-note">Werden nicht mehr aktualisiert.</p>
      <ion-list lines="full" class="finished-list">
        @for (f of proto.finished(); track f.id) {
          <ion-item button (click)="open(f)">
            <ion-label>
              <h3>{{ f.shortNumber }} · {{ f.title }}</h3>
              <p>Erledigt am {{ f.finishedAt }}</p>
            </ion-label>
          </ion-item>
        }
      </ion-list>
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
            <ion-title>Themen beobachten</ion-title>
            <ion-buttons slot="end">
              <ion-button (click)="pickerOpen.set(false)">Fertig</ion-button>
            </ion-buttons>
          </ion-toolbar>
        </ion-header>
        <ion-content class="ion-padding">
          <p class="group-note">
            Du bekommst um 08:00 eine Mitteilung, wenn in deinen Themen neue
            Geschäfte eingereicht wurden.
          </p>
          @for (tag of proto.tags(); track tag.id) {
            <ion-chip
              [outline]="!proto.isTopicFollowed(tag.id)"
              [color]="proto.isTopicFollowed(tag.id) ? 'primary' : undefined"
              (click)="proto.toggleTopic(tag.id)"
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
    .topic-strip {
      display: flex;
      overflow-x: auto;
      margin: 0 -1rem 0.5rem;
      padding: 0 1rem;
      ion-chip {
        flex-shrink: 0;
      }
    }
    .digest-card {
      margin: 0 0 1rem 0;
      ion-card-title {
        font-size: 18px;
      }
    }
    .count {
      display: inline-block;
      margin: 0 0.75rem 0.25rem 0;
    }
    .more {
      margin-top: 0.5rem;
      color: var(--ion-color-primary);
      font-weight: 600;
    }
    .changes {
      margin: 0;
      padding: 0;
      list-style: none;
      color: var(--ion-color-primary);
      font-size: 14px;
      font-weight: 600;
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
    .finished-list h3 {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      color: #666;
    }
  `
})
export class FollowingBComponent {
  readonly proto = inject(DigestPrototypeService);
  private readonly router = inject(Router);
  readonly pickerOpen = signal(false);
  readonly latest = this.proto.digestDates[0];
  readonly day = formatDay;

  business(f: ProtoFollow) {
    return asBusiness(f);
  }

  open(f: ProtoFollow) {
    if (f.parliament !== 'ch') return;
    void this.router.navigate(detailPath('business', f.parliament, f.id));
  }

  openDigest(date: string) {
    void this.router.navigate(['/layout/business/ch/digest', date], {
      queryParams: { variant: 'B' }
    });
  }
}
