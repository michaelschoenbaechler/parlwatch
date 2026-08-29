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

  /** Topic tags offered as a shortcut into the same filter the modal exposes. */
  readonly suggestedTags = computed(() => this.tagStore.tagsViewModel().tags);

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

  onSearchBlur() {
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
