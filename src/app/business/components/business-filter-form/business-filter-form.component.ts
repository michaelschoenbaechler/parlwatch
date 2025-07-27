import {
  Component,
  computed,
  EventEmitter,
  inject,
  Output
} from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { TranslocoDirective } from '@jsverse/transloco';
import { BusinessStore } from '../../business.store';

@Component({
  selector: 'app-business-filter-form',
  templateUrl: './business-filter-form.component.html',
  styleUrls: ['./business-filter-form.component.scss'],
  imports: [FormsModule, IonicModule, ReactiveFormsModule, TranslocoDirective]
})
export class BusinessFilterFormComponent {
  readonly store = inject(BusinessStore);

  @Output() submitFilter = new EventEmitter<void>();

  businessTypeCheckboxes = computed(() =>
    this.store.businessTypes().map((type) => ({
      ...type,
      checked: this.store.query().businessTypes.some((t) => t.ID === type.ID)
    }))
  );

  businessStatusCheckboxes = computed(() =>
    this.store.businessStatuses().map((status) => ({
      ...status,
      checked: this.store
        .query()
        .businessStatuses.some(
          (s) => s.BusinessStatusId === status.BusinessStatusId
        )
    }))
  );

  onSubmit() {
    this.submitFilter.emit();
    this.store.updateQuery({
      ...this.store.query(),
      businessTypes: this.businessTypeCheckboxes().filter(
        (type) => type.checked
      ),
      businessStatuses: this.businessStatusCheckboxes().filter(
        (status) => status.checked
      )
    });
  }
}
