import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env.js';
import { errorHandler, notFoundHandler } from './middleware/error-handler.js';
import { authRouter } from './routes/auth.routes.js';
import { dashboardRouter } from './routes/dashboard.routes.js';
import { exportsRouter } from './routes/exports.routes.js';
import { healthRouter } from './routes/health.routes.js';
import { measurementsRouter } from './routes/measurements.routes.js';
import { settingsRouter } from './routes/settings.routes.js';

export const createApp = () => {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: env.FRONTEND_ORIGIN,
      credentials: true
    })
  );
  app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));
  app.use(express.json());
  app.use(cookieParser());

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Zu viele Anfragen. Bitte spaeter erneut versuchen.' }
  });

  app.use('/api/v1/health', healthRouter);
  app.use('/api/v1/auth', authLimiter, authRouter);
  app.use('/api/v1/measurements', measurementsRouter);
  app.use('/api/v1/dashboard', dashboardRouter);
  app.use('/api/v1/settings', settingsRouter);
  app.use('/api/v1/exports', exportsRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
