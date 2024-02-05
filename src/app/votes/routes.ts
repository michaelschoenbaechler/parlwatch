import { Route } from '@angular/router';

export const VOTE_ROUTES: Route[] = [
  {
    path: 'list',
    loadComponent: () =>
      import('./container/vote-list/vote-list.page').then(
        (m) => m.VoteListComponent
      )
  },
  {
    path: 'detail/:id',
    loadComponent: () =>
      import('./container/vote-detail/vote-detail.page').then(
        (m) => m.VoteDetailPage
      )
  },
  {
    path: '',
    redirectTo: 'list',
    pathMatch: 'full'
  }
];
