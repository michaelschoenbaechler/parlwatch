import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { VoteStore } from '../store/vote';

/**
 * Pre-activation guard for the votes list.
 * If `BusinessShortNumber` exists in the query params, it updates the VoteStore searchTerm
 * and redirects to the same route without the param to keep the URL clean.
 * @param route Activated route snapshot for the target route
 * @param _state Router state snapshot (unused)
 * @returns true to proceed or a UrlTree to redirect without the query param
 */
export const votesQueryGuard: CanActivateFn = (route, _state) => {
  const router = inject(Router);
  const store = inject(VoteStore);

  const businessShortNumber = route.queryParamMap.get('BusinessShortNumber');
  if (businessShortNumber) {
    const searchTerm = String(businessShortNumber);
    store.updateQuery({ ...store.query(), searchTerm });

    // Redirect to the same route without the BusinessShortNumber param
    const { BusinessShortNumber, ...rest } = route.queryParams as Record<
      string,
      any
    >;
    return router.createUrlTree(['/layout', 'votes'], { queryParams: rest });
  }

  return true;
};
