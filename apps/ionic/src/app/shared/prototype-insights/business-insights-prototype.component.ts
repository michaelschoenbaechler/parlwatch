// PROTOTYPE for #48. Throwaway. Rendered on the business detail page.
import { NgTemplateOutlet } from '@angular/common';
import { Component, computed, inject, input, signal } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { TextCardComponent } from '@parlwatch/shared/common/components';
import { detailPathInTab } from '@parlwatch/shared/parliament/models';
import {
  councilName,
  formatDuration,
  InsightsPrototypeService,
  ProtoMember
} from './insights-prototype.service';
import { SPEAKING_TIME_METHOD } from './method-text';

type Speaker = { member: ProtoMember; seconds: number };

@Component({
  selector: 'app-business-insights-prototype',
  imports: [IonicModule, TextCardComponent, NgTemplateOutlet],
  template: `
    @if (service.variant() === 'B' && councils().length > 0) {
      <app-text-card title="Wer wie lange sprach" subtitle="Nur Ratsmitglieder, die für sich selbst sprachen">
        <ng-container *ngTemplateOutlet="list; context: { $implicit: speakers().slice(0, 8) }" />
        @if (speakers().length > 8 || councils().length > 1) {
          <ion-button class="read-more" fill="clear" size="small" (click)="modalOpen.set(true)">
            Mehr lesen
            <ion-icon slot="end" name="chevron-forward-outline" />
          </ion-button>
        }
      </app-text-card>

      <ion-modal [isOpen]="modalOpen()" (didDismiss)="modalOpen.set(false)">
        <ng-template>
          <ion-header>
            <ion-toolbar>
              <ion-title>Wer wie lange sprach</ion-title>
              <ion-buttons slot="end">
                <ion-button (click)="modalOpen.set(false)">Schliessen</ion-button>
              </ion-buttons>
            </ion-toolbar>
            @if (councils().length > 1) {
              <ion-toolbar>
                <ion-segment [value]="active()" (ionChange)="council.set($any($event.detail.value))">
                  @for (c of councils(); track c) {
                    <ion-segment-button [value]="c"><ion-label>{{ name(c) }}</ion-label></ion-segment-button>
                  }
                </ion-segment>
              </ion-toolbar>
            }
          </ion-header>
          <ion-content class="ion-padding">
            <ng-container *ngTemplateOutlet="list; context: { $implicit: speakers() }" />
            <h4>So wird gezählt</h4>
            @for (p of method; track p) { <p class="sub">{{ p }}</p> }
          </ion-content>
        </ng-template>
      </ion-modal>

      <ng-template #list let-rows>
        <ul class="bars">
          @for (s of $any(rows); track s.member.personNumber) {
            <li (click)="openMember(s.member.personNumber)">
              <div class="row">
                <span class="who">
                  {{ s.member.name }}
                  <small>{{ s.member.parlGroup }} · {{ s.member.canton }}</small>
                </span>
                <span class="time">{{ duration(s.seconds) }}</span>
              </div>
              <div class="bar"><span [style.width.%]="(s.seconds / max()) * 100"></span></div>
            </li>
          }
        </ul>
      </ng-template>
    }
  `,
  styles: `
    .sub { color: var(--ion-color-medium); font-size: 13px; margin: 4px 0; }
    .bars { list-style: none; padding: 0; margin: 12px 0 0; }
    .bars li { margin-bottom: 18px; }
    .row { display: flex; justify-content: space-between; gap: 8px; font-size: 14px; }
    .who small { color: var(--ion-color-medium); margin-left: 4px; }
    .time { white-space: nowrap; color: var(--ion-color-medium); }
    .bar { height: 6px; background: var(--ion-color-light); border-radius: 3px; margin-top: 6px; }
    .bar span { display: block; height: 100%; background: var(--ion-color-primary); border-radius: 3px; }
    .read-more {
      --padding-start: 0;
      --padding-end: 0;
      margin: 0;
      font-size: 13px;
      font-weight: 600;
      text-transform: none;
      letter-spacing: 0;
    }
    h4 { margin-top: 24px; font-size: 15px; }
  `
})
export class BusinessInsightsPrototypeComponent {
  readonly service = inject(InsightsPrototypeService);
  private readonly router = inject(Router);
  readonly businessId = input.required<number>();

  private readonly data = computed(() => this.service.business(this.businessId()));
  readonly councils = computed(() =>
    (['N', 'S'] as const).filter((c) => this.data()[c].some((s) => s.seconds > 0))
  );
  readonly council = signal<'N' | 'S' | null>(null);
  readonly active = computed(() => this.council() ?? this.councils()[0] ?? 'N');
  readonly speakers = computed<Speaker[]>(() =>
    this.data()[this.active()].filter((s) => s.seconds > 0)
  );
  readonly max = computed(() => this.speakers()[0]?.seconds || 1);
  readonly modalOpen = signal(false);
  readonly method = SPEAKING_TIME_METHOD;
  readonly duration = formatDuration;
  readonly name = councilName;

  openMember(personNumber: number) {
    this.modalOpen.set(false);
    this.router
      .navigate(detailPathInTab(this.router.url, 'council-member', personNumber))
      .catch(console.error);
  }
}
