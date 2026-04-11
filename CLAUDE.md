# AI dev workflow for angular and node.js monorepos

> An Angular + Node.js MonoRepo template with an AI-powered development workflow using specialized skills for Requirements, Architecture, Frontend, Backend, QA, and Deployment.

## Tech Stack

- **Frontend:** Angular (standalone components, signals), TypeScript
- **Styling:** Tailwind CSS + spartan/ui (spartan.ng)
- **Backend:** Node.js + Express + Prisma ORM + SQLite
- **Deployment:** Docker Compose
- **Charts:** Angular Charts (angularcharts.com)
- **Validation:** Zod + Angular Signal Forms
- **State:** Angular Services (injectable)

## Project Structure

MonoRepo managed via npm workspaces — frontend and backend share a single repository.

```
package.json                  Root workspace (npm workspaces)
apps/
  frontend/                   Angular app
    src/
      app/
        core/                 Services, guards, interceptors, models
        shared/               Shared components, pipes, directives
        features/             Feature components (lazy-loaded)
      assets/                 Static assets
      environments/           Environment configs (environment.ts)
    angular.json
    package.json
  backend/                    Node.js + Express API
    src/
      routes/                 Express route handlers
      middleware/             Auth, validation, error handling
      services/               Business logic
    prisma/
      schema.prisma           Prisma schema (SQLite)
      migrations/             Auto-generated migrations
    package.json
docker-compose.yml            Container orchestration
features/                     Feature specifications (PROJ-X-name.md)
  INDEX.md                    Feature status overview
docs/
  PRD.md                      Product Requirements Document
  production/                 Production guides
```

## Development Workflow

1. `/requirements` - Create feature spec from idea
2. `/architecture` - Design tech architecture (PM-friendly, no code)
3. `/frontend-design` - Design UI look & feel (after architecture, before implementation)
4. `/frontend` - Implement Angular components based on design decisions
5. `/backend` - Build APIs, database schema, Prisma migrations
6. `/qa` - Test against acceptance criteria + security audit
7. `/deploy` - Deploy via Docker Compose + production-ready checks

## Feature Tracking

All features tracked in `features/INDEX.md`. Every skill reads it at start and updates it when done. Feature specs live in `features/PROJ-X-name.md`.

## Key Conventions

- **Feature IDs:** PROJ-1, PROJ-2, etc. (sequential)
- **Commits:** `feat(PROJ-X): description`, `fix(PROJ-X): description`
- **Single Responsibility:** One feature per spec file
- **spartan/ui first:** NEVER create custom versions of spartan/ui components
- **Human-in-the-loop:** All workflows have user approval checkpoints
- **Tests:** Unit tests co-located next to source files. E2E tests in `tests/`.

## Build & Test Commands

```bash
# Frontend — run from apps/frontend/
ng serve              # Development server (localhost:4200)
ng build              # Production build
ng lint               # ESLint
ng test               # Unit tests

# Backend — run from apps/backend/
npm run dev           # Development server (localhost:3000)
npm run build         # Production build

# Overall - run from project root
npm test             # Vitest unit/integration tests
npm run test:e2e     # Playwright E2E tests
npm run test:all     # Both test suites

# Database — run from apps/backend/
npx prisma migrate dev       # Apply migrations
npx prisma studio            # Database GUI
npx prisma generate          # Regenerate Prisma client

# Docker — run from repo root
docker compose up -d         # Start all services
docker compose down          # Stop all services
docker compose build         # Rebuild images
docker compose logs -f       # Follow logs
```

## Product Context

@docs/PRD.md

## Feature Overview

@features/INDEX.md
