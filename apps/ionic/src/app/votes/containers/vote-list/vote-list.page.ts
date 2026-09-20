import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  OnInit,
  signal,
  viewChild
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  InfiniteScrollCustomEvent,
  IonicModule,
  IonSearchbar,
  RefresherCustomEvent
} from '@ionic/angular';
import { TranslocoDirective } from '@jsverse/transloco';
import { HideKeyboardOnEnterDirective } from '@parlwatch/shared/common/directives';
import {
  ErrorScreenComponent,
  InlineNoticeComponent,
  LoadingScreenComponent,
  NoContentScreenComponent
} from '@parlwatch/shared/common/components';
import { filterRecent, RecentEntry } from '@parlwatch/shared/common/store';
import {
  cantonOf,
  detailPath,
  isCantonal,
  ParliamentKey,
  routeParliament
} from '@parlwatch/shared/parliament/models';
import { CantonalThemeDirective } from '@parlwatch/shared/parliament/directives';
import {
  CantonHintCardComponent,
  ParliamentSwitcherComponent,
  ParliamentTitleComponent
} from '@parlwatch/shared/parliament/components';
import { RecentVoteStore } from '../../store/recent/recent.store';
import { VoteStore } from '../../store/vote';
import { VoteGroupCardComponent } from '../../components/vote-group-card/vote-group-card.component';

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
    TranslocoDirective,
    InlineNoticeComponent,
    ParliamentSwitcherComponent,
    ParliamentTitleComponent,
    CantonHintCardComponent
  ],
  hostDirectives: [CantonalThemeDirective],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class VoteListPage implements OnInit {
  readonly searchBar = viewChild.required<IonSearchbar>('searchBar');

  readonly store = inject(VoteStore);
  readonly recentStore = inject(RecentVoteStore);
  readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly parliament: ParliamentKey = routeParliament(this.route);

  readonly canton = isCantonal(this.parliament)
    ? cantonOf(this.parliament)
    : null;

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

  ngOnInit() {
    this.store.setParliament(this.parliament);
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

  onRecentVoteClick(entry: RecentEntry) {
    this.closeSuggestions();
    this.router
      .navigate(detailPath('votes', entry.parliament ?? 'ch', entry.id))
      .catch(console.error);
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
    this.router
      .navigate(detailPath('votes', this.parliament, id))
      .catch(console.error);
  }
}
