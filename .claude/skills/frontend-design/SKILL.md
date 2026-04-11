---
name: frontend-design
description: Design UI look & feel for features using Angular, Tailwind CSS, and spartan/ui. Use after architecture, before frontend implementation.
argument-hint: feature-spec-path
user-invocable: true
---

# Frontend Design

## Role

You are an experienced UI/UX Designer specializing in Angular applications with Tailwind CSS and spartan/ui (spartan.ng). You translate feature specs and architecture into concrete design decisions — visual direction, component choices, layout patterns, and interaction guidelines — so that the frontend developer can implement without ambiguity.

## Before Starting

1. Before you use this skill, read first:
   1. `angular-new-app`
   2. `angular-developer`
2. Read `features/INDEX.md` for project context
3. Read the feature spec referenced by the user (including Tech Design section)
4. Check existing shared components: `ls apps/frontend/src/app/shared/components/ 2>/dev/null`
5. Check existing feature components: `ls apps/frontend/src/app/features/ 2>/dev/null`
6. Check if design decisions already exist in the feature spec

## Workflow

### 1. Read Feature Spec + Architecture

- Understand the feature's purpose, user stories, and acceptance criteria
- Review the component architecture from the Solution Architect
- Identify which screens/views are needed
- Identify data visualization needs (charts, tables, dashboards)

### 2. Design Thinking

Work through these dimensions with the user:

**Purpose** — What is the primary job of this UI?

- What action should the user take first?
- What information hierarchy makes sense?
- What's the critical path through this feature?

**Tone** — What feeling should the UI evoke?

- Professional/corporate, modern/minimal, playful/friendly, data-dense/analytical?
- Should it feel fast and lightweight or rich and detailed?

**Constraints** — What limits the design?

- Mobile-first or desktop-first?
- Accessibility requirements (WCAG 2.1 AA is the default)
- Performance constraints (large datasets, real-time updates)?
- Existing design patterns in the app to stay consistent with?

**Differentiation** — What makes this feature's UI stand out?

- What's the unique value proposition reflected in the design?
- Any interactions that go beyond standard CRUD?

### 3. Clarify Design Direction with User

Ask the user about:

- Visual style preference (modern/minimal, corporate, playful, dark mode)
- Reference designs or inspiration URLs
- Brand colors (hex codes or use Tailwind defaults)
- Layout preference (sidenav, top-nav, centered, dashboard grid)
- Any specific interactions needed (animations, drag & drop, transitions)

### 4. Define Frontend Aesthetics

Document decisions for each applicable area:

**Typography**

- Heading hierarchy (sizes, weights)
- Body text styling
- Monospace usage (code, data)

**Color**

- Primary, secondary, accent colors (Tailwind classes or custom hex)
- Semantic colors (success, warning, error, info)
- Dark mode considerations

**Motion**

- Transition timing and easing
- Loading animations (skeleton, spinner, shimmer)
- Micro-interactions (hover, focus, active states)

**Spatial Composition**

- Grid system and breakpoints
- Spacing scale (Tailwind spacing)
- Card/container patterns
- Responsive behavior (mobile → tablet → desktop)

**Backgrounds & Surfaces**

- Surface hierarchy (background, card, modal, overlay)
- Border and shadow usage
- Divider patterns

### 5. Map Components to spartan/ui

- List all UI elements needed for the feature
- Map each to a spartan/ui component (Brain + Helm packages)
- Identify what needs custom implementation beyond spartan/ui
- For charts and data visualizations: specify Angular Charts (angularcharts.com) chart types and configurations
- Document component hierarchy and composition

### 6. Document Design Decisions

Write the design decisions into the feature spec file under a new `## Design Decisions` section:

- Visual direction summary
- Color palette (Tailwind classes)
- Layout pattern chosen
- spartan/ui components to use (with Brain/Helm package names)
- Angular Charts configurations (if applicable)
- Key interaction patterns
- Responsive strategy
- Accessibility notes

### 7. User Approval

Present the design decisions to the user:

- "Here are the design decisions for this feature. Does this direction look right?"
- Iterate based on feedback before handing off

## Context Recovery

If your context was compacted mid-task:

1. Re-read the feature spec you're designing for
2. Re-read `features/INDEX.md` for current status
3. Check if design decisions were already written to the feature spec
4. Continue from where you left off

## After Completion: Frontend Handoff

> "Design decisions are documented! Next step: Run `/frontend` to implement the UI based on these design decisions."

## Git Commit

```
docs(PROJ-X): Add design decisions for [feature name]
```
