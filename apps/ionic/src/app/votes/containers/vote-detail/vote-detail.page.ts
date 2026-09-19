import { Component, OnInit, effect, inject, computed } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { IonicModule } from '@ionic/angular';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { Voting } from 'swissparl';
import { VoteCardComponent } from '../../components/vote-card/vote-card.component';
import { ParlGroupBreakdownComponent } from '../../components/parl-group-breakdown/parl-group-breakdown.component';
import { TextCardComponent } from '../../../shared/components/text-card/text-card.component';
import { LoadingScreenComponent } from '../../../shared/components/loading-screen/loading-screen.component';
import { ErrorScreenComponent } from '../../../shared/components/error-screen/error-screen.component';
import { VoteStore, VotingDecisionFilter } from '../../store/vote';
import { RecentVoteStore } from '../../store/recent/recent.store';
import {
  toCssColour,
  toVoteDecision,
  VoteDecision
} from '../../models/vote-decision';
import { parlGroupTranslationKey } from '../../../shared/models/parl-group.model';
import { LoadedVote } from '../../models/loaded-vote';
import {
  isCantonal,
  ParliamentKey
} from '../../../parliament/models/parliament.model';
import {
  detailPathInTab,
  routeParliament
} from '../../../parliament/models/parliament-routes';
import { CantonalThemeDirective } from '../../../parliament/directives/cantonal-theme.directive';
import { ParliamentTitleComponent } from '../../../parliament/components/parliament-title/parliament-title.component';
import { RecordSourceFooterComponent } from '../../../parliament/components/record-source-footer/record-source-footer.component';

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

/**
 * Label a vote is listed under in the "recently viewed" suggestions. Uses the
 * business title, which is what the vote list itself shows and what makes the
 * entry recognisable: a vote's own subject is often a generic label such as
 * "Gesamtabstimmung", identical across unrelated votes. Falls back through the
 * remaining title fields, each of which is optional on the API model.
 * @param vote The vote that was opened
 * @returns A display label, or an empty string when the vote carries no title
 */
function recentVoteTitle(vote: LoadedVote): string {
  const title =
    vote.BusinessTitle?.trim() ||
    vote.BillTitle?.trim() ||
    vote.Subject?.trim();
  const shortNumber = vote.BusinessShortNumber?.trim();

  return [shortNumber, title].filter(Boolean).join(' - ');
}

@Component({
  selector: 'app-vote-detail',
  templateUrl: './vote-detail.page.html',
  styleUrls: ['./vote-detail.page.scss'],
  imports: [
    ReactiveFormsModule,
    IonicModule,
    VoteCardComponent,
    ParlGroupBreakdownComponent,
    TextCardComponent,
    LoadingScreenComponent,
    ErrorScreenComponent,
    TranslocoDirective,
    ParliamentTitleComponent,
    RecordSourceFooterComponent
  ],
  hostDirectives: [CantonalThemeDirective]
})
export class VoteDetailPage implements OnInit {
  readonly router = inject(Router);
  readonly route = inject(ActivatedRoute);
  readonly store = inject(VoteStore);
  readonly recentStore = inject(RecentVoteStore);
  private readonly transloco = inject(TranslocoService);

  /** The parliament this vote belongs to, read from the route only. */
  readonly parliament: ParliamentKey = routeParliament(this.route);
  readonly isCantonal = isCantonal(this.parliament);

  voteFilterControl = new FormControl<VotingDecisionFilter>('all');
  private readonly voteFilter = toSignal(this.voteFilterControl.valueChanges, {
    initialValue: this.voteFilterControl.value as VotingDecisionFilter
  });

  readonly viewModel = computed(() =>
    this.store.voteDetailViewModel(this.voteFilter() ?? 'all')
  );

  constructor() {
    effect(() => {
      const vote = this.viewModel().vote;
      if (!vote?.ID) return;

      const title = recentVoteTitle(vote);
      if (title) {
        this.recentStore.recordEntry({
          id: vote.ID,
          title,
          parliament: this.parliament
        });
      }
    });
  }

  ngOnInit() {
    this.store.selectVote({
      parliament: this.parliament,
      id: parseInt(this.route.snapshot.params.id)
    });
  }

  retrySearch() {
    this.store.selectVote({
      parliament: this.parliament,
      id: parseInt(this.route.snapshot.params.id)
    });
  }

  goToBusiness() {
    const businessNumber = this.viewModel().vote?.BusinessNumber;
    if (businessNumber === undefined) return;

    this.router
      .navigate(detailPathInTab(this.router.url, 'business', businessNumber))
      .catch(console.error);
  }

  /**
   * Open the member behind a ballot, staying inside the current tab.
   * @param voting The tapped ballot
   */
  onMember(voting: Voting) {
    if (voting.PersonNumber === undefined) return;

    this.router
      .navigate(
        detailPathInTab(this.router.url, 'council-member', voting.PersonNumber)
      )
      .catch(console.error);
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
    const key = parlGroupTranslationKey(voting.ParlGroupCode);
    return key
      ? this.transloco.translate(key)
      : (voting.ParlGroupNameAbbreviation ?? '');
  }

  /**
   * The second line under a member's name: faction and canton federally,
   * the party alone for a cantonal ballot, which has no canton to add.
   * @param voting The member's voting record
   * @returns The line, or an empty string
   */
  memberSubtitle(voting: Voting): string {
    return [this.parlGroupLabel(voting), voting.CantonName]
      .filter((part) => !!part)
      .join(' - ');
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
