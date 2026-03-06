import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { API_BASE_URL } from './api-base.token';
import { AuthResponse, RegisterResponse, User } from '../../shared/models/api.models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);

  private readonly userState = signal<User | null>(null);
  readonly user = this.userState.asReadonly();
  readonly isAuthenticatedSignal = computed(() => !!this.userState());
  private sessionInitialized = false;

  get currentUser(): User | null {
    return this.userState();
  }

  isAuthenticated(): boolean {
    return this.isAuthenticatedSignal();
  }

  ensureSessionLoaded(): Observable<void> {
    if (this.sessionInitialized) {
      return of(undefined);
    }

    return this.http
      .get<AuthResponse>(`${this.apiBaseUrl}/auth/me`)
      .pipe(
        tap((response) => {
          this.sessionInitialized = true;
          this.userState.set(response.user);
        }),
        map(() => undefined),
        catchError(() => {
          this.sessionInitialized = true;
          this.userState.set(null);
          return of(undefined);
        })
      );
  }

  register(email: string, password: string): Observable<RegisterResponse> {
    return this.http.post<RegisterResponse>(`${this.apiBaseUrl}/auth/register`, { email, password });
  }

  login(email: string, password: string): Observable<User> {
    return this.http
      .post<AuthResponse>(`${this.apiBaseUrl}/auth/login`, { email, password })
      .pipe(
        map((response) => response.user),
        tap((user) => {
          this.sessionInitialized = true;
          this.userState.set(user);
        })
      );
  }

  fastLogin(token: string): Observable<User> {
    return this.http
      .post<AuthResponse>(`${this.apiBaseUrl}/auth/fast-login`, { token })
      .pipe(
        map((response) => response.user),
        tap((user) => {
          this.sessionInitialized = true;
          this.userState.set(user);
        })
      );
  }

  logout(): Observable<void> {
    return this.http
      .post<void>(`${this.apiBaseUrl}/auth/logout`, {})
      .pipe(
        tap(() => {
          this.sessionInitialized = true;
          this.userState.set(null);
        })
      );
  }
}
