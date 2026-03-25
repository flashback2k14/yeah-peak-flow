# Product Requirements Document

## Vision

Eine mobile-first Web-App, die Eltern und Betreuern ermöglicht, Peak-Flow-Messwerte für Asthma-Patienten einfach zu erfassen, mit einem Ampel-Zonensystem (Grün/Gelb/Rot) zu überwachen und als PDF-Report für Arztbesuche zu exportieren.

## Target Users

**Primär: Eltern und Betreuer von Asthmatikern** (primär Kinder), die:

- täglich Peak-Flow-Messungen für ihre Angehörigen dokumentieren müssen
- den Verlauf visuell überwachen möchten, um Verschlechterungen frühzeitig zu erkennen
- regelmäßig Berichte für medizinisches Fachpersonal (Kinderarzt, Lungenfacharzt) erstellen

**Pain Points:**

- Manuelle Aufzeichnung auf Papier ist fehleranfällig und geht verloren
- Kein einfacher Überblick über Trends und Zonenverlauf
- PDF-Erstellung für den Arztbesuch ist aufwändig

## Core Features (Roadmap)

| Priority | Feature                        | Status  |
| -------- | ------------------------------ | ------- |
| P0 (MVP) | Benutzer-Authentifizierung     | Planned |
| P0 (MVP) | Patientenprofil-Verwaltung     | Planned |
| P0 (MVP) | Messwert-Erfassung             | Planned |
| P0 (MVP) | Dashboard & Peak-Flow-Diagramm | Planned |
| P1       | PDF-Export                     | Planned |

## Success Metrics

- Messungen pro Nutzer pro Woche (Ziel: ≥ 14, d. h. 2× täglich)
- PDF-Exports pro aktiven Nutzer pro Monat (Ziel: ≥ 1)
- 4-Wochen-Retention (Ziel: ≥ 60 %)

## Constraints

- Mobile-first (Smartphone als primäres Gerät, kein dedizierter Desktop-Fokus)
- Stack: Angular + Node.js + Express + Prisma ORM + SQLite
- Einzelentwickler, kein dediziertes Budget

## Non-Goals

- Keine Echtzeit-Benachrichtigungen oder automatischen medizinischen Warnungen
- Keine direkte Gerätekopplung (Bluetooth-Spirometer oder Medizingeräte-APIs)
- Keine Symptom- oder Medikamentenverfolgung (nur Freitext-Notizen)
- Keine Mehrsprachigkeit in Version 1 (App ist auf Deutsch)
- Kein Arzt-/Klinik-Login mit Mehrmandantenfähigkeit

---

Use `/requirements` to create detailed feature specifications for each item in the roadmap above.
