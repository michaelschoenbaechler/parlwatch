import { DOCUMENT } from '@angular/common';
import { inject, Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { cantonTheme, toParliamentKey } from '../models/parliament.model';

@Injectable({ providedIn: 'root' })
export class ParliamentThemeService {
  private readonly router = inject(Router);
  private readonly body = inject(DOCUMENT).body;

  constructor() {
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => this.apply());
  }

  private apply(): void {
    const theme = cantonTheme(
      toParliamentKey(routeParliament(this.router.routerState.snapshot.root))
    );

    this.body.classList.toggle('cantonal', !!theme);
    if (theme) {
      this.body.style.setProperty('--canton-colour-a', theme.colours[0]);
      this.body.style.setProperty('--canton-colour-b', theme.colours[1]);
    } else {
      this.body.style.removeProperty('--canton-colour-a');
      this.body.style.removeProperty('--canton-colour-b');
    }
  }
}

function routeParliament(root: ActivatedRouteSnapshot): string | null {
  let parliament: string | null = null;
  for (
    let route: ActivatedRouteSnapshot | null = root;
    route;
    route = route.firstChild
  ) {
    parliament = route.paramMap.get('parliament') ?? parliament;
  }
  return parliament;
}
