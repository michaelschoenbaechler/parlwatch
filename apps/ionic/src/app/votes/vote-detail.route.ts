import { Route } from '@angular/router';

/**
 * Vote detail as reached from another tab. See `businessDetailRoute`.
 *
 * Lives outside `routes.ts` on purpose: `VOTE_ROUTES` pulls in
 * `businessDetailRoute`, so importing this from `BUSINESS_ROUTES` would close
 * an evaluation cycle between the two route modules.
 */
export const voteDetailRoute: Route = {
  path: 'votes/detail/:id',
  loadComponent: () =>
    import('./containers/vote-detail/vote-detail.page').then(
      (m) => m.VoteDetailPage
    )
};
