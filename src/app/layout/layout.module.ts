import { IonicModule } from '@ionic/angular';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TabLayoutPage } from './containers/tab-layout/tab-layout.page';
import { TabLayoutRoutingModule } from './layout-routing.module';
import { WelcomeComponent } from './containers/welcome/welcome.component';

@NgModule({
  imports: [IonicModule, CommonModule, FormsModule, TabLayoutRoutingModule],
  declarations: [TabLayoutPage, WelcomeComponent]
})
export class TabLayoutModule {}
