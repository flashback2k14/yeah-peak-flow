# Peak-Flow Monitor (Angular + Node.js + SQLite)

Monorepo fuer eine Webanwendung zur Erfassung und Auswertung von Peak-Flow-Werten bei Asthma.

## Inhalt
- `frontend/`: Angular 21 App (Login/Registrierung, Kalender-Erfassung, Dashboard, Settings, PDF-Export)
- `backend/`: Node.js API (Express, Prisma, SQLite, JWT-Cookie-Auth, PDF-Generator)

## Features
- Registrierung und Login per E-Mail + Passwort
- Fast-Login per benutzerspezifischem Token (`/auth/fast-login?token=...`)
- QR-Code fuer Fast-Login-Link in den Einstellungen
- Sichere Authentifizierung via JWT im HttpOnly-Cookie
- Monatlich getrennte Erfassung in Kalenderansicht
- Beliebig viele Messungen pro Tag (Wert, Uhrzeit, Messzeitpunkt vor/nach Inhalation, optionale Notiz)
- Einklappbares Notizfeld in der Erfassungsmaske (standardmaessig eingeklappt)
- Dashboard mit:
  - Monats-Trendlinie (vor Inhalation / nach Inhalation / Durchschnitt)
  - Zonen-Hintergrundflaechen (gruen/gelb/rot) basierend auf persoenlichem Bestwert
  - Kennzahlen (Anzahl, Min, Max, Durchschnitt, vor/nach Inhalation)
  - Zonen-Kacheln (Anzahl gruen/gelb/rot)
- Vollstaendige Asthma-Zonenlogik (60%/80%-Schwellen vom persoenlichen Bestwert)
- Einstellungen:
  - Zeitzone
  - persoenlicher Bestwert (`personalBestLpm`)
  - Theme-Umschaltung (Dark Theme als Default)
  - Fast-Login aktivieren/deaktivieren, Token neu generieren
  - PDF-Export mit Monatsauswahl (nur Monate mit vorhandenen Daten)
- PDF-Export:
  - mehrmonatiger Export
  - Tageszeilen mit Spalten fuer vor/nach Inhalation und Notizen
  - Diagramm am Ende des PDFs
- Persistenz in SQLite

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
JWT_SECRET=replace-with-at-least-32-characters
JWT_EXPIRES_IN=12h
FRONTEND_ORIGIN=http://localhost:4200
COOKIE_NAME=pf_token
```

Wichtig:
- `JWT_SECRET` ist Pflicht und muss mindestens 32 Zeichen lang sein.
- Platzhalterwerte wie `replace-with-at-least-32-characters` werden beim Start explizit abgewiesen.

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

Alternativ beide zusammen:

```bash
npm run dev
```

## Tests
Backend:
```bash
npm run test --workspace backend
```

Frontend:
```bash
npm run test --workspace frontend
```

Gesamt (Backend + Frontend):

```bash
npm test
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
- `GET /api/v1/exports/available-months`
- `GET /api/v1/exports/measurements.pdf?months=YYYY-MM,YYYY-MM`

Hinweis zu Auth:
- `POST /api/v1/auth/register` antwortet immer generisch mit `202 Accepted` (keine Unterscheidung zwischen neuer und bereits registrierter E-Mail) und erstellt keine Session.
- Anmeldung erfolgt anschliessend ueber `POST /api/v1/auth/login`.

### Asthma-Zonen (implementiert)
- Grundlage: `personalBestLpm` (aus Settings)
- Zonen:
  - `green`: `>= 80%` von `personalBestLpm`
  - `yellow`: `>= 60%` und `< 80%`
  - `red`: `< 60%`
- Dashboard liefert:
  - Zonenklassifikation je Tagespunkt (`beforeZone`, `afterZone`, `avgZone`)
  - Zonenstatistik (`green`, `yellow`, `red`, `unclassified`)
  - berechnete Schwellen (`greenMin`, `yellowMin`)

## Docker Deployment
Compose startet:
- `frontend` als Nginx auf Port `80` (anpassbar via `FRONTEND_PORT`)
- `backend` intern auf Port `3000`
- persistente SQLite-Daten in Docker-Volume `sqlite_data`

Vor dem Start ein sicheres JWT-Secret setzen (mind. 32 Zeichen, kein Platzhalter):

```bash
export JWT_SECRET="$(openssl rand -base64 48)"
```

Ohne `JWT_SECRET` (oder mit Platzhalter) bricht der Start absichtlich ab.

Start:

```bash
docker compose up --build -d
```

Optional:
- anderer Frontend-Port: `FRONTEND_PORT=8080 docker compose up --build -d`
- explizite DB-Datei: `DATABASE_URL=file:/data/prod.db`

Hinweis:
- Bei `NODE_ENV=production` setzt der Backend-Cookie `Secure=true`. Dafuer sollte die App ueber HTTPS bereitgestellt werden.
