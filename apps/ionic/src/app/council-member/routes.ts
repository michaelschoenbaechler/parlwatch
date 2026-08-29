import { Route } from '@angular/router';
import { businessDetailRoute } from '../business/routes';

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
  businessDetailRoute
];
