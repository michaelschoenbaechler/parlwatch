import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Business } from 'swissparl';
import { BusinessService } from '../../services/business.service';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { catchError, first, switchMap, tap } from 'rxjs/operators';
import { Subject, from, of } from 'rxjs';
import { IonicModule } from '@ionic/angular';
import { BusinessCardComponent } from '../../components/business-card/business-card.component';
import { BusinessDetailTextComponent } from '../../components/business-detail-text/business-detail-text.component';
import { LoadingScreenComponent } from '../../../shared/components/loading-screen/loading-screen.component';
import { ErrorScreenComponent } from '../../../shared/components/error-screen/error-screen.component';
import { NgIf } from '@angular/common';

@UntilDestroy()
@Component({
  selector: 'app-business-detail',
  templateUrl: './business-detail.page.html',
  styleUrls: ['./business-detail.page.scss'],
  standalone: true,
  imports: [
    NgIf,
    IonicModule,
    BusinessCardComponent,
    BusinessDetailTextComponent,
    LoadingScreenComponent,
    ErrorScreenComponent
  ]
})
export class BusinessDetailPage implements OnInit {
  business: Business = null;
  loading = true;
  error = false;

  trigger$ = new Subject<void>();

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private businessService: BusinessService
  ) {}

  ngOnInit() {
    from(this.trigger$)
      .pipe(
        untilDestroyed(this),
        tap(() => (this.loading = true)),
        switchMap(() =>
          this.businessService
            .getBusiness(parseInt(this.route.snapshot.params.id))
            .pipe(
              first(),
              catchError(() => {
                this.error = true;
                this.loading = false;
                return of(null);
              })
            )
        )
      )
      .subscribe((business) => {
        if (business === null) {
          return;
        }
        this.business = business;
        this.loading = false;
      });
  }

  ionViewDidEnter() {
    if (this.business === null) {
      this.trigger$.next();
    }
  }

  goToVote() {
    this.router.navigate(['layout', 'votes'], {
      queryParams: { BusinessShortNumber: this.business.BusinessShortNumber }
    });
  }

  retrySearch() {
    this.trigger$.next();
  }
}
