import { Component, computed, effect, inject, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { TranslocoDirective } from '@jsverse/transloco';
import { BusinessCardComponent } from '../../components/business-card/business-card.component';
import { BusinessDetailTextComponent } from '../../components/business-detail-text/business-detail-text.component';
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
}
