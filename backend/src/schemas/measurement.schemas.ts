import { z } from 'zod';

export const monthQuerySchema = z.object({
  month: z.string().min(1, 'month wird benoetigt.')
});

const measuredAtSchema = z.string().datetime({ offset: true });
const inhalationTimingSchema = z.enum(['before_inhalation', 'after_inhalation'], {
  message: 'inhalationTiming muss "before_inhalation" oder "after_inhalation" sein.'
});

export const createMeasurementSchema = z.object({
  measuredAt: measuredAtSchema,
  peakFlowLpm: z.number().int().min(50).max(900),
  inhalationTiming: inhalationTimingSchema,
  note: z.string().trim().max(500).optional().nullable()
});

export const updateMeasurementSchema = z
  .object({
    measuredAt: measuredAtSchema.optional(),
    peakFlowLpm: z.number().int().min(50).max(900).optional(),
    inhalationTiming: inhalationTimingSchema.optional(),
    note: z.string().trim().max(500).optional().nullable()
  })
  .refine((value) => Object.values(value).some((entry) => entry !== undefined), {
    message: 'Mindestens ein Feld muss fuer das Update gesetzt sein.'
  });

export const measurementIdSchema = z.object({
  id: z.string().uuid('Ungueltige Messungs-ID.')
});
