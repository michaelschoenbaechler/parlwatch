import {
  ChangeDetectionStrategy,
  Component,
  input,
  output
} from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { ODataDateTimePipe } from '@parlwatch/shared/common/pipes/o-data-date-time.pipe';
import { BusinessDocument } from '../../models/cantonal-business';

@Component({
  selector: 'app-business-document-list',
  template: `
    <ion-list class="document-list" lines="full">
      @for (document of documents(); track document.id; let last = $last) {
        <ion-item
          button
          detail="false"
          [lines]="last ? 'none' : 'full'"
          (click)="documentSelected.emit(document)"
        >
          <ion-icon name="document-text-outline" slot="start" size="small" />
          <ion-label class="ion-text-wrap">
            <h3>{{ document.name }}</h3>
            @if (document.date) {
              <p>{{ document.date | oDataDateTime }}</p>
            }
          </ion-label>
          <ion-icon name="open-outline" slot="end" size="small" />
        </ion-item>
      }
    </ion-list>
  `,
  styles: `
    .document-list {
      padding: 0;
      background: transparent;
    }

    ion-item {
      --background: transparent;
      --padding-start: 0;
      --inner-padding-end: 0;
      --border-color: #ebebeb;
    }

    ion-icon {
      color: var(--ion-color-primary);
    }

    ion-icon[slot='start'] {
      margin-inline-end: 0.75rem;
    }

    ion-label h3 {
      font-size: 15px;
      font-weight: 600;
      color: var(--ion-color-dark);
      overflow-wrap: anywhere;
    }

    ion-label p {
      margin: 0.125rem 0 0 0;
      font-size: 13px;
      color: #666666;
    }
  `,
  imports: [IonicModule, ODataDateTimePipe],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BusinessDocumentListComponent {
  readonly documents = input.required<BusinessDocument[]>();
  readonly documentSelected = output<BusinessDocument>();
}
