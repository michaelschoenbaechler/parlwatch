import { Route } from '@angular/router';
import { businessDetailRoute } from '../business/routes';
import { councilMemberDetailRoute } from '../council-member/routes';
import {
  activeParliamentRedirectGuard,
  parliamentKeyGuard
} from '../parliament/guards/parliament.guards';

/** See `BUSINESS_ROUTES` for the parliament segment and the legacy redirects. */
export const VOTE_ROUTES: Route[] = [
  {
    path: '',
    pathMatch: 'full',
    canActivate: [activeParliamentRedirectGuard],
    children: []
  },
  { path: 'detail/:id', redirectTo: 'ch/detail/:id' },
  { path: 'business/detail/:id', redirectTo: 'ch/business/detail/:id' },
  {
    path: 'council-member/detail/:id',
    redirectTo: 'ch/council-member/detail/:id'
  },
  {
    path: ':parliament',
    canActivate: [parliamentKeyGuard],
    children: [
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
    ]
  }
];
