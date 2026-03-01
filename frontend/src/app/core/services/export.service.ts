import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from './api-base.token';

interface AvailableExportMonthsResponse {
  months: string[];
}

@Injectable({ providedIn: 'root' })
export class ExportService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);

  getAvailableMonths(): Observable<AvailableExportMonthsResponse> {
    return this.http.get<AvailableExportMonthsResponse>(`${this.apiBaseUrl}/exports/available-months`);
  }

  exportMeasurementsPdf(months: string[]): Observable<HttpResponse<Blob>> {
    const params = new HttpParams().set('months', months.join(','));
    return this.http.get(`${this.apiBaseUrl}/exports/measurements.pdf`, {
      params,
      responseType: 'blob',
      observe: 'response'
    });
  }
}
