import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { StatusBar, Style } from '@capacitor/status-bar';
import { IonicModule, Platform } from '@ionic/angular';
import { TranslocoDirective } from '@jsverse/transloco';
import { StorageService } from '@parlwatch/shared/common/services';
import { markIntroSeen } from '../../guard/intro.guard';

interface Feature {
  key: string;
  icon: string;
}

@Component({
  selector: 'app-welcome',
  templateUrl: './welcome.page.html',
  styleUrls: ['./welcome.page.scss'],
  imports: [IonicModule, TranslocoDirective]
})
export class WelcomePage implements OnInit {
  private readonly router = inject(Router);
  private readonly platform = inject(Platform);
  private readonly storage = inject(StorageService);

  readonly features: Feature[] = [
    { key: 'overview', icon: 'podium-outline' },
    { key: 'cantons', icon: 'map-outline' },
    { key: 'watch', icon: 'eye-outline' },
    { key: 'openSource', icon: 'code-slash-outline' }
  ];

  ngOnInit(): void {
    this.setStatusBarStyle(Style.Light);
  }

  async discover() {
    await this.leave(['/layout/votes']);
  }

  async chooseCantons() {
    await this.leave(['/layout/settings']);
  }

  private async leave(path: string[]) {
    await markIntroSeen(this.storage);
    this.setStatusBarStyle(Style.Dark);
    await this.router.navigate(path);
  }

  private setStatusBarStyle(style: Style) {
    if (!this.platform.is('capacitor')) return;
    StatusBar.setStyle({ style }).catch((err) => console.warn(err));
  }
}
