import { Component, Input } from '@angular/core';
import { MemberCouncil } from 'swissparl';
import { LowerCasePipe } from '@angular/common';

@Component({
  selector: 'app-council-member-card',
  templateUrl: './council-member-card.component.html',
  styleUrls: ['./council-member-card.component.scss'],
  standalone: true,
  imports: [LowerCasePipe]
})
export class CouncilMemberCardComponent {
  @Input() councilMember: MemberCouncil;

  constructor() {}
}
