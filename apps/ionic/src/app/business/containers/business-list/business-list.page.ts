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
import { Router } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import {
  InfiniteScrollCustomEvent,
  IonicModule,
  IonSearchbar,
  RefresherCustomEvent
} from '@ionic/angular';
import { TranslocoDirective } from '@jsverse/transloco';
import { BusinessCardComponent } from '../../components/business-card/business-card.component';
import { LoadingScreenComponent } from '../../../shared/components/loading-screen/loading-screen.component';
import { ErrorScreenComponent } from '../../../shared/components/error-screen/error-screen.component';
import { NoContentScreenComponent } from '../../../shared/components/no-content-screen/no-content-screen.component';
import { HideKeyboardOnEnterDirective } from '../../../shared/directives/hide-keyboard-on-enter.directive';
import { BusinessFilterFormComponent } from '../../components/business-filter-form/business-filter-form.component';
import { BusinessStore } from '../../store/business/business.store';
import { BusinessTypesStore } from '../../store/business-types/business-types.store';
import { SessionStore } from '../../store/session/session.store';
import { TagStore } from '../../store/tag/tag.store';
import { RecentStore } from '../../store/recent/recent.store';

/** How many recent searches / businesses the suggestion panel lists. */
const MAX_VISIBLE_RECENTS = 3;

@Component({
  selector: 'app-business-list',
  templateUrl: './business-list.page.html',
  styleUrls: ['./business-list.page.scss'],
  imports: [
    IonicModule,
    ReactiveFormsModule,
    BusinessCardComponent,
    LoadingScreenComponent,
    ErrorScreenComponent,
    NoContentScreenComponent,
    HideKeyboardOnEnterDirective,
    BusinessFilterFormComponent,
    TranslocoDirective
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BusinessListPage implements OnInit {
  readonly searchBar = viewChild<IonSearchbar>('searchBar');

  readonly businessStore = inject(BusinessStore);
  readonly businessTypesStore = inject(BusinessTypesStore);
  readonly sessionStore = inject(SessionStore);
  readonly tagStore = inject(TagStore);
  readonly recentStore = inject(RecentStore);
  readonly router = inject(Router);

  readonly viewModel = computed(() =>
    this.businessStore.businessListViewModel()
  );
  readonly hasFilterError = computed(
    () => this.businessTypesStore.businessTypesViewModel().hasError
  );

  /** Name of the session the list is currently scoped to, if any. */
  readonly activeSessionName = computed(() => {
    const sessionId = this.businessStore.query().sessionId;
    return (
      this.sessionStore
        .sessionsViewModel()
        .sessions.find((session) => session.ID === sessionId)?.SessionName ?? ''
    );
  });

  isModalOpen = false;
  presentingElement = null;

  readonly showSuggestedSearches = signal(false);

  /** Lowercased current query, used to narrow the suggestion panel. */
  private readonly suggestionFilter = computed(() =>
    (this.businessStore.query().searchTerm ?? '').trim().toLowerCase()
  );

  /**
   * History is capped at the few newest entries, but filtering runs over the
   * whole stored history, so typing can surface entries that have already
   * dropped out of the top three.
   */
  readonly visibleRecentSearches = computed(() =>
    this.matchQuery(this.recentStore.searches(), (term) => term).slice(
      0,
      MAX_VISIBLE_RECENTS
    )
  );

  readonly visibleRecentBusinesses = computed(() =>
    this.matchQuery(
      this.recentStore.businesses(),
      (entry) => entry.title
    ).slice(0, MAX_VISIBLE_RECENTS)
  );

  /** All topics on an empty query, only the matching ones while typing. */
  readonly visibleTags = computed(() =>
    this.matchQuery(
      this.tagStore.tagsViewModel().tags,
      (tag) => tag.TagName ?? ''
    )
  );

  /** Keeps the panel from covering the results with an empty overlay. */
  readonly hasSuggestions = computed(
    () =>
      this.visibleTags().length > 0 ||
      this.visibleRecentSearches().length > 0 ||
      this.visibleRecentBusinesses().length > 0
  );

  /**
   * Narrow a list to the entries matching the current query, or return it
   * untouched when there is no query.
   * @param entries Entries to narrow
   * @param toText Reads the text an entry is matched on
   * @returns The matching entries
   */
  private matchQuery<T>(entries: T[], toText: (entry: T) => string): T[] {
    const filter = this.suggestionFilter();
    if (!filter) return entries;
    return entries.filter((entry) =>
      toText(entry).toLowerCase().includes(filter)
    );
  }

  /** Tags the list is currently filtered by, for the active-filter chips. */
  readonly activeTags = computed(() => {
    const selected = this.businessStore.query().tagIds;
    return this.tagStore
      .tagsViewModel()
      .tags.filter((tag) => selected.includes(tag.ID));
  });

  refreshOrLoadMoreEvent: InfiniteScrollCustomEvent | RefresherCustomEvent;

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
    this.presentingElement = document.querySelector('ion-router-outlet');
  }

  onSearchFocus() {
    this.showSuggestedSearches.set(true);
  }

  closeSuggestions() {
    this.recentStore.recordSearch(this.searchBar().value ?? '');
    this.showSuggestedSearches.set(false);
  }

  toggleFilterModal() {
    this.isModalOpen = !this.isModalOpen;
  }

  onSearch(event: any) {
    this.commitSearchTerm(event.target.value ?? '');
  }

  private commitSearchTerm(searchTerm: string) {
    if (searchTerm === this.businessStore.query().searchTerm) return;
    this.businessStore.updateQuery({
      ...this.businessStore.query(),
      searchTerm
    });
  }

  /**
   * Picking a topic applies it and dismisses the panel so the results are
   * visible right away. Combining several topics is done in the filter modal.
   * @param tagId Tag to toggle
   */
  onSuggestionTagClick(tagId: number) {
    this.toggleTag(tagId);
    this.closeSuggestions();
  }

  onRecentSearchClick(searchTerm: string) {
    this.searchBar().value = searchTerm;
    this.commitSearchTerm(searchTerm);
    this.closeSuggestions();
  }

  onRecentBusinessClick(id: number) {
    this.closeSuggestions();
    this.onClickBusiness(id);
  }

  toggleTag(tagId: number) {
    const query = this.businessStore.query();
    const tagIds = query.tagIds.includes(tagId)
      ? query.tagIds.filter((id) => id !== tagId)
      : [...query.tagIds, tagId];
    this.businessStore.updateQuery({ ...query, tagIds });
  }

  isTagSelected(tagId: number): boolean {
    return this.businessStore.query().tagIds.includes(tagId);
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

  retrySearch() {
    this.businessStore.reloadBusinesses(this.businessStore.query());
  }

  resetFilter() {
    this.searchBar().value = '';
    this.showSuggestedSearches.set(false);
    this.businessStore.resetQuery();
  }

  distanceReached(event: InfiniteScrollCustomEvent) {
    this.refreshOrLoadMoreEvent = event;
    this.businessStore.loadMore();
  }

  handleRefresh(event: RefresherCustomEvent) {
    this.refreshOrLoadMoreEvent = event;
    this.businessStore.refresh();
  }

  onClickBusiness(id: number) {
    this.router.navigate(['/layout/business/detail', id]);
  }
}
