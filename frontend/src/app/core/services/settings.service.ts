import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from './api-base.token';
import { UserSettings } from '../../shared/models/api.models';

export interface UpdateSettingsPayload {
  timezone?: string;
  personalBestLpm?: number | null;
  fastLoginEnabled?: boolean;
  regenerateFastLoginToken?: boolean;
}

@Injectable({ providedIn: 'root' })
export class SettingsService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);

  getSettings(): Observable<UserSettings> {
    return this.http.get<UserSettings>(`${this.apiBaseUrl}/settings`);
  }

  updateSettings(payload: UpdateSettingsPayload): Observable<UserSettings> {
    return this.http.patch<UserSettings>(`${this.apiBaseUrl}/settings`, payload);
  }
}
