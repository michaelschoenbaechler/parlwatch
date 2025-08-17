import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  OnInit,
  viewChild
} from '@angular/core';
import { Router } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import {
  InfiniteScrollCustomEvent,
  IonicModule,
  IonSearchbar,
  Platform,
  RefresherCustomEvent
} from '@ionic/angular';
import { Keyboard } from '@capacitor/keyboard';
import { TranslocoDirective } from '@jsverse/transloco';
import { BusinessCardComponent } from '../../components/business-card/business-card.component';
import { LoadingScreenComponent } from '../../../shared/components/loading-screen/loading-screen.component';
import { ErrorScreenComponent } from '../../../shared/components/error-screen/error-screen.component';
import { NoContentScreenComponent } from '../../../shared/components/no-content-screen/no-content-screen.component';
import { HideKeyboardOnEnterDirective } from '../../../shared/directives/hide-keyboard-on-enter.directive';
import { BusinessFilterFormComponent } from '../../components/business-filter-form/business-filter-form.component';
import { BusinessStore } from '../../store/business/business.store';
import { BusinessTypesStore } from '../../store/business-types/business-types.store';
import { BusinessStatusesStore } from '../../store/business-status/business-statuses.store';
import { SearchSuggestions } from './search-suggestions';

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
  readonly businessStatusesStore = inject(BusinessStatusesStore);
  readonly router = inject(Router);
  readonly platform = inject(Platform);

  readonly viewModel = computed(() =>
    this.businessStore.businessListViewModel()
  );
  readonly hasFilterError = computed(
    () =>
      this.businessTypesStore.businessTypesViewModel().hasError ||
      this.businessStatusesStore.businessStatusesViewModel().hasError
  );

  isModalOpen = false;
  presentingElement = null;

  showSuggestedSearches: boolean = false;
  suggestedSearchTerms = SearchSuggestions;

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
    this.addKeyBoardListener();
    this.presentingElement = document.querySelector('ion-router-outlet');
  }

  private addKeyBoardListener() {
    if (!this.platform.is('capacitor')) return;
    Keyboard.addListener('keyboardWillHide', () => {
      this.showSuggestedSearches = false;
    });
    Keyboard.addListener('keyboardWillShow', () => {
      this.showSuggestedSearches = true;
    });
  }

  toggleFilterModal() {
    this.isModalOpen = !this.isModalOpen;
  }

  onSearch(event: any) {
    this.showSuggestedSearches = false;
    this.businessStore.updateQuery({
      ...this.businessStore.query(),
      searchTerm: event.target.value
    });
  }

  onSuggestedSearchTopic(searchTerm: string) {
    this.showSuggestedSearches = false;
    this.searchBar().value = searchTerm;
    this.businessStore.updateQuery({
      ...this.businessStore.query(),
      searchTerm
    });
  }

  retrySearch() {
    this.businessStore.reloadBusinesses(this.businessStore.query());
  }

  resetFilter() {
    this.searchBar().value = '';
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
    this.router.navigate(['business', 'detail', id]);
  }
}
