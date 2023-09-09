import { Component, Input } from '@angular/core';
import { MemberCouncil } from 'swissparl';

@Component({
  selector: 'app-council-member-card',
  templateUrl: './council-member-card.component.html',
  styleUrls: ['./council-member-card.component.scss']
})
export class CouncilMemberCardComponent {
  @Input() councilMember: MemberCouncil;

  constructor() {}
}
