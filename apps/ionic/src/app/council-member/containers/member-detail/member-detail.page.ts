import { Component, computed, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { UntilDestroy } from '@ngneat/until-destroy';
import { IonicModule } from '@ionic/angular';
import { TranslocoDirective } from '@jsverse/transloco';
import { Voting } from 'swissparl';
import { MemberIdCardComponent } from '../../components/member-id-card/member-id-card.component';
import { InterestListComponent } from '../../components/interest-list/interest-list.component';
import { TextCardComponent } from '../../../shared/components/text-card/text-card.component';
import { LoadingScreenComponent } from '../../../shared/components/loading-screen/loading-screen.component';
import { ErrorScreenComponent } from '../../../shared/components/error-screen/error-screen.component';
import { CouncilMemberStore } from '../../store/council-member/council-member.store';
import { VotingRecordStore } from '../../store/voting-record/voting-record.store';
import { InterestStore } from '../../store/interest/interest.store';

@UntilDestroy()
@Component({
  selector: 'app-member-detail',
  templateUrl: './member-detail.page.html',
  styleUrls: ['./member-detail.page.scss'],
  imports: [
    IonicModule,
    MemberIdCardComponent,
    InterestListComponent,
    TextCardComponent,
    LoadingScreenComponent,
    ErrorScreenComponent,
    TranslocoDirective
  ]
})
export class MemberDetailPage implements OnInit {
  readonly councilMemberStore = inject(CouncilMemberStore);
  readonly votingRecordStore = inject(VotingRecordStore);
  readonly interestStore = inject(InterestStore);
  readonly route = inject(ActivatedRoute);
  readonly router = inject(Router);

  readonly councilMemberViewModel = computed(() =>
    this.councilMemberStore.councilMemberDetailViewModel()
  );

  readonly votingRecordViewModel = computed(() =>
    this.votingRecordStore.votingRecordViewModel()
  );

  readonly interestViewModel = computed(() =>
    this.interestStore.interestViewModel()
  );

  ngOnInit() {
    const councilMemberId = parseInt(this.route.snapshot.params.id);
    this.councilMemberStore.selectCouncilMember(councilMemberId);
    this.votingRecordStore.loadVotingRecord(councilMemberId);
    this.interestStore.loadInterests(councilMemberId);
  }

  retry() {
    this.councilMemberStore.selectCouncilMember(
      parseInt(this.route.snapshot.params.id)
    );
  }

  onClickBusiness(voting: Voting) {
    if (voting.BusinessNumber === undefined) return;
    this.router
      .navigate([
        '/layout/council-member/business/detail',
        voting.BusinessNumber
      ])
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
