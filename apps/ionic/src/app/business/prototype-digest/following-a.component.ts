// PROTOTYPE for #55, variant A: «Beobachtet» split into Geschäfte | Themen.
// Topics are managed in their own tab, which also lists the recent digests.
// Finished businesses sit in a collapsed section below the open ones.
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
  selector: 'app-following-a',
  imports: [IonicModule, BusinessCardComponent],
  template: `
    <ion-segment
      [value]="tab()"
      (ionChange)="tab.set($any($event.detail.value))"
    >
      <ion-segment-button value="businesses">Geschäfte</ion-segment-button>
      <ion-segment-button value="topics">
        Themen ({{ proto.followedTags().length }})
      </ion-segment-button>
    </ion-segment>

    @if (tab() === 'businesses') {
      @for (f of proto.active(); track f.id) {
        <ion-item-sliding #sliding class="card-sliding">
          <ion-item button detail="false" (click)="open(f)">
            <app-business-card
              [business]="business(f)"
              [parliament]="f.parliament"
            >
              @if (f.parliament !== 'ch') {
                <p class="no-push">
                  <ion-icon name="notifications-off-outline" />
                  Keine Mitteilung · wird beim Öffnen der App geprüft
                </p>
              }
              <ul class="changes">
                @for (line of f.changes; track line) {
                  <li>{{ line }}</li>
                }
              </ul>
            </app-business-card>
          </ion-item>
          <ion-item-options side="end">
            <ion-item-option
              color="danger"
              (click)="proto.toggleBusiness(f.id); sliding.close()"
            >
              <ion-icon slot="icon-only" name="eye-off-outline" />
            </ion-item-option>
          </ion-item-options>
        </ion-item-sliding>
      }

      @if (proto.finished().length > 0) {
        <ion-accordion-group>
          <ion-accordion value="finished">
            <ion-item slot="header" lines="none" class="section-header">
              <ion-icon name="checkmark-done-outline" slot="start" />
              <ion-label>
                Erledigt ({{ proto.finished().length }})
                <p>Werden nicht mehr aktualisiert</p>
              </ion-label>
            </ion-item>
            <div slot="content">
              @for (f of proto.finished(); track f.id) {
                <ion-item
                  button
                  detail="false"
                  class="finished"
                  (click)="open(f)"
                >
                  <app-business-card [business]="business(f)">
                    <p class="finished-note">Erledigt am {{ f.finishedAt }}</p>
                  </app-business-card>
                </ion-item>
              }
            </div>
          </ion-accordion>
        </ion-accordion-group>
      }
    } @else {
      <ion-list-header>Tagesdigest</ion-list-header>
      <ion-list inset lines="full">
        @for (date of proto.digestDates; track date) {
          <ion-item button (click)="openDigest(date)">
            <ion-icon name="newspaper-outline" slot="start" />
            <ion-label>
              {{ day(date) }}
              <p>{{ proto.digestCount(date) }} neue Geschäfte</p>
            </ion-label>
          </ion-item>
        }
      </ion-list>
      <p class="hint">Täglich um 08:00, wenn es in deinen Themen Neues gibt.</p>

      <ion-list-header>Themen</ion-list-header>
      <ion-list inset lines="full">
        @for (tag of proto.tags(); track tag.id) {
          <ion-item>
            <ion-toggle
              [checked]="proto.isTopicFollowed(tag.id)"
              (ionChange)="proto.toggleTopic(tag.id)"
            >
              {{ tag.name }}
            </ion-toggle>
          </ion-item>
        }
      </ion-list>
    }
  `,
  styles: `
    :host {
      display: block;
      padding-bottom: 6rem;
    }
    ion-segment {
      margin-bottom: 1rem;
    }
    .no-push {
      display: flex;
      align-items: center;
      gap: 0.35rem;
      margin: 0.25rem 0;
      font-size: 13px;
      color: #666;
    }
    .changes {
      margin: 0;
      padding: 0;
      list-style: none;
      color: var(--ion-color-primary);
      font-size: 14px;
      font-weight: 600;
    }
    .section-header {
      --background: transparent;
      margin-top: 1rem;
    }
    .finished {
      opacity: 0.6;
    }
    .finished-note {
      margin: 0.25rem 0 0 0;
      font-size: 13px;
      color: #666;
    }
    .hint {
      margin: -0.5rem 1.25rem 1rem;
      font-size: 13px;
      color: #666;
    }
  `
})
export class FollowingAComponent {
  readonly proto = inject(DigestPrototypeService);
  private readonly router = inject(Router);
  readonly tab = signal<'businesses' | 'topics'>('businesses');
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
      queryParams: { variant: 'A' }
    });
  }
}
