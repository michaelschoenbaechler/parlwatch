import { Component, computed, inject, output } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { TranslocoDirective } from '@jsverse/transloco';
import { BusinessTypesStore } from '../../store/business-types/business-types.store';
import { BusinessStore } from '../../store/business/business.store';
import { BusinessStatusesStore } from '../../store/business-status/business-statuses.store';

@Component({
  selector: 'app-business-filter-form',
  templateUrl: './business-filter-form.component.html',
  styleUrls: ['./business-filter-form.component.scss'],
  imports: [FormsModule, IonicModule, ReactiveFormsModule, TranslocoDirective]
})
export class BusinessFilterFormComponent {
  readonly businessStore = inject(BusinessStore);
  readonly businessTypeStore = inject(BusinessTypesStore);
  readonly businessStatusStore = inject(BusinessStatusesStore);

  submitFilter = output<void>();

  readonly businessTypeViewModel = computed(() =>
    this.businessTypeStore.businessTypesViewModel()
  );

  readonly businessStatusViewModel = computed(() =>
    this.businessStatusStore.businessStatusesViewModel()
  );

  businessTypeCheckboxes = computed(() =>
    this.businessTypeViewModel().types.map((type) => ({
      ...type,
      checked: this.businessStore
        .query()
        .businessTypes.some((t) => t.ID === type.ID)
    }))
  );

  businessStatusCheckboxes = computed(() =>
    this.businessStatusViewModel().statuses.map((status) => ({
      ...status,
      checked: this.businessStore
        .query()
        .businessStatuses.some(
          (s) => s.BusinessStatusId === status.BusinessStatusId
        )
    }))
  );

  onSubmit() {
    this.submitFilter.emit();
    this.businessStore.updateQuery({
      ...this.businessStore.query(),
      businessTypes: this.businessTypeCheckboxes().filter(
        (type) => type.checked
      ),
      businessStatuses: this.businessStatusCheckboxes().filter(
        (status) => status.checked
      )
    });
  }
}
