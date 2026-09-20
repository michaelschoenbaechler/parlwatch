import {
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  input
} from '@angular/core';
import { Business } from 'swissparl';
import { TextCardComponent } from '@parlwatch/shared/common/components';
import { ODataDateTimePipe } from '@parlwatch/shared/common/pipes';
import { applyCantonTheme } from '@parlwatch/shared/parliament/directives';
import {
  cantonTheme,
  ParliamentKey
} from '@parlwatch/shared/parliament/models';

@Component({
  selector: 'app-business-card',
  templateUrl: './business-card.component.html',
  styleUrls: ['./business-card.component.scss'],
  imports: [TextCardComponent]
})
export class BusinessCardComponent {
  readonly business = input.required<Business>();
  /** Set to colour the card by parliament where the page itself is not themed. */
  readonly parliament = input<ParliamentKey>();

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly datePipe = new ODataDateTimePipe();

  readonly subtitle = computed(() => {
    const business = this.business();
    const status = business.BusinessStatusText?.trim() ?? '';
    const statusDate = this.datePipe.transform(business.BusinessStatusDate);
    if (statusDate) return `${status} am ${statusDate}`;

    const submitted = this.datePipe.transform(business.SubmissionDate);
    return [status, submitted && `Eingereicht am ${submitted}`]
      .filter(Boolean)
      .join(' · ');
  });

  constructor() {
    effect(() => {
      const parliament = this.parliament();
      if (parliament === undefined) return;
      applyCantonTheme(this.host.nativeElement, cantonTheme(parliament));
    });
  }

  getTagNames(): string[] {
    const business = this.business();
    if (!business.TagNames) return [];
    return business.TagNames.split('|');
  }
}
