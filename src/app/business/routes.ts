import { Route } from '@angular/router';

export const BUSINESS_ROUTES: Route[] = [
  {
    path: 'list',
    loadComponent: () =>
      import('./containers/business-list/business-list.page').then(
        (m) => m.BusinessListPage
      )
  },
  {
    path: 'detail/:id',
    loadComponent: () =>
      import('./containers/business-detail/business-detail.page').then(
        (m) => m.BusinessDetailPage
      )
  },
  {
    path: '',
    redirectTo: 'list',
    pathMatch: 'full'
  }
];
