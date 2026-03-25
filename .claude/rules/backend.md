---
paths:
  - "backend/src/**"
  - "backend/prisma/**"
---

# Backend Development Rules

## Database (Prisma + SQLite)
- Define all models in `backend/prisma/schema.prisma`
- NEVER write raw SQL — use Prisma Client for all queries
- Run `npx prisma migrate dev --name <description>` for every schema change
- Run `npx prisma generate` after schema changes to update the client
- Add `@@index` on columns used in WHERE, ORDER BY, and JOIN clauses
- Use `onDelete: Cascade` on relations where appropriate

## Prisma Schema Conventions
```prisma
model Task {
  id        String   @id @default(cuid())
  userId    String
  title     String
  status    String   @default("todo")
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([status])
}
```

## API Routes (Express)
- Create route handlers in `backend/src/routes/`
- Validate all inputs using Zod schemas before processing
- Always verify authentication (JWT) before processing protected routes
- Return meaningful error messages with appropriate HTTP status codes
- Use `.take()` / pagination on all list queries — never return unbounded lists

## Query Patterns
- Use Prisma `include` or `select` for related data (avoid N+1 queries)
- Use `prisma.$transaction()` for operations that must be atomic
- Always handle Prisma errors (`PrismaClientKnownRequestError`)

## Security
- Never hardcode secrets in source code
- Use environment variables for all credentials (JWT secret, etc.)
- Validate and sanitize all user input with Zod
- Prisma uses parameterized queries by default — never concatenate user input into queries
