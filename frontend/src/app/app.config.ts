import { ApplicationConfig, inject, provideAppInitializer } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { routes } from './app.routes';
import { API_BASE_URL } from './core/services/api-base.token';
import { environment } from '../environments/environment';
import { credentialsInterceptor } from './core/interceptors/credentials.interceptor';
import { ThemeService } from './core/services/theme.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptors([credentialsInterceptor])),
    provideCharts(withDefaultRegisterables()),
    provideAppInitializer(() => {
      inject(ThemeService);
    }),
    { provide: API_BASE_URL, useValue: environment.apiBaseUrl }
  ]
};
