import { DateTime, Info } from 'luxon';
import { HttpError } from './http-error.js';

export const assertValidTimezone = (timezone: string): void => {
  if (!Info.isValidIANAZone(timezone)) {
    throw new HttpError(422, 'Ungueltige Zeitzone.');
  }
};

export const monthRangeInUtc = (month: string, timezone: string): { startUtc: Date; endUtc: Date } => {
  assertValidTimezone(timezone);

  const monthStart = DateTime.fromFormat(month, 'yyyy-MM', { zone: timezone }).startOf('month');

  if (!monthStart.isValid) {
    throw new HttpError(400, 'Parameter month muss das Format YYYY-MM haben.');
  }

  const monthEnd = monthStart.plus({ months: 1 });

  return {
    startUtc: monthStart.toUTC().toJSDate(),
    endUtc: monthEnd.toUTC().toJSDate()
  };
};

export const localDateKey = (value: Date, timezone: string): string => {
  assertValidTimezone(timezone);
  return DateTime.fromJSDate(value, { zone: 'utc' }).setZone(timezone).toISODate() ?? '';
};

export const parseIsoToDate = (value: string): Date => {
  const dt = DateTime.fromISO(value);

  if (!dt.isValid) {
    throw new HttpError(422, 'measuredAt muss ein gueltiger ISO-8601 Zeitstempel sein.');
  }

  return dt.toUTC().toJSDate();
};
