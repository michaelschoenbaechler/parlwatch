import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Subject, combineLatest, of } from 'rxjs';
import { catchError, first, switchMap, tap } from 'rxjs/operators';
import { MemberCouncil } from 'swissparl';
import { CouncilMemberService } from '../../services/council-member.service';
import { FormArray, FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { IonSearchbar } from '@ionic/angular';

@UntilDestroy()
@Component({
  selector: 'app-member-list',
  templateUrl: './member-list.component.html',
  styleUrls: ['./member-list.component.scss']
})
export class MemberListComponent implements OnInit {
  top = 50;
  skip = 0;
  members: MemberCouncil[] = [];
  loading = true;
  error = false;
  noContent = false;

  trigger$ = new Subject<void>();
  searchTerm$ = new BehaviorSubject<string>('');
  filter$ = new BehaviorSubject<{
    council: number[];
    showInactive: boolean;
  }>({
    council: [],
    showInactive: false
  });

  councils = [
    {
      id: 1,
      councilName: 'Nationalrat'
    },
    {
      id: 2,
      councilName: 'Ständerat'
    },
    {
      id: 99,
      councilName: 'Bundesrat'
    }
  ];

  isModalOpen = false;
  presentingElement = null;
  filterForm: FormGroup;
  showFilterButton = false;
  selectedCouncils: { id: number; councilName: string }[] = [];

  @ViewChild('searchBar', { static: false }) searchBar: IonSearchbar;

  constructor(
    private memberService: CouncilMemberService,
    private router: Router,
    private fb: FormBuilder
  ) {}

  ngOnInit() {
    this.presentingElement = document.querySelector(
      'app-member-list .ion-page'
    );

    this.filterForm = this.fb.group({
      council: new FormArray([]),
      inactiveMembers: new FormControl(false)
    });

    this.councils.forEach(() => {
      (this.filterForm.controls.council as FormArray).push(
        new FormControl(false)
      );
    });

    combineLatest([this.searchTerm$, this.filter$, this.trigger$])
      .pipe(
        untilDestroyed(this),
        tap(() => {
          this.skip = 0;
          this.error = false;
          this.loading = true;
        }),
        switchMap(([searchTerm, { council, showInactive }]) =>
          this.memberService
            .getMembers({
              top: this.top,
              skip: this.skip,
              searchTerm,
              council,
              showInactive
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
      .subscribe((members) => {
        if (members === null) {
          return;
        }
        this.members = members;
        this.noContent = members.length === 0;
        this.loading = false;
      });

    this.filterForm.valueChanges
      .pipe(untilDestroyed(this))
      .subscribe((formValues) => {
        this.selectedCouncils = [];
        formValues.council.forEach((value, index) => {
          if (value) {
            this.selectedCouncils.push(this.councils[index]);
          }
        });

        if (this.selectedCouncils.length > 0 || formValues.inactiveMembers) {
          this.showFilterButton = true;
        }
      });
  }

  ionViewDidEnter() {
    // trigger search again if we are coming back from another page and no items have been loaded yet
    if (this.members.length === 0) {
      this.trigger$.next();
    }
  }

  distanceReached(event: any) {
    this.skip += this.top;
    this.memberService
      .getMembers({
        top: this.top,
        skip: this.skip,
        searchTerm: this.searchTerm$.getValue(),
        council: this.selectedCouncils.map((council) => council.id),
        showInactive: this.filterForm.controls.inactiveMembers.value
      })
      .pipe(
        first(),
        catchError(() => {
          this.error = true;
          return of(null);
        })
      )
      .subscribe((newMembers) => {
        if (newMembers === null) {
          return;
        }
        this.members = [...this.members, ...newMembers];
        event.target.complete();
      });
  }

  toggleFilterModal() {
    this.isModalOpen = !this.isModalOpen;
  }

  applyFilter() {
    this.toggleFilterModal();
    this.filter$.next({
      council: this.selectedCouncils.map((council) => council.id),
      showInactive: this.filterForm.controls.inactiveMembers.value
    });
  }

  resetFilter() {
    this.filterForm.reset();
    this.searchTerm$.next('');
    this.searchBar.value = '';
    this.filter$.next({
      council: [],
      showInactive: false
    });
  }

  onSearch(event: any) {
    this.searchTerm$.next(event.target.value);
  }

  onClickPerson(id: number) {
    this.router.navigate(['council-member', 'detail', id]);
  }

  retrySearch() {
    this.trigger$.next();
  }

  get councilArray() {
    return (this.filterForm.controls.council as FormArray)
      .controls as FormControl[];
  }

  get inactiveMembers() {
    return this.filterForm.controls.inactiveMembers as FormControl;
  }
}
