// PROTOTYPE for #55: the list a topic digest push opens.
// Three variants of one page, switchable via ?variant=A|B|C:
// A grouped sections with sticky topic headers, swipe to follow (as in the
//   business list); a business in two followed topics shows under both.
// B topic filter on top, compact rows with an inline follow button; each
//   business once.
// C one day per page with ‹ › between days, topics as collapsible groups,
//   full cards with a follow button inside the card.
import { Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { detailPath } from '@parlwatch/shared/parliament/models';
import { BusinessCardComponent } from '../components/business-card/business-card.component';
import {
  asBusiness,
  DigestPrototypeService,
  formatDay,
  ProtoDigestBusiness,
  VariantKey
} from './digest-prototype.service';
import { PrototypeSwitcherComponent } from './prototype-switcher.component';

@Component({
  selector: 'app-digest-prototype',
  imports: [IonicModule, BusinessCardComponent, PrototypeSwitcherComponent],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/layout/business/ch" text="" />
        </ion-buttons>
        <ion-title>
          Neue Geschäfte
          <div class="subtitle">{{ day(date()) }}</div>
        </ion-title>
      </ion-toolbar>
      @if (proto.variant() === 'B') {
        <ion-toolbar color="light">
          <ion-segment
            scrollable
            [value]="'' + filter()"
            (ionChange)="filter.set(+$any($event.detail.value))"
          >
            <ion-segment-button value="0">
              Alle {{ unique().length }}
            </ion-segment-button>
            @for (group of groups(); track group.tag.id) {
              <ion-segment-button [value]="'' + group.tag.id">
                {{ group.tag.name }} {{ group.businesses.length }}
              </ion-segment-button>
            }
          </ion-segment>
        </ion-toolbar>
      }
      @if (proto.variant() === 'C') {
        <ion-toolbar color="light" class="day-nav">
          <ion-buttons slot="start">
            <ion-button [disabled]="!older()" (click)="go(older())">
              <ion-icon slot="icon-only" name="chevron-back" />
            </ion-button>
          </ion-buttons>
          <ion-title size="small"
            >{{ unique().length }} in deinen Themen</ion-title
          >
          <ion-buttons slot="end">
            <ion-button [disabled]="!newer()" (click)="go(newer())">
              <ion-icon slot="icon-only" name="chevron-forward" />
            </ion-button>
          </ion-buttons>
        </ion-toolbar>
      }
    </ion-header>

    <ion-content class="ion-padding">
      @switch (proto.variant()) {
        @case ('A') {
          @for (group of groups(); track group.tag.id) {
            <ion-item-divider sticky class="topic-divider">
              <ion-label>{{ group.tag.name }}</ion-label>
              <ion-note slot="end">{{ group.businesses.length }}</ion-note>
            </ion-item-divider>
            @for (b of group.businesses; track b.id) {
              <ion-item-sliding #sliding class="card-sliding">
                <ion-item button detail="false" (click)="open(b)">
                  <app-business-card [business]="card(b)">
                    @if (proto.isFollowed(b.id)) {
                      <p class="followed"><ion-icon name="eye" /> Beobachtet</p>
                    }
                  </app-business-card>
                </ion-item>
                <ion-item-options side="end">
                  <ion-item-option
                    [color]="proto.isFollowed(b.id) ? 'medium' : 'primary'"
                    (click)="proto.toggleBusiness(b.id); sliding.close()"
                  >
                    <ion-icon
                      slot="top"
                      [name]="
                        proto.isFollowed(b.id)
                          ? 'eye-off-outline'
                          : 'eye-outline'
                      "
                    />
                    {{ proto.isFollowed(b.id) ? '' : 'Beobachten' }}
                  </ion-item-option>
                </ion-item-options>
              </ion-item-sliding>
            }
          }
        }
        @case ('B') {
          <ion-list lines="full" class="compact">
            @for (b of filtered(); track b.id) {
              <ion-item button detail="false" (click)="open(b)">
                <ion-label class="ion-text-wrap">
                  <p class="meta">
                    {{ b.shortNumber }} · {{ b.typeName }}
                    @if (filter() === 0) {
                      · {{ topicsOf(b) }}
                    }
                  </p>
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
        }
        @case ('C') {
          <ion-accordion-group [multiple]="true" [value]="openGroups()">
            @for (group of groups(); track group.tag.id) {
              <ion-accordion [value]="'' + group.tag.id">
                <ion-item slot="header">
                  <ion-label>{{ group.tag.name }}</ion-label>
                  <ion-badge slot="end">{{
                    group.businesses.length
                  }}</ion-badge>
                </ion-item>
                <div slot="content">
                  @for (b of group.businesses; track b.id) {
                    <ion-item button detail="false" (click)="open(b)">
                      <app-business-card [business]="card(b)">
                        <ion-button
                          size="small"
                          [fill]="proto.isFollowed(b.id) ? 'solid' : 'outline'"
                          (click)="
                            $event.stopPropagation(); proto.toggleBusiness(b.id)
                          "
                        >
                          <ion-icon
                            slot="start"
                            [name]="
                              proto.isFollowed(b.id) ? 'eye' : 'eye-outline'
                            "
                          />
                          {{
                            proto.isFollowed(b.id) ? 'Beobachtet' : 'Beobachten'
                          }}
                        </ion-button>
                      </app-business-card>
                    </ion-item>
                  }
                </div>
              </ion-accordion>
            }
          </ion-accordion-group>
          <p class="others">
            {{ proto.digest(date()).length - unique().length }} weitere neue
            Geschäfte in anderen Themen
          </p>
        }
      }
      @if (groups().length === 0) {
        <p class="others">
          An diesem Tag gab es nichts Neues in deinen Themen.
        </p>
      }
      <app-prototype-switcher />
    </ion-content>
  `,
  styles: `
    .subtitle {
      font-size: 12px;
      font-weight: 400;
      opacity: 0.85;
    }
    .topic-divider {
      --background: var(--ion-color-primary-contrast);
      font-weight: 700;
      font-size: 17px;
      margin-top: 0.5rem;
    }
    .followed {
      display: flex;
      align-items: center;
      gap: 0.3rem;
      margin: 0.25rem 0 0;
      font-size: 13px;
      font-weight: 600;
      color: var(--ion-color-primary);
    }
    .compact .meta {
      font-size: 12px;
      text-transform: none;
    }
    .compact h3 {
      font-weight: 600;
    }
    .others {
      margin: 1.5rem 0 5rem;
      text-align: center;
      font-size: 13px;
      color: #666;
    }
  `
})
export class DigestPrototypePage {
  readonly proto = inject(DigestPrototypeService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly params = toSignal(this.route.paramMap);
  private readonly query = toSignal(this.route.queryParamMap);

  readonly day = formatDay;
  readonly filter = signal(0);

  readonly date = computed(() => this.params()?.get('date') ?? '');
  readonly groups = computed(() => this.proto.digestGroups(this.date()));
  readonly unique = computed(() => {
    const seen = new Map<number, ProtoDigestBusiness>();
    for (const group of this.groups()) {
      for (const b of group.businesses) seen.set(b.id, b);
    }
    return [...seen.values()];
  });
  readonly filtered = computed(() =>
    this.filter() === 0
      ? this.unique()
      : this.unique().filter((b) => b.tagIds.includes(this.filter()))
  );
  readonly openGroups = computed(() => {
    const topic = this.query()?.get('topic');
    return topic ? [topic] : this.groups().map((g) => '' + g.tag.id);
  });
  readonly older = computed(() => this.neighbour(1));
  readonly newer = computed(() => this.neighbour(-1));

  constructor() {
    const variant = this.route.snapshot.queryParamMap.get('variant');
    if (variant) this.proto.variant.set(variant as VariantKey);
    // D has no digest page: the push opens the following view on a topic.
    effect(() => {
      if (this.proto.variant() !== 'D' || this.groups().length === 0) return;
      void this.router.navigate(['/layout/business/ch'], {
        queryParams: { variant: 'D', topic: this.groups()[0]?.tag.id },
        replaceUrl: true
      });
    });
    const topic = this.route.snapshot.queryParamMap.get('topic');
    if (topic && variant === 'B') this.filter.set(+topic);
  }

  card(b: ProtoDigestBusiness) {
    return asBusiness(
      b,
      b.tagIds.map((id) => this.proto.tagName(id))
    );
  }

  topicsOf(b: ProtoDigestBusiness): string {
    return b.tagIds
      .filter((id) => this.proto.isTopicFollowed(id))
      .map((id) => this.proto.tagName(id))
      .join(', ');
  }

  open(b: ProtoDigestBusiness) {
    void this.router.navigate(detailPath('business', 'ch', b.id));
  }

  go(date: string | undefined) {
    if (!date) return;
    void this.router.navigate(['/layout/business/ch/digest', date], {
      queryParamsHandling: 'merge',
      replaceUrl: true
    });
  }

  private neighbour(step: number): string | undefined {
    const dates = this.proto.digestDates;
    return dates[dates.indexOf(this.date()) + step];
  }
}
