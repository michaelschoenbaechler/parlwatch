// PROTOTYPE for #48. Throwaway. Rendered on the member detail page.
import { DatePipe } from '@angular/common';
import { Component, computed, inject, input, signal } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { TextCardComponent } from '@parlwatch/shared/common/components';
import { detailPathInTab } from '@parlwatch/shared/parliament/models';
import {
  councilName,
  formatDuration,
  InsightsPrototypeService
} from './insights-prototype.service';
import { DISCLOSURE_METHOD, SPEAKING_TIME_METHOD } from './method-text';

@Component({
  selector: 'app-member-insights-prototype',
  imports: [IonicModule, TextCardComponent, DatePipe],
  template: `
    @if (member(); as m) {
      @switch (service.variant()) {
        @case ('A') {
          <app-text-card title="Redezeit">
            <div class="headline">
              <strong>{{ duration(m.seconds) }}</strong>
              <ion-button fill="clear" size="small" (click)="methodOpen.set(true)">
                <ion-icon slot="icon-only" name="information-circle-outline" />
              </ion-button>
            </div>
            <p class="sub">
              Rang {{ m.rank }} von {{ m.of }} im {{ council(m.council) }} ·
              {{ m.speeches }} Voten · Median {{ duration(m.median) }}
            </p>
            <div class="strip">
              @for (other of ranking(); track other.personNumber) {
                <span
                  class="dot"
                  [class.me]="other.personNumber === m.personNumber"
                  [style.left.%]="(other.seconds / m.max) * 100"
                ></span>
              }
            </div>
            <p class="label">Am meisten gesprochen zu</p>
            <ion-list lines="none" class="businesses">
              @for (b of showAll() ? m.businesses : m.businesses.slice(0, 8); track b.shortNumber) {
                <ion-item button detail (click)="openBusiness(b.id)">
                  <ion-label class="ion-text-wrap">
                    <p>{{ b.shortNumber }} · {{ duration(b.seconds) }}</p>
                    <h3>{{ b.title }}</h3>
                  </ion-label>
                </ion-item>
              }
            </ion-list>
            @if (m.businesses.length > 8) {
              <ion-button expand="block" size="small" fill="outline" (click)="showAll.set(!showAll())">
                {{ showAll() ? 'Weniger anzeigen' : 'Mehr anzeigen (' + (m.businesses.length - 8) + ')' }}
              </ion-button>
            }
            @if (provisional()) {
              <p class="provisional">Provisorisch: die letzte Session ist noch nicht definitiv.</p>
            }
          </app-text-card>
          <app-text-card title="Offenlegungen">
            @if (m.disclosures.length === 0) {
              <p class="sub">In der laufenden Legislatur keine gefunden.</p>
            }
            @for (d of m.disclosures; track d.transcriptId) {
              <blockquote>«{{ d.text }}»</blockquote>
              @if (d.business) {
                <p class="sub link" (click)="openBusiness(d.business.id)">
                  {{ d.date | date: 'dd.MM.yyyy' }} · {{ d.business.shortNumber }}
                  {{ d.business.title }} ›
                </p>
              }
            }
          </app-text-card>
          <ion-modal [isOpen]="methodOpen()" (didDismiss)="methodOpen.set(false)" [initialBreakpoint]="0.6" [breakpoints]="[0, 0.6, 1]">
            <ng-template>
              <ion-content class="ion-padding">
                <h3>So wird die Redezeit gezählt</h3>
                @for (p of speakingMethod; track p) { <p>{{ p }}</p> }
                <h3>Offenlegungen</h3>
                @for (p of disclosureMethod; track p) { <p>{{ p }}</p> }
              </ion-content>
            </ng-template>
          </ion-modal>
        }
        @case ('B') {
          <app-text-card title="Redezeit und Offenlegungen">
            <p class="sub">
              Variante B zeigt beides nur bei den einzelnen Geschäften, im
              Abschnitt «Debatte». Hier erscheint nichts.
            </p>
          </app-text-card>
        }
        @case ('C') {
          <div class="chips">
            <ion-chip (click)="openRanking()">
              <ion-icon name="podium-outline" />
              <ion-label>Redezeit: Rang {{ m.rank }}/{{ m.of }} im {{ council(m.council) }}</ion-label>
            </ion-chip>
            <ion-chip (click)="openRanking('disclosures')">
              <ion-icon name="hand-left-outline" />
              <ion-label>{{ m.disclosures.length }} Offenlegungen</ion-label>
            </ion-chip>
          </div>
        }
      }
    }
  `,
  styles: `
    .headline { display: flex; align-items: center; justify-content: space-between; }
    .headline strong { font-size: 28px; }
    .sub { color: var(--ion-color-medium); font-size: 13px; margin: 4px 0; }
    .link { color: var(--ion-color-primary); }
    .label { font-size: 12px; text-transform: uppercase; color: var(--ion-color-medium); margin: 16px 0 0; }
    .strip { position: relative; height: 18px; margin: 12px 4px; border-bottom: 1px solid var(--ion-color-light-shade); }
    .dot { position: absolute; top: 6px; width: 6px; height: 6px; margin-left: -3px; border-radius: 50%; background: var(--ion-color-medium); opacity: 0.35; }
    .dot.me { top: 2px; width: 14px; height: 14px; margin-left: -7px; opacity: 1; background: var(--ion-color-primary); z-index: 1; }
    .provisional { font-size: 12px; color: var(--ion-color-warning-shade); }
    blockquote { margin: 12px 0 4px; padding-left: 10px; border-left: 3px solid var(--ion-color-primary); font-style: italic; }
    .businesses ion-item { --padding-top: 10px; --padding-bottom: 10px; }
    .businesses ion-label h3 { margin-top: 4px; line-height: 1.35; }
    .chips { display: flex; flex-wrap: wrap; margin: 0 0 8px; }
  `
})
export class MemberInsightsPrototypeComponent {
  readonly service = inject(InsightsPrototypeService);
  private readonly router = inject(Router);
  readonly personNumber = input.required<number>();

  readonly member = computed(() => this.service.member(this.personNumber()));
  readonly ranking = computed(() => {
    const m = this.member();
    return m ? this.service.ranking(m.council) : [];
  });
  readonly provisional = this.service.provisional;
  readonly methodOpen = signal(false);
  readonly showAll = signal(false);
  readonly speakingMethod = SPEAKING_TIME_METHOD;
  readonly disclosureMethod = DISCLOSURE_METHOD;
  readonly duration = formatDuration;
  readonly council = councilName;

  openBusiness(id: number) {
    this.router
      .navigate(detailPathInTab(this.router.url, 'business', id))
      .catch(console.error);
  }

  openRanking(tab?: 'disclosures') {
    const m = this.member();
    this.router
      .navigate(['/layout/council-member/ch/speaking-time'], {
        queryParams: { council: m?.council, tab, highlight: m?.personNumber }
      })
      .catch(console.error);
  }
}
