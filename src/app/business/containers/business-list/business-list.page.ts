import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Subject, combineLatest, from, of } from 'rxjs';
import { map, first, tap, catchError, switchMap } from 'rxjs/operators';
import { Business, BusinessStatus, BusinessType } from 'swissparl';
import { BusinessService } from '../../services/business.service';
import {
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule
} from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import * as _ from 'lodash';
import { IonicModule, IonSearchbar, Platform } from '@ionic/angular';
import { Keyboard } from '@capacitor/keyboard';
import { NgFor, NgIf } from '@angular/common';
import { BusinessCardComponent } from '../../components/business-card/business-card.component';
import { LoadingScreenComponent } from '../../../shared/components/loading-screen/loading-screen.component';
import { ErrorScreenComponent } from '../../../shared/components/error-screen/error-screen.component';
import { NoContentScreenComponent } from '../../../shared/components/no-content-screen/no-content-screen.component';

@UntilDestroy()
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
    NoContentScreenComponent
  ]
})
export class BusinessListPage implements OnInit {
  top = 20;
  skip = 0;
  businesses: Business[] = [];
  loading = true;
  error = false;
  noContent = false;
  isModalOpen = false;
  showFilterButton = false;
  presentingElement = null;
  showSuggestedSearches: boolean = false;
  suggestedSearchTerms: string[] = [
    'Internationale Politik',
    'Verkehr',
    'Finanzwesen',
    'Soziale Fragen',
    'Umwelt',
    'Bildung',
    'Wirtschaft',
    'Staatspolitik',
    'Migration',
    'Gesundheit',
    'Parlament',
    'Strafrecht',
    'Steuer',
    'Europapolitik',
    'Sicherheitspolitik',
    'Raumplanung'
  ];

  filterForm: FormGroup;
  filterError = false;
  searchTerm$ = new BehaviorSubject<string>('');

  businessStatuses: BusinessStatus[] = [];
  businessTypes: BusinessType[] = [];
  selectedBusinessTypes: BusinessType[] = [];
  selectedBusinessStatuses: BusinessStatus[] = [];

  @ViewChild('searchBar', { static: false }) searchBar: IonSearchbar;

  trigger$ = new Subject<void>();
  filter$ = new BehaviorSubject<{
    businessTypes: number[];
    businessStatuses: number[];
  }>({
    businessTypes: [],
    businessStatuses: []
  });

  constructor(
    private businessService: BusinessService,
    private router: Router,
    private platform: Platform,
    private fb: FormBuilder
  ) {}

  ngOnInit() {
    this.presentingElement = document.querySelector(
      'app-business-list .ion-page'
    );

    this.filterForm = this.fb.group({
      businessStatus: new FormArray([]),
      businessType: new FormArray([])
    });

    from(this.trigger$)
      .pipe(
        untilDestroyed(this),
        tap(() => (this.filterError = false)),
        switchMap(() =>
          this.businessService.getBusinessStatus().pipe(
            catchError(() => {
              this.filterError = true;
              return of(null);
            })
          )
        ),
        map((businessStatus) => _.uniqBy(businessStatus, 'BusinessStatusId'))
      )
      .subscribe((businessStatus) => {
        if (businessStatus === null) {
          return;
        }
        businessStatus.forEach(() => {
          const control = new FormControl(false);
          (this.filterForm.controls.businessStatus as FormArray).push(control);
        });
        this.businessStatuses = businessStatus;
      });

    from(this.trigger$)
      .pipe(
        untilDestroyed(this),
        tap(() => (this.filterError = false)),
        switchMap(() =>
          this.businessService.getBusinessTypes().pipe(
            catchError(() => {
              this.filterError = true;
              return of(null);
            })
          )
        )
      )
      .subscribe((businessTypes) => {
        if (businessTypes === null) {
          return;
        }
        businessTypes.forEach(() => {
          const control = new FormControl(false);
          (this.filterForm.controls.businessType as FormArray).push(control);
        });
        this.businessTypes = businessTypes;
      });

    combineLatest([this.searchTerm$, this.filter$, this.trigger$])
      .pipe(
        untilDestroyed(this),
        tap(() => {
          this.skip = 0;
          this.error = false;
          this.loading = true;
        }),
        switchMap(([searchTerm, { businessStatuses, businessTypes }]) =>
          this.businessService
            .getBusinesses({
              top: this.top,
              skip: this.skip,
              searchTerm,
              businessStatuses,
              businessTypes
            })
            .pipe(
              catchError(() => {
                this.error = true;
                this.loading = false;
                return of(null);
              })
            )
        )
      )
      .subscribe((businesses) => {
        if (businesses === null) {
          return;
        }
        this.businesses = businesses;
        this.noContent = businesses.length === 0;
        this.loading = false;
      });

    this.filterForm.valueChanges
      .pipe(untilDestroyed(this))
      .subscribe((formValues) => {
        this.selectedBusinessTypes = [];
        formValues.businessType.forEach((value, index) => {
          if (value) {
            this.selectedBusinessTypes.push(this.businessTypes[index]);
          }
        });

        this.selectedBusinessStatuses = [];
        formValues.businessStatus.forEach((value, index) => {
          if (value) {
            this.selectedBusinessStatuses.push(this.businessStatuses[index]);
          }
        });

        if (
          this.selectedBusinessTypes.length > 0 ||
          this.selectedBusinessStatuses.length > 0
        ) {
          this.showFilterButton = true;
        }
      });

    this.addKeyBoardListener();
  }

  ionViewDidEnter() {
    // trigger search again if we are coming back from another page and no items have been loaded yet
    if (this.businesses.length === 0) {
      this.trigger$.next();
    }
  }

  addKeyBoardListener() {
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
    this.searchTerm$.next(event.target.value);
  }

  onSuggestedSearchTopic(searchTerm: string) {
    this.showSuggestedSearches = false;
    this.searchBar.value = searchTerm;
    this.searchTerm$.next(searchTerm);
  }

  retrySearch() {
    this.trigger$.next();
  }

  resetFilter() {
    this.filterForm.reset();
    this.searchTerm$.next('');
    this.searchBar.value = '';
    this.filter$.next({
      businessTypes: [],
      businessStatuses: []
    });
  }

  distanceReached(event: any) {
    this.skip += this.top;
    this.fetchBusinesses().subscribe((newBusinesses) => {
      if (newBusinesses === null) {
        return;
      }
      this.businesses = [...this.businesses, ...newBusinesses];
      event.target.complete();
    });
  }

  handleRefresh(event) {
    this.skip = 0;
    this.fetchBusinesses().subscribe((businesses) => {
      if (businesses === null) {
        return;
      }
      this.businesses = businesses;
      event.target.complete();
    });
  }

  fetchBusinesses() {
    return this.businessService
      .getBusinesses({
        top: this.top,
        skip: this.skip,
        searchTerm: this.searchTerm$.getValue(),
        businessStatuses: this.filter$.getValue().businessStatuses,
        businessTypes: this.filter$.getValue().businessTypes
      })
      .pipe(
        first(),
        catchError(() => {
          this.error = true;
          return of(null);
        })
      );
  }

  onClickBusiness(id: number) {
    this.router.navigate(['business', 'detail', id]);
  }

  applyFilter() {
    this.toggleFilterModal();
    this.filter$.next({
      businessTypes: this.selectedBusinessTypes.map((bt) => bt.ID),
      businessStatuses: this.selectedBusinessStatuses.map(
        (bs) => bs.BusinessStatusId
      )
    });
  }

  get businessTypesArray(): FormControl[] {
    return (this.filterForm.controls.businessType as FormArray)
      .controls as FormControl[];
  }

  get businessStatusesArray(): FormControl[] {
    return (this.filterForm.controls.businessStatus as FormArray)
      .controls as FormControl[];
  }
}
