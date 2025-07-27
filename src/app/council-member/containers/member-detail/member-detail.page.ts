import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { UntilDestroy } from '@ngneat/until-destroy';
import { IonicModule } from '@ionic/angular';
import { TranslocoDirective } from '@jsverse/transloco';
import { CouncilMemberCardComponent } from '../../components/council-member-card/council-member-card.component';
import { TextCardComponent } from '../../../shared/components/text-card/text-card.component';
import { LoadingScreenComponent } from '../../../shared/components/loading-screen/loading-screen.component';
import { ErrorScreenComponent } from '../../../shared/components/error-screen/error-screen.component';
import { CouncilMemberStore } from '../../council-member.store';

@UntilDestroy()
@Component({
  selector: 'app-member-detail',
  templateUrl: './member-detail.page.html',
  styleUrls: ['./member-detail.page.scss'],
  imports: [
    IonicModule,
    CouncilMemberCardComponent,
    TextCardComponent,
    LoadingScreenComponent,
    ErrorScreenComponent,
    TranslocoDirective
  ]
})
export class MemberDetailPage implements OnInit {
  readonly store = inject(CouncilMemberStore);
  readonly route = inject(ActivatedRoute);
  readonly router = inject(Router);

  ngOnInit() {
    const councilMemberId = parseInt(this.route.snapshot.params.id);
    this.store.selectCouncilMember(councilMemberId);
    this.store.loadVotingRecord(councilMemberId);
  }

  retry() {
    this.store.selectCouncilMember(parseInt(this.route.snapshot.params.id));
  }

  onClickBusiness(id: number) {
    this.router.navigate(['business', 'detail', id]).catch(console.error);
  }

  getMandatesAsHtmlList() {
    const member = this.store.selectedCouncilMember();
    let mandates = '';
    if (member.Mandates) {
      mandates =
        '<ul>' +
        member.Mandates.split(';')
          .map((mandate) => `<li>${mandate}</li>`)
          .join('') +
        '</ul>';
    }

    let additionalMandates = '';
    if (member.AdditionalMandate) {
      additionalMandates =
        '<ul>' +
        member.AdditionalMandate.split(';')
          .map((mandate) => `<li>${mandate}</li>`)
          .join('') +
        '</ul>';
    }

    return mandates + additionalMandates;
  }

  getAdditionalActivitiesAsHtmlList() {
    const member = this.store.selectedCouncilMember();
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
