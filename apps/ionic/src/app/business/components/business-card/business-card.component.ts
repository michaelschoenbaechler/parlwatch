import { Component, computed, input } from '@angular/core';
import { Business } from 'swissparl';
import { TextCardComponent } from '../../../shared/components/text-card/text-card.component';
import { ODataDateTimePipe } from '../../../shared/pipes/o-data-date-time.pipe';

@Component({
  selector: 'app-business-card',
  templateUrl: './business-card.component.html',
  styleUrls: ['./business-card.component.scss'],
  imports: [TextCardComponent]
})
export class BusinessCardComponent {
  readonly business = input.required<Business>();

  private readonly datePipe = new ODataDateTimePipe();

  /**
   * Status line under the title. Federal rows date the status itself; a
   * cantonal row carries no status date, so its submission date stands in.
   */
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

  constructor() {}

  getTagNames(): string[] {
    const business = this.business();
    if (!business.TagNames) return [];
    return business.TagNames.split('|');
  }
}
