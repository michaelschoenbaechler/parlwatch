import { computed, Directive, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { cantonTheme } from '../models/parliament.model';
import { routeParliament } from '../models/parliament-routes';

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
