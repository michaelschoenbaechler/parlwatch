import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input
} from '@angular/core';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import {
  ParlGroupTally,
  parlGroupTranslationKey
} from '../../models/vote-decision';
import { VotingBarComponent } from '../voting-bar/voting-bar.component';

@Component({
  selector: 'app-parl-group-breakdown',
  templateUrl: './parl-group-breakdown.component.html',
  styleUrls: ['./parl-group-breakdown.component.scss'],
  imports: [VotingBarComponent, TranslocoDirective],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ParlGroupBreakdownComponent {
  private readonly transloco = inject(TranslocoService);

  readonly groups = input.required<ParlGroupTally[]>();

  /**
   * Short faction label, falling back to the API's own abbreviation for codes
   * the app does not know, then to a label for members of no faction.
   * @param group The faction the row renders
   * @returns Localised faction name
   */
  label(group: ParlGroupTally): string {
    const key = parlGroupTranslationKey(group.code);
    if (key) {
      return this.transloco.translate(key);
    }

    return (
      group.abbreviation ||
      this.transloco.translate('votes.voteDetail.noParlGroup')
    );
  }
}
