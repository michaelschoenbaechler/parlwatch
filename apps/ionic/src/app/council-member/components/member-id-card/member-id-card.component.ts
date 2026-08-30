import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { LowerCasePipe } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { TranslocoDirective } from '@jsverse/transloco';
import { MemberCouncil } from 'swissparl';
import { ODataDateTimePipe } from '../../../shared/pipes/o-data-date-time.pipe';

/**
 * The member detail page's header: an identity card for one council member.
 *
 * Only fields the API fills in for practically every member are shown, so the
 * card never renders a half-empty grid. Rank, marital status and number of
 * children are deliberately left out: they are missing for a third to two
 * thirds of members.
 */
@Component({
  selector: 'app-member-id-card',
  templateUrl: './member-id-card.component.html',
  styleUrls: ['./member-id-card.component.scss'],
  imports: [IonicModule, LowerCasePipe, ODataDateTimePipe, TranslocoDirective],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MemberIdCardComponent {
  readonly councilMember = input.required<MemberCouncil>();
}
