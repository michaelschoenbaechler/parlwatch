import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Platform } from '@ionic/angular';

@Component({
  selector: 'app-welcome',
  templateUrl: './welcome.component.html',
  styleUrls: ['./welcome.component.scss']
})
export class WelcomeComponent implements OnInit {
  constructor(
    private router: Router,
    private platform: Platform
  ) {}

  ngOnInit(): void {
    this.setStatusBarStyle(Style.Light);
  }

  onDiscover() {
    this.setStatusBarStyle(Style.Dark);
    this.router.navigate(['/layout/business']);
  }

  setStatusBarStyle(style: Style) {
    if (!this.platform.is('capacitor')) return;
    StatusBar.setStyle({ style }).catch((err) => {
      console.warn(err);
    });
  }
}
