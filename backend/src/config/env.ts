import 'dotenv/config';
import { z } from 'zod';

const disallowedJwtSecretValues = new Set([
  'replace-with-at-least-32-characters',
  'replace-with-long-random-secret'
]);

const isPlaceholderJwtSecret = (value: string): boolean => {
  const normalized = value.trim().toLowerCase();
  return normalized.startsWith('replace-with-') || disallowedJwtSecretValues.has(normalized);
};

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z
    .string()
    .trim()
    .min(32, 'JWT_SECRET muss mindestens 32 Zeichen lang sein.')
    .refine((value) => !isPlaceholderJwtSecret(value), {
      message: 'JWT_SECRET darf kein Platzhalterwert sein.'
    }),
  JWT_EXPIRES_IN: z.string().default('12h'),
  FRONTEND_ORIGIN: z.string().url().default('http://localhost:4200'),
  COOKIE_NAME: z.string().default('pf_token')
});

export type Env = z.infer<typeof envSchema>;

export const parseEnv = (input: NodeJS.ProcessEnv): Env => {
  const parsedEnv = envSchema.safeParse(input);

  if (!parsedEnv.success) {
    const fieldErrors = parsedEnv.error.flatten().fieldErrors;
    const errorSummary = Object.entries(fieldErrors)
      .map(([field, errors]) => (errors && errors.length > 0 ? `${field}: ${errors.join(', ')}` : null))
      .filter((entry): entry is string => entry !== null)
      .join('; ');

    throw new Error(`Ungueltige Umgebungsvariablen: ${errorSummary}`);
  }

  return parsedEnv.data;
};

const loadEnvOrExit = (): Env => {
  try {
    return parseEnv(process.env);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Ungueltige Umgebungsvariablen.';
    console.error(message);
    process.exit(1);
  }
};

export const env = loadEnvOrExit();
