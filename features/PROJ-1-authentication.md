# PROJ-1: Benutzer-Authentifizierung

## Status: In Review
**Created:** 2026-03-22
**Last Updated:** 2026-04-01

## Dependencies
- None

## User Stories
- Als Betreuer möchte ich mich mit E-Mail und Passwort registrieren, damit meine Daten sicher gespeichert werden
- Als Betreuer möchte ich mich einloggen, damit ich auf meine Patientenprofile und Messdaten zugreife
- Als Betreuer möchte ich mich ausloggen können, damit meine Daten auf geteilten Geräten geschützt sind
- Als Betreuer möchte ich bei ungültigen Anmeldedaten eine verständliche Fehlermeldung erhalten

## Acceptance Criteria
- [ ] Registrierung mit E-Mail + Passwort (min. 8 Zeichen); E-Mail wird auf Eindeutigkeit geprüft
- [ ] Login mit E-Mail + Passwort; bei Erfolg wird ein JWT-Token ausgestellt
- [ ] Passwort wird serverseitig gehasht gespeichert (bcrypt)
- [ ] Ungültige Anmeldedaten zeigen eine klare Fehlermeldung (ohne Hinweis, ob E-Mail oder Passwort falsch ist)
- [ ] Geschützte Routen leiten nicht eingeloggte Nutzer zur Login-Seite um
- [ ] Logout löscht den Token clientseitig und leitet zur Login-Seite um
- [ ] Passwort-Validierung findet sowohl client- als auch serverseitig statt

## Edge Cases
- Bereits registrierte E-Mail bei der Registrierung → klare Fehlermeldung "E-Mail bereits vergeben"
- Abgelaufener JWT-Token → automatischer Logout + Weiterleitung zur Login-Seite
- Sehr schwaches Passwort (< 8 Zeichen) → Validierungsfehler mit Hinweis auf Mindestlänge
- Netzwerkfehler beim Login → generische Fehlermeldung, kein App-Absturz
- Mehrere fehlgeschlagene Login-Versuche → keine Lockout-Logik in MVP (kein Scope)

## Technical Requirements
- Security: Passwort-Hashing mit bcrypt (min. 10 Rounds)
- Token: JWT mit Ablaufzeit (z. B. 7 Tage)
- API-Endpunkte: POST /auth/register, POST /auth/login
- Frontend: Angular Route Guard für geschützte Bereiche

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)

### Komponentenstruktur (Frontend)

```
App (AppComponent)
+-- Auth-Routen (nicht eingeloggt)
|   +-- /login       → LoginPageComponent
|   +-- /register    → RegisterPageComponent
+-- Protected Shell (AuthGuard)
    +-- /dashboard   → (PROJ-4)
    +-- /patients    → (PROJ-2)
    +-- /measurements → (PROJ-3)
```

### Datenmodell

**User** (gespeichert in SQLite via Prisma)
- `id` — Integer, auto-increment, Primärschlüssel
- `email` — String, eindeutig, Pflichtfeld
- `password` — String, bcrypt-Hash (wird nie in API-Antworten zurückgegeben)
- `createdAt` — DateTime, automatisch gesetzt

### API-Endpunkte

| Methode | Pfad | Zweck |
|---------|------|-------|
| POST | /auth/register | Konto erstellen (E-Mail + Passwort) |
| POST | /auth/login | Anmeldedaten prüfen, JWT zurückgeben |

JWT-Payload enthält: `userId`, `email`. Ablaufzeit: 7 Tage.

### Frontend-Services & Guards

- **AuthService** — kapselt API-Aufrufe (register/login/logout), speichert JWT in `localStorage`, stellt `isAuthenticated`-Signal bereit
- **AuthGuard** — funktionaler Route Guard, leitet nicht eingeloggte Nutzer zu `/login` um
- **AuthInterceptor** — HttpInterceptor, der den Bearer-Token an alle API-Anfragen anhängt und bei 401-Antworten automatisch ausloggt

### Technische Entscheidungen

| Entscheidung | Wahl | Begründung |
|---|---|---|
| Token-Speicher | localStorage | Einfachste Lösung für MVP; kein SSR, kein CSRF-Risiko |
| Token-Ablauf | 7 Tage | Betreuer nutzen die App täglich — lang genug um Reibung zu vermeiden |
| Keine Refresh-Tokens | Im MVP weggelassen | Erneuter Login nach 7 Tagen ist akzeptabel |
| Kein Rate-Limiting | Im MVP weggelassen | Laut Spec kein Lockout in MVP vorgesehen |
| Validierung | Zod (Backend) + Signal Forms (Frontend) | Konsistent mit dem Projekt-Stack |

### Abhängigkeiten

**Backend:**
- `bcrypt` — Passwort-Hashing (10 Rounds)
- `jsonwebtoken` — JWT-Erstellung und -Prüfung
- `zod` — Request-Body-Validierung

**Frontend:**
- `@angular/material` — Formularfelder, Buttons, Fehlermeldungen (keine Custom-Komponenten)

## Implementation Notes (Frontend)

**Angular app scaffolded:** `apps/frontend/` — Angular v21, standalone components, `@angular/forms/signals`

**Files created:**
- `src/app/app.ts` + `app.config.ts` + `app.routes.ts` — app shell (RouterOutlet, lazy routes)
- `src/app/core/services/auth.service.ts` — JWT in localStorage, `isAuthenticated` signal, `login`/`register`/`logout`
- `src/app/core/guards/auth.guard.ts` — functional guard redirecting to `/login`
- `src/app/core/interceptors/auth.interceptor.ts` — Bearer token + auto-logout on 401
- `src/app/features/auth/login-page/` — "Willkommen zurück", Signal Forms
- `src/app/features/auth/register-page/` — "Konto erstellen", Signal Forms + password match check
- `src/app/shared/ui/hlm-input.directive.ts` + `hlm-button.directive.ts` — pass-through directives (spartan/ui not available as npm packages without Nx)

**Note:** spartan/ui individual packages (`@spartan-ng/ui-*-helm`) are not published to npm — they require the Nx generator. Local stub directives used instead; all visual styling handled by Tailwind classes in templates.

## QA Test Results

**QA Date:** 2026-04-01
**Outcome:** 11 bugs found and fixed. Feature is now functional.

### Bugs Fixed

| ID | Severity | Description | Fix |
|----|----------|-------------|-----|
| BUG-1 | Critical | API URL mismatch — frontend called `/api/auth/*`, backend mounted at `/auth/*` | Changed `environment.ts` apiUrl from `http://localhost:3000/api` to `http://localhost:3000` |
| BUG-2 | High | Dashboard route loaded `LoginPageComponent` instead of a dashboard | Created `DashboardPageComponent` placeholder; updated `app.routes.ts` |
| BUG-3 | High | No `helmet` middleware — missing security headers | Installed helmet v8, added `app.use(helmet())` to backend |
| BUG-4 | High | CORS wide open — accepted requests from any origin | Restricted CORS to `CORS_ORIGIN` env var or `http://localhost:4200` |
| BUG-5 | High | No async error handling — unhandled promise rejections in auth routes | Added try/catch to both route handlers and global error middleware |
| BUG-6 | High | No JWT_SECRET validation at startup | Added startup guard: `process.exit(1)` if JWT_SECRET missing |
| BUG-7 | Medium | Weak default JWT_SECRET placeholder | Replaced with cryptographically random 64-char hex string |
| BUG-8 | Medium | `isLoading` not reset on successful login/register | Added `this.isLoading.set(false)` in the `next` callback of both components |
| BUG-9 | Low | Login form leaked password policy via min-length validator | Removed `minLength` validator from login form; changed placeholder to "Ihr Passwort" |
| BUG-10 | Low | Missing German umlauts in templates and component strings | Fixed all ae/oe/ue → ä/ö/ü occurrences across templates and .ts files |
| BUG-11 | Critical | `(ngSubmit)` used without `FormsModule` — Angular's `NgForm` never applied, so `onSubmit()` was never called; browser fell back to native GET form submission, leaking credentials as URL query params | Changed `(ngSubmit)="onSubmit()"` → `(submit)="onSubmit($event)"` in both login and register HTML; added `event.preventDefault()` as first line of both `onSubmit()` methods |

## Deployment
_To be added by /deploy_
