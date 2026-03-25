---
paths:
  - "src/app/**"
  - "src/environments/**"
---

# Frontend Development Rules

## spartan/ui First (MANDATORY)
- Before creating ANY UI component, check if spartan/ui (spartan.ng) has it
- NEVER create custom implementations of: Button, Input, Select, Checkbox, Switch, Dialog, Alert Dialog, Sonner/Toast, Table, Tabs, Card, Badge, Menu, Tooltip, Navigation Menu, Sheet, Breadcrumb, Progress, Spinner
- Import spartan/ui Helm directives/components directly in standalone component imports array
- Brain packages (`@spartan-ng/ui-*-brain`) provide accessible primitives (logic, state, a11y)
- Helm components (`@spartan-ng/ui-*-helm`) provide Tailwind-based styling — you own and can customize these
- Custom components are ONLY for business-specific compositions that internally use spartan/ui primitives

## Angular Charts for Data Visualization (MANDATORY)
- When charts or data visualizations are needed, ALWAYS use Angular Charts (https://angularcharts.com/)
- NEVER use other charting libraries (ng2-charts, Chart.js, D3, ngx-echarts, ag-charts, Syncfusion Charts, etc.)
- Angular Charts components are standalone, copy-paste ready, and built with Tailwind CSS + Spartan UI
- Supported chart types: area, bar, line, donut, and more
- All chart components support dark mode out of the box
- Refer to https://angularcharts.com/ for available components and usage examples

## Import Pattern
```typescript
import { HlmButtonDirective } from '@spartan-ng/ui-button-helm';
import { HlmCardDirective } from '@spartan-ng/ui-card-helm';
import { HlmInputDirective } from '@spartan-ng/ui-input-helm';

@Component({
  standalone: true,
  imports: [HlmButtonDirective, HlmCardDirective, HlmInputDirective],
})
```

## Component Standards
- ALL components must be standalone (`standalone: true`)
- Use `inject()` function instead of constructor injection
- Use `OnPush` change detection for all components
- Use signals (`signal()`, `computed()`, `linkedSignal()`) for reactive state
- Use Tailwind CSS for layout/spacing and spartan/ui Helm styles for components
- All components must be responsive (mobile 375px, tablet 768px, desktop 1440px)
- Implement loading states, error states, and empty states
- Use semantic HTML and ARIA labels for accessibility

## State Management
- Shared/cross-component state lives in Angular Services (`@Injectable({ providedIn: 'root' })`)
- Use `signal()` inside services for reactive state
- Component-local state may use `signal()` directly in the component
- NEVER use `BehaviorSubject` or `Observable` where signals suffice

## Forms (Angular Signal Forms)
- Use Angular Signal Forms for all form handling
- Define Zod schemas for validation logic
- Integrate Zod validation with Signal Forms via custom validators

## Auth Best Practices
- Use Angular Route Guards (`CanActivateFn`) to protect routes
- Store auth state in a dedicated `AuthService`
- Use `Router.navigate()` for post-login redirects
- Always handle loading state in all code paths (success, error, finally)
