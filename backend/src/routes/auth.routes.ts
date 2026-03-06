import { Router } from 'express';
import argon2 from 'argon2';
import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { asyncHandler } from '../utils/async-handler.js';
import { fastLoginSchema, loginSchema, registerSchema } from '../schemas/auth.schemas.js';
import { HttpError } from '../utils/http-error.js';
import { clearAuthCookie, setAuthCookie, signAuthToken } from '../lib/auth.js';
import { requireAuth } from '../middleware/auth.js';

export const authRouter = Router();

authRouter.post(
  '/register',
  asyncHandler(async (req, res) => {
    const { email, password } = registerSchema.parse(req.body);
    const normalizedEmail = email.toLowerCase();
    const passwordHash = await argon2.hash(password, { type: argon2.argon2id });

    try {
      await prisma.user.create({
        data: {
          email: normalizedEmail,
          passwordHash,
          settings: {
            create: {
              timezone: 'Europe/Berlin'
            }
          }
        }
      });
    } catch (error) {
      if (!(error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002')) {
        throw error;
      }
    }

    res.status(202).json({
      message:
        'Registrierung entgegengenommen. Falls die E-Mail noch nicht registriert ist, wurde ein Konto angelegt.'
    });
  })
);

authRouter.post(
  '/login',
  asyncHandler(async (req, res) => {
    const { email, password } = loginSchema.parse(req.body);
    const normalizedEmail = email.toLowerCase();

    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

    if (!user) {
      throw new HttpError(401, 'Ungueltige Login-Daten.');
    }

    const passwordValid = await argon2.verify(user.passwordHash, password);

    if (!passwordValid) {
      throw new HttpError(401, 'Ungueltige Login-Daten.');
    }

    const token = signAuthToken({ userId: user.id, email: user.email });
    setAuthCookie(res, token);

    res.json({
      user: {
        id: user.id,
        email: user.email
      }
    });
  })
);

authRouter.post(
  '/fast-login',
  asyncHandler(async (req, res) => {
    const { token } = fastLoginSchema.parse(req.body);

    const settings = await prisma.userSettings.findFirst({
      where: {
        fastLoginEnabled: true,
        fastLoginToken: token
      },
      select: {
        user: {
          select: {
            id: true,
            email: true
          }
        }
      }
    });

    if (!settings?.user) {
      throw new HttpError(401, 'Ungueltiger Fast-Login-Token.');
    }

    const authToken = signAuthToken({ userId: settings.user.id, email: settings.user.email });
    setAuthCookie(res, authToken);

    res.json({
      user: {
        id: settings.user.id,
        email: settings.user.email
      }
    });
  })
);

authRouter.post('/logout', (_req, res) => {
  clearAuthCookie(res);
  res.status(204).send();
});

authRouter.get(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        email: true
      }
    });

    if (!user) {
      throw new HttpError(401, 'Nicht authentifiziert.');
    }

    res.json({ user });
  })
);
