import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, first, tap, switchMap } from 'rxjs/operators';
import { Vote } from 'swissparl';
import { VoteService } from '../../services/votes.service';
import { BehaviorSubject, Subject, combineLatest, of } from 'rxjs';
import { IonSearchbar } from '@ionic/angular';

@Component({
  selector: 'app-vote-list',
  templateUrl: './vote-list.page.html',
  styleUrls: ['./vote-list.page.scss']
})
export class VoteListComponent implements OnInit {
  top = 10;
  skip = 0;
  votes: Vote[] = [];
  loading = true;
  error = false;
  noContent = false;

  searchTerm$ = new BehaviorSubject<string>('');
  trigger$ = new Subject<void>();

  @ViewChild('searchBar', { static: false }) searchBar: IonSearchbar;

  constructor(
    private voteService: VoteService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    combineLatest([this.searchTerm$, this.trigger$])
      .pipe(
        tap(() => {
          this.skip = 0;
          this.error = false;
          this.loading = true;
        }),
        switchMap(([searchTerm]) =>
          this.voteService
            .getVotes({
              top: this.top,
              skip: this.skip,
              searchTerm
            })
            .pipe(
              catchError(() => {
                this.error = true;
                this.loading = false;
                return of(null);
              })
            )
        )
      )
      .subscribe((votes) => {
        if (votes === null) {
          return;
        }
        this.votes = votes;
        this.noContent = votes.length === 0;
        this.loading = false;
      });
  }

  ionViewDidEnter() {
    // trigger search again if we are coming back from another page and no items have been loaded yet
    if (this.votes.length === 0) {
      this.trigger$.next();
    }

    const businessShortNumber =
      +this.route.snapshot.queryParams['BusinessShortNumber'];
    if (businessShortNumber) {
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { BusinessShortNumber: null },
        queryParamsHandling: 'merge'
      });
      this.searchBar.value = businessShortNumber.toString();
      this.searchTerm$.next(businessShortNumber.toString());
    }
  }

  retrySearch() {
    this.trigger$.next();
  }

  onSearch(event: any) {
    this.searchTerm$.next(event.target.value);
  }

  resetFilter() {
    this.searchTerm$.next('');
    this.searchBar.value = '';
  }

  distanceReached(event: any) {
    this.skip += this.top;
    this.fetchVotes().subscribe((newVotes) => {
      if (newVotes === null) {
        return;
      }
      this.votes = [...this.votes, ...newVotes];
      event.target.complete();
    });
  }

  handleRefresh(event) {
    this.skip = 0;
    this.fetchVotes().subscribe((votes) => {
      if (votes === null) {
        return;
      }
      this.votes = votes;
      event.target.complete();
    });
  }

  fetchVotes() {
    return this.voteService
      .getVotes({
        top: this.top,
        skip: this.skip,
        searchTerm: this.searchTerm$.getValue()
      })
      .pipe(
        first(),
        catchError(() => {
          this.error = true;
          return of(null);
        })
      );
  }

  onClickVote(id: number) {
    this.router.navigate(['votes', 'detail', id]);
  }

  getSubtitle(vote: Vote) {
    if (vote.Subject) {
      return `${vote.SessionName} - ${vote.Subject}`;
    }
    return vote.SessionName;
  }
}
