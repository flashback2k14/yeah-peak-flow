# Performance

## Lighthouse Check (after every deployment)

1. Open Chrome DevTools (F12)
2. Go to Lighthouse tab
3. Select: Performance, Accessibility, Best Practices, SEO
4. Generate Report for both Mobile and Desktop
5. **Target: Score > 90** in all categories

## Common Angular Performance Issues

### Missing OnPush Change Detection

Without `OnPush`, Angular checks every component on every event. Enable it everywhere:

```typescript
import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-task-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `...`,
})
export class TaskListComponent {}
```

### Unoptimized Images

```html
<!-- Bad: unoptimized, no lazy loading -->
<img src="/large-image.jpg" />

<!-- Good: Angular's NgOptimizedImage directive -->
<img ngSrc="/large-image.jpg" width="800" height="600" alt="Description" />
```

Import in your component:
```typescript
import { NgOptimizedImage } from '@angular/common';

@Component({
  imports: [NgOptimizedImage],
})
```

`NgOptimizedImage` automatically: enforces lazy loading, adds `fetchpriority`, warns about missing dimensions.

### Unoptimized Route Loading

All feature routes should be lazy-loaded so the initial bundle stays small:

```typescript
// app.routes.ts
export const routes: Routes = [
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./features/dashboard/dashboard.component').then(
        (m) => m.DashboardComponent
      ),
  },
];
```

### Missing Loading States

Always show feedback during data fetching. Use spartan/ui:

```typescript
import { HlmSpinnerComponent } from '@spartan-ng/ui-spinner-helm';
```

```html
@if (isLoading()) {
  <hlm-spinner size="sm" />
} @else {
  <app-task-list [tasks]="tasks()" />
}
```

### Large Bundle Size

Analyze your bundle after `ng build`:

```bash
ng build --stats-json
npx webpack-bundle-analyzer dist/your-app/browser/stats.json
```

Look for large dependencies that can be replaced with smaller alternatives or lazy-loaded.

## Quick Wins Checklist
- [ ] All components use `OnPush` change detection
- [ ] All images use `ngSrc` (NgOptimizedImage)
- [ ] All feature routes are lazy-loaded
- [ ] Loading states show spinner/skeleton
- [ ] No unused spartan/ui modules imported in shared modules

## Docker/nginx Performance

Enable gzip and static asset caching in the nginx config for the frontend container:

```nginx
# nginx.conf
gzip on;
gzip_types text/plain text/css application/json application/javascript text/xml;
gzip_min_length 1000;

location ~* \.(js|css|png|jpg|svg|woff2)$ {
  expires 1y;
  add_header Cache-Control "public, immutable";
}
```

## Container Monitoring

```bash
docker stats           # Live CPU/memory per container
docker compose logs -f # Live logs from all services
```
