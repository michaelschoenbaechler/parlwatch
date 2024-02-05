import { Route } from '@angular/router';

export const BUSINESS_ROUTES: Route[] = [
  {
    path: 'list',
    loadComponent: () =>
      import('./container/business-list/business-list.page').then(
        (m) => m.BusinessListComponent
      )
  },
  {
    path: 'detail/:id',
    loadComponent: () =>
      import('./container/business-detail/business-detail.page').then(
        (m) => m.BusinessDetailPage
      )
  },
  {
    path: '',
    redirectTo: 'list',
    pathMatch: 'full'
  }
];
