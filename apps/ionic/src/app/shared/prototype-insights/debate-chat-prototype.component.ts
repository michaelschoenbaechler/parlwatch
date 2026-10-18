// PROTOTYPE for #48. Throwaway. A business's debate as a conversation.
import { NgTemplateOutlet } from '@angular/common';
import { Component, effect, inject, input, signal } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { TextCardComponent } from '@parlwatch/shared/common/components';
import {
  cleanTranscriptText,
  SpeechGroupVm,
  SpeechVm
} from '@parlwatch/shared/common/models';
import { ODataDateTimePipe, SafeHtmlPipe } from '@parlwatch/shared/common/pipes';
import { TranscriptService } from '@parlwatch/shared/common/services';

const PREVIEW = 8;

const GROUP_COLORS: Record<string, string> = {
  S: '#e4002b',
  V: '#00843d',
  RL: '#1f5aa6',
  'M-E': '#f39200',
  G: '#84b414',
  GL: '#a6c11c'
};

type Role = 'member' | 'government' | 'chair';

@Component({
  selector: 'app-debate-chat-prototype',
  imports: [IonicModule, TextCardComponent, NgTemplateOutlet, ODataDateTimePipe, SafeHtmlPipe],
  template: `
    @for (stage of stages(); track stage.key) {
      <app-text-card [title]="stage.title + ' Debatte'" [subtitle]="stage.date | oDataDateTime">
        <ng-container *ngTemplateOutlet="chat; context: { $implicit: stage.speeches.slice(0, limit) }" />
        @if (stage.speeches.length > limit) {
          <ion-button class="read-more" fill="clear" size="small" (click)="openStage(stage)">
            Mehr lesen ({{ stage.speeches.length }} Voten)
            <ion-icon slot="end" name="chevron-forward-outline" />
          </ion-button>
        }
      </app-text-card>
    }

    <ion-modal [isOpen]="!!openedStage()" (didDismiss)="openedStage.set(null)">
      <ng-template>
        @if (openedStage(); as stage) {
          <ion-header>
            <ion-toolbar>
              <ion-title>{{ stage.title }} Debatte</ion-title>
              <ion-buttons slot="end">
                <ion-button (click)="openedStage.set(null)">Schliessen</ion-button>
              </ion-buttons>
            </ion-toolbar>
          </ion-header>
          <ion-content class="ion-padding">
            <ng-container *ngTemplateOutlet="chat; context: { $implicit: stage.speeches }" />
          </ion-content>
        }
      </ng-template>
    </ion-modal>

    <ng-template #chat let-speeches>
      <ol class="chat">
        @for (s of $any(speeches); track s.id; let i = $index) {
          @switch (role(s)) {
            @case ('chair') {
              <li class="chair">
                <span>{{ s.speaker }}: {{ previewText(s) || '…' }}</span>
              </li>
            }
            @default {
              <li class="msg" [class.gov]="role(s) === 'government'"
                  [class.followup]="i > 0 && $any(speeches)[i - 1].speaker === s.speaker">
                <span class="avatar" [style.background]="color(s)">{{ initials(s) }}</span>
                <div class="content">
                  <p class="name">
                    {{ s.speaker }}
                    <small>{{ role(s) === 'government' ? 'Bundesrat' : s.parlGroup }}</small>
                  </p>
                  <div class="bubble" [class.open]="expanded() === s.id" (click)="toggle(s.id)">
                    @if (expanded() === s.id && texts()[s.id]) {
                      <div [innerHTML]="texts()[s.id] | safeHtml"></div>
                    } @else if (texts()[s.id] === undefined) {
                      <ion-skeleton-text [animated]="true" style="width: 90%" />
                      <ion-skeleton-text [animated]="true" style="width: 60%" />
                    } @else {
                      <p class="clamp">{{ previewText(s) }}</p>
                    }
                  </div>
                </div>
              </li>
            }
          }
        }
      </ol>
    </ng-template>
  `,
  styles: `
    .chat { list-style: none; padding: 0; margin: 8px 0 0; }
    .msg { display: flex; gap: 8px; margin: 14px 0 0; align-items: flex-start; }
    .msg.followup { margin-top: 4px; }
    .msg.followup .avatar { visibility: hidden; }
    .msg.followup .name { display: none; }
    .msg.gov { flex-direction: row-reverse; }
    .msg.gov .content { align-items: flex-end; }
    .avatar {
      flex: none; width: 32px; height: 32px; border-radius: 50%;
      display: grid; place-items: center;
      color: #fff; font-size: 12px; font-weight: 700;
    }
    .content { display: flex; flex-direction: column; min-width: 0; max-width: 85%; }
    .name { margin: 0 0 3px; font-size: 13px; font-weight: 600; }
    .name small { color: var(--ion-color-medium); font-weight: 400; margin-left: 4px; }
    .bubble {
      background: var(--ion-color-light);
      border-radius: 4px 16px 16px 16px;
      padding: 8px 12px;
      font-size: 14px;
      line-height: 1.4;
    }
    .gov .bubble { border-radius: 16px 4px 16px 16px; background: rgba(var(--ion-color-primary-rgb), 0.1); }
    .bubble p { margin: 0; }
    .clamp { display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
    .chair { text-align: center; margin: 14px 0 0; }
    .chair span {
      display: inline-block; max-width: 90%;
      font-size: 12px; color: var(--ion-color-medium);
      background: var(--ion-color-light); border-radius: 999px; padding: 3px 10px;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .read-more {
      --padding-start: 0;
      --padding-end: 0;
      margin: 0.5rem 0 0 0;
      font-size: 13px;
      font-weight: 600;
      text-transform: none;
      letter-spacing: 0;
    }
  `
})
export class DebateChatPrototypeComponent {
  private readonly transcripts = inject(TranscriptService);
  readonly stages = input.required<SpeechGroupVm[]>();

  readonly limit = PREVIEW;
  readonly texts = signal<Record<number, string>>({});
  readonly expanded = signal<number | null>(null);
  readonly openedStage = signal<SpeechGroupVm | null>(null);
  private readonly requested = new Set<number>();

  constructor() {
    effect(() => {
      for (const stage of this.stages()) this.load(stage.speeches.slice(0, PREVIEW));
    });
  }

  openStage(stage: SpeechGroupVm) {
    this.openedStage.set(stage);
    this.load(stage.speeches);
  }

  toggle(id: number) {
    this.expanded.set(this.expanded() === id ? null : id);
  }

  role(s: SpeechVm): Role {
    if (/^(BR|BPR|VPBR|BK)-/.test(s.speakerFunction)) return 'government';
    if (/^(P|1VP|2VP)-/.test(s.speakerFunction)) return 'chair';
    return 'member';
  }

  color(s: SpeechVm) {
    if (this.role(s) === 'government') return 'var(--ion-color-primary)';
    return GROUP_COLORS[s.parlGroup] ?? 'var(--ion-color-medium)';
  }

  initials(s: SpeechVm) {
    return s.speaker
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0])
      .join('');
  }

  previewText(s: SpeechVm) {
    const html = this.texts()[s.id] ?? '';
    return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  }

  private load(speeches: SpeechVm[]) {
    for (const s of speeches) {
      if (this.requested.has(s.id)) continue;
      this.requested.add(s.id);
      this.transcripts.getSpeechText(s.id).subscribe({
        next: (text) =>
          this.texts.update((t) => ({ ...t, [s.id]: cleanTranscriptText(text) })),
        error: () => this.texts.update((t) => ({ ...t, [s.id]: '' }))
      });
    }
  }
}
