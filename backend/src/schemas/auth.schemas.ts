import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().trim().email('Bitte eine gueltige E-Mail-Adresse eingeben.').max(254),
  password: z
    .string()
    .min(8, 'Passwort muss mindestens 8 Zeichen lang sein.')
    .max(128)
    .regex(/[A-Z]/, 'Passwort muss mindestens einen Grossbuchstaben enthalten.')
    .regex(/[a-z]/, 'Passwort muss mindestens einen Kleinbuchstaben enthalten.')
    .regex(/[0-9]/, 'Passwort muss mindestens eine Zahl enthalten.')
});

export const loginSchema = z.object({
  email: z.string().trim().email('Bitte eine gueltige E-Mail-Adresse eingeben.').max(254),
  password: z.string().min(1, 'Passwort darf nicht leer sein.').max(128)
});

export const fastLoginSchema = z.object({
  token: z.string().trim().min(1, 'Fast-Login-Token fehlt.').max(512)
});
