import type { NextFunction, Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import { env } from '../config/env.js';
import { HttpError } from '../utils/http-error.js';

export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({ error: `Route nicht gefunden: ${req.method} ${req.originalUrl}` });
};

export const errorHandler = (err: unknown, _req: Request, res: Response, _next: NextFunction): void => {
  if (err instanceof ZodError) {
    res.status(422).json({
      error: 'Validierungsfehler',
      details: err.flatten().fieldErrors
    });
    return;
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
    res.status(409).json({ error: 'Ressource existiert bereits.' });
    return;
  }

  if (err instanceof HttpError) {
    res.status(err.statusCode).json({ error: err.message, details: err.details });
    return;
  }

  if (env.NODE_ENV !== 'production') {
    console.error(err);
  }

  res.status(500).json({ error: 'Interner Serverfehler.' });
};
