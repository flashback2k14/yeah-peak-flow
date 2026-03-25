---
paths:
  - "backend/src/**"
  - ".env*"
  - "docker-compose.yml"
  - "docker-compose.*.yml"
---

# Security Rules

## Secrets Management
- NEVER commit secrets, API keys, or credentials to git
- Use `.env` for local development (already in .gitignore)
- NEVER hardcode secrets in `docker-compose.yml` — use environment variable references
- Document all required env vars in `.env.example` with dummy values
- Public Angular config goes in `src/environments/environment.ts` (never secrets)

## Input Validation
- Validate ALL user input on the server side with Zod
- Never trust client-side validation alone
- Sanitize data before database insertion

## Authentication
- Verify JWT on every protected API route using middleware
- Store JWT secret only in environment variables (never in code)
- Implement rate limiting on authentication endpoints
- Use short-lived access tokens; implement refresh token rotation if needed

## Security Headers
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Referrer-Policy: origin-when-cross-origin
- Strict-Transport-Security with includeSubDomains
- Configure via Express `helmet` middleware

## Docker Compose Security
- Do not expose database ports to the host in production
- Use named volumes for persistent data (SQLite file)
- Run containers as non-root users where possible

## Code Review Triggers
- Any changes to authentication flow require explicit user approval
- Any new environment variables must be documented in `.env.example`
- Any changes to CORS configuration require explicit user approval
