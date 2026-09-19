import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input
} from '@angular/core';
import { cantonTheme, ParliamentKey } from '../../models/parliament.model';

@Component({
  selector: 'app-parliament-title',
  template: `
    @if (theme(); as theme) {
      <span class="parliament-title">
        <img class="coat-of-arms" [src]="theme.coatOfArms" alt="" />
        <span class="canton-name">{{ theme.name }}</span>
        <span class="page-title">{{ title() }}</span>
      </span>
    } @else {
      {{ title() }}
    }
  `,
  styles: `
    .parliament-title {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      max-width: 100%;
    }

    .coat-of-arms {
      width: 1.5rem;
      height: 1.5rem;
      flex-shrink: 0;
      border: #bbbbbb 1px solid;
      border-radius: 0.2rem;
      background: white;
    }

    .canton-name {
      font-weight: 700;
    }

    .page-title {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .page-title::before {
      content: '· ';
      font-weight: 400;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ParliamentTitleComponent {
  readonly parliament = input.required<ParliamentKey>();
  readonly title = input.required<string>();

  readonly theme = computed(() => cantonTheme(this.parliament()));
}
