import { enableProdMode, importProvidersFrom } from '@angular/core';

import { environment } from './environments/environment';
import { provideRouter, RouteReuseStrategy } from '@angular/router';
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { IonicModule, IonicRouteStrategy } from '@ionic/angular';
import { IonicStorageModule } from '@ionic/storage-angular';

if (environment.production) {
  enableProdMode();
}

bootstrapApplication(AppComponent, {
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    importProvidersFrom(IonicModule.forRoot(), IonicStorageModule.forRoot()),
    provideRouter([
      {
        path: '',
        loadChildren: () =>
          import('./app/layout/routes').then((m) => m.TAB_ROUTES)
      }
    ])
  ]
}).then(() => console.log('Application started'));
