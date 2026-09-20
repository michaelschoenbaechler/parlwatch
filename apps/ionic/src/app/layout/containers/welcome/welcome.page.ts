import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { StatusBar, Style } from '@capacitor/status-bar';
import { IonicModule, Platform } from '@ionic/angular';
import { TranslocoDirective } from '@jsverse/transloco';
import { CantonPickerComponent } from '@parlwatch/shared/parliament/components';
import { ParliamentStore } from '@parlwatch/shared/parliament/store';

@Component({
  selector: 'app-welcome',
  templateUrl: './welcome.page.html',
  styleUrls: ['./welcome.page.scss'],
  imports: [IonicModule, TranslocoDirective, CantonPickerComponent]
})
export class WelcomePage implements OnInit {
  private router = inject(Router);
  private platform = inject(Platform);
  readonly parliamentStore = inject(ParliamentStore);

  readonly showCantonStep = signal(false);

  ngOnInit(): void {
    this.setStatusBarStyle(Style.Light);
  }

  onDiscover() {
    this.showCantonStep.set(true);
  }

  onStart() {
    this.setStatusBarStyle(Style.Dark);
    this.router.navigate(['/layout/votes']);
  }

  setStatusBarStyle(style: Style) {
    if (!this.platform.is('capacitor')) return;
    StatusBar.setStyle({ style }).catch((err) => {
      console.warn(err);
    });
  }
}
