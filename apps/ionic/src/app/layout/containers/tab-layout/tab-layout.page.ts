import { Component, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { StatusBar, Style } from '@capacitor/status-bar';
import { IonicModule, Platform } from '@ionic/angular';
import { TranslocoDirective } from '@jsverse/transloco';
import { filter } from 'rxjs';
import { isCantonKey } from '../../../parliament/models/parliament.model';

/** Index of the parliament segment in `/layout/<feature>/<parliament>/...`. */
const PARLIAMENT_SEGMENT = 3;

@Component({
  selector: 'app-tab-layout',
  templateUrl: 'tab-layout.page.html',
  styleUrls: ['tab-layout.page.scss'],
  imports: [IonicModule, TranslocoDirective]
})
export class TabLayoutPage {
  private readonly router = inject(Router);
  private readonly platform = inject(Platform);

  constructor() {
    // The status bar sits on the toolbar: light text on the federal red,
    // dark text on the white cantonal one. Following the URL keeps it right
    // across pushes, pops and tab switches alike.
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntilDestroyed()
      )
      .subscribe((event) => this.syncStatusBar(event.urlAfterRedirects));
  }

  private syncStatusBar(url: string) {
    if (!this.platform.is('capacitor')) return;

    const segment = url.split('?')[0].split('/')[PARLIAMENT_SEGMENT];
    StatusBar.setStyle({
      style: isCantonKey(segment) ? Style.Light : Style.Dark
    }).catch((err) => console.warn(err));
  }
}
