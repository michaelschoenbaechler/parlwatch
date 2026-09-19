import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { StatusBar, Style } from '@capacitor/status-bar';
import { IonicModule, Platform } from '@ionic/angular';
import { TranslocoDirective } from '@jsverse/transloco';
import { CantonPickerComponent } from '../../../parliament/components/canton-picker/canton-picker.component';
import { ParliamentStore } from '../../../parliament/store/parliament.store';

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

  /** The optional canton step, shown after the welcome text. */
  readonly showCantonStep = signal(false);

  ngOnInit(): void {
    this.setStatusBarStyle(Style.Light);
  }

  onDiscover() {
    this.showCantonStep.set(true);
  }

  /**
   * Leave the welcome flow. Whatever was ticked in the canton step is
   * already in the store; skipping simply leaves the list empty.
   */
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
