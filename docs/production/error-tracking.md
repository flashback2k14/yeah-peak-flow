# Error Tracking Setup (Sentry)

Track production errors automatically so you know about issues before your users report them. Setup covers both the Angular frontend and the Node.js/Express backend.

## Frontend Setup (Angular)

### 1. Create Sentry Account
- Go to [sentry.io](https://sentry.io) (free tier available)
- Create a new project and select "Angular"

### 2. Install Angular SDK
```bash
npm install @sentry/angular
```

### 3. Configure in `app.config.ts`
```typescript
import * as Sentry from '@sentry/angular';
import { ApplicationConfig, ErrorHandler } from '@angular/core';
import { Router } from '@angular/router';

Sentry.init({
  dsn: 'https://xxx@xxx.ingest.sentry.io/xxx',
  environment: 'production',
  tracesSampleRate: 0.2,
});

export const appConfig: ApplicationConfig = {
  providers: [
    {
      provide: ErrorHandler,
      useValue: Sentry.createErrorHandler(),
    },
    {
      provide: Sentry.TraceService,
      deps: [Router],
    },
  ],
};
```

### 4. Add DSN to `src/environments/environment.ts`
```typescript
export const environment = {
  production: true,
  sentryDsn: 'https://xxx@xxx.ingest.sentry.io/xxx',
};
```

## Backend Setup (Node.js/Express)

### 1. Install Node.js SDK
```bash
cd backend
npm install @sentry/node
```

### 2. Initialize in `backend/src/index.ts` (before all other imports)
```typescript
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.2,
});

import express from 'express';
const app = express();

// ... routes ...

// Must be added AFTER all routes
Sentry.setupExpressErrorHandler(app);
```

### 3. Add Environment Variables
Add to `.env` (local) and your Docker Compose environment (production):
```bash
SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
```

## Verify Setup

Trigger a test error and check the Sentry Dashboard:
```typescript
// Temporary test - remove after verification
throw new Error('Sentry test error');
```

## What You Get
- Automatic error capture (frontend + backend)
- Stack traces with source maps
- Error grouping and deduplication
- Email alerts for new errors
- Performance monitoring (optional)
