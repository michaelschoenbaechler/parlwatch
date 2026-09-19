import { computed, Directive, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { cantonTheme } from '../models/parliament.model';
import { routeParliament } from '../models/parliament-routes';

/**
 * Dresses a page in its canton.
 *
 * Reads the parliament from the page's own route, so a page only has to list
 * the directive as a host directive. For a canton it sets the `cantonal`
 * class, which the global stylesheet turns into the neutral white theme, and
 * the two heraldic colours as custom properties for the accent line and the
 * card stripes. Federal pages get neither and keep their look untouched.
 */
@Directive({
  selector: '[appCantonalTheme]',
  host: {
    '[class.cantonal]': '!!theme()',
    '[style.--canton-colour-a]': 'theme()?.colours?.[0] ?? null',
    '[style.--canton-colour-b]': 'theme()?.colours?.[1] ?? null'
  }
})
export class CantonalThemeDirective {
  private readonly route = inject(ActivatedRoute);

  readonly theme = computed(() => cantonTheme(routeParliament(this.route)));
}
