import { Component, Input } from '@angular/core';
import { Business } from 'swissparl';
import { TextCardComponent } from '../../../shared/components/text-card/text-card.component';
import { ODataDateTimePipe } from '../../../shared/pipes/o-data-date-time.pipe';

@Component({
  selector: 'app-business-card',
  templateUrl: './business-card.component.html',
  styleUrls: ['./business-card.component.scss'],
  standalone: true,
  imports: [TextCardComponent, ODataDateTimePipe]
})
export class BusinessCardComponent {
  @Input() business: Business;

  constructor() {}

  getTagNames(): string[] {
    if (!this.business.TagNames) return [];
    return this.business.TagNames.split('|');
  }
}
