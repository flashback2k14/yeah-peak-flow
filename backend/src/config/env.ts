import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET muss mindestens 32 Zeichen lang sein.'),
  JWT_EXPIRES_IN: z.string().default('12h'),
  FRONTEND_ORIGIN: z.string().url().default('http://localhost:4200'),
  COOKIE_NAME: z.string().default('pf_token')
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('Ungueltige Umgebungsvariablen:', parsedEnv.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsedEnv.data;
