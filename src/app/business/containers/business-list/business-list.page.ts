import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  OnInit,
  ViewChild
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
import { NgFor, NgIf } from '@angular/common';
import { BusinessCardComponent } from '../../components/business-card/business-card.component';
import { LoadingScreenComponent } from '../../../shared/components/loading-screen/loading-screen.component';
import { ErrorScreenComponent } from '../../../shared/components/error-screen/error-screen.component';
import { NoContentScreenComponent } from '../../../shared/components/no-content-screen/no-content-screen.component';
import { BusinessStore } from '../../business.store';
import { SearchSuggestions } from './search-suggestions';
import { HideKeyboardOnEnterDirective } from '../../../shared/directives/hide-keyboard-on-enter.directive';
import { BusinessFilterFormComponent } from '../../components/business-filter-form/business-filter-form.component';

@Component({
  selector: 'app-business-list',
  templateUrl: './business-list.page.html',
  styleUrls: ['./business-list.page.scss'],
  standalone: true,
  imports: [
    NgIf,
    NgFor,
    IonicModule,
    ReactiveFormsModule,
    BusinessCardComponent,
    LoadingScreenComponent,
    ErrorScreenComponent,
    NoContentScreenComponent,
    HideKeyboardOnEnterDirective,
    BusinessFilterFormComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BusinessListPage implements OnInit {
  @ViewChild('searchBar', { static: false }) searchBar: IonSearchbar;

  readonly store = inject(BusinessStore);
  readonly router = inject(Router);
  readonly platform = inject(Platform);

  isModalOpen = false;
  presentingElement = null;

  showSuggestedSearches: boolean = false;
  suggestedSearchTerms = SearchSuggestions;

  refreshOrLoadMoreEvent: InfiniteScrollCustomEvent | RefresherCustomEvent;

  constructor() {
    effect(() => {
      if (!this.store.isLoadingMore() && !this.store.isRefreshing()) {
        this.refreshOrLoadMoreEvent?.target?.complete().catch(() => {
          console.error('Error completing refresh or load more event');
        });
      }
    });
  }

  ngOnInit() {
    this.addKeyBoardListener();

    this.store.loadBusinesses(this.store.query);

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
    this.store.updateQuery({
      ...this.store.query(),
      searchTerm: event.target.value
    });
  }

  onSuggestedSearchTopic(searchTerm: string) {
    this.showSuggestedSearches = false;
    this.searchBar.value = searchTerm;
    this.store.updateQuery({
      ...this.store.query(),
      searchTerm
    });
  }

  retrySearch() {
    this.store.loadBusinesses(this.store.query());
  }

  resetFilter() {
    this.searchBar.value = '';
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

  onClickBusiness(id: number) {
    this.router.navigate(['business', 'detail', id]);
  }
}
