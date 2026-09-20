import { DOCUMENT } from '@angular/common';
import { inject, Injectable } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { applyCantonTheme } from '../directives/cantonal-theme.directive';
import { cantonTheme, toParliamentKey } from '../models/parliament.model';
import { urlParliament } from '../models/parliament-routes';

/** Themes the body so hoisted overlays and the tab bar follow the page. */
@Injectable({ providedIn: 'root' })
export class ParliamentThemeService {
  private readonly router = inject(Router);
  private readonly body = inject(DOCUMENT).body;

  constructor() {
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event) =>
        applyCantonTheme(
          this.body,
          cantonTheme(toParliamentKey(urlParliament(event.urlAfterRedirects)))
        )
      );
  }
}
