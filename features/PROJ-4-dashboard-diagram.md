# PROJ-4: Dashboard & Peak-Flow-Diagramm

## Status: Planned
**Created:** 2026-03-22
**Last Updated:** 2026-03-22

## Dependencies
- Requires: PROJ-1 (Benutzer-Authentifizierung)
- Requires: PROJ-2 (Patientenprofil-Verwaltung) — Zonen basieren auf persönlichem Bestwert
- Requires: PROJ-3 (Messwert-Erfassung) — Diagramm visualisiert erfasste Messwerte

## User Stories
- Als Betreuer möchte ich ein Liniendiagramm der Peak-Flow-Werte sehen, damit ich den Verlauf auf einen Blick erkenne
- Als Betreuer möchte ich Grün/Gelb/Rot-Zonen im Diagramm sehen, damit ich den Schweregrad sofort einschätzen kann
- Als Betreuer möchte ich zwischen 7-Tage-, 30-Tage- und benutzerdefinierter Ansicht wechseln, damit ich verschiedene Zeiträume analysieren kann
- Als Betreuer möchte ich Zusammenfassungs-Kacheln (letzter Wert, Durchschnitt, Min/Max) sehen, damit ich Kerninformationen sofort erfasse
- Als Betreuer möchte ich durch Antippen eines Datenpunkts den genauen Wert und die Notiz sehen

## Acceptance Criteria
- [ ] Liniendiagramm mit Datenpunkten, responsive und mobile-first (Touch-freundlich)
- [ ] Ampel-Zonengrenzen: Grün ≥ 80 % PBW, Gelb 60–79 % PBW, Rot < 60 % PBW
- [ ] Farbige Hintergrundregionen (halbtransparent) im Diagramm für Grün/Gelb/Rot
- [ ] Zeitraum-Selektor mit drei Optionen: "7 Tage" / "30 Tage" / "Benutzerdefiniert" (Datepicker)
- [ ] Zusammenfassungs-Kacheln: Letzter Messwert + Zone, Durchschnitt, Minimum, Maximum (im gewählten Zeitraum)
- [ ] Antippen eines Datenpunkts zeigt Tooltip/Modal mit: Datum, Uhrzeit, Wert, Zone, Notiz
- [ ] Wenn kein PBW gesetzt: Zonen-Hintergrundregionen ausgeblendet, Hinweis "Bestwert fehlen" anzeigen
- [ ] Diagramm wechselt bei Profilwechsel automatisch zum neuen Profil

## Edge Cases
- Keine Messwerte im gewählten Zeitraum → leerer Zustand mit Illustration und Hinweis "Noch keine Messungen in diesem Zeitraum"
- Nur 1 Messwert → Diagramm zeigt einzelnen Punkt ohne Verbindungslinie
- PBW nachträglich geändert → Zonen werden sofort neu berechnet und Diagramm aktualisiert
- Sehr viele Messwerte (>200 im Zeitraum) → Datenpunkte werden aggregiert (Tagesdurchschnitt)
- Benutzerdefinierter Zeitraum: Enddatum vor Startdatum → Validierungsfehler

## Technical Requirements
- Diagramm-Bibliothek: Chart.js oder ng2-charts (zu entscheiden in /architecture)
- API: GET /patients/:id/measurements?from=&to= (gefiltert nach Zeitraum)
- Performance: Diagramm rendert in < 300 ms auch bei 200 Datenpunkten
- Mobile UX: Zeitraum-Selektor als horizontal scrollbare Tab-Leiste

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)
_To be added by /architecture_

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
