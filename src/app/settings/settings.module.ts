import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SettingsOverviewComponent } from './containers/settings-overview/settings-overview.component';
import { IonicModule } from '@ionic/angular';

@NgModule({
  declarations: [SettingsOverviewComponent],
  imports: [IonicModule, CommonModule]
})
export class SettingsModule {}
