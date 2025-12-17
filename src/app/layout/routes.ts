import { Routes } from '@angular/router';
import { TabLayoutPage } from './containers/tab-layout/tab-layout.page';
import { firstTimeOpenGuard } from './guard/first-time-open.guard';

export const TAB_ROUTES: Routes = [
  {
    path: 'layout',
    component: TabLayoutPage,
    canActivate: [firstTimeOpenGuard],
    children: [
      {
        path: 'votes',
        loadComponent: () =>
          import('../votes/containers/vote-list/vote-list.page').then(
            (m) => m.VoteListPage
          )
      },
      {
        path: 'council-member',
        loadComponent: () =>
          import('../council-member/containers/member-list/member-list.page').then(
            (m) => m.MemberListPage
          )
      },
      {
        path: 'business',
        loadComponent: () =>
          import('../business/containers/business-list/business-list.page').then(
            (m) => m.BusinessListPage
          )
      },

      {
        path: 'settings',
        loadComponent: () =>
          import('../settings/containers/settings-overview/settings-overview.page').then(
            (mod) => mod.SettingsOverviewPage
          )
      }
    ]
  },
  {
    path: 'welcome',
    loadComponent: () =>
      import('./containers/welcome/welcome.page').then((mod) => mod.WelcomePage)
  },
  {
    path: '',
    redirectTo: '/layout/votes',
    pathMatch: 'full'
  }
];
