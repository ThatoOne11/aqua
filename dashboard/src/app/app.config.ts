import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
  inject,
  provideAppInitializer,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import {
  provideHttpClient,
  withFetch,
  withInterceptors,
} from '@angular/common/http';

import { routes } from './app.routes';
import { loadingInterceptor } from '@core/interceptors/loading.interceptor';
import { hydrateSessionStore } from '@core/store/session.store';
import { AuthService } from '@core/services/auth/auth.service';
import { provideNgxSkeletonLoader } from 'ngx-skeleton-loader';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { provideMomentDateAdapter } from '@angular/material-moment-adapter';
import { MAT_DATE_FORMATS } from '@angular/material/core';
import { MY_DATE_FORMATS } from '@client-dashboard/components/data-visualization/filters/filters';

function appInitializer() {
  const auth = inject(AuthService);

  try {
    hydrateSessionStore();
  } catch (e) {
    // keep bootstrap resilient
    console.warn('[appInitializer] hydrateSessionStore failed:', e);
  }

  // If async, return a Promise (Angular will await it)
  return typeof auth.initialiseSession === 'function'
    ? Promise.resolve(auth.initialiseSession())
    : undefined;
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideHttpClient(withFetch(), withInterceptors([loadingInterceptor])),
    provideRouter(routes),
    provideAppInitializer(appInitializer),
    provideNgxSkeletonLoader({
      theme: {
        extendsFromRoot: true,
        height: '50px',
      },
    }),
    provideCharts(withDefaultRegisterables()),
    provideMomentDateAdapter(),
    { provide: MAT_DATE_FORMATS, useValue: MY_DATE_FORMATS },
  ],
};
