import { Component, computed, inject, input, OnInit } from '@angular/core';
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

  /**
   * What a yes/no vote stood for. The API stores these once in whichever
   * language they were entered, so they are not translated with the app.
   */
  readonly meaningYes = computed(() => this.vote()?.MeaningYes?.trim() ?? '');
  readonly meaningNo = computed(() => this.vote()?.MeaningNo?.trim() ?? '');

  ngOnInit(): void {
    this.store.loadVoting(this.vote().ID);
  }
}
