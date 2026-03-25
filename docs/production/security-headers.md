# Security Headers Configuration

Protect against XSS, Clickjacking, MIME sniffing, and other common web attacks. Security headers are applied at two layers: the Express backend and the nginx frontend container.

## Layer 1: Express Backend (via `helmet`)

`helmet` sets security headers on all API responses automatically.

### 1. Install
```bash
cd backend
npm install helmet
```

### 2. Add to Express
```typescript
// backend/src/index.ts
import helmet from 'helmet';

const app = express();

app.use(helmet({
  // Helmet enables all headers by default — customize as needed:
  frameguard: { action: 'deny' },         // X-Frame-Options: DENY
  noSniff: true,                          // X-Content-Type-Options: nosniff
  referrerPolicy: { policy: 'origin-when-cross-origin' },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
  },
}));
```

## Layer 2: nginx Frontend (Docker container)

Add headers to the nginx config used in the Angular frontend Docker image:

```nginx
# nginx.conf
server {
  listen 80;

  add_header X-Frame-Options "DENY" always;
  add_header X-Content-Type-Options "nosniff" always;
  add_header Referrer-Policy "origin-when-cross-origin" always;
  add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

  location / {
    root /usr/share/nginx/html;
    try_files $uri $uri/ /index.html;
  }

  location /api/ {
    proxy_pass http://backend:3000/;
  }
}
```

## What Each Header Does

| Header | Protection |
|--------|-----------|
| X-Frame-Options: DENY | Prevents your site from being embedded in iframes (clickjacking) |
| X-Content-Type-Options: nosniff | Prevents browsers from guessing content types (MIME sniffing) |
| Referrer-Policy | Controls how much URL info is sent to other sites |
| Strict-Transport-Security | Forces HTTPS connections |

## Verify After Deployment
1. Open Chrome DevTools
2. Go to Network tab
3. Click on any request to your site
4. Check Response Headers section
5. Verify all 4 headers are present

## Advanced (Optional): Content-Security-Policy

The most powerful header, but Angular needs `'unsafe-inline'` for its default styles:

```nginx
add_header Content-Security-Policy "default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self';" always;
```

Start with report-only mode to identify issues before enforcing:
```nginx
add_header Content-Security-Policy-Report-Only "default-src 'self';" always;
```
