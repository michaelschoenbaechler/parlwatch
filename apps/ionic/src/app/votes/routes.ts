import { Route } from '@angular/router';
import { businessDetailRoute } from '../business/routes';
import { councilMemberDetailRoute } from '../council-member/routes';

export const VOTE_ROUTES: Route[] = [
  {
    path: '',
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
  // Both reached from the vote detail page.
  businessDetailRoute,
  councilMemberDetailRoute
];
