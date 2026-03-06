# FND-002 - Unsicherer JWT Secret Default in Docker Compose

- Status: Done (2026-03-06)
- Priority: P1
- Finding Date: 2026-03-06
- Source: Security/Data-Integrity Review

## Betroffene Dateien

- `docker-compose.yml` (`JWT_SECRET` mit bekanntem Default)
- `backend/src/config/env.ts` (Env-Validierung)

## Problem

`docker-compose.yml` setzt einen bekannten Fallback-Wert fuer `JWT_SECRET`.
Wenn dieser in produktionsnahen Deployments nicht ueberschrieben wird, sind JWTs vorhersagbar/signierbar.

## Risiko / Auswirkung

- Kompromittierung der Authentifizierung.
- Angreifer koennen gueltige JWTs erzeugen.

## Loesungsvorschlag

1. Keinen Default fuer `JWT_SECRET` in Compose verwenden (fail-fast bei fehlender Variable).
2. In `env.ts` bekannte Platzhalterwerte explizit verbieten.
3. Deployment-Doku um Pflicht-Secret-Setup erweitern.

## Akzeptanzkriterien

1. Start des Backends ohne `JWT_SECRET` bricht mit klarer Fehlermeldung ab.
2. Start mit Platzhalter-Secret bricht ebenfalls ab.
3. Start mit starkem Secret funktioniert.
4. README/Deploy-Doku beschreibt die Pflichtkonfiguration eindeutig.

## Testhinweise

- Manuelle Verifikation mit und ohne gesetzter `JWT_SECRET`.
- Optional automatisierter Test fuer Env-Validierung.

## Umsetzungsnotiz (BL-001)

- `docker-compose.yml`: Kein Fallback mehr fuer `JWT_SECRET` (`:?` fail-fast).
- `backend/src/config/env.ts`: Platzhalterwerte fuer `JWT_SECRET` werden explizit blockiert.
- `backend/tests/env.validation.test.ts`: Validierung fuer fehlendes/Platzhalter-/gueltiges Secret abgedeckt.
- `README.md` und `backend/.env.example`: Pflichtkonfiguration und Generierungshinweis fuer starkes Secret dokumentiert.

## Risiko- und Rollout-Hinweis

- Rollout-Risiko: Deployments ohne gesetztes `JWT_SECRET` starten nach dem Update nicht mehr.
- Rollout: Vor `docker compose up` zwingend `JWT_SECRET` als starkes, einzigartiges Secret setzen (mindestens 32 Zeichen).
