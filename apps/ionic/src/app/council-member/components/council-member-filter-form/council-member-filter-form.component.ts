import { Component, inject, input, OnInit, output } from '@angular/core';
import {
  FormArray,
  FormControl,
  FormGroup,
  ReactiveFormsModule
} from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { TranslocoDirective } from '@jsverse/transloco';
import { AllCouncils, Council } from '../../containers/member-list/councils';
import { FacetOption } from '../../models/member-facets';
import { MemberFacetStore } from '../../store/facet/facet.store';

export type CouncilMemberFilterForm = {
  councils: Council[];
  cantons: FacetOption[];
  parlGroups: FacetOption[];
  parties: FacetOption[];
  inactiveMembers: boolean;
};

/** One checkbox per council, plus the facet selections and the inactive toggle. */
type FilterFormGroup = FormGroup<{
  councils: FormArray<FormControl<boolean>>;
  cantons: FormControl<number[]>;
  parlGroups: FormControl<number[]>;
  parties: FormControl<number[]>;
  inactiveMembers: FormControl<boolean>;
}>;

@Component({
  selector: 'app-council-member-filter-form',
  templateUrl: './council-member-filter-form.component.html',
  styleUrls: ['./council-member-filter-form.component.scss'],
  imports: [IonicModule, ReactiveFormsModule, TranslocoDirective]
})
export class CouncilMemberFilterFormComponent implements OnInit {
  private readonly facetStore = inject(MemberFacetStore);

  preset = input<CouncilMemberFilterForm>();

  councilList = AllCouncils;

  readonly facets = this.facetStore.facets;
  readonly facetsLoading = this.facetStore.isLoading;

  filterForm: FilterFormGroup = this.createForm();

  readonly applyFilter = output<CouncilMemberFilterForm>();

  ngOnInit() {
    this.facetStore.ensureFacetsLoaded();
    this.filterForm = this.createForm();
  }

  onSubmit() {
    const councils = this.councils.controls
      .map((control, index) => (control.value ? this.councilList[index] : null))
      .filter((council): council is Council => council !== null);

    const value = this.filterForm.controls;

    this.applyFilter.emit({
      councils,
      cantons: this.pick(this.facets().cantons, value.cantons.value),
      parlGroups: this.pick(this.facets().parlGroups, value.parlGroups.value),
      parties: this.pick(this.facets().parties, value.parties.value),
      inactiveMembers: value.inactiveMembers.value
    });
  }

  get councils() {
    return this.filterForm.controls.councils;
  }

  /**
   * Resolve selected ids back to their options, so the caller can label the
   * active-filter chips without looking the ids up again.
   * @param options The facet's full option list
   * @param selectedIds Ids the user picked
   * @returns The selected options, in the facet's own order
   */
  private pick(options: FacetOption[], selectedIds: number[]): FacetOption[] {
    return options.filter((option) => selectedIds.includes(option.id));
  }

  /**
   * Build the form, seeded from the filter currently applied to the list.
   * @returns A form group matching the preset
   */
  private createForm(): FilterFormGroup {
    const preset = this.preset();

    return new FormGroup({
      councils: new FormArray(
        this.councilList.map(
          (council) =>
            new FormControl(preset?.councils.includes(council) ?? false, {
              nonNullable: true
            })
        )
      ),
      cantons: new FormControl(toIds(preset?.cantons), { nonNullable: true }),
      parlGroups: new FormControl(toIds(preset?.parlGroups), {
        nonNullable: true
      }),
      parties: new FormControl(toIds(preset?.parties), { nonNullable: true }),
      inactiveMembers: new FormControl(preset?.inactiveMembers ?? false, {
        nonNullable: true
      })
    });
  }
}

/**
 * Reduce preset options to the ids the selects bind to.
 * @param options Options carried by the preset, if any
 * @returns The option ids
 */
function toIds(options: FacetOption[] | undefined): number[] {
  return (options ?? []).map((option) => option.id);
}
