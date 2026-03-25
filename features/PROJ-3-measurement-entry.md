# PROJ-3: Messwert-Erfassung

## Status: Planned
**Created:** 2026-03-22
**Last Updated:** 2026-03-22

## Dependencies
- Requires: PROJ-1 (Benutzer-Authentifizierung)
- Requires: PROJ-2 (Patientenprofil-Verwaltung) — Messwerte werden einem Patientenprofil zugeordnet

## User Stories
- Als Betreuer möchte ich schnell einen Peak-Flow-Wert (L/min) eintragen, damit die Messung zeitnah dokumentiert ist
- Als Betreuer möchte ich Datum und Uhrzeit der Messung angeben (Standard: aktuelle Zeit), damit Messungen korrekt zeitgestempelt sind
- Als Betreuer möchte ich eine optionale Freitext-Notiz hinzufügen, damit ich Besonderheiten festhalten kann
- Als Betreuer möchte ich nach dem Speichern sofort sehen, in welcher Zone (Grün/Gelb/Rot) der Wert liegt
- Als Betreuer möchte ich vergangene Messungen in einer Liste sehen, damit ich einen schnellen Überblick habe
- Als Betreuer möchte ich eine Messung bearbeiten oder löschen, damit ich Fehleingaben korrigieren kann

## Acceptance Criteria
- [ ] Eingabefeld für Peak-Flow-Wert: numerisch, Bereich 60–900 L/min (Pflichtfeld)
- [ ] Datum- und Uhrzeitfeld: Standard = aktuelle Zeit, editierbar (Datepicker + Timepicker)
- [ ] Freitextfeld für Notizen: optional, max. 500 Zeichen
- [ ] Nach dem Speichern: sofortiges visuelles Feedback mit Zonenzuordnung (Grün/Gelb/Rot) basierend auf PBW
- [ ] Messliste zeigt alle Einträge des aktiven Profils, sortiert nach Datum (neueste zuerst)
- [ ] Jeder Listeneintrag zeigt: Datum, Uhrzeit, Wert, Zonen-Badge (Farbe), Notiz-Vorschau
- [ ] Bearbeiten und Löschen einzelner Einträge über Swipe-Geste oder Kontextmenü möglich
- [ ] Löschen erfordert Bestätigung ("Messung wirklich löschen?")

## Edge Cases
- Wert außerhalb des Bereichs (< 60 oder > 900) → Validierungsfehler "Wert muss zwischen 60 und 900 L/min liegen"
- Zukünftiges Datum → Warnung "Datum liegt in der Zukunft", aber Speichern ist erlaubt
- Kein PBW gesetzt → Zonen-Badge nach dem Speichern nicht angezeigt; stattdessen Hinweis "Bestwert fehlt"
- Keine Netzwerkverbindung → Fehlermeldung, kein Datenverlust (Formular bleibt befüllt)
- Sehr langer Notiztext (> 500 Zeichen) → Zeichenzähler im Feld, Eingabe wird bei Limit blockiert

## Technical Requirements
- API-Endpunkte: GET/POST /patients/:id/measurements, GET/PUT/DELETE /measurements/:id
- Performance: Messliste lädt max. 50 Einträge initial; ältere per Pagination nachladen
- Mobile UX: Große Eingabefelder, Zahlen-Tastatur für Peak-Flow-Wert

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)
_To be added by /architecture_

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
