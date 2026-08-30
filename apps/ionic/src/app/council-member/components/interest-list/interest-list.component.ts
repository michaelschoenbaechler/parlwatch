import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { TranslocoDirective } from '@jsverse/transloco';
import { InterestVm } from '../../models/person-interest';

@Component({
  selector: 'app-interest-list',
  templateUrl: './interest-list.component.html',
  styleUrls: ['./interest-list.component.scss'],
  imports: [IonicModule, TranslocoDirective],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InterestListComponent {
  /** The register entries of one legal form, as one card renders them. */
  readonly interests = input.required<InterestVm[]>();
}
