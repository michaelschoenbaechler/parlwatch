import { Component, computed, effect, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { TranslocoDirective } from '@jsverse/transloco';
import { BusinessCardComponent } from '../../components/business-card/business-card.component';
import { BusinessDetailTextComponent } from '../../components/business-detail-text/business-detail-text.component';
import { BusinessTimelineComponent } from '../../components/business-timeline/business-timeline.component';
import { RelatedBusinessListComponent } from '../../components/related-business-list/related-business-list.component';
import { TextCardComponent } from '../../../shared/components/text-card/text-card.component';
import { LoadingScreenComponent } from '../../../shared/components/loading-screen/loading-screen.component';
import { ErrorScreenComponent } from '../../../shared/components/error-screen/error-screen.component';
import { BusinessStore } from '../../store/business/business.store';
import { RecentBusinessStore } from '../../store/recent/recent.store';

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
    TextCardComponent,
    LoadingScreenComponent,
    ErrorScreenComponent,
    RouterLink,
    TranslocoDirective
  ]
})
export class BusinessDetailPage implements OnInit {
  readonly store = inject(BusinessStore);
  readonly recentStore = inject(RecentBusinessStore);
  readonly route = inject(ActivatedRoute);
  readonly router = inject(Router);

  readonly viewModel = computed(() => this.store.businessDetailViewModel());

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
    this.store.selectBusiness(parseInt(this.route.snapshot.params.id));
  }

  retry() {
    this.store.selectBusiness(parseInt(this.route.snapshot.params.id));
  }

  /**
   * Open a cross-referenced business on its own detail page.
   * @param id Business number of the related business
   */
  onRelatedBusiness(id: number) {
    this.router.navigate(['/layout/business/detail', id]).catch(console.error);
  }
}
