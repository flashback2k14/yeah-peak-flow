import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from './api-base.token';
import { DashboardMonthlyResponse } from '../../shared/models/api.models';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);

  getMonthly(month: string): Observable<DashboardMonthlyResponse> {
    const params = new HttpParams().set('month', month);
    return this.http.get<DashboardMonthlyResponse>(`${this.apiBaseUrl}/dashboard/monthly`, { params });
  }
}
