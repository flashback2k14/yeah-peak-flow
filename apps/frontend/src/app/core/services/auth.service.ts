import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

interface AuthResponse {
  token: string;
}

interface JwtPayload {
  id: number;
  email: string;
  exp: number;
  iat: number;
}

const TOKEN_KEY = 'auth_token';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly token = signal<string | null>(
    localStorage.getItem(TOKEN_KEY),
  );

  readonly isAuthenticated = computed(() => {
    const t = this.token();
    if (!t) return false;
    return !this.isTokenExpired(t);
  });

  readonly currentUserEmail = computed(() => {
    const t = this.token();
    if (!t) return null;
    try {
      return this.decodePayload(t).email;
    } catch {
      return null;
    }
  });

  register(email: string, password: string) {
    return this.http
      .post<AuthResponse>(`${environment.apiUrl}/auth/register`, {
        email,
        password,
      })
      .pipe(tap((res) => this.storeToken(res.token)));
  }

  login(email: string, password: string) {
    return this.http
      .post<AuthResponse>(`${environment.apiUrl}/auth/login`, {
        email,
        password,
      })
      .pipe(tap((res) => this.storeToken(res.token)));
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    this.token.set(null);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return this.token();
  }

  private storeToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
    this.token.set(token);
  }

  private decodePayload(token: string): JwtPayload {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join(''),
    );
    return JSON.parse(json) as JwtPayload;
  }

  private isTokenExpired(token: string): boolean {
    try {
      return this.decodePayload(token).exp * 1000 < Date.now();
    } catch {
      return true;
    }
  }
}
