import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MemberListComponent } from './containers/member-list/member-list.component';
import { MemberDetailComponent } from './containers/member-detail/member-detail.component';
import { CouncilMemberCardComponent } from './components/council-member-card/council-member-card.component';
import { SharedModule } from '../shared/shared.module';

const routes: Routes = [
  {
    path: 'council-member/detail/:id',
    component: MemberDetailComponent
  }
];

@NgModule({
  declarations: [
    MemberDetailComponent,
    MemberListComponent,
    CouncilMemberCardComponent
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
export class CouncileMemberModule {}
