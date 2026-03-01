export interface User {
  id: string;
  email: string;
}

export interface AuthResponse {
  user: User;
}

export interface Measurement {
  id: string;
  measuredAt: string;
  peakFlowLpm: number;
  inhalationTiming: 'before_inhalation' | 'after_inhalation';
  note: string | null;
}

export interface MeasurementsResponse {
  month: string;
  items: Measurement[];
}

export interface DashboardPoint {
  date: string;
  beforeInhalation: number | null;
  afterInhalation: number | null;
  avg: number;
}

export interface DashboardStats {
  count: number;
  min: number | null;
  max: number | null;
  avg: number | null;
  avgBeforeInhalation: number | null;
  avgAfterInhalation: number | null;
}

export interface DashboardMonthlyResponse {
  month: string;
  series: DashboardPoint[];
  stats: DashboardStats;
}

export interface UserSettings {
  timezone: string;
  personalBestLpm: number | null;
  fastLoginEnabled: boolean;
  fastLoginUrl: string | null;
}
