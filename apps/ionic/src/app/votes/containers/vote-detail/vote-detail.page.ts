import { Component, OnInit, inject, computed } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { IonicModule } from '@ionic/angular';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { Voting } from 'swissparl';
import { VoteCardComponent } from '../../components/vote-card/vote-card.component';
import { TextCardComponent } from '../../../shared/components/text-card/text-card.component';
import { LoadingScreenComponent } from '../../../shared/components/loading-screen/loading-screen.component';
import { ErrorScreenComponent } from '../../../shared/components/error-screen/error-screen.component';
import { VoteStore, VotingDecisionFilter } from '../../store/vote';
import {
  PARL_GROUP_CODES,
  toCssColour,
  toVoteDecision,
  VoteDecision
} from '../../models/vote-decision';

const DECISION_ICONS: Record<VoteDecision, string> = {
  yes: 'checkmark-outline',
  no: 'close-outline',
  abstained: 'remove-outline',
  'not-participated': 'ellipsis-horizontal-outline'
};

const DECISION_COLORS: Record<VoteDecision, string> = {
  yes: 'success',
  no: 'danger',
  abstained: 'warning',
  'not-participated': 'medium'
};

@Component({
  selector: 'app-vote-detail',
  templateUrl: './vote-detail.page.html',
  styleUrls: ['./vote-detail.page.scss'],
  imports: [
    RouterLink,
    ReactiveFormsModule,
    IonicModule,
    VoteCardComponent,
    TextCardComponent,
    LoadingScreenComponent,
    ErrorScreenComponent,
    TranslocoDirective
  ]
})
export class VoteDetailPage implements OnInit {
  readonly router = inject(Router);
  readonly route = inject(ActivatedRoute);
  readonly store = inject(VoteStore);
  private readonly transloco = inject(TranslocoService);

  voteFilterControl = new FormControl<VotingDecisionFilter>('all');
  private readonly voteFilter = toSignal(this.voteFilterControl.valueChanges, {
    initialValue: this.voteFilterControl.value as VotingDecisionFilter
  });

  readonly viewModel = computed(() =>
    this.store.voteDetailViewModel(this.voteFilter() ?? 'all')
  );

  ngOnInit() {
    this.store.selectVote(parseInt(this.route.snapshot.params.id));
  }

  retrySearch() {
    this.store.selectVote(parseInt(this.route.snapshot.params.id));
  }

  goToBusiness() {
    const vm = this.viewModel();
    if (vm.vote) {
      this.router.navigate([
        '/layout/votes/business/detail',
        vm.vote.BusinessNumber
      ]);
    }
  }

  /**
   * Icon name representing how a member voted.
   * @param voting The member's voting record
   * @returns Ionicon name
   */
  decisionIcon(voting: Voting): string {
    return DECISION_ICONS[toVoteDecision(voting.Decision)];
  }

  /**
   * Ionic colour representing how a member voted.
   * @param voting The member's voting record
   * @returns Ionic colour name
   */
  decisionColor(voting: Voting): string {
    return DECISION_COLORS[toVoteDecision(voting.Decision)];
  }

  /**
   * Translated label for how a member voted, used as the icon's accessible name.
   * @param voting The member's voting record
   * @returns Localised decision label
   */
  decisionLabel(voting: Voting): string {
    return this.transloco.translate(
      `votes.decision.${toVoteDecision(voting.Decision)}`
    );
  }

  /**
   * Short faction label. Keyed on `ParlGroupCode`, which is stable across
   * languages, and falls back to the API's own abbreviation for codes the app
   * does not know yet.
   * @param voting The member's voting record
   * @returns Localised faction abbreviation
   */
  parlGroupLabel(voting: Voting): string {
    const code = voting.ParlGroupCode;
    return code && PARL_GROUP_CODES.includes(code)
      ? this.transloco.translate(`votes.parlGroup.${code}`)
      : (voting.ParlGroupNameAbbreviation ?? '');
  }

  /**
   * Faction colour as reported by the API.
   * @param voting The member's voting record
   * @returns CSS hex colour
   */
  parlGroupColour(voting: Voting): string {
    return toCssColour(voting.ParlGroupColour);
  }
}
