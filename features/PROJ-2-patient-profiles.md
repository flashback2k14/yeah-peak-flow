# PROJ-2: Patientenprofil-Verwaltung

## Status: Architected
**Created:** 2026-03-22
**Last Updated:** 2026-04-11

## Dependencies
- Requires: PROJ-1 (Benutzer-Authentifizierung) — Profilverwaltung erfordert einen eingeloggten Benutzer

## User Stories
- Als Betreuer möchte ich ein neues Patientenprofil anlegen, damit ich Messungen dem richtigen Patienten zuordnen kann
- Als Betreuer möchte ich den persönlichen Bestwert (PBW) pro Patient festlegen, damit das Ampel-Zonensystem korrekt berechnet wird
- Als Betreuer möchte ich zwischen mehreren Patientenprofilen wechseln, damit ich Daten für verschiedene Familienmitglieder verwalten kann
- Als Betreuer möchte ich ein Profil bearbeiten, damit ich veraltete Daten (z. B. neuer Bestwert) aktualisieren kann
- Als Betreuer möchte ich ein Profil löschen, wenn ein Patient nicht mehr überwacht wird
- Als Betreuer möchte ich Notizen zu einem Patienten hinterlegen (z. B. Medikamente, Arztname), damit ich wichtige Infos an einem Ort habe
- Als Betreuer möchte ich über ein Dropdown in der Navbar schnell zwischen Patienten wechseln, ohne die aktuelle Seite zu verlassen
- Als Betreuer möchte ich auf einer Übersichtsseite alle Patientenprofile als Karten sehen und von dort aus Profile erstellen, bearbeiten oder löschen

## Acceptance Criteria
- [ ] Profil-Felder: Name (Pflicht), Geburtsdatum (optional), Geschlecht (optional, Auswahl: männlich/weiblich/divers), persönlicher Bestwert in L/min (optional, Zahlenfeld), Notizen (optional, Freitext, max. 500 Zeichen)
- [ ] Pro Account sind maximal 10 Profile erlaubt
- [ ] Navbar enthält ein Dropdown, das den aktuell ausgewählten Patienten anzeigt und schnellen Wechsel ermöglicht
- [ ] Seite `/patients` zeigt alle Patientenprofile als Karten; von dort aus können Profile erstellt, bearbeitet und gelöscht werden
- [ ] Löschen eines Profils erfordert einen Bestätigungsdialog mit Hinweis: "Alle Messwerte dieses Profils werden unwiderruflich gelöscht"
- [ ] Wenn kein PBW gesetzt ist, wird das Ampel-Zonensystem deaktiviert und ein Hinweis angezeigt
- [ ] Nach dem ersten Login (noch kein Profil vorhanden) startet automatisch ein zwingender Fullscreen-/Modal-Dialog zur Profil-Erstellung; die App ist ohne Profil nicht nutzbar
- [ ] Notizfeld zeigt einen Zeichenzähler (z. B. "120 / 500")

## Edge Cases
- Kein Profil vorhanden → Onboarding-Dialog startet automatisch; die App kann ohne Profil nicht genutzt werden
- PBW = 0 oder leer → Zonen werden deaktiviert; Hinweis in Dashboard und Messwert-Ansicht
- Profil löschen mit vorhandenen Messungen → Bestätigung erforderlich; Messwerte werden kaskadierend gelöscht
- 10 Profile bereits vorhanden → "Profil hinzufügen"-Button deaktiviert mit Hinweis auf das Limit
- Namensfeld leer gelassen → Validierungsfehler "Name ist ein Pflichtfeld"
- Notizfeld überlang (> 500 Zeichen) → Eingabe wird auf 500 Zeichen begrenzt; Zeichenzähler rot gefärbt
- Profil-Dropdown in Navbar bei nur 1 Profil → Dropdown zeigt den Namen; bleibt klickbar als Schnellzugriff auf `/patients`

## Technical Requirements
- Security: Nutzer kann nur eigene Profile sehen/bearbeiten (Servervalidierung mit JWT)
- API-Endpunkte: GET/POST /patients, GET/PUT/DELETE /patients/:id
- Datenbankbeziehung: Patient gehört zu User; Measurement gehört zu Patient (Kaskadenlöschen)

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)

### 1. Komponentenstruktur

```
App (app.ts) — Layout mit Navbar + Router-Outlet (nur wenn authentifiziert)
├── NavbarComponent  [NEU — shared/components/navbar/]
│   ├── App-Titel
│   ├── PatientSelectorDropdown  [NEU — zeigt ausgewählten Patienten, schneller Wechsel]
│   │   └── Patientenliste + "Patienten verwalten" → /patients
│   └── User-Menü (E-Mail + Logout)
│
├── /patients  [NEU, guarded]
│   └── PatientsPageComponent  [NEU]
│       ├── Header mit "Neues Profil"-Button (deaktiviert bei 10 Profilen)
│       ├── PatientCardComponent  [NEU, pro Patient]
│       │   └── Name, Geburtsdatum, Geschlecht, PBW, Notiz-Vorschau
│       │   └── Bearbeiten + Löschen Buttons
│       └── Empty State wenn keine Patienten
│
├── PatientFormDialogComponent  [NEU — für Erstellen + Bearbeiten]
│   ├── Name (Pflicht), Geburtsdatum, Geschlecht-Select, PBW (Zahl), Notizen + Zeichenzähler
│   └── Speichern / Abbrechen
│
├── DeleteConfirmDialogComponent  [NEU]
│   └── Warnung: "Alle Messwerte werden unwiderruflich gelöscht"
│
└── OnboardingDialogComponent  [NEU — Fullscreen, nicht schließbar]
    └── Willkommensnachricht + PatientForm (Erstellmodus)
```

### 2. Datenmodell

**Patient** speichert:
- ID (Auto-Increment)
- userId (Fremdschlüssel → User)
- Name (Pflicht, String)
- Geburtsdatum (optional, Datum)
- Geschlecht (optional: männlich/weiblich/divers)
- Persönlicher Bestwert PBW in L/min (optional, Ganzzahl)
- Notizen (optional, max. 500 Zeichen)
- Erstellt/Aktualisiert Zeitstempel

**Beziehungen:**
- User 1 → N Patient (max. 10, App-seitig erzwungen)
- Patient 1 → N Measurement (Kaskadenlöschung)

**Measurement** wird als Platzhalter-Modell angelegt (id, patientId, value, measuredAt, createdAt), damit die Kaskadenrelation von Anfang an korrekt ist. Volle Implementierung in PROJ-3.

### 3. API-Endpunkte

Alle Endpunkte erfordern Authentifizierung (`authenticate` Middleware auf Router-Ebene). Queries immer auf `userId = req.user.id` beschränkt.

| Methode | Pfad | Beschreibung |
|---------|------|-------------|
| GET | `/patients` | Alle Patienten des Users, sortiert nach Erstellung |
| POST | `/patients` | Neuen Patienten anlegen (Zod-Validierung, 400 bei ≥10 Profilen) |
| GET | `/patients/:id` | Einzelnes Profil (404 wenn nicht gefunden/nicht eigenes) |
| PUT | `/patients/:id` | Profil aktualisieren |
| DELETE | `/patients/:id` | Profil + Messungen löschen (Kaskade), 204 No Content |

### 4. Frontend-Service & State

**PatientService** (providedIn: root, Signal-basiert wie AuthService):
- `patients` Signal — Liste aller Patienten
- `selectedPatientId` Signal — in localStorage persistiert (überlebt Page-Refresh)
- `selectedPatient` Computed — abgeleitet aus patients + selectedPatientId
- `hasPatients` Computed — für Onboarding-Check
- `canCreateMore` Computed — `patients().length < 10`
- Methoden: `loadPatients()`, `createPatient()`, `updatePatient()`, `deletePatient()`, `selectPatient()`

**Initialisierung:** PatientService lädt Patienten beim App-Start (nach Auth-Check). App-Shell prüft `hasPatients` — wenn false und authentifiziert → Onboarding-Dialog öffnet sich.

### 5. Wichtige UX-Flows

- **Onboarding:** Login → Patienten laden → Liste leer → Fullscreen-Dialog (nicht schließbar) → Profil anlegen → Dialog schließt, App nutzbar
- **Patientenwechsel:** Navbar-Dropdown → Patient auswählen → Signal aktualisiert → alle abhängigen Komponenten reagieren sofort
- **CRUD auf /patients:** Karten-Übersicht, Dialog für Erstellen/Bearbeiten, Bestätigungsdialog beim Löschen
- **Löschwarnung:** Immer angezeigt (unabhängig ob Messungen existieren) — einfacher und zukunftssicher für PROJ-3

### 6. Tech-Entscheidungen

| Entscheidung | Begründung |
|-------------|------------|
| Signals statt NgRx | Konsistent mit AuthService-Pattern, kein Overhead für kleinen Scope |
| localStorage für selectedPatientId | Überlebt Page-Refresh, konsistent mit Token-Speicherung |
| Onboarding als Dialog statt Guard | Spec fordert Fullscreen-Overlay ohne URL-Änderung |
| Authenticate auf Router-Ebene | Weniger fehleranfällig als pro Endpunkt |
| 10-Profil-Limit serverseitig | Frontend UX-Hinweis, Server ist Autorität |
| Measurement-Platzhalter jetzt | Kaskadenrelation von Anfang an korrekt, keine spätere Migration nötig |

### 7. Neue spartan/ui-Komponenten

| Komponente | Zweck |
|-----------|-------|
| AlertDialog | Onboarding-Dialog, Lösch-Bestätigung, Formular-Dialog |
| Select | Geschlecht-Dropdown im Formular |
| Label | Formular-Labels |
| Textarea | Notizfeld mit Zeichenzähler |
| Card | Patientenkarten auf /patients |
| DropdownMenu | Navbar-Patientenauswahl + User-Menü |
| Separator | Trennlinien in Dropdown-Menüs |

### 8. Neue Abhängigkeiten

Keine neuen npm-Pakete nötig. Alle spartan/ui-Komponenten werden über spartan CLI generiert. Vorhandene Pakete (Zod, Prisma, Lucide, Angular Forms/Signals) decken alles ab.

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
