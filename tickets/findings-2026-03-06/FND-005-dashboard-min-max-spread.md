# FND-005 - Stabilitaetsrisiko durch Spread bei Math.min/Math.max

- Status: Open
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
