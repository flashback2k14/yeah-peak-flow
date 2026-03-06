import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { API_BASE_URL } from './api-base.token';
import { UserSettings } from '../../shared/models/api.models';

export interface UpdateSettingsPayload {
  timezone?: string;
  personalBestLpm?: number | null;
  medicationManagementUrl?: string | null;
  fastLoginEnabled?: boolean;
  regenerateFastLoginToken?: boolean;
}

@Injectable({ providedIn: 'root' })
export class SettingsService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);
  private readonly settingsState = signal<UserSettings | null>(null);

  readonly settings = this.settingsState.asReadonly();

  getSettings(): Observable<UserSettings> {
    return this.http.get<UserSettings>(`${this.apiBaseUrl}/settings`).pipe(
      tap((settings) => {
        this.settingsState.set(settings);
      })
    );
  }

  updateSettings(payload: UpdateSettingsPayload): Observable<UserSettings> {
    return this.http.patch<UserSettings>(`${this.apiBaseUrl}/settings`, payload).pipe(
      tap((settings) => {
        this.settingsState.set(settings);
      })
    );
  }
}
