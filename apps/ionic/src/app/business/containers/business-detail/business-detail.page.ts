import { Component, computed, effect, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Browser } from '@capacitor/browser';
import { IonicModule } from '@ionic/angular';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { BusinessCardComponent } from '../../components/business-card/business-card.component';
import { BusinessDetailTextComponent } from '../../components/business-detail-text/business-detail-text.component';
import { BusinessTimelineComponent } from '../../components/business-timeline/business-timeline.component';
import { RelatedBusinessListComponent } from '../../components/related-business-list/related-business-list.component';
import { BusinessContributorListComponent } from '../../components/business-contributor-list/business-contributor-list.component';
import { BusinessDocumentListComponent } from '../../components/business-document-list/business-document-list.component';
import { VoteItemsComponent } from '../../../votes/components/vote-items/vote-items.component';
import { SpeechListComponent } from '../../../shared/components/speech-list/speech-list.component';
import { TextCardComponent } from '../../../shared/components/text-card/text-card.component';
import { ODataDateTimePipe } from '../../../shared/pipes/o-data-date-time.pipe';
import { LoadingScreenComponent } from '../../../shared/components/loading-screen/loading-screen.component';
import { ErrorScreenComponent } from '../../../shared/components/error-screen/error-screen.component';
import { BusinessStore } from '../../store/business/business.store';
import { RecentBusinessStore } from '../../store/recent/recent.store';
import { DebateStore } from '../../store/debate/debate.store';
import { VoteStore } from '../../../votes/store/vote';
import {
  isCantonal,
  ParliamentKey
} from '../../../shared/parliament/models/parliament.model';
import {
  detailPathInTab,
  routeParliament
} from '../../../shared/parliament/models/parliament-routes';
import { CantonalThemeDirective } from '../../../shared/parliament/directives/cantonal-theme.directive';
import { ParliamentTitleComponent } from '../../../shared/parliament/components/parliament-title/parliament-title.component';
import { RecordSourceFooterComponent } from '../../../shared/parliament/components/record-source-footer/record-source-footer.component';
import { BusinessDocument } from '../../models/cantonal-business';

@Component({
  selector: 'app-business-detail',
  templateUrl: './business-detail.page.html',
  styleUrls: ['./business-detail.page.scss'],
  imports: [
    IonicModule,
    BusinessCardComponent,
    BusinessDetailTextComponent,
    BusinessTimelineComponent,
    RelatedBusinessListComponent,
    BusinessContributorListComponent,
    BusinessDocumentListComponent,
    VoteItemsComponent,
    SpeechListComponent,
    TextCardComponent,
    ODataDateTimePipe,
    LoadingScreenComponent,
    ErrorScreenComponent,
    TranslocoDirective,
    ParliamentTitleComponent,
    RecordSourceFooterComponent
  ],
  hostDirectives: [CantonalThemeDirective]
})
export class BusinessDetailPage implements OnInit {
  readonly store = inject(BusinessStore);
  readonly recentStore = inject(RecentBusinessStore);
  readonly debateStore = inject(DebateStore);
  private readonly voteStore = inject(VoteStore);
  private readonly transloco = inject(TranslocoService);
  readonly route = inject(ActivatedRoute);
  readonly router = inject(Router);

  readonly parliament: ParliamentKey = routeParliament(this.route);
  readonly isCantonal = isCantonal(this.parliament);

  readonly viewModel = computed(() => this.store.businessDetailViewModel());

  readonly cantonal = computed(
    () => this.viewModel().business?.cantonal ?? null
  );

  /** Debates are recorded verbatim, so speeches carry their own language. */
  readonly uiLanguage = this.transloco.getActiveLang();

  constructor() {
    effect(() => {
      const business = this.viewModel().business;
      if (business?.ID && business.Title) {
        this.recentStore.recordEntry({
          id: business.ID,
          title: business.Title,
          parliament: this.parliament
        });
      }
    });

    effect(() => {
      if (this.isCantonal) return;
      const voteIds = this.viewModel()
        .votes.map((vote) => vote.ID)
        .filter((id): id is number => id !== undefined);
      if (voteIds.length > 0) {
        this.voteStore.loadTallies(voteIds);
      }
    });
  }

  ngOnInit() {
    const businessId = parseInt(this.route.snapshot.params.id);
    this.store.selectBusiness({ parliament: this.parliament, id: businessId });
    if (!this.isCantonal) {
      this.debateStore.selectBusiness(businessId);
    }
  }

  retry() {
    this.store.selectBusiness({
      parliament: this.parliament,
      id: parseInt(this.route.snapshot.params.id)
    });
  }

  /** Open the business on parlament.ch, where the full dossier lives. */
  openFurtherInformation() {
    const business = this.viewModel().business;
    if (!business?.ID) return;

    Browser.open({
      url:
        'https://www.parlament.ch/de/ratsbetrieb/suche-curia-vista/geschaeft?AffairId=' +
        business.ID,
      presentationStyle: 'popover'
    });
  }

  openDocument(document: BusinessDocument) {
    Browser.open({ url: document.url, presentationStyle: 'popover' }).catch(
      console.error
    );
  }

  onVote(id: number) {
    this.router
      .navigate(detailPathInTab(this.router.url, 'votes', id))
      .catch(console.error);
  }

  onContributor(personId: number) {
    this.router
      .navigate(detailPathInTab(this.router.url, 'council-member', personId))
      .catch(console.error);
  }

  /**
   * Open a cross-referenced business on its own detail page.
   * @param id Business number of the related business
   */
  onRelatedBusiness(id: number) {
    this.router
      .navigate(detailPathInTab(this.router.url, 'business', id))
      .catch(console.error);
  }
}
