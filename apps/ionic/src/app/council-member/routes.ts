import { Route } from '@angular/router';
import { businessDetailRoute } from '../business/routes';
import { voteDetailRoute } from '../votes/vote-detail.route';
import {
  activeParliamentRedirectGuard,
  parliamentKeyGuard
} from '../parliament/guards/parliament.guards';

const loadMemberDetail = () =>
  import('./containers/member-detail/member-detail.page').then(
    (m) => m.MemberDetailPage
  );

/**
 * Council member detail as reached from another tab. See `businessDetailRoute`.
 */
export const councilMemberDetailRoute: Route = {
  path: 'council-member/detail/:id',
  loadComponent: loadMemberDetail
};

export const COUNCIL_MEMBER_ROUTES: Route[] = [
  {
    path: '',
    pathMatch: 'full',
    canActivate: [activeParliamentRedirectGuard],
    children: []
  },
  { path: 'detail/:id', redirectTo: 'ch/detail/:id' },
  { path: 'business/detail/:id', redirectTo: 'ch/business/detail/:id' },
  { path: 'votes/detail/:id', redirectTo: 'ch/votes/detail/:id' },
  {
    path: ':parliament',
    canActivate: [parliamentKeyGuard],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./containers/member-list/member-list.page').then(
            (m) => m.MemberListPage
          )
      },
      {
        path: 'detail/:id',
        loadComponent: loadMemberDetail
      },
      // Reached from the member detail page.
      businessDetailRoute,
      voteDetailRoute
    ]
  }
];
