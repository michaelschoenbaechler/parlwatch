import { Route } from '@angular/router';

export const COUNCIL_MEMBER_ROUTES: Route[] = [
  {
    path: 'list',
    loadComponent: () =>
      import('./containers/member-list/member-list.page').then(
        (m) => m.MemberListPage
      )
  },
  {
    path: 'detail/:id',
    loadComponent: () =>
      import('./containers/member-detail/member-detail.page').then(
        (m) => m.MemberDetailPage
      )
  },
  {
    path: '',
    redirectTo: 'list',
    pathMatch: 'full'
  }
];
