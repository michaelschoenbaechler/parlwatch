import { enableProdMode, importProvidersFrom } from '@angular/core';
import { provideRouter, RouteReuseStrategy } from '@angular/router';
import { bootstrapApplication } from '@angular/platform-browser';
import { IonicModule, IonicRouteStrategy } from '@ionic/angular';
import { IonicStorageModule } from '@ionic/storage-angular';
import { AppComponent } from './app/app.component';
import { environment } from './environments/environment';
import { APP_ROUTES } from './routes';

if (environment.production) {
  enableProdMode();
}

bootstrapApplication(AppComponent, {
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    importProvidersFrom(IonicModule.forRoot(), IonicStorageModule.forRoot()),
    provideRouter(APP_ROUTES)
  ]
}).then(() => console.log('Application started'));
