# FND-001 - Fast-Login Token Hardening

- Status: Open
- Priority: P1
- Finding Date: 2026-03-06
- Source: Security/Data-Integrity Review

## Betroffene Dateien

- `backend/prisma/schema.prisma` (fastLoginToken als Klartext gespeichert)
- `backend/src/routes/settings.routes.ts` (Token-Generierung + Link-Aufbau)
- `backend/src/routes/auth.routes.ts` (Token-basierter Login)

## Problem

Der Fast-Login-Token wird als langlebiges Bearer-Secret in Klartext gespeichert und als Query-Parameter im Link verteilt.
Es gibt aktuell keine Ablaufzeit und keine Einmal-Nutzung.

## Risiko / Auswirkung

- Account-Takeover bei Link- oder Token-Leak (History, Logs, Screenshots, Referer, DB-Export).
- Erhoehte Angriffszeit durch unbegrenzte Gueltigkeit.

## Loesungsvorschlag

1. Fast-Login-Token nur gehasht speichern (analog Passwort-Ansatz, z. B. Argon2 oder HMAC mit serverseitigem Secret).
2. Ablaufzeit einfuehren (`fastLoginTokenExpiresAt`).
3. Token bei erfolgreichem Fast-Login invalidieren (one-time) oder rotieren.
4. Optional: separate Rate-Limit-Strategie fuer `/auth/fast-login`.

## Akzeptanzkriterien

1. In der DB ist kein Klartext-Fast-Login-Token mehr gespeichert.
2. Abgelaufene Tokens fuehren zu `401`.
3. Ein bereits verwendeter One-Time-Token fuehrt zu `401`.
4. Neuer Token kann weiterhin ueber Settings erzeugt und als QR/Link genutzt werden.
5. Tests decken gueltig, abgelaufen, wiederverwendet und invalid ab.

## Testhinweise

- Integrationstest fuer Fast-Login mit Token-Ablauf und One-Time-Verhalten.
- Negative Tests fuer invaliden und bereits verwendeten Token.
