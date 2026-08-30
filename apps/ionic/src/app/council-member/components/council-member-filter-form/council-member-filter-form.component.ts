import { Component, input, OnInit, output } from '@angular/core';
import {
  FormArray,
  FormControl,
  FormGroup,
  ReactiveFormsModule
} from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { TranslocoDirective } from '@jsverse/transloco';
import { AllCouncils, Council } from '../../containers/member-list/councils';

export type CouncilMemberFilterForm = {
  councils: Council[];
  inactiveMembers: boolean;
};

/** One checkbox per council, in `AllCouncils` order, plus the inactive toggle. */
type FilterFormGroup = FormGroup<{
  councils: FormArray<FormControl<boolean>>;
  inactiveMembers: FormControl<boolean>;
}>;

@Component({
  selector: 'app-council-member-filter-form',
  templateUrl: './council-member-filter-form.component.html',
  styleUrls: ['./council-member-filter-form.component.scss'],
  imports: [IonicModule, ReactiveFormsModule, TranslocoDirective]
})
export class CouncilMemberFilterFormComponent implements OnInit {
  preset = input<CouncilMemberFilterForm>();

  councilList = AllCouncils;

  filterForm: FilterFormGroup = new FormGroup({
    councils: new FormArray<FormControl<boolean>>([]),
    inactiveMembers: new FormControl(false, { nonNullable: true })
  });

  readonly applyFilter = output<CouncilMemberFilterForm>();

  ngOnInit() {
    this.filterForm = new FormGroup({
      councils: new FormArray(
        this.councilList.map(
          (council) =>
            new FormControl(
              this.preset()?.councils.includes(council) ?? false,
              {
                nonNullable: true
              }
            )
        )
      ),
      inactiveMembers: new FormControl(
        this.preset()?.inactiveMembers ?? false,
        { nonNullable: true }
      )
    });
  }

  onSubmit() {
    const councils = this.councils.controls
      .map((control, index) => (control.value ? this.councilList[index] : null))
      .filter((council): council is Council => council !== null);

    this.applyFilter.emit({
      councils,
      inactiveMembers: this.filterForm.controls.inactiveMembers.value
    });
  }

  get councils() {
    return this.filterForm.controls.councils;
  }
}
