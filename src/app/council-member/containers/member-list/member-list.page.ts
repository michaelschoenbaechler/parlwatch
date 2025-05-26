import { Component, effect, inject, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { UntilDestroy } from '@ngneat/until-destroy';
import {
  InfiniteScrollCustomEvent,
  IonicModule,
  IonSearchbar,
  RefresherCustomEvent
} from '@ionic/angular';
import { TranslocoDirective } from '@jsverse/transloco';
import { HideKeyboardOnEnterDirective } from '../../../shared/directives/hide-keyboard-on-enter.directive';
import { CouncilMemberCardComponent } from '../../components/council-member-card/council-member-card.component';
import { LoadingScreenComponent } from '../../../shared/components/loading-screen/loading-screen.component';
import { NoContentScreenComponent } from '../../../shared/components/no-content-screen/no-content-screen.component';
import { ErrorScreenComponent } from '../../../shared/components/error-screen/error-screen.component';
import { CouncilMemberStore } from '../../council-member.store';
import {
  CouncilMemberFilterForm,
  CouncilMemberFilterFormComponent
} from '../../components/council-member-filter-form/council-member-filter-form.component';

@UntilDestroy()
@Component({
  selector: 'app-member-list',
  templateUrl: './member-list.page.html',
  styleUrls: ['./member-list.page.scss'],
  standalone: true,
  imports: [
    IonicModule,
    ReactiveFormsModule,
    CouncilMemberCardComponent,
    HideKeyboardOnEnterDirective,
    LoadingScreenComponent,
    NoContentScreenComponent,
    ErrorScreenComponent,
    CouncilMemberFilterFormComponent,
    TranslocoDirective
  ]
})
export class MemberListPage implements OnInit {
  @ViewChild('searchBar', { static: false }) searchBar: IonSearchbar;

  readonly store = inject(CouncilMemberStore);
  readonly router = inject(Router);

  isModalOpen = false;
  presentingElement = null;
  activeFilter: CouncilMemberFilterForm = {
    councils: [],
    inactiveMembers: false
  };

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
    this.store.loadCouncilMembers(this.store.query);

    this.presentingElement = document.querySelector('ion-router-outlet');
  }

  toggleFilterModal() {
    this.isModalOpen = !this.isModalOpen;
  }

  onSearch(event: any) {
    this.store.updateQuery({
      ...this.store.query(),
      searchTerm: event.target.value
    });
  }

  retrySearch() {
    this.store.loadCouncilMembers(this.store.query);
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

  onFilter(event: CouncilMemberFilterForm) {
    this.activeFilter = event;
    this.toggleFilterModal();
    this.store.updateQuery({
      ...this.store.query(),
      council: this.activeFilter.councils.map((council) => council.id),
      showInactive: this.activeFilter.inactiveMembers
    });
  }

  onClickPerson(id: number) {
    this.router.navigate(['council-member', 'detail', id]);
  }
}
