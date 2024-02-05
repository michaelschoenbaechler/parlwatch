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
        loadChildren: () =>
          import('../votes/routes').then((mod) => mod.VOTE_ROUTES)
      },
      {
        path: 'council-member',
        loadChildren: () =>
          import('../council-member/routes').then(
            (mod) => mod.COUNCIL_MEMBER_ROUTES
          )
      },
      {
        path: 'business',
        loadChildren: () =>
          import('../business/routes').then((mod) => mod.BUSINESS_ROUTES)
      },
      {
        path: 'settings',
        loadComponent: () =>
          import(
            '../settings/containers/settings-overview/settings-overview.component'
          ).then((mod) => mod.SettingsOverviewComponent)
      },
      {
        path: '',
        redirectTo: '/layout/votes/list',
        pathMatch: 'full'
      }
    ]
  },
  {
    path: 'welcome',
    loadComponent: () =>
      import('./containers/welcome/welcome.component').then(
        (mod) => mod.WelcomeComponent
      )
  },
  {
    path: '',
    redirectTo: '/layout/votes',
    pathMatch: 'full'
  }
];
