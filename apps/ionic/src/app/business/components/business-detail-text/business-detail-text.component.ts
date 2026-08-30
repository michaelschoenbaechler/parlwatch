import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  signal
} from '@angular/core';
import { Business } from 'swissparl';
import { IonicModule } from '@ionic/angular';
import { TranslocoDirective } from '@jsverse/transloco';
import { TextCardComponent } from '../../../shared/components/text-card/text-card.component';
import { SafeHtmlPipe } from '../../../shared/pipes/safe-html.pipe';
import {
  BusinessTextSection,
  toBusinessTextSections
} from '../../models/business-text';

@Component({
  selector: 'app-business-detail-text',
  templateUrl: './business-detail-text.component.html',
  styleUrls: ['./business-detail-text.component.scss'],
  imports: [IonicModule, TextCardComponent, SafeHtmlPipe, TranslocoDirective],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BusinessDetailTextComponent {
  readonly business = input.required<Business>();

  readonly sections = computed(() => toBusinessTextSections(this.business()));

  /** The section being read in full, or null while the modal is closed. */
  readonly openSection = signal<BusinessTextSection | null>(null);

  /**
   * Open a section's full text.
   * @param section The section whose excerpt was tapped
   */
  readSection(section: BusinessTextSection) {
    this.openSection.set(section);
  }

  closeSection() {
    this.openSection.set(null);
  }
}
