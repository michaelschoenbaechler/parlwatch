import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { StatusBar, Style } from '@capacitor/status-bar';
import { IonicModule, Platform } from '@ionic/angular';
import { TranslocoDirective } from '@jsverse/transloco';

@Component({
  selector: 'app-welcome',
  templateUrl: './welcome.page.html',
  styleUrls: ['./welcome.page.scss'],
  standalone: true,
  imports: [IonicModule, TranslocoDirective]
})
export class WelcomePage implements OnInit {
  constructor(
    private router: Router,
    private platform: Platform
  ) {}

  ngOnInit(): void {
    this.setStatusBarStyle(Style.Light);
  }

  onDiscover() {
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
