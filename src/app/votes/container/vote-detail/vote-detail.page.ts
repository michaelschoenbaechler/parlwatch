import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Vote } from 'swissparl';
import { VoteService } from '../../services/votes.service';
import { catchError, first, switchMap, tap } from 'rxjs/operators';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { FormControl } from '@angular/forms';
import { Subject, from, of } from 'rxjs';

@UntilDestroy()
@Component({
  selector: 'app-vote-detail',
  templateUrl: './vote-detail.page.html',
  styleUrls: ['./vote-detail.page.scss']
})
export class VoteDetailPage implements OnInit {
  vote: Vote = null;
  loading = true;
  error = false;
  votingsFiltered = [];

  trigger$ = new Subject<void>();
  voteFilterControl = new FormControl('all');

  partyMappingDE = {
    'Sozialdemokratische Fraktion': 'SP',
    'Grüne Fraktion': 'Grüne',
    'Fraktion der Schweizerischen Volkspartei': 'SVP',
    'FDP-Liberale Fraktion': 'FDP',
    'Grünliberale Fraktion': 'GLP',
    'Die Mitte-Fraktion. Die Mitte. EVP.': 'Die Mitte'
  };

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private voteService: VoteService
  ) {}

  ngOnInit() {
    from(this.trigger$)
      .pipe(
        untilDestroyed(this),
        tap(() => (this.loading = true)),
        switchMap(() =>
          this.voteService
            .getVote(parseInt(this.route.snapshot.params.id))
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
      .subscribe((vote) => {
        if (vote === null) {
          return;
        }
        this.vote = vote;
        this.votingsFiltered = vote.Votings;
        this.loading = false;
      });

    this.voteFilterControl.valueChanges
      .pipe(untilDestroyed(this))
      .subscribe((value) => {
        if (value === 'all') {
          this.votingsFiltered = this.vote.Votings;
        } else {
          this.votingsFiltered = this.vote.Votings.filter((voting) => {
            return {
              yes: () => voting.Decision === 1,
              no: () => voting.Decision === 2,
              'no-vote': () => voting.Decision !== 1 && voting.Decision !== 2
            }[value]();
          });
        }
      });
  }

  ionViewDidEnter() {
    if (this.vote === null) {
      this.trigger$.next();
    }
  }

  retrySearch() {
    this.trigger$.next();
  }

  onClickPerson(id: number) {
    this.router.navigate(['council-member', 'detail', id]);
  }

  goToBusiness() {
    this.router.navigate(['business', 'detail', this.vote.BusinessNumber]);
  }
}
