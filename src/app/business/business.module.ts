import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BusinessListComponent } from './container/business-list/business-list.page';
import { BusinessDetailPage } from './container/business-detail/business-detail.page';
import { BusinessCardComponent } from './components/business-card/business-card.component';
import { BusinessDetailTextComponent } from './components/business-detail-text/business-detail-text.component';
import { SharedModule } from '../shared/shared.module';

const routes: Routes = [
  {
    path: 'business/detail/:id',
    component: BusinessDetailPage
  }
];

@NgModule({
  declarations: [
    BusinessListComponent,
    BusinessDetailPage,
    BusinessCardComponent,
    BusinessDetailTextComponent
  ],
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule.forChild(routes),
    SharedModule
  ]
})
export class BusinessModule {}
