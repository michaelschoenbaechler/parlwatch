import { Route } from '@angular/router';

export const VOTE_ROUTES: Route[] = [
  {
    path: 'detail/:id',
    loadComponent: () =>
      import('./containers/vote-detail/vote-detail.page').then(
        (m) => m.VoteDetailPage
      )
  }
];
