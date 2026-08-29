import { Route } from '@angular/router';

export const APP_ROUTES: Route[] = [
  {
    path: '',
    loadChildren: () => import('./app/layout/routes').then((m) => m.TAB_ROUTES)
  }
];
