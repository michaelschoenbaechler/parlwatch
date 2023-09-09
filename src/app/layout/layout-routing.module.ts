import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { VoteListComponent } from '../votes/container/vote-list/vote-list.page';
import { MemberListComponent } from '../council-member/containers/member-list/member-list.component';
import { BusinessListComponent } from '../business/container/business-list/business-list.page';
import { SettingsOverviewComponent } from '../settings/containers/settings-overview/settings-overview.component';
import { TabLayoutPage } from './containers/tab-layout/tab-layout.page';
import { WelcomeComponent } from './containers/welcome/welcome.component';
import { firstTimeOpenGuard } from './guard/first-time-open.guard';

const routes: Routes = [
  {
    path: 'layout',
    component: TabLayoutPage,
    canActivate: [firstTimeOpenGuard],
    children: [
      {
        path: 'votes',
        component: VoteListComponent
      },
      {
        path: 'council-member',
        component: MemberListComponent
      },
      {
        path: 'business',
        component: BusinessListComponent
      },
      {
        path: 'settings',
        component: SettingsOverviewComponent
      },
      {
        path: '',
        redirectTo: '/layout/business',
        pathMatch: 'full'
      }
    ]
  },
  {
    path: 'welcome',
    component: WelcomeComponent
  },
  {
    path: '',
    redirectTo: '/layout/business',
    pathMatch: 'full'
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)]
})
export class TabLayoutRoutingModule {}
