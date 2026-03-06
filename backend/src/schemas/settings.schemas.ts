import { Info } from 'luxon';
import { z } from 'zod';

export const updateSettingsSchema = z
  .object({
    timezone: z
      .string()
      .refine((value) => Info.isValidIANAZone(value), 'timezone muss eine gueltige IANA-Zeitzone sein.')
      .optional(),
    personalBestLpm: z.number().int().min(50).max(900).nullable().optional(),
    medicationManagementUrl: z
      .string()
      .trim()
      .max(2048, 'medicationManagementUrl darf maximal 2048 Zeichen enthalten.')
      .url('medicationManagementUrl muss eine gueltige URL sein.')
      .refine((value) => /^https?:\/\//i.test(value), 'medicationManagementUrl muss mit http:// oder https:// beginnen.')
      .nullable()
      .optional(),
    fastLoginEnabled: z.boolean().optional(),
    regenerateFastLoginToken: z.boolean().optional()
  })
  .refine((value) => Object.values(value).some((entry) => entry !== undefined), {
    message: 'Mindestens ein Feld muss fuer das Update gesetzt sein.'
  });
