import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
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
import { RecentVoteStore } from '../../store/recent/recent.store';
import { filterRecent } from '../../../shared/store/recent/recent.store';

/** How many recent searches / votes the suggestion panel lists. */
const MAX_VISIBLE_RECENTS = 3;

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
  readonly recentStore = inject(RecentVoteStore);
  readonly router = inject(Router);

  readonly viewModel = computed(() => this.store.votesListViewModel());

  readonly showSuggestedSearches = signal(false);

  /** Lowercased current query, used to narrow the suggestion panel. */
  private readonly suggestionFilter = computed(() =>
    (this.store.query().searchTerm ?? '').trim().toLowerCase()
  );

  readonly visibleRecentSearches = computed(() =>
    filterRecent(
      this.recentStore.searches(),
      (term) => term,
      this.suggestionFilter()
    ).slice(0, MAX_VISIBLE_RECENTS)
  );

  readonly visibleRecentVotes = computed(() =>
    filterRecent(
      this.recentStore.entries(),
      (entry) => entry.title,
      this.suggestionFilter()
    ).slice(0, MAX_VISIBLE_RECENTS)
  );

  /** Keeps the panel from covering the results with an empty overlay. */
  readonly hasSuggestions = computed(
    () =>
      this.visibleRecentSearches().length > 0 ||
      this.visibleRecentVotes().length > 0
  );

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

  onSearchFocus() {
    this.showSuggestedSearches.set(true);
  }

  closeSuggestions() {
    this.recentStore.recordSearch(this.searchBar().value ?? '');
    this.showSuggestedSearches.set(false);
  }

  onRecentSearchClick(searchTerm: string) {
    this.searchBar().value = searchTerm;
    this.commitSearchTerm(searchTerm);
    this.closeSuggestions();
  }

  onRecentVoteClick(id: number) {
    this.closeSuggestions();
    this.onClickVote(id);
  }

  onSearch(event: any) {
    this.commitSearchTerm(event.target.value ?? '');
  }

  private commitSearchTerm(searchTerm: string) {
    if (searchTerm === this.store.query().searchTerm) return;
    this.store.updateQuery({ ...this.store.query(), searchTerm });
  }

  /**
   * Commit the current term straight away and drop focus, which dismisses the
   * keyboard and closes the suggestions.
   */
  async onSearchEnter() {
    this.commitSearchTerm(this.searchBar().value ?? '');
    this.closeSuggestions();
    const input = await this.searchBar().getInputElement();
    input.blur();
  }

  resetFilter() {
    this.searchBar().value = '';
    this.showSuggestedSearches.set(false);
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
