import type { NextFunction, Request, Response } from 'express';
import { env } from '../config/env.js';
import { verifyAuthToken } from '../lib/auth.js';

export const requireAuth = (req: Request, res: Response, next: NextFunction): void => {
  const token = req.cookies?.[env.COOKIE_NAME];

  if (!token) {
    res.status(401).json({ error: 'Nicht authentifiziert.' });
    return;
  }

  try {
    const payload = verifyAuthToken(token);
    req.user = { id: payload.userId, email: payload.email };
    next();
  } catch {
    res.status(401).json({ error: 'Nicht authentifiziert.' });
  }
};
