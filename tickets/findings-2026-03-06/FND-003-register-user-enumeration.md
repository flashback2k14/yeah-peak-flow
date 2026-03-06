# FND-003 - User Enumeration bei Registrierung

- Status: Open
- Priority: P2
- Finding Date: 2026-03-06
- Source: Security/Data-Integrity Review

## Betroffene Dateien

- `backend/src/routes/auth.routes.ts` (Register-Flow, spezielle Fehlermeldung bei existierender E-Mail)

## Problem

Der Register-Endpunkt liefert fuer bereits vorhandene E-Mails eine spezifische `409`-Antwort.
Damit kann ein Angreifer gueltige Konten systematisch enumerieren.

## Risiko / Auswirkung

- Offenlegung vorhandener Nutzerkonten.
- Erhoehte Erfolgswahrscheinlichkeit fuer Credential-Stuffing und Phishing.

## Loesungsvorschlag

1. Generische, nicht unterscheidbare Antwort fuer Register-Versuche verwenden.
2. Optional: Registrierungsablauf auf "accepted" umstellen (gleiches externes Verhalten fuer beide Faelle).
3. Logging intern differenzieren, aber keine Detailleaks nach aussen.

## Akzeptanzkriterien

1. Antwort auf Registrierung unterscheidet nicht mehr zwischen "existiert" und "neu".
2. API liefert keine kontenspezifischen Hinweise im Fehlertext.
3. Bestehende Funktionalitaet fuer legitime Registrierung bleibt erhalten.

## Testhinweise

- Integrationstest mit neuer und bereits registrierter E-Mail.
- Verifikation gleicher externer Antwortklasse fuer beide Faelle.
