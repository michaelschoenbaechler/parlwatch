import { Component, Input } from '@angular/core';
import { Business } from 'swissparl';

@Component({
  selector: 'app-business-card',
  templateUrl: './business-card.component.html',
  styleUrls: ['./business-card.component.scss']
})
export class BusinessCardComponent {
  @Input() business: Business;

  constructor() {}

  getTagNames(): string[] {
    if (!this.business.TagNames) return [];
    return this.business.TagNames.split('|');
  }
}
