import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input
} from '@angular/core';
import { cantonTheme, ParliamentKey } from '../../models/parliament.model';

/**
 * The thin two-colour stripe that marks a cantonal item in a merged list,
 * split vertically into the canton's heraldic colours. Renders nothing for
 * the federal parliament, so it can sit in every row unconditionally.
 */
@Component({
  selector: 'app-canton-stripe',
  template: `
    @if (theme(); as theme) {
      <span
        class="canton-stripe"
        [style.--canton-colour-a]="theme.colours[0]"
        [style.--canton-colour-b]="theme.colours[1]"
        [attr.aria-label]="theme.name"
        role="img"
      ></span>
    }
  `,
  styles: `
    :host {
      display: contents;
    }

    .canton-stripe {
      display: block;
      width: 4px;
      align-self: stretch;
      min-height: 1.5rem;
      border-radius: 2px;
      background: linear-gradient(
        to bottom,
        var(--canton-colour-a) 0 50%,
        var(--canton-colour-b) 50% 100%
      );
      box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.08);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CantonStripeComponent {
  readonly parliament = input<ParliamentKey | undefined>(undefined);

  readonly theme = computed(() => cantonTheme(this.parliament() ?? 'ch'));
}
