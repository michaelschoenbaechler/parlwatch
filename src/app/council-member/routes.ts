import { Route } from '@angular/router';

export const COUNCIL_MEMBER_ROUTES: Route[] = [
  {
    path: 'list',
    loadComponent: () =>
      import('./containers/member-list/member-list.component').then(
        (m) => m.MemberListComponent
      )
  },
  {
    path: 'detail/:id',
    loadComponent: () =>
      import('./containers/member-detail/member-detail.component').then(
        (m) => m.MemberDetailComponent
      )
  },
  {
    path: '',
    redirectTo: 'list',
    pathMatch: 'full'
  }
];
