// PROTOTYPE for #55, variant C: topics as rows above the businesses, each
// row opening that topic's part of the latest digest. Cantonal follows carry
// a badge; finished businesses hide behind one row that opens a sheet.
import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { detailPath } from '@parlwatch/shared/parliament/models';
import { BusinessCardComponent } from '../components/business-card/business-card.component';
import {
  asBusiness,
  DigestPrototypeService,
  ProtoFollow
} from './digest-prototype.service';

@Component({
  selector: 'app-following-c',
  imports: [IonicModule, BusinessCardComponent],
  template: `
    <ion-list-header>Themen</ion-list-header>
    <ion-list inset lines="full" class="topics">
      @for (tag of proto.followedTags(); track tag.id) {
        <ion-item button (click)="openDigest(tag.id)">
          <ion-label>{{ tag.name }}</ion-label>
          @if (countFor(tag.id) > 0) {
            <ion-badge slot="end" color="danger">
              {{ countFor(tag.id) }} neu
            </ion-badge>
          }
        </ion-item>
      }
      <ion-item button detail="false" (click)="editOpen.set(true)">
        <ion-icon name="create-outline" slot="start" color="primary" />
        <ion-label color="primary">Themen bearbeiten</ion-label>
      </ion-item>
    </ion-list>

    <ion-list-header>Geschäfte</ion-list-header>
    @for (f of proto.active(); track f.id) {
      <ion-item button detail="false" (click)="open(f)">
        <app-business-card [business]="business(f)" [parliament]="f.parliament">
          @if (f.parliament !== 'ch') {
            <span class="badge">
              <ion-icon name="notifications-off-outline" /> Ohne Push
            </span>
          }
          <ul class="changes">
            @for (line of f.changes; track line) {
              <li>{{ line }}</li>
            }
          </ul>
        </app-business-card>
      </ion-item>
    }

    @if (proto.finished().length > 0) {
      <ion-list inset lines="none">
        <ion-item button (click)="finishedOpen.set(true)">
          <ion-icon name="archive-outline" slot="start" />
          <ion-label>Erledigt</ion-label>
          <ion-note slot="end">{{ proto.finished().length }}</ion-note>
        </ion-item>
      </ion-list>
    }

    <ion-modal [isOpen]="finishedOpen()" (didDismiss)="finishedOpen.set(false)">
      <ng-template>
        <ion-header>
          <ion-toolbar>
            <ion-title>Erledigt</ion-title>
            <ion-buttons slot="end">
              <ion-button (click)="finishedOpen.set(false)"
                >Schliessen</ion-button
              >
            </ion-buttons>
          </ion-toolbar>
        </ion-header>
        <ion-content class="ion-padding">
          <p class="note">
            Diese Geschäfte sind abgeschlossen und werden nicht mehr
            aktualisiert.
          </p>
          @for (f of proto.finished(); track f.id) {
            <ion-item button detail="false" (click)="openFinished(f)">
              <app-business-card [business]="business(f)">
                <p class="note">Erledigt am {{ f.finishedAt }}</p>
              </app-business-card>
            </ion-item>
          }
        </ion-content>
      </ng-template>
    </ion-modal>

    <ion-modal [isOpen]="editOpen()" (didDismiss)="editOpen.set(false)">
      <ng-template>
        <ion-header>
          <ion-toolbar>
            <ion-title>Themen</ion-title>
            <ion-buttons slot="end">
              <ion-button (click)="editOpen.set(false)">Fertig</ion-button>
            </ion-buttons>
          </ion-toolbar>
        </ion-header>
        <ion-content>
          <ion-list lines="full">
            @for (tag of proto.tags(); track tag.id) {
              <ion-item
                button
                detail="false"
                (click)="proto.toggleTopic(tag.id)"
              >
                <ion-label>{{ tag.name }}</ion-label>
                @if (proto.isTopicFollowed(tag.id)) {
                  <ion-icon name="checkmark" slot="end" color="primary" />
                }
              </ion-item>
            }
          </ion-list>
        </ion-content>
      </ng-template>
    </ion-modal>
  `,
  styles: `
    :host {
      display: block;
      padding-bottom: 6rem;
    }
    .topics ion-badge {
      font-weight: 600;
    }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      margin: 0.25rem 0;
      padding: 2px 8px;
      border-radius: 999px;
      background: var(--ion-color-light);
      font-size: 12px;
      color: #555;
    }
    .changes {
      margin: 0;
      padding: 0;
      list-style: none;
      color: var(--ion-color-primary);
      font-size: 14px;
      font-weight: 600;
    }
    .note {
      margin: 0.25rem 0 0.5rem;
      font-size: 13px;
      color: #666;
    }
  `
})
export class FollowingCComponent {
  readonly proto = inject(DigestPrototypeService);
  private readonly router = inject(Router);
  readonly finishedOpen = signal(false);
  readonly editOpen = signal(false);
  private readonly latest = this.proto.digestDates[0];

  countFor(tagId: number): number {
    return (
      this.proto
        .digestGroups(this.latest)
        .find((group) => group.tag.id === tagId)?.businesses.length ?? 0
    );
  }

  business(f: ProtoFollow) {
    return asBusiness(f);
  }

  open(f: ProtoFollow) {
    if (f.parliament !== 'ch') return;
    void this.router.navigate(detailPath('business', f.parliament, f.id));
  }

  openFinished(f: ProtoFollow) {
    this.finishedOpen.set(false);
    this.open(f);
  }

  openDigest(tagId: number) {
    void this.router.navigate(['/layout/business/ch/digest', this.latest], {
      queryParams: { variant: 'C', topic: tagId }
    });
  }
}
