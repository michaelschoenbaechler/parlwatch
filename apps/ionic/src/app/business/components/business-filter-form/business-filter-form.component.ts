import { Component, computed, inject, output } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { TranslocoDirective } from '@jsverse/transloco';
import { BusinessTypesStore } from '../../store/business-types/business-types.store';
import { BusinessStore } from '../../store/business/business.store';
import { SessionStore } from '../../store/session/session.store';
import { TagStore } from '../../store/tag/tag.store';
import { BUSINESS_STATUS_OPTIONS } from '../../models/business-status';

@Component({
  selector: 'app-business-filter-form',
  templateUrl: './business-filter-form.component.html',
  styleUrls: ['./business-filter-form.component.scss'],
  imports: [FormsModule, IonicModule, ReactiveFormsModule, TranslocoDirective]
})
export class BusinessFilterFormComponent {
  readonly businessStore = inject(BusinessStore);
  readonly businessTypeStore = inject(BusinessTypesStore);
  readonly sessionStore = inject(SessionStore);
  readonly tagStore = inject(TagStore);

  submitFilter = output<void>();

  readonly businessTypeViewModel = computed(() =>
    this.businessTypeStore.businessTypesViewModel()
  );

  readonly sessionViewModel = computed(() =>
    this.sessionStore.sessionsViewModel()
  );

  readonly tagViewModel = computed(() => this.tagStore.tagsViewModel());

  tagCheckboxes = computed(() =>
    this.tagViewModel().tags.map((tag) => ({
      ...tag,
      checked: this.businessStore.query().tagIds.includes(tag.ID)
    }))
  );

  /** `null` is the "all sessions" option in the picker. */
  selectedSessionId: number | null =
    this.businessStore.query().sessionId ?? null;

  businessTypeCheckboxes = computed(() =>
    this.businessTypeViewModel().types.map((type) => ({
      ...type,
      checked: this.businessStore
        .query()
        .businessTypes.some((t) => t.ID === type.ID)
    }))
  );

  businessStatusCheckboxes = computed(() =>
    BUSINESS_STATUS_OPTIONS.map((option) => ({
      ...option,
      checked: this.businessStore
        .query()
        .businessStatuses.some((s) => s.id === option.id)
    }))
  );

  onSubmit() {
    this.submitFilter.emit();
    this.businessStore.updateQuery({
      ...this.businessStore.query(),
      sessionId: this.selectedSessionId,
      businessTypes: this.businessTypeCheckboxes().filter(
        (type) => type.checked
      ),
      businessStatuses: this.businessStatusCheckboxes()
        .filter((status) => status.checked)
        .map(({ id, ids }) => ({ id, ids })),
      tagIds: this.tagCheckboxes()
        .filter((tag) => tag.checked)
        .map((tag) => tag.ID)
    });
  }
}
