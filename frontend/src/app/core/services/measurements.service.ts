import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from './api-base.token';
import { Measurement, MeasurementsResponse } from '../../shared/models/api.models';

interface CreateMeasurementPayload {
  measuredAt: string;
  peakFlowLpm: number;
  inhalationTiming: 'before_inhalation' | 'after_inhalation';
  note?: string | null;
}

interface UpdateMeasurementPayload {
  measuredAt?: string;
  peakFlowLpm?: number;
  inhalationTiming?: 'before_inhalation' | 'after_inhalation';
  note?: string | null;
}

@Injectable({ providedIn: 'root' })
export class MeasurementsService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);

  getByMonth(month: string): Observable<MeasurementsResponse> {
    const params = new HttpParams().set('month', month);
    return this.http.get<MeasurementsResponse>(`${this.apiBaseUrl}/measurements`, { params });
  }

  create(payload: CreateMeasurementPayload): Observable<Measurement> {
    return this.http.post<Measurement>(`${this.apiBaseUrl}/measurements`, payload);
  }

  update(id: string, payload: UpdateMeasurementPayload): Observable<Measurement> {
    return this.http.patch<Measurement>(`${this.apiBaseUrl}/measurements/${id}`, payload);
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiBaseUrl}/measurements/${id}`);
  }
}
