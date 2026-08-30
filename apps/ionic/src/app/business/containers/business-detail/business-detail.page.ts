import { Component, computed, effect, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Browser } from '@capacitor/browser';
import { IonicModule } from '@ionic/angular';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { BusinessCardComponent } from '../../components/business-card/business-card.component';
import { BusinessDetailTextComponent } from '../../components/business-detail-text/business-detail-text.component';
import { BusinessTimelineComponent } from '../../components/business-timeline/business-timeline.component';
import { RelatedBusinessListComponent } from '../../components/related-business-list/related-business-list.component';
import { SpeechListComponent } from '../../../shared/components/speech-list/speech-list.component';
import { TextCardComponent } from '../../../shared/components/text-card/text-card.component';
import { ODataDateTimePipe } from '../../../shared/pipes/o-data-date-time.pipe';
import { LoadingScreenComponent } from '../../../shared/components/loading-screen/loading-screen.component';
import { ErrorScreenComponent } from '../../../shared/components/error-screen/error-screen.component';
import { BusinessStore } from '../../store/business/business.store';
import { RecentBusinessStore } from '../../store/recent/recent.store';
import { DebateStore } from '../../store/debate/debate.store';

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
    SpeechListComponent,
    TextCardComponent,
    ODataDateTimePipe,
    LoadingScreenComponent,
    ErrorScreenComponent,
    RouterLink,
    TranslocoDirective
  ]
})
export class BusinessDetailPage implements OnInit {
  readonly store = inject(BusinessStore);
  readonly recentStore = inject(RecentBusinessStore);
  readonly debateStore = inject(DebateStore);
  private readonly transloco = inject(TranslocoService);
  readonly route = inject(ActivatedRoute);
  readonly router = inject(Router);

  readonly viewModel = computed(() => this.store.businessDetailViewModel());

  /** Debates are recorded verbatim, so speeches carry their own language. */
  readonly uiLanguage = this.transloco.getActiveLang();

  constructor() {
    effect(() => {
      const business = this.viewModel().business;
      if (business?.ID && business.Title) {
        this.recentStore.recordEntry({
          id: business.ID,
          title: business.Title
        });
      }
    });
  }

  ngOnInit() {
    const businessId = parseInt(this.route.snapshot.params.id);
    this.store.selectBusiness(businessId);
    this.debateStore.selectBusiness(businessId);
  }

  retry() {
    this.store.selectBusiness(parseInt(this.route.snapshot.params.id));
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

  /**
   * Open a cross-referenced business on its own detail page.
   * @param id Business number of the related business
   */
  onRelatedBusiness(id: number) {
    this.router.navigate(['/layout/business/detail', id]).catch(console.error);
  }
}
