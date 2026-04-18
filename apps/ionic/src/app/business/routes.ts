import { Route } from '@angular/router';

export const BUSINESS_ROUTES: Route[] = [
  {
    path: 'detail/:id',
    loadComponent: () =>
      import('./containers/business-detail/business-detail.page').then(
        (m) => m.BusinessDetailPage
      )
  }
];
