import { Router } from 'express';
import { randomBytes } from 'node:crypto';
import { prisma } from '../lib/prisma.js';
import { env } from '../config/env.js';
import { requireAuth } from '../middleware/auth.js';
import { updateSettingsSchema } from '../schemas/settings.schemas.js';
import { asyncHandler } from '../utils/async-handler.js';

export const settingsRouter = Router();

settingsRouter.use(requireAuth);

const generateFastLoginToken = (): string => randomBytes(24).toString('hex');

const buildFastLoginUrl = (token: string): string => {
  return `${env.FRONTEND_ORIGIN}/auth/fast-login?token=${encodeURIComponent(token)}`;
};

const toSettingsResponse = (settings: {
  timezone: string;
  personalBestLpm: number | null;
  fastLoginEnabled: boolean;
  fastLoginToken: string | null;
}) => {
  const fastLoginUrl = settings.fastLoginEnabled && settings.fastLoginToken ? buildFastLoginUrl(settings.fastLoginToken) : null;

  return {
    timezone: settings.timezone,
    personalBestLpm: settings.personalBestLpm,
    fastLoginEnabled: settings.fastLoginEnabled,
    fastLoginUrl
  };
};

settingsRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const settings = await prisma.userSettings.upsert({
      where: { userId: req.user!.id },
      create: {
        userId: req.user!.id,
        timezone: 'Europe/Berlin'
      },
      update: {},
      select: {
        timezone: true,
        personalBestLpm: true,
        fastLoginEnabled: true,
        fastLoginToken: true
      }
    });

    res.json(toSettingsResponse(settings));
  })
);

settingsRouter.patch(
  '/',
  asyncHandler(async (req, res) => {
    const payload = updateSettingsSchema.parse(req.body);

    const currentSettings = await prisma.userSettings.upsert({
      where: { userId: req.user!.id },
      create: {
        userId: req.user!.id,
        timezone: payload.timezone ?? 'Europe/Berlin',
        personalBestLpm: payload.personalBestLpm ?? null,
        fastLoginEnabled: false,
        fastLoginToken: null
      },
      update: {
        timezone: payload.timezone,
        personalBestLpm: payload.personalBestLpm
      },
      select: {
        timezone: true,
        personalBestLpm: true,
        fastLoginEnabled: true,
        fastLoginToken: true
      }
    });

    const fastLoginEnabled = payload.fastLoginEnabled ?? currentSettings.fastLoginEnabled;

    let fastLoginToken = currentSettings.fastLoginToken;
    if (payload.fastLoginEnabled === false) {
      fastLoginToken = null;
    } else if (payload.regenerateFastLoginToken || (fastLoginEnabled && !fastLoginToken)) {
      fastLoginToken = generateFastLoginToken();
    }

    const settings = await prisma.userSettings.update({
      where: { userId: req.user!.id },
      data: {
        timezone: payload.timezone,
        personalBestLpm: payload.personalBestLpm,
        fastLoginEnabled,
        fastLoginToken
      },
      select: {
        timezone: true,
        personalBestLpm: true,
        fastLoginEnabled: true,
        fastLoginToken: true
      }
    });

    res.json(toSettingsResponse(settings));
  })
);
