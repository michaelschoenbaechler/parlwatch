import { Component, input } from '@angular/core';
import { Business } from 'swissparl';
import { TextCardComponent } from '../../../shared/components/text-card/text-card.component';
import { ODataDateTimePipe } from '../../../shared/pipes/o-data-date-time.pipe';

@Component({
  selector: 'app-business-card',
  templateUrl: './business-card.component.html',
  styleUrls: ['./business-card.component.scss'],
  imports: [TextCardComponent, ODataDateTimePipe]
})
export class BusinessCardComponent {
  readonly business = input<Business>(undefined);

  constructor() {}

  getTagNames(): string[] {
    const business = this.business();
    if (!business.TagNames) return [];
    return business.TagNames.split('|');
  }
}
