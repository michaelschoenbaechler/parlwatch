import {
  Component,
  computed,
  effect,
  inject,
  OnInit,
  viewChild
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { UntilDestroy } from '@ngneat/until-destroy';
import { MemberCouncil } from 'swissparl';
import {
  InfiniteScrollCustomEvent,
  IonicModule,
  IonSearchbar,
  NavController,
  RefresherCustomEvent
} from '@ionic/angular';
import { TranslocoDirective } from '@jsverse/transloco';
import { HideKeyboardOnEnterDirective } from '../../../shared/directives/hide-keyboard-on-enter.directive';
import { CouncilMemberCardComponent } from '../../components/council-member-card/council-member-card.component';
import { LoadingScreenComponent } from '../../../shared/components/loading-screen/loading-screen.component';
import { NoContentScreenComponent } from '../../../shared/components/no-content-screen/no-content-screen.component';
import { ErrorScreenComponent } from '../../../shared/components/error-screen/error-screen.component';
import {
  CouncilMemberFilterForm,
  CouncilMemberFilterFormComponent
} from '../../components/council-member-filter-form/council-member-filter-form.component';
import { CouncilMemberStore } from '../../store/council-member/council-member.store';
import { ParliamentStore } from '../../../parliament/store/parliament.store';
import { ParliamentKey } from '../../../parliament/models/parliament.model';
import {
  detailPath,
  listPath,
  routeParliament
} from '../../../parliament/models/parliament-routes';
import { CantonalThemeDirective } from '../../../parliament/directives/cantonal-theme.directive';
import { ParliamentSwitcherComponent } from '../../../parliament/components/parliament-switcher/parliament-switcher.component';
import { ParliamentTitleComponent } from '../../../parliament/components/parliament-title/parliament-title.component';
import { CantonHintCardComponent } from '../../../parliament/components/canton-hint-card/canton-hint-card.component';

@UntilDestroy()
@Component({
  selector: 'app-member-list',
  templateUrl: './member-list.page.html',
  styleUrls: ['./member-list.page.scss'],
  imports: [
    IonicModule,
    ReactiveFormsModule,
    CouncilMemberCardComponent,
    HideKeyboardOnEnterDirective,
    LoadingScreenComponent,
    NoContentScreenComponent,
    ErrorScreenComponent,
    CouncilMemberFilterFormComponent,
    TranslocoDirective,
    ParliamentSwitcherComponent,
    ParliamentTitleComponent,
    CantonHintCardComponent
  ],
  hostDirectives: [CantonalThemeDirective]
})
export class MemberListPage implements OnInit {
  readonly searchBar = viewChild.required<IonSearchbar>('searchBar');

  readonly store = inject(CouncilMemberStore);
  readonly parliamentStore = inject(ParliamentStore);
  readonly router = inject(Router);
  private readonly navController = inject(NavController);
  private readonly route = inject(ActivatedRoute);

  /** The parliament this page lists, fixed for the page's lifetime. */
  readonly parliament: ParliamentKey = routeParliament(this.route);

  readonly viewModel = computed(() => this.store.councilMembersViewModel());

  isModalOpen = false;
  presentingElement: HTMLElement | null = null;
  activeFilter: CouncilMemberFilterForm = {
    councils: [],
    cantons: [],
    parlGroups: [],
    parties: [],
    inactiveMembers: false
  };

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
    // The route is the source of truth; the store follows it so the other
    // tabs open on the same parliament.
    this.parliamentStore.setActiveParliament(this.parliament);
    this.store.setParliament(this.parliament);
  }

  /**
   * Switch to another parliament's list. Replaces the tab's stack rather
   * than pushing onto it, so back never walks through old parliaments.
   * @param parliament The parliament picked in the switcher
   */
  onParliamentChange(parliament: ParliamentKey) {
    this.parliamentStore.setActiveParliament(parliament);
    this.navController
      .navigateRoot(listPath('council-member', parliament))
      .catch(console.error);
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
    this.store.reloadMembers(this.store.query);
  }

  resetFilter() {
    this.searchBar().value = '';
    this.activeFilter = {
      councils: [],
      cantons: [],
      parlGroups: [],
      parties: [],
      inactiveMembers: false
    };
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
      cantons: this.activeFilter.cantons.map((canton) => canton.id),
      parlGroups: this.activeFilter.parlGroups.map((group) => group.id),
      parties: this.activeFilter.parties.map((party) => party.id),
      showInactive: this.activeFilter.inactiveMembers
    });
  }

  /**
   * The canton, faction and party chips shown above the list.
   *
   * Each facet numbers its values independently, so canton 13 and party 13 are
   * different things; the chips are keyed by facet name as well as id.
   * @returns One chip per selected facet value
   */
  get activeFacetChips(): { key: string; label: string }[] {
    const { cantons, parlGroups, parties } = this.activeFilter;
    return [
      ...cantons.map((o) => ({ key: `canton-${o.id}`, label: o.label })),
      ...parlGroups.map((o) => ({ key: `parlGroup-${o.id}`, label: o.label })),
      ...parties.map((o) => ({ key: `party-${o.id}`, label: o.label }))
    ];
  }

  onClickPerson(councilMember: MemberCouncil) {
    if (councilMember.ID !== undefined) {
      this.router
        .navigate(detailPath('council-member', this.parliament, councilMember.ID))
        .catch(console.error);
    }
  }
}
