# FND-005 - Stabilitaetsrisiko durch Spread bei Math.min/Math.max

- Status: Done (2026-03-06)
- Priority: P3
- Finding Date: 2026-03-06
- Source: Security/Data-Integrity Review

## Betroffene Dateien

- `backend/src/routes/dashboard.routes.ts` (`Math.min(...values)` / `Math.max(...values)`)

## Problem

Die Statistikberechnung nutzt Spread auf potenziell grosse Arrays.
Bei grossen Datenmengen kann dies zu `RangeError` fuehren und den Request abbrechen.

## Risiko / Auswirkung

- Instabiles Verhalten bei grossen Monatsdaten.
- Potenzieller 500-Fehler statt sauberer Antwort.

## Loesungsvorschlag

1. `min`/`max` per `reduce` berechnen statt per Spread.
2. Optional: defensive Guards fuer sehr grosse Datensaetze.

## Akzeptanzkriterien

1. Keine Verwendung von `Math.min(...values)`/`Math.max(...values)` mehr fuer ungebundene Arrays.
2. Dashboard liefert auch bei grossen Datensaetzen stabil Antworten.
3. Tests decken einen Datensatz mit hoher Anzahl Messwerte ab.

## Testhinweise

- Lastnaher Test mit vielen Messwerten in einem Monat.
- Erwartung: kein RangeError, konsistente Statistikwerte.

## Umsetzungsnotiz (BL-005)

- `backend/src/routes/dashboard.routes.ts`: Statistikaggregation auf einen einzelnen `reduce`-Durchlauf umgestellt; `min`/`max` werden ohne Spread berechnet.
- `backend/tests/measurements.integration.test.ts`: Integrationstest mit `130000` Monatsmesswerten ergaenzt, inkl. Erwartung auf stabile 200-Antwort und konsistente Kennzahlen.

## Risiko / Rollout

- Restrisiko: Bei sehr grossen Datensaetzen bleibt der Endpunkt naturgemaess CPU-/I/O-intensiv, liefert aber keine argument-listenbedingten `RangeError` mehr.
- Rollout: Kein API- oder Schema-Change; normaler Backend-Deploy ausreichend.
