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
import { ReactiveFormsModule } from '@angular/forms';
import {
  InfiniteScrollCustomEvent,
  IonicModule,
  IonSearchbar,
  RefresherCustomEvent
} from '@ionic/angular';
import { TranslocoDirective } from '@jsverse/transloco';
import { Business, Tags } from 'swissparl';
import { LoadingScreenComponent } from '@parlwatch/shared/common/components/loading-screen/loading-screen.component';
import { ErrorScreenComponent } from '@parlwatch/shared/common/components/error-screen/error-screen.component';
import { NoContentScreenComponent } from '@parlwatch/shared/common/components/no-content-screen/no-content-screen.component';
import { HideKeyboardOnEnterDirective } from '@parlwatch/shared/common/directives/hide-keyboard-on-enter.directive';
import {
  filterRecent,
  RecentEntry
} from '@parlwatch/shared/common/store/recent/recent.store';
import {
  isCantonal,
  ParliamentKey
} from '@parlwatch/shared/parliament/models/parliament.model';
import {
  detailPath,
  routeParliament
} from '@parlwatch/shared/parliament/models/parliament-routes';
import { CantonalThemeDirective } from '@parlwatch/shared/parliament/directives/cantonal-theme.directive';
import { ParliamentSwitcherComponent } from '@parlwatch/shared/parliament/components/parliament-switcher/parliament-switcher.component';
import { ParliamentTitleComponent } from '@parlwatch/shared/parliament/components/parliament-title/parliament-title.component';
import { CantonHintCardComponent } from '@parlwatch/shared/parliament/components/canton-hint-card/canton-hint-card.component';
import { RecentBusinessStore } from '../../store/recent/recent.store';
import { TagStore } from '../../store/tag/tag.store';
import { SessionStore } from '../../store/session/session.store';
import { BusinessTypesStore } from '../../store/business-types/business-types.store';
import { BusinessStore } from '../../store/business/business.store';
import { BusinessFilterFormComponent } from '../../components/business-filter-form/business-filter-form.component';
import { BusinessCardComponent } from '../../components/business-card/business-card.component';

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
    TranslocoDirective,
    ParliamentSwitcherComponent,
    ParliamentTitleComponent,
    CantonHintCardComponent
  ],
  hostDirectives: [CantonalThemeDirective],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BusinessListPage implements OnInit {
  readonly searchBar = viewChild.required<IonSearchbar>('searchBar');

  readonly businessStore = inject(BusinessStore);
  readonly businessTypesStore = inject(BusinessTypesStore);
  readonly sessionStore = inject(SessionStore);
  readonly tagStore = inject(TagStore);
  readonly recentStore = inject(RecentBusinessStore);
  readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly parliament: ParliamentKey = routeParliament(this.route);
  readonly isCantonal = isCantonal(this.parliament);

  readonly viewModel = computed(() =>
    this.businessStore.businessListViewModel()
  );
  readonly hasFilterError = computed(
    () => this.businessTypesStore.businessTypesViewModel().hasError
  );

  /** Name of the session the list is currently scoped to, if any. */
  readonly activeSessionName = computed(() => {
    if (this.isCantonal) return '';
    const sessionId = this.businessStore.query().sessionId;
    return (
      this.sessionStore
        .sessionsViewModel()
        .sessions.find((session) => session.ID === sessionId)?.SessionName ?? ''
    );
  });

  isModalOpen = false;
  presentingElement: HTMLElement | null = null;

  readonly showSuggestedSearches = signal(false);

  /** Lowercased current query, used to narrow the suggestion panel. */
  private readonly suggestionFilter = computed(() =>
    (this.businessStore.query().searchTerm ?? '').trim().toLowerCase()
  );

  readonly visibleRecentSearches = computed(() =>
    filterRecent(
      this.recentStore.searches(),
      (term) => term,
      this.suggestionFilter()
    ).slice(0, MAX_VISIBLE_RECENTS)
  );

  readonly visibleRecentBusinesses = computed(() =>
    filterRecent(
      this.recentStore.entries(),
      (entry) => entry.title,
      this.suggestionFilter()
    ).slice(0, MAX_VISIBLE_RECENTS)
  );

  /** All topics on an empty query, only the matching ones while typing. */
  readonly visibleTags = computed(() =>
    filterRecent(
      this.tagStore.tagsViewModel().tags,
      (tag) => tag.TagName ?? '',
      this.suggestionFilter()
    )
  );

  /** Keeps the panel from covering the results with an empty overlay. */
  readonly hasSuggestions = computed(
    () =>
      this.visibleTags().length > 0 ||
      this.visibleRecentSearches().length > 0 ||
      this.visibleRecentBusinesses().length > 0
  );

  /** Tags the list is currently filtered by, for the active-filter chips. */
  readonly activeTags = computed(() => {
    const selected = this.businessStore.query().tagIds ?? [];
    return this.tagStore
      .tagsViewModel()
      .tags.filter((tag) => tag.ID !== undefined && selected.includes(tag.ID));
  });

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
    this.presentingElement = document.querySelector('ion-router-outlet');
    this.businessStore.setParliament(this.parliament);
    this.businessTypesStore.setParliament(this.parliament);
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
   * @param tag Tag to toggle
   */
  onSuggestionTagClick(tag: Tags) {
    if (tag.ID === undefined) return;
    this.toggleTag(tag.ID);
    this.closeSuggestions();
  }

  /**
   * Toggle a topic from the active-filter chips.
   * @param tag Tag whose chip was tapped
   */
  onActiveTagClick(tag: Tags) {
    if (tag.ID === undefined) return;
    this.toggleTag(tag.ID);
  }

  onRecentSearchClick(searchTerm: string) {
    this.searchBar().value = searchTerm;
    this.commitSearchTerm(searchTerm);
    this.closeSuggestions();
  }

  onRecentBusinessClick(entry: RecentEntry) {
    this.closeSuggestions();
    this.router
      .navigate(detailPath('business', entry.parliament ?? 'ch', entry.id))
      .catch(console.error);
  }

  toggleTag(tagId: number) {
    const query = this.businessStore.query();
    const selected = query.tagIds ?? [];
    const tagIds = selected.includes(tagId)
      ? selected.filter((id) => id !== tagId)
      : [...selected, tagId];
    this.businessStore.updateQuery({ ...query, tagIds });
  }

  isTagSelected(tagId: number | undefined): boolean {
    return (
      tagId !== undefined &&
      (this.businessStore.query().tagIds ?? []).includes(tagId)
    );
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
    this.router
      .navigate(detailPath('business', this.parliament, id))
      .catch(console.error);
  }

  /**
   * Open a business from its list card.
   * @param business The business the tapped card renders
   */
  onBusinessCardClick(business: Business) {
    if (business.ID === undefined) return;
    this.onClickBusiness(business.ID);
  }
}
