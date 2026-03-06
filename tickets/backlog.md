# Backlog v2 (2026-03-06)

Dieses Backlog enthaelt nur noch offene Themen.
Prioritaetsskala: `P1` (kritisch), `P2` (wichtig), `P3` (mittel).

## Now (sofort starten)

| ID     | Prioritaet | Thema                                                 | Nutzen                                             | Aufwand | Ticket    |
| ------ | ---------- | ----------------------------------------------------- | -------------------------------------------------- | ------- | --------- |
| BL-002 | P1         | Fast-Login Token hardening (hash + expiry + rotation) | Reduziert hohes Account-Takeover-Risiko            | M-L     | `FND-001` |
| BL-006 | P2         | Testausbau fuer Security-/Race-Edge-Cases             | Senkt Regressionsrisiko bei kritischen Aenderungen | M       | Neu       |

## Next (direkt danach)

| ID     | Prioritaet | Thema                                                          | Nutzen                                      | Aufwand | Ticket |
| ------ | ---------- | -------------------------------------------------------------- | ------------------------------------------- | ------- | ------ |
| BL-007 | P2         | CI-Qualitaetsgate (build + tests + optional lint)              | Fruehes Erkennen von Regressions im PR-Flow | M       | Neu    |
| BL-010 | P3         | Sicherheitsdoku + Betriebscheckliste (Secrets, HTTPS, Backups) | Weniger Betriebsfehler bei Deployments      | S       | Neu    |

## Later (nach Stabilisierung)

| ID     | Prioritaet | Thema                                                             | Nutzen                                     | Aufwand | Ticket |
| ------ | ---------- | ----------------------------------------------------------------- | ------------------------------------------ | ------- | ------ |
| BL-008 | P2         | Export/Month-Queries fuer grosse Datenmengen optimieren           | Bessere Antwortzeiten bei grossen Accounts | M-L     | Neu    |
| BL-009 | P2         | Observability (Request-ID, strukturierte Logs, Error-Korrelation) | Schnellere Fehleranalyse im Betrieb        | M       | Neu    |

## Erledigt (archiviert)

- `BL-001` (`FND-002`)
- `BL-003` (`FND-004`)
- `BL-004` (`FND-003`)
- `BL-005` (`FND-005`)

## Empfohlene Reihenfolge (naechste 2 Sprints)

1. Sprint 1: `BL-002`, `BL-006`
2. Sprint 2: `BL-007`, `BL-010`

## Definition of Done (fuer jedes Backlog-Item)

1. Code-Aenderung inkl. Tests vorhanden.
2. Build und relevante Test-Suites laufen gruen.
3. Dokumentation/README bei Betriebs- oder API-Aenderungen aktualisiert.
4. Ticket enthaelt kurze Notiz zu Risiko und Rollout-Hinweisen.
5. Verschiebe das erledigte Ticket in den `done` Ordner.
