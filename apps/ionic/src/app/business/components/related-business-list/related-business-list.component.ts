import {
  ChangeDetectionStrategy,
  Component,
  input,
  output
} from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { RelatedBusiness } from 'swissparl';

@Component({
  selector: 'app-related-business-list',
  templateUrl: './related-business-list.component.html',
  styleUrls: ['./related-business-list.component.scss'],
  imports: [IonicModule],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RelatedBusinessListComponent {
  readonly relatedBusinesses = input.required<RelatedBusiness[]>();
  readonly businessSelected = output<number>();

  /**
   * Open a cross-referenced business, ignoring rows the API gives no id for.
   * @param related The row that was tapped
   */
  onSelect(related: RelatedBusiness) {
    if (related.RelatedBusinessNumber !== undefined) {
      this.businessSelected.emit(related.RelatedBusinessNumber);
    }
  }
}
