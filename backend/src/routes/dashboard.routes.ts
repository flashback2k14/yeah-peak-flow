import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { monthQuerySchema } from '../schemas/measurement.schemas.js';
import { localDateKey, monthRangeInUtc } from '../utils/date.js';
import { asyncHandler } from '../utils/async-handler.js';

export const dashboardRouter = Router();

dashboardRouter.use(requireAuth);

dashboardRouter.get(
  '/monthly',
  asyncHandler(async (req, res) => {
    const { month } = monthQuerySchema.parse(req.query);

    const settings = await prisma.userSettings.findUnique({
      where: { userId: req.user!.id },
      select: { timezone: true }
    });

    const timezone = settings?.timezone ?? 'Europe/Berlin';
    const { startUtc, endUtc } = monthRangeInUtc(month, timezone);

    const measurements = await prisma.measurement.findMany({
      where: {
        userId: req.user!.id,
        measuredAt: {
          gte: startUtc,
          lt: endUtc
        }
      },
      orderBy: {
        measuredAt: 'asc'
      },
      select: {
        measuredAt: true,
        peakFlowLpm: true,
        inhalationTiming: true
      }
    });

    const grouped = new Map<string, { beforeSum: number; beforeCount: number; afterSum: number; afterCount: number }>();

    for (const measurement of measurements) {
      const key = localDateKey(measurement.measuredAt, timezone);
      const existing = grouped.get(key) ?? { beforeSum: 0, beforeCount: 0, afterSum: 0, afterCount: 0 };

      if (measurement.inhalationTiming === 'after_inhalation') {
        existing.afterSum += measurement.peakFlowLpm;
        existing.afterCount += 1;
      } else {
        existing.beforeSum += measurement.peakFlowLpm;
        existing.beforeCount += 1;
      }

      grouped.set(key, {
        beforeSum: existing.beforeSum,
        beforeCount: existing.beforeCount,
        afterSum: existing.afterSum,
        afterCount: existing.afterCount
      });
    }

    const series = [...grouped.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, values]) => ({
        date,
        beforeInhalation: values.beforeCount ? Number((values.beforeSum / values.beforeCount).toFixed(1)) : null,
        afterInhalation: values.afterCount ? Number((values.afterSum / values.afterCount).toFixed(1)) : null,
        avg: Number(
          ((values.beforeSum + values.afterSum) / (values.beforeCount + values.afterCount)).toFixed(1)
        )
      }));

    const count = measurements.length;
    const values = measurements.map((item) => item.peakFlowLpm);
    const beforeValues = measurements
      .filter((item) => item.inhalationTiming === 'before_inhalation')
      .map((item) => item.peakFlowLpm);
    const afterValues = measurements
      .filter((item) => item.inhalationTiming === 'after_inhalation')
      .map((item) => item.peakFlowLpm);

    const stats = {
      count,
      min: count ? Math.min(...values) : null,
      max: count ? Math.max(...values) : null,
      avg: count ? Number((values.reduce((sum, value) => sum + value, 0) / count).toFixed(1)) : null,
      avgBeforeInhalation: beforeValues.length
        ? Number((beforeValues.reduce((sum, value) => sum + value, 0) / beforeValues.length).toFixed(1))
        : null,
      avgAfterInhalation: afterValues.length
        ? Number((afterValues.reduce((sum, value) => sum + value, 0) / afterValues.length).toFixed(1))
        : null
    };

    res.json({ month, series, stats });
  })
);
