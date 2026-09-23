import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Platform } from '@ionic/angular';
import { IntroComponent } from '@parlwatch/shared/common/components';
import { StorageService } from '@parlwatch/shared/common/services';
import { markIntroSeen } from '../../guard/intro.guard';

@Component({
  selector: 'app-welcome',
  template: '<app-intro (done)="discover()" />',
  imports: [IntroComponent]
})
export class WelcomePage implements OnInit {
  private readonly router = inject(Router);
  private readonly platform = inject(Platform);
  private readonly storage = inject(StorageService);

  ngOnInit(): void {
    this.setStatusBarStyle(Style.Light);
  }

  async discover() {
    await markIntroSeen(this.storage);
    this.setStatusBarStyle(Style.Dark);
    await this.router.navigate(['/layout/votes']);
  }

  private setStatusBarStyle(style: Style) {
    if (!this.platform.is('capacitor')) return;
    StatusBar.setStyle({ style }).catch((err) => console.warn(err));
  }
}
