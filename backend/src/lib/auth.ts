import type { Response } from 'express';
import jwt, { type SignOptions } from 'jsonwebtoken';
import { env } from '../config/env.js';

interface TokenPayload {
  userId: string;
  email: string;
}

export const signAuthToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn']
  });
};

export const verifyAuthToken = (token: string): TokenPayload => {
  return jwt.verify(token, env.JWT_SECRET) as TokenPayload;
};

const cookieBaseOptions = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: env.NODE_ENV === 'production',
  path: '/',
  maxAge: 12 * 60 * 60 * 1000
};

export const setAuthCookie = (res: Response, token: string): void => {
  res.cookie(env.COOKIE_NAME, token, cookieBaseOptions);
};

export const clearAuthCookie = (res: Response): void => {
  res.clearCookie(env.COOKIE_NAME, {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.NODE_ENV === 'production',
    path: '/'
  });
};
