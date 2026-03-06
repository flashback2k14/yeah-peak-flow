import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import {
  createMeasurementSchema,
  measurementIdSchema,
  monthQuerySchema,
  updateMeasurementSchema
} from '../schemas/measurement.schemas.js';
import { monthRangeInUtc, parseIsoToDate } from '../utils/date.js';
import { asyncHandler } from '../utils/async-handler.js';
import { HttpError } from '../utils/http-error.js';

const mapMeasurement = (item: {
  id: string;
  measuredAt: Date;
  peakFlowLpm: number;
  inhalationTiming: string;
  note: string | null;
}) => ({
  id: item.id,
  measuredAt: item.measuredAt.toISOString(),
  peakFlowLpm: item.peakFlowLpm,
  inhalationTiming: item.inhalationTiming,
  note: item.note
});

const measurementSelect = {
  id: true,
  measuredAt: true,
  peakFlowLpm: true,
  inhalationTiming: true,
  note: true
} as const;

export const measurementsRouter = Router();

measurementsRouter.use(requireAuth);

measurementsRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const payload = createMeasurementSchema.parse(req.body);

    const measurement = await prisma.measurement.create({
      data: {
        userId: req.user!.id,
        measuredAt: parseIsoToDate(payload.measuredAt),
        peakFlowLpm: payload.peakFlowLpm,
        inhalationTiming: payload.inhalationTiming,
        note: payload.note?.trim() || null
      },
      select: measurementSelect
    });

    res.status(201).json(mapMeasurement(measurement));
  })
);

measurementsRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const { month } = monthQuerySchema.parse(req.query);

    const settings = await prisma.userSettings.findUnique({
      where: { userId: req.user!.id },
      select: { timezone: true }
    });

    const timezone = settings?.timezone ?? 'Europe/Berlin';
    const { startUtc, endUtc } = monthRangeInUtc(month, timezone);

    const items = await prisma.measurement.findMany({
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
      select: measurementSelect
    });

    res.json({
      month,
      items: items.map(mapMeasurement)
    });
  })
);

measurementsRouter.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = measurementIdSchema.parse(req.params);
    const payload = updateMeasurementSchema.parse(req.body);

    const updateResult = await prisma.measurement.updateMany({
      where: {
        id,
        userId: req.user!.id
      },
      data: {
        measuredAt: payload.measuredAt ? parseIsoToDate(payload.measuredAt) : undefined,
        peakFlowLpm: payload.peakFlowLpm,
        inhalationTiming: payload.inhalationTiming,
        note: payload.note === undefined ? undefined : payload.note?.trim() || null
      }
    });

    if (updateResult.count === 0) {
      throw new HttpError(404, 'Messung nicht gefunden.');
    }

    const measurement = await prisma.measurement.findFirst({
      where: {
        id,
        userId: req.user!.id
      },
      select: measurementSelect
    });

    if (!measurement) {
      throw new HttpError(404, 'Messung nicht gefunden.');
    }

    res.json(mapMeasurement(measurement));
  })
);

measurementsRouter.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = measurementIdSchema.parse(req.params);

    const deleteResult = await prisma.measurement.deleteMany({
      where: {
        id,
        userId: req.user!.id
      }
    });

    if (deleteResult.count === 0) {
      throw new HttpError(404, 'Messung nicht gefunden.');
    }

    res.status(204).send();
  })
);
