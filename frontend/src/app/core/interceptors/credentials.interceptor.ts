import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { API_BASE_URL } from '../services/api-base.token';

export const credentialsInterceptor: HttpInterceptorFn = (req, next) => {
  const apiBaseUrl = inject(API_BASE_URL);

  if (!req.url.startsWith(apiBaseUrl)) {
    return next(req);
  }

  return next(req.clone({ withCredentials: true }));
};
