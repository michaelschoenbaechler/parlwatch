import { Route } from '@angular/router';

export const VOTE_ROUTES: Route[] = [
  {
    path: 'list',
    loadComponent: () =>
      import('./containers/vote-list/vote-list.page').then(
        (m) => m.VoteListPage
      )
  },
  {
    path: 'detail/:id',
    loadComponent: () =>
      import('./containers/vote-detail/vote-detail.page').then(
        (m) => m.VoteDetailPage
      )
  },
  {
    path: '',
    redirectTo: 'list',
    pathMatch: 'full'
  }
];
