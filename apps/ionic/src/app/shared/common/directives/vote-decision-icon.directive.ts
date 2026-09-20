import { computed, Directive, inject, input } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import {
  DECISION_COLOURS,
  DECISION_ICONS,
  toVoteDecision
} from '../models/vote-decision';

@Directive({
  selector: 'ion-icon[appVoteDecisionIcon]',
  host: {
    '[attr.name]': 'DECISION_ICONS[decision()]',
    '[attr.color]': 'DECISION_COLOURS[decision()]',
    '[attr.aria-label]': 'label()'
  }
})
export class VoteDecisionIconDirective {
  private readonly transloco = inject(TranslocoService);

  readonly decisionCode = input.required<number | undefined>({
    alias: 'appVoteDecisionIcon'
  });

  readonly decision = computed(() => toVoteDecision(this.decisionCode()));
  readonly label = computed(() =>
    this.transloco.translate(`votes.decision.${this.decision()}`)
  );

  readonly DECISION_ICONS = DECISION_ICONS;
  readonly DECISION_COLOURS = DECISION_COLOURS;
}
