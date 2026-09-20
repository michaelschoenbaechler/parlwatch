import { Component, computed, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { UntilDestroy } from '@ngneat/until-destroy';
import { IonicModule } from '@ionic/angular';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { Voting } from 'swissparl';
import { MemberIdCardComponent } from '../../components/member-id-card/member-id-card.component';
import { InterestListComponent } from '../../components/interest-list/interest-list.component';
import { SpeechListComponent } from '../../../shared/components/speech-list/speech-list.component';
import { TextCardComponent } from '../../../shared/components/text-card/text-card.component';
import { LoadingScreenComponent } from '../../../shared/components/loading-screen/loading-screen.component';
import { ErrorScreenComponent } from '../../../shared/components/error-screen/error-screen.component';
import { CouncilMemberStore } from '../../store/council-member/council-member.store';
import { VotingRecordStore } from '../../store/voting-record/voting-record.store';
import { InterestStore } from '../../store/interest/interest.store';
import { SpeechStore } from '../../store/speech/speech.store';
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
import { MemberMembershipListComponent } from '../../components/member-membership-list/member-membership-list.component';
import { VotingRecordListComponent } from '../../components/voting-record-list/voting-record-list.component';

@UntilDestroy()
@Component({
  selector: 'app-member-detail',
  templateUrl: './member-detail.page.html',
  styleUrls: ['./member-detail.page.scss'],
  imports: [
    IonicModule,
    MemberIdCardComponent,
    InterestListComponent,
    SpeechListComponent,
    TextCardComponent,
    LoadingScreenComponent,
    ErrorScreenComponent,
    TranslocoDirective,
    ParliamentTitleComponent,
    RecordSourceFooterComponent,
    MemberMembershipListComponent,
    VotingRecordListComponent
  ],
  hostDirectives: [CantonalThemeDirective]
})
export class MemberDetailPage implements OnInit {
  readonly councilMemberStore = inject(CouncilMemberStore);
  readonly votingRecordStore = inject(VotingRecordStore);
  readonly interestStore = inject(InterestStore);
  readonly speechStore = inject(SpeechStore);
  private readonly transloco = inject(TranslocoService);
  readonly route = inject(ActivatedRoute);
  readonly router = inject(Router);

  readonly parliament: ParliamentKey = routeParliament(this.route);
  readonly isCantonal = isCantonal(this.parliament);

  readonly councilMemberViewModel = computed(() =>
    this.councilMemberStore.councilMemberDetailViewModel()
  );

  readonly cantonal = computed(
    () => this.councilMemberViewModel().councilMember?.cantonal ?? null
  );

  readonly votingRecordViewModel = computed(() =>
    this.votingRecordStore.votingRecordViewModel()
  );

  readonly interestViewModel = computed(() =>
    this.interestStore.interestViewModel()
  );

  /** Debates are recorded verbatim, so speeches carry their own language. */
  readonly uiLanguage = this.transloco.getActiveLang();

  ngOnInit() {
    const id = parseInt(this.route.snapshot.params.id);
    const parliament = this.parliament;
    this.councilMemberStore.selectCouncilMember({ parliament, id });
    this.votingRecordStore.loadVotingRecord({ parliament, id });
    this.interestStore.loadInterests({ parliament, id });
    this.speechStore.selectMember(parliament, id);
  }

  retry() {
    this.councilMemberStore.selectCouncilMember({
      parliament: this.parliament,
      id: parseInt(this.route.snapshot.params.id)
    });
  }

  onClickBusiness(voting: Voting) {
    if (this.isCantonal && voting.IdVote !== undefined) {
      this.router
        .navigate(detailPathInTab(this.router.url, 'votes', voting.IdVote))
        .catch(console.error);
      return;
    }

    if (voting.BusinessNumber === undefined) return;
    this.router
      .navigate(
        detailPathInTab(this.router.url, 'business', voting.BusinessNumber)
      )
      .catch(console.error);
  }

  /**
   * The member's political career, which the API ships as one `;`-separated
   * string. Distinct from the register of interests: this is past offices,
   * the register is current ties to organisations.
   * @returns An HTML list of past offices, or an empty string when none
   */
  getMandatesAsHtmlList() {
    const member = this.councilMemberViewModel().councilMember;
    if (!member?.Mandates) return '';

    return (
      '<ul>' +
      member.Mandates.split(';')
        .map((mandate) => `<li>${mandate}</li>`)
        .join('') +
      '</ul>'
    );
  }

  /**
   * The parliamentary groups the member chairs or co-chairs, shipped as one
   * `;`-separated string.
   * @returns An HTML list of parliamentary groups, or an empty string
   */
  getAdditionalActivitiesAsHtmlList() {
    const member = this.councilMemberViewModel().councilMember;
    if (!member) return '';

    let additionalActivities = '';
    if (member.AdditionalActivity) {
      additionalActivities =
        '<ul>' +
        member.AdditionalActivity.split(';')
          .map((activity) => `<li>${activity}</li>`)
          .join('') +
        '</ul>';
    }

    return additionalActivities;
  }
}
