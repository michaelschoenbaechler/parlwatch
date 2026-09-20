import { Route } from '@angular/router';
import {
  activeParliamentListGuard,
  activeParliamentRedirectGuard,
  parliamentKeyGuard
} from '@parlwatch/shared/parliament/guards/parliament.guards';
import { voteDetailRoute } from '../votes/vote-detail.route';

const loadBusinessDetail = () =>
  import('./containers/business-detail/business-detail.page').then(
    (m) => m.BusinessDetailPage
  );

/**
 * Business detail as reached from another tab. Registering it under the tab
 * that links to it keeps the user inside that tab's navigation stack, so the
 * tab bar stays put and the selected tab never jumps.
 */
export const businessDetailRoute: Route = {
  path: 'business/detail/:id',
  loadComponent: loadBusinessDetail
};

export const BUSINESS_ROUTES: Route[] = [
  {
    path: '',
    pathMatch: 'full',
    canActivate: [activeParliamentRedirectGuard],
    children: []
  },
  { path: 'detail/:id', redirectTo: 'ch/detail/:id' },
  { path: 'votes/detail/:id', redirectTo: 'ch/votes/detail/:id' },
  {
    path: ':parliament',
    canActivate: [parliamentKeyGuard],
    children: [
      {
        path: '',
        canActivate: [activeParliamentListGuard],
        loadComponent: () =>
          import('./containers/business-list/business-list.page').then(
            (m) => m.BusinessListPage
          )
      },
      {
        path: 'detail/:id',
        loadComponent: loadBusinessDetail
      },
      // Reached from the vote list on the business detail page.
      voteDetailRoute
    ]
  }
];
