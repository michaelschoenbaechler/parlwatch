import { Route } from '@angular/router';

export const COUNCIL_MEMBER_ROUTES: Route[] = [
  {
    path: 'detail/:id',
    loadComponent: () =>
      import('./containers/member-detail/member-detail.page').then(
        (m) => m.MemberDetailPage
      )
  }
];
