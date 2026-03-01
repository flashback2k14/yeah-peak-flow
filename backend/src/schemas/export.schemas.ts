import { z } from 'zod';

const monthFormat = /^\d{4}-(0[1-9]|1[0-2])$/;

export const exportMeasurementsPdfQuerySchema = z.object({
  months: z
    .string()
    .min(1, 'months wird benoetigt.')
    .transform((value) =>
      value
        .split(',')
        .map((entry) => entry.trim())
        .filter((entry) => entry.length > 0)
    )
    .refine((months) => months.length > 0, {
      message: 'Mindestens ein Monat muss ausgewaehlt werden.'
    })
    .refine((months) => months.length <= 24, {
      message: 'Es koennen maximal 24 Monate exportiert werden.'
    })
    .refine((months) => months.every((month) => monthFormat.test(month)), {
      message: 'Alle Monate muessen das Format YYYY-MM haben.'
    })
    .transform((months) => [...new Set(months)])
});
