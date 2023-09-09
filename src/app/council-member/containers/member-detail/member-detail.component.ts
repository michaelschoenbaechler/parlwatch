import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MemberCouncil } from 'swissparl';
import { CouncilMemberService } from '../../services/council-member.service';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { catchError, first, switchMap, tap } from 'rxjs/operators';
import { Subject, from, of } from 'rxjs';

@UntilDestroy()
@Component({
  selector: 'app-member-detail',
  templateUrl: './member-detail.component.html',
  styleUrls: ['./member-detail.component.scss']
})
export class MemberDetailComponent implements OnInit {
  councilMember: MemberCouncil = null;
  councilMemberVotings = [];
  noVotes = false;
  loading = true;
  error = false;

  trigger$ = new Subject<void>();

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private memberService: CouncilMemberService
  ) {}

  ngOnInit() {
    from(this.trigger$)
      .pipe(
        untilDestroyed(this),
        tap(() => (this.loading = true)),
        switchMap(() =>
          this.memberService
            .getMemberById(parseInt(this.route.snapshot.params.id))
            .pipe(
              first(),
              catchError(() => {
                this.error = true;
                this.loading = false;
                return of(null);
              })
            )
        )
      )
      .subscribe((councilMember) => {
        if (councilMember === null) {
          return;
        }
        this.councilMember = councilMember;
        this.loading = false;
      });

    from(this.trigger$)
      .pipe(
        untilDestroyed(this),
        tap(() => (this.loading = true)),
        switchMap(() =>
          this.memberService
            .getVotes(parseInt(this.route.snapshot.params.id))
            .pipe(
              first(),
              catchError(() => {
                this.error = true;
                this.loading = false;
                return of(null);
              })
            )
        )
      )
      .subscribe((votings) => {
        if (votings === null) {
          return;
        }
        this.noVotes = votings.length === 0;
        this.councilMemberVotings = votings;
      });
  }

  ionViewDidEnter() {
    if (this.councilMember === null) {
      this.trigger$.next();
    }
  }

  onClickBusiness(id: number) {
    this.router.navigate(['business', 'detail', id]);
  }

  getMandatesAsHtmlList() {
    let mandates = '';
    if (this.councilMember.Mandates) {
      mandates =
        '<ul>' +
        this.councilMember.Mandates.split(';')
          .map((mandate) => `<li>${mandate}</li>`)
          .join('') +
        '</ul>';
    }

    let additionalMandates = '';
    if (this.councilMember.AdditionalMandate) {
      additionalMandates =
        '<ul>' +
        this.councilMember.AdditionalMandate.split(';')
          .map((mandate) => `<li>${mandate}</li>`)
          .join('') +
        '</ul>';
    }

    return mandates + additionalMandates;
  }

  getAdditionalActivitiesAsHtmlList() {
    let additionalActivities = '';
    if (this.councilMember.AdditionalActivity) {
      additionalActivities =
        '<ul>' +
        this.councilMember.AdditionalActivity.split(';')
          .map((activity) => `<li>${activity}</li>`)
          .join('') +
        '</ul>';
    }

    return additionalActivities;
  }

  retrySearch() {
    this.trigger$.next();
  }
}
