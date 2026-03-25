# PROJ-2: Patientenprofil-Verwaltung

## Status: Planned
**Created:** 2026-03-22
**Last Updated:** 2026-03-22

## Dependencies
- Requires: PROJ-1 (Benutzer-Authentifizierung) — Profilverwaltung erfordert einen eingeloggten Benutzer

## User Stories
- Als Betreuer möchte ich ein neues Patientenprofil anlegen, damit ich Messungen dem richtigen Patienten zuordnen kann
- Als Betreuer möchte ich den persönlichen Bestwert (PBW) pro Patient festlegen, damit das Ampel-Zonensystem korrekt berechnet wird
- Als Betreuer möchte ich zwischen mehreren Patientenprofilen wechseln, damit ich Daten für verschiedene Familienmitglieder verwalten kann
- Als Betreuer möchte ich ein Profil bearbeiten, damit ich veraltete Daten (z. B. neuer Bestwert) aktualisieren kann
- Als Betreuer möchte ich ein Profil löschen, wenn ein Patient nicht mehr überwacht wird

## Acceptance Criteria
- [ ] Profil-Felder: Name (Pflicht), Geburtsdatum (optional), Geschlecht (optional), persönlicher Bestwert in L/min (optional)
- [ ] Pro Account sind maximal 10 Profile erlaubt
- [ ] Profil-Selektor ist am oberen Bildschirmrand dauerhaft sichtbar (mobil-freundliches Dropdown oder Chip-Reihe)
- [ ] Löschen eines Profils erfordert einen Bestätigungsdialog mit Hinweis: "Alle Messwerte dieses Profils werden unwiderruflich gelöscht"
- [ ] Wenn kein PBW gesetzt ist, wird das Ampel-Zonensystem deaktiviert und ein Hinweis angezeigt
- [ ] Nach dem ersten Login (noch kein Profil vorhanden) startet automatisch ein Onboarding-Flow zur Profil-Erstellung

## Edge Cases
- Kein Profil vorhanden → Onboarding-Dialog startet automatisch; die App kann ohne Profil nicht genutzt werden
- PBW = 0 oder leer → Zonen werden deaktiviert; Hinweis in Dashboard und Messwert-Ansicht
- Profil löschen mit vorhandenen Messungen → Bestätigung erforderlich; Messwerte werden kaskadierend gelöscht
- 10 Profile bereits vorhanden → "Profil hinzufügen"-Button deaktiviert mit Hinweis auf das Limit
- Namensfeld leer gelassen → Validierungsfehler "Name ist ein Pflichtfeld"

## Technical Requirements
- Security: Nutzer kann nur eigene Profile sehen/bearbeiten (Servervalidierung mit JWT)
- API-Endpunkte: GET/POST /patients, GET/PUT/DELETE /patients/:id
- Datenbankbeziehung: Patient gehört zu User; Measurement gehört zu Patient (Kaskadenlöschen)

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)
_To be added by /architecture_

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
