import { Component, EventEmitter, input, OnInit, Output } from '@angular/core';
import {
  FormArray,
  FormBuilder,
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

@Component({
  selector: 'app-council-member-filter-form',
  templateUrl: './council-member-filter-form.component.html',
  styleUrls: ['./council-member-filter-form.component.scss'],
  imports: [IonicModule, ReactiveFormsModule, TranslocoDirective],
  standalone: true
})
export class CouncilMemberFilterFormComponent implements OnInit {
  preset = input<CouncilMemberFilterForm>();

  councilList = AllCouncils;

  filterForm = new FormGroup({
    councils: new FormArray([]),
    inactiveMembers: new FormControl(false)
  });

  @Output() applyFilter: EventEmitter<CouncilMemberFilterForm> =
    new EventEmitter<CouncilMemberFilterForm>();

  constructor(private fb: FormBuilder) {}

  ngOnInit() {
    this.filterForm = this.fb.group({
      councils: this.fb.array([
        ...this.councilList.map((c) =>
          this.fb.control(this.preset()?.councils.includes(c) ?? false)
        )
      ]),
      inactiveMembers: new FormControl(this.preset()?.inactiveMembers ?? false)
    });
  }

  onSubmit() {
    const councils = this.filterForm.value.councils
      .map((value, index) => (value ? this.councilList[index] : null))
      .filter((value) => value !== null) as Council[];

    this.applyFilter.emit({
      councils,
      inactiveMembers: this.filterForm.get('inactiveMembers').value
    });
  }

  get councils() {
    return this.filterForm.get('councils') as FormArray;
  }
}
