import { computed, Directive, effect, ElementRef, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { cantonTheme, CantonTheme } from '../models/parliament.model';
import { routeParliament } from '../models/parliament-routes';

export function applyCantonTheme(
  element: HTMLElement,
  theme: CantonTheme | null
): void {
  element.classList.toggle('cantonal', !!theme);
  if (theme) {
    element.style.setProperty('--canton-colour-a', theme.colours[0]);
    element.style.setProperty('--canton-colour-b', theme.colours[1]);
  } else {
    element.style.removeProperty('--canton-colour-a');
    element.style.removeProperty('--canton-colour-b');
  }
}

@Directive({ selector: '[appCantonalTheme]' })
export class CantonalThemeDirective {
  private readonly route = inject(ActivatedRoute);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly theme = computed(() => cantonTheme(routeParliament(this.route)));

  constructor() {
    effect(() => applyCantonTheme(this.host.nativeElement, this.theme()));
  }
}
