import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { VoteListComponent } from './container/vote-list/vote-list.page';
import { VoteDetailPage } from './container/vote-detail/vote-detail.page';
import { VoteCardComponent } from './components/vote-card/vote-card.component';
import { SharedModule } from '../shared/shared.module';

const routes: Routes = [
  {
    path: 'votes/detail/:id',
    component: VoteDetailPage
  }
];

@NgModule({
  declarations: [VoteListComponent, VoteDetailPage, VoteCardComponent],
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule.forChild(routes),
    SharedModule
  ]
})
export class VotesModule {}
