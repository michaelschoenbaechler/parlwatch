import { Component, inject, input, OnInit } from '@angular/core';
import { Vote } from 'swissparl';
import { TranslocoDirective } from '@jsverse/transloco';
import { TextCardComponent } from '../../../shared/components/text-card/text-card.component';
import { ODataDateTimePipe } from '../../../shared/pipes/o-data-date-time.pipe';
import { VoteStore } from '../../store/vote';
import { VotingBarComponent } from '../voting-bar/voting-bar.component';

@Component({
  selector: 'app-vote-card',
  templateUrl: './vote-card.component.html',
  styleUrls: ['./vote-card.component.scss'],
  imports: [
    TextCardComponent,
    VotingBarComponent,
    ODataDateTimePipe,
    TranslocoDirective
  ]
})
export class VoteCardComponent implements OnInit {
  readonly store = inject(VoteStore);

  vote = input.required<Vote>();

  ngOnInit(): void {
    this.store.loadVoting(this.vote().ID);
  }
}
