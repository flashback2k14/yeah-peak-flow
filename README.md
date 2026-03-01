# Peak-Flow Monitor (Angular + Node.js + SQLite)

Monorepo fuer eine Webanwendung zur Erfassung und Auswertung von Peak-Flow-Werten bei Asthma.

## Inhalt
- `frontend/`: Angular-App (Login/Registrierung, Kalender-Erfassung, Dashboard-Diagramm)
- `backend/`: Node.js API (Express, Prisma, SQLite, JWT-Cookie-Auth)

## Features (MVP)
- Registrierung und Login per E-Mail + Passwort
- Sichere Authentifizierung via JWT im HttpOnly-Cookie
- Monatlich getrennte Erfassung in Kalenderansicht
- Beliebig viele Messungen pro Tag (Wert, Uhrzeit, Notiz)
- Dashboard mit Monats-Trendlinie und Kennzahlen (Anzahl, Min, Max, Durchschnitt)
- Einstellungen inkl. Fast-Login pro Benutzer (Link + QR-Code)
- Persistenz in SQLite
- Vorbereitung fuer Asthma-Zonenlogik (`personal_best_lpm` in Settings)

## Voraussetzungen
- Node.js 22.x (empfohlen: `22.22.0`)
- npm 10+

## Installation
Im Repository-Root:

```bash
npm install
```

Wenn lokal Node 24 aktiv ist, kann `ng build` mit einem `esbuild`-Crash abbrechen (z. B. `malloc: Double free...`).
Dann auf die gepinnte Version wechseln:

```bash
volta install node@22.22.0
volta pin node@22.22.0
```

Alternativ mit nvm:

```bash
nvm use
```

## Umgebungsvariablen (Backend)
`backend/.env` anlegen, Beispiel:

```env
NODE_ENV=development
PORT=3000
DATABASE_URL=file:./prisma/dev.db
JWT_SECRET=replace-with-long-random-secret
JWT_EXPIRES_IN=12h
FRONTEND_ORIGIN=http://localhost:4200
COOKIE_NAME=pf_token
```

## Datenbank initialisieren
```bash
npm run prisma:generate --workspace backend
npm run prisma:push --workspace backend
```

## Entwicklung starten
Terminal 1:
```bash
npm run dev --workspace backend
```

Terminal 2:
```bash
npm run start --workspace frontend
```

- Frontend: `http://localhost:4200`
- Backend: `http://localhost:3000`
- Healthcheck: `GET http://localhost:3000/api/v1/health`

## Tests
Backend:
```bash
npm run test --workspace backend
```

Frontend:
```bash
npm run test --workspace frontend
```

## API (Kurzueberblick)
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/fast-login`
- `POST /api/v1/auth/logout`
- `GET /api/v1/auth/me`
- `POST /api/v1/measurements`
- `GET /api/v1/measurements?month=YYYY-MM`
- `PATCH /api/v1/measurements/:id`
- `DELETE /api/v1/measurements/:id`
- `GET /api/v1/dashboard/monthly?month=YYYY-MM`
- `GET /api/v1/settings`
- `PATCH /api/v1/settings`

## Docker Deployment
Compose startet:
- `frontend` als Nginx auf Port `80` (anpassbar via `FRONTEND_PORT`)
- `backend` intern auf Port `3000`
- persistente SQLite-Daten in Docker-Volume `sqlite_data`

Vor dem Start ein sicheres JWT-Secret setzen (mind. 32 Zeichen):

```bash
export JWT_SECRET='DEIN_SEHR_LANGES_RANDOM_SECRET_MIT_MIN_32_ZEICHEN'
```

Start:

```bash
docker compose up --build -d
```

Optional:
- anderer Frontend-Port: `FRONTEND_PORT=8080 docker compose up --build -d`
- explizite DB-Datei: `DATABASE_URL=file:/data/prod.db`

Hinweis:
- Bei `NODE_ENV=production` setzt der Backend-Cookie `Secure=true`. Dafuer sollte die App ueber HTTPS bereitgestellt werden.
