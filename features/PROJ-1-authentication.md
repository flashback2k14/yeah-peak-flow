# PROJ-1: Benutzer-Authentifizierung

## Status: In Progress
**Created:** 2026-03-22
**Last Updated:** 2026-03-23

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

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
