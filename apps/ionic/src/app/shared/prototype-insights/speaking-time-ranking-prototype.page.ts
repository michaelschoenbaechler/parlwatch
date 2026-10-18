// PROTOTYPE for #48. Throwaway. Variant C's ranking, under the members tab.
import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { detailPathInTab } from '@parlwatch/shared/parliament/models';
import {
  formatDuration,
  InsightsPrototypeService
} from './insights-prototype.service';
import { DISCLOSURE_METHOD, SPEAKING_TIME_METHOD } from './method-text';

type Tab = 'N' | 'S' | 'disclosures';

@Component({
  selector: 'app-speaking-time-ranking-prototype',
  imports: [IonicModule, DatePipe],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button text="Zurück" defaultHref="/layout/council-member" />
        </ion-buttons>
        <ion-title>Redezeit</ion-title>
      </ion-toolbar>
      <ion-toolbar>
        <ion-segment [value]="tab()" (ionChange)="tab.set($any($event.detail.value))">
          <ion-segment-button value="N"><ion-label>Nationalrat</ion-label></ion-segment-button>
          <ion-segment-button value="S"><ion-label>Ständerat</ion-label></ion-segment-button>
          <ion-segment-button value="disclosures"><ion-label>Offenlegungen</ion-label></ion-segment-button>
        </ion-segment>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <details class="method">
        <summary>{{ tab() === 'disclosures' ? 'Wie werden Offenlegungen gefunden?' : 'Wie wird gezählt?' }}</summary>
        @for (p of tab() === 'disclosures' ? disclosureMethod : speakingMethod; track p) {
          <p>{{ p }}</p>
        }
      </details>
      @if (service.provisional()) {
        <p class="provisional">Provisorisch, Stand {{ service.generatedAt() | date: 'dd.MM.yyyy' }}</p>
      }
      @if (tab() === 'disclosures') {
        @for (d of service.disclosures(); track d.transcriptId) {
          <div class="disclosure" [class.me]="d.member.personNumber === highlight">
            <p class="who" (click)="openMember(d.member.personNumber)">
              {{ d.member.name }} <small>{{ d.member.parlGroup }} · {{ d.member.canton }} · {{ d.date | date: 'dd.MM.yyyy' }}</small>
            </p>
            <blockquote>«{{ d.text }}»</blockquote>
            @if (d.business) {
              <p class="biz" (click)="openBusiness(d.business.id)">{{ d.business.shortNumber }} {{ d.business.title }} ›</p>
            }
          </div>
        }
      } @else {
        <ol class="ranking">
          @for (m of ranking(); track m.personNumber; let i = $index) {
            <li [class.me]="m.personNumber === highlight" (click)="openMember(m.personNumber)">
              <span class="rank">{{ i + 1 }}</span>
              <span class="body">
                <span class="row">
                  <span>{{ m.name }} <small>{{ m.parlGroup }} · {{ m.canton }}</small></span>
                  <span class="time">{{ duration(m.seconds) }}</span>
                </span>
                <span class="bar"><span [style.width.%]="(m.seconds / max()) * 100"></span></span>
              </span>
            </li>
          }
        </ol>
      }
    </ion-content>
  `,
  styles: `
    .method { font-size: 13px; color: var(--ion-color-medium); margin-bottom: 8px; }
    .method summary { color: var(--ion-color-primary); }
    .provisional { font-size: 12px; color: var(--ion-color-warning-shade); }
    .ranking { list-style: none; padding: 0; }
    .ranking li { display: flex; gap: 10px; padding: 8px 4px; border-bottom: 1px solid var(--ion-color-light); }
    .me { background: rgba(var(--ion-color-primary-rgb), 0.1); border-radius: 6px; }
    .rank { width: 28px; text-align: right; color: var(--ion-color-medium); }
    .body { flex: 1; }
    .row { display: flex; justify-content: space-between; font-size: 14px; }
    small { color: var(--ion-color-medium); }
    .time { color: var(--ion-color-medium); white-space: nowrap; }
    .bar { display: block; height: 5px; background: var(--ion-color-light); border-radius: 3px; margin-top: 4px; }
    .bar span { display: block; height: 100%; background: var(--ion-color-primary); border-radius: 3px; }
    .disclosure { padding: 8px 4px; border-bottom: 1px solid var(--ion-color-light); }
    .who { margin: 0; font-weight: 600; }
    blockquote { margin: 6px 0; padding-left: 10px; border-left: 3px solid var(--ion-color-primary); font-style: italic; }
    .biz { margin: 0; font-size: 13px; color: var(--ion-color-primary); }
  `
})
export class SpeakingTimeRankingPrototypePage {
  readonly service = inject(InsightsPrototypeService);
  private readonly router = inject(Router);
  private readonly params = inject(ActivatedRoute).snapshot.queryParams;

  readonly tab = signal<Tab>(
    this.params['tab'] === 'disclosures' ? 'disclosures' : this.params['council'] === 'S' ? 'S' : 'N'
  );
  readonly highlight = Number(this.params['highlight']);
  readonly ranking = computed(() => {
    const tab = this.tab();
    return tab === 'disclosures' ? [] : this.service.ranking(tab);
  });
  readonly max = computed(() => this.ranking()[0]?.seconds || 1);
  readonly speakingMethod = SPEAKING_TIME_METHOD;
  readonly disclosureMethod = DISCLOSURE_METHOD;
  readonly duration = formatDuration;

  openMember(personNumber: number) {
    this.router
      .navigate(detailPathInTab(this.router.url, 'council-member', personNumber))
      .catch(console.error);
  }

  openBusiness(id: number) {
    this.router
      .navigate(detailPathInTab(this.router.url, 'business', id))
      .catch(console.error);
  }
}
