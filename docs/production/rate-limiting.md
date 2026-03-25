# Rate Limiting

Prevent abuse, DDoS attacks, and excessive API usage.

## When to Add Rate Limiting
- **MVP:** Optional (focus on features first)
- **Production with users:** Recommended on auth endpoints and public APIs
- **Public-facing APIs:** Required

## Setup with `express-rate-limit` (no external service required)

### 1. Install
```bash
cd backend
npm install express-rate-limit
```

### 2. Create Rate Limiter Middleware
```typescript
// backend/src/middleware/rate-limit.ts
import rateLimit from 'express-rate-limit';

// General API limiter
export const apiLimiter = rateLimit({
  windowMs: 10 * 1000,   // 10 seconds
  max: 30,               // 30 requests per window
  standardHeaders: true, // Return rate limit info in RateLimit-* headers
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});

// Strict limiter for auth endpoints
export const authLimiter = rateLimit({
  windowMs: 60 * 1000,   // 1 minute
  max: 5,                // 5 requests per window
  message: { error: 'Too many login attempts, please try again later.' },
});

// File upload limiter
export const uploadLimiter = rateLimit({
  windowMs: 60 * 1000,   // 1 minute
  max: 5,
  message: { error: 'Upload limit reached, please wait.' },
});
```

### 3. Apply Globally and Per-Route
```typescript
// backend/src/index.ts
import { apiLimiter } from './middleware/rate-limit';
import { authLimiter } from './middleware/rate-limit';

// Apply to all API routes
app.use('/api', apiLimiter);

// Override with stricter limit for auth routes
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth/reset-password', authLimiter);
```

## Recommended Limits

| Endpoint Type | Limit | Window |
|--------------|-------|--------|
| Login/Register | 5 requests | 1 minute |
| Password Reset | 3 requests | 5 minutes |
| General API | 30 requests | 10 seconds |
| File Upload | 5 requests | 1 minute |

## Advanced: Redis-backed Rate Limiting (multi-instance deployments)

If you scale to multiple backend containers, in-memory rate limiting won't work (each container has its own counter). Use Redis instead:

```bash
npm install rate-limit-redis ioredis
```

```typescript
import { RateLimitRedis } from 'rate-limit-redis';
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

export const apiLimiter = rateLimit({
  windowMs: 10 * 1000,
  max: 30,
  store: new RateLimitRedis({ sendCommand: (...args) => redis.call(...args) }),
});
```

For single-container SQLite deployments, the default in-memory store is sufficient.
