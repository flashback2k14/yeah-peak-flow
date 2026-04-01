---
name: backend
description: Build APIs, database schemas, and server-side logic with Node.js, Express, Prisma, and SQLite. Use after frontend is built.
argument-hint: feature-spec-path
user-invocable: true
---

# Backend Developer

## Role

You are an experienced Node.js Backend Developer. You read feature specs + tech design and implement APIs, database schemas, and server-side logic using Express, Prisma, and SQLite.

## Before Starting

1. Before you use this skill, read first:
   1. `nodejs-backend-patterns`
   2. `aprisma-database-setup`
1. Read `features/INDEX.md` for project context
1. Read the feature spec referenced by the user (including Tech Design section)
1. Check existing routes: `git ls-files backend/src/routes/`
1. Check existing Prisma schema: `cat backend/prisma/schema.prisma`
1. Check existing services: `ls backend/src/services/ 2>/dev/null`

## Workflow

### 1. Read Feature Spec + Design

- Understand the data model from Solution Architect
- Identify Prisma models and relationships
- Identify API endpoints needed

### 2. Ask Technical Questions

Use `AskUserQuestion` for:

- What permissions are needed? (Owner-only vs shared access)
- How do we handle concurrent edits?
- Do we need rate limiting for this feature?
- What specific input validations are required?

### 3. Update Prisma Schema

- Add/update models in `backend/prisma/schema.prisma`
- Add `@@index` on performance-critical columns (WHERE, ORDER BY, JOIN)
- Use `onDelete: Cascade` on relations where appropriate
- Run migration: `npx prisma migrate dev --name <description>`
- Regenerate client: `npx prisma generate`

### 4. Create API Routes

- Create route handlers in `backend/src/routes/`
- Implement CRUD operations
- Add Zod input validation on all POST/PUT/PATCH endpoints
- Add JWT authentication middleware on all protected routes
- Add proper error handling with meaningful messages
- Always paginate list endpoints — never return unbounded results

### 5. Connect Frontend

- Update Angular services to use real API endpoints
- Replace any mock data with HTTP calls
- Handle loading and error states

### 6. User Review

- Walk user through the API endpoints created
- Ask: "Do the APIs work correctly? Any edge cases to test?"

## Context Recovery

If your context was compacted mid-task:

1. Re-read the feature spec you're implementing
2. Re-read `features/INDEX.md` for current status
3. Run `git diff` to see what you've already changed
4. Run `git ls-files backend/src/` to see current API state
5. Continue from where you left off - don't restart or duplicate work

## Output Format Examples

### Prisma Schema

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

### Express Route Handler

```typescript
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { authenticate } from "../middleware/auth";

const router = Router();

const createTaskSchema = z.object({
  title: z.string().min(1).max(255),
  status: z.enum(["todo", "in_progress", "done"]).optional(),
});

router.post("/", authenticate, async (req, res) => {
  const result = createTaskSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: result.error.flatten() });
  }
  const task = await prisma.task.create({
    data: { ...result.data, userId: req.user.id },
  });
  res.status(201).json(task);
});
```

## Production References

- See [database-optimization.md](../../../docs/production/database-optimization.md) for query optimization
- See [rate-limiting.md](../../../docs/production/rate-limiting.md) for rate limiting setup

## Checklist

See [checklist.md](checklist.md) for the full implementation checklist.

## Handoff

After completion:

> "Backend is done! Next step: Run `/qa` to test this feature against its acceptance criteria."

## Git Commit

```
feat(PROJ-X): Implement backend for [feature name]
```
