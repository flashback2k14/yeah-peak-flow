# PROJ-5: PDF-Export

## Status: Planned
**Created:** 2026-03-22
**Last Updated:** 2026-03-22

## Dependencies
- Requires: PROJ-4 (Dashboard & Peak-Flow-Diagramm) — Export basiert auf Diagramm-Daten und Zeitraumauswahl

## User Stories
- Als Betreuer möchte ich einen PDF-Report für den Arztbesuch generieren, damit ich Messdaten professionell vorlegen kann
- Als Betreuer möchte ich den Zeitraum des Reports selbst wählen, damit der Report zum Arzttermin passt
- Als Betreuer möchte ich das Diagramm und eine Wertetabelle im PDF sehen, damit der Arzt alle relevanten Daten auf einen Blick hat
- Als Betreuer möchte ich den PDF direkt im Browser herunterladen, ohne zusätzliche Software installieren zu müssen

## Acceptance Criteria
- [ ] Export-Button ist prominent im Dashboard sichtbar
- [ ] Zeitraumauswahl vor dem Export: gleiche Optionen wie im Diagramm (7 Tage / 30 Tage / Benutzerdefiniert)
- [ ] PDF enthält: Patientenname, Zeitraum, persönlicher Bestwert, Diagramm (mit Ampel-Zonen), Wertetabelle
- [ ] Wertetabelle-Spalten: Datum, Uhrzeit, Wert (L/min), Zone (Grün/Gelb/Rot), Notiz
- [ ] PDF ist druckoptimiert (DIN A4, Hochformat, Deutsch)
- [ ] Download startet automatisch im Browser (kein Öffnen in neuem Tab)
- [ ] Generierung dauert maximal 5 Sekunden; Ladeindikator während der Erstellung

## Edge Cases
- Keine Messdaten im gewählten Zeitraum → Export-Button deaktiviert, Hinweis "Keine Daten für diesen Zeitraum"
- Sehr viele Einträge (>100) → mehrseitiges PDF; Diagramm auf Seite 1, Tabelle auf Folgeseiten
- PBW nicht gesetzt → Zone-Spalte zeigt "—"; kein Zonenhintergrund im Diagramm
- Benutzerdefinierter Zeitraum mit Enddatum < Startdatum → Validierungsfehler vor Export
- PDF-Generierung schlägt serverseitig fehl → Fehlermeldung "Export fehlgeschlagen, bitte erneut versuchen"

## Technical Requirements
- PDF-Bibliothek: pdfmake oder jsPDF (zu entscheiden in /architecture)
- Diagramm im PDF: Als PNG-Bild eingebettet (Canvas-to-Image im Browser oder serverseitige Generierung)
- Sprache: Alle Labels und Überschriften auf Deutsch
- Dateiname: `peakflow-[Patientenname]-[Datum].pdf`

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)
_To be added by /architecture_

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
