# FND-004 - Nicht-atomare Update/Delete-Operationen bei Messungen

- Status: Resolved
- Priority: P2
- Finding Date: 2026-03-06
- Source: Security/Data-Integrity Review

## Betroffene Dateien

- `backend/src/routes/measurements.routes.ts` (separates `findFirst` vor `update`/`delete`)
- `backend/src/middleware/error-handler.ts` (kein spezifisches Mapping fuer relevante Prisma-Fehler in diesem Pfad)

## Problem

`PATCH` und `DELETE` pruefen zuerst mit `findFirst`, fuehren danach aber eine separate `update`/`delete`-Operation aus.
Bei Race Conditions kann der Datensatz zwischen den beiden Schritten verschwinden und als unerwarteter Fehler enden.

## Risiko / Auswirkung

- Inkonsistentes Fehlerverhalten (statt 404 moeglich 500).
- Schlechtere Robustheit unter Last oder bei parallelen Requests.

## Loesungsvorschlag

1. Atomare Operationen nutzen (`updateMany`/`deleteMany` mit `{ id, userId }`) und `count` auswerten.
2. Alternativ Prisma-Fehler (z. B. NotFound) explizit auf 404 mappen.
3. Tests fuer gleichzeitige Loesch-/Update-Szenarien ergaenzen.

## Akzeptanzkriterien

1. `PATCH`/`DELETE` liefern auch bei konkurrierenden Requests konsistent 404 statt 500 fuer nicht vorhandene Ressourcen.
2. Keine Regression der bestehenden Berechtigungspruefung (`userId`-Scope).
3. Integrationstests decken den konkurrierenden Zugriff ab.

## Testhinweise

- Simulierter paralleler Delete+Patch auf dieselbe Messung.
- Erwartung: deterministische und fachlich korrekte Statuscodes.

## Umsetzungsnotiz (2026-03-06)

- `PATCH`/`DELETE` wurden auf atomare `updateMany`/`deleteMany` mit `{ id, userId }` umgestellt.
- Bei `count === 0` wird konsistent `404` (`Messung nicht gefunden.`) geliefert.
- Integrationstests decken fehlende Ressourcen, `userId`-Scope und konkurrierenden `PATCH`+`DELETE`-Zugriff ohne 500er ab.

## Risiko / Rollout

- Restrisiko: Zwischen erfolgreichem `PATCH` und Response-Read kann ein konkurrierendes `DELETE` stattfinden; der Pfad liefert dann ebenfalls fachlich korrekt `404` statt `500`.
- Rollout: Kein Schema-/API-Contract-Change, daher normaler Backend-Deploy ohne Migrationsschritt ausreichend.
