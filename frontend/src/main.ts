import { LOCALE_ID } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { registerLocaleData } from '@angular/common';
import localeDe from '@angular/common/locales/de';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';

registerLocaleData(localeDe);

bootstrapApplication(AppComponent, {
  ...appConfig,
  providers: [...appConfig.providers, { provide: LOCALE_ID, useValue: 'de-DE' }]
}).catch((err) => console.error(err));
