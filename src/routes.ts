import { Route } from '@angular/router';

export const APP_ROUTES: Route[] = [
  {
    path: 'business',
    loadChildren: () =>
      import('./app/business/routes').then((mod) => mod.BUSINESS_ROUTES)
  },
  {
    path: 'council-member',
    loadChildren: () =>
      import('./app/council-member/routes').then(
        (mod) => mod.COUNCIL_MEMBER_ROUTES
      )
  },
  {
    path: 'votes',
    loadChildren: () =>
      import('./app/votes/routes').then((mod) => mod.VOTE_ROUTES)
  },
  {
    path: '',
    loadChildren: () => import('./app/layout/routes').then((m) => m.TAB_ROUTES)
  }
];
