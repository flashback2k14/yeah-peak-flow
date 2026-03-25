# Database Optimization (Prisma + SQLite)

## 1. Indexing

Add indexes on columns used in WHERE, ORDER BY, or JOIN clauses via `@@index` in your Prisma schema:

```prisma
model Task {
  id        String   @id @default(cuid())
  userId    String
  status    String   @default("todo")
  createdAt DateTime @default(now())

  // Without these indexes: full table scan at 100k rows (~500ms)
  // With indexes: <10ms
  @@index([userId, createdAt(sort: Desc)])
  @@index([status])
}
```

After adding indexes, run a migration:
```bash
npx prisma migrate dev --name add-task-indexes
```

**Rule of thumb:** If a column appears in `where`, `orderBy`, or a relation lookup and the table will have >1000 rows, add an index.

## 2. Avoid N+1 Queries

The most common performance problem with ORMs:

```typescript
// Bad: N+1 (1 query for users + N queries for tasks)
const users = await prisma.user.findMany();
for (const user of users) {
  const tasks = await prisma.task.findMany({ where: { userId: user.id } });
}

// Good: Single query with include (2 queries total, batched by Prisma)
const users = await prisma.user.findMany({
  include: { tasks: true },
});

// Better: Select only what you need
const users = await prisma.user.findMany({
  select: {
    id: true,
    name: true,
    tasks: {
      select: { id: true, title: true, status: true },
    },
  },
});
```

## 3. Always Paginate Results

Never return unbounded results from the database:

```typescript
// Bad: Returns ALL rows
const tasks = await prisma.task.findMany();

// Good: Returns max 50 rows
const tasks = await prisma.task.findMany({
  take: 50,
});

// Better: Cursor-based pagination
const tasks = await prisma.task.findMany({
  take: 50,
  skip: cursor ? 1 : 0,
  cursor: cursor ? { id: cursor } : undefined,
  orderBy: { createdAt: 'desc' },
});
```

## 4. Caching Strategy

SQLite reads are fast for local/single-server deployments, but expensive aggregations benefit from in-memory caching:

```typescript
// backend/src/lib/cache.ts
import NodeCache from 'node-cache';

export const cache = new NodeCache({ stdTTL: 3600 }); // 1 hour default

// Usage in a service
export async function getDashboardStats() {
  const cacheKey = 'dashboard-stats';
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const stats = await prisma.task.groupBy({
    by: ['status'],
    _count: { status: true },
  });

  cache.set(cacheKey, stats);
  return stats;
}
```

Install: `npm install node-cache`

**When to cache:**
- Aggregate queries (counts, sums, groupBy)
- Data that changes less than once per hour
- Data shared across all users (not user-specific)

**When NOT to cache:**
- User-specific data that changes frequently
- Data that must always be fresh (e.g., inventory, balances)

## 5. Select Only What You Need

```typescript
// Bad: Fetches all columns (including large text/blob fields)
const users = await prisma.user.findMany();

// Good: Fetches only needed columns
const users = await prisma.user.findMany({
  select: { id: true, name: true, avatarUrl: true },
});
```

## 6. Use Transactions for Atomic Operations

```typescript
// Bad: Two separate queries — can leave data inconsistent on failure
await prisma.order.create({ data: orderData });
await prisma.inventory.update({ where: { id }, data: { stock: { decrement: 1 } } });

// Good: Atomic transaction
await prisma.$transaction([
  prisma.order.create({ data: orderData }),
  prisma.inventory.update({ where: { id }, data: { stock: { decrement: 1 } } }),
]);
```
