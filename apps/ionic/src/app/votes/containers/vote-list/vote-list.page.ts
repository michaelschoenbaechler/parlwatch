import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  viewChild
} from '@angular/core';
import { Router } from '@angular/router';
import {
  InfiniteScrollCustomEvent,
  IonicModule,
  IonSearchbar,
  RefresherCustomEvent
} from '@ionic/angular';
import { TranslocoDirective } from '@jsverse/transloco';
import { HideKeyboardOnEnterDirective } from '../../../shared/directives/hide-keyboard-on-enter.directive';
import { VoteGroupCardComponent } from '../../components/vote-group-card/vote-group-card.component';
import { LoadingScreenComponent } from '../../../shared/components/loading-screen/loading-screen.component';
import { ErrorScreenComponent } from '../../../shared/components/error-screen/error-screen.component';
import { NoContentScreenComponent } from '../../../shared/components/no-content-screen/no-content-screen.component';
import { VoteStore } from '../../store/vote';

@Component({
  selector: 'app-vote-list',
  templateUrl: './vote-list.page.html',
  styleUrls: ['./vote-list.page.scss'],
  imports: [
    IonicModule,
    VoteGroupCardComponent,
    HideKeyboardOnEnterDirective,
    LoadingScreenComponent,
    ErrorScreenComponent,
    NoContentScreenComponent,
    TranslocoDirective
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class VoteListPage {
  readonly searchBar = viewChild.required<IonSearchbar>('searchBar');

  readonly store = inject(VoteStore);
  readonly router = inject(Router);

  readonly viewModel = computed(() => this.store.votesListViewModel());

  refreshOrLoadMoreEvent?: InfiniteScrollCustomEvent | RefresherCustomEvent;

  constructor() {
    effect(() => {
      if (!this.viewModel().isLoadingMore && !this.viewModel().isRefreshing) {
        this.refreshOrLoadMoreEvent?.target?.complete().catch(() => {
          console.error('Error completing refresh or load more event');
        });
      }
    });
  }

  retrySearch() {
    this.store.reloadVotes(this.store.query());
  }

  onSearch(event: any) {
    this.commitSearchTerm(event.target.value ?? '');
  }

  private commitSearchTerm(searchTerm: string) {
    if (searchTerm === this.store.query().searchTerm) return;
    this.store.updateQuery({ ...this.store.query(), searchTerm });
  }

  /** Commit straight away and drop focus, which dismisses the keyboard. */
  async onSearchEnter() {
    this.commitSearchTerm(this.searchBar().value ?? '');
    const input = await this.searchBar().getInputElement();
    input.blur();
  }

  resetFilter() {
    this.store.resetQuery();
  }

  distanceReached(event: InfiniteScrollCustomEvent) {
    this.refreshOrLoadMoreEvent = event;
    this.store.loadMore();
  }

  handleRefresh(event: RefresherCustomEvent) {
    this.refreshOrLoadMoreEvent = event;
    this.store.refresh();
  }

  onClickVote(id: number) {
    this.router.navigate(['/layout/votes/detail', id]);
  }
}
