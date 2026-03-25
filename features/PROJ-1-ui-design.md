# UI Design: PROJ-1 – Benutzer-Authentifizierung

## Aesthetic Direction: "Atemraum" (Breathing Space)

**Concept:** Refined warmth. The auth screens evoke the calm focus a caregiver brings when tracking health data — precise, reassuring, unhurried. A dark teal gradient background suggests depth and trust. The floating cream card feels like a clean medical clipboard.

**Tone:** Premium but accessible. Not cold clinical, not startup-flashy.

---

## Color Palette

| Role | Token | Hex | Tailwind |
|------|-------|-----|----------|
| Background (from) | `--color-bg-from` | `#0C2340` | `bg-[#0C2340]` |
| Background (to) | `--color-bg-to` | `#0F3D4F` | `bg-[#0F3D4F]` |
| Card surface | `--color-surface` | `#FAFAF7` | `bg-[#FAFAF7]` |
| Primary brand | `--color-brand` | `#0D9488` | `teal-600` |
| Primary hover | `--color-brand-dark` | `#0F766E` | `teal-700` |
| Accent | `--color-accent` | `#D97706` | `amber-600` |
| Zone Green | `--color-zone-green` | `#10B981` | `emerald-500` |
| Zone Yellow | `--color-zone-yellow` | `#F59E0B` | `amber-500` |
| Zone Red | `--color-zone-red` | `#F43F5E` | `rose-500` |
| Text primary | — | `#111827` | `gray-900` |
| Text muted | — | `#6B7280` | `gray-500` |
| Border | — | `#E5E4DF` | `[#E5E4DF]` |
| Error | — | `#EF4444` | `red-500` |

### CSS Variables (add to `src/styles.css`)
```css
:root {
  --color-brand: #0D9488;
  --color-brand-dark: #0F766E;
  --color-accent: #D97706;
  --color-surface: #FAFAF7;
  --color-bg-from: #0C2340;
  --color-bg-to: #0F3D4F;
  --color-zone-green: #10B981;
  --color-zone-yellow: #F59E0B;
  --color-zone-red: #F43F5E;
}
```

---

## Typography

### Google Fonts (add to `src/index.html`)
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,600;1,9..144,300&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet">
```

### Font Usage
| Element | Font | Weight | Notes |
|---------|------|--------|-------|
| App name "Peak Flow" | Fraunces | 600 | Large, brand mark |
| App tagline | Fraunces | 300 italic | Subtitle below brand |
| Page headings ("Anmelden") | DM Sans | 600 | Card title |
| Subtitles / hints | DM Sans | 400 | Muted gray, italic optional |
| Labels, body | DM Sans | 400 | Standard UI text |
| Buttons | DM Sans | 500 | Slightly heavier |

### Tailwind Font Config (add to `tailwind.config.js`)
```js
fontFamily: {
  display: ['Fraunces', 'serif'],
  body: ['DM Sans', 'sans-serif'],
}
```

### CSS (add to `src/styles.css`)
```css
body {
  font-family: 'DM Sans', sans-serif;
}
.font-display {
  font-family: 'Fraunces', serif;
}
```

---

## Page Layouts

### Shared Background Structure
```html
<!-- Full-screen wrapper -->
<div class="min-h-screen bg-gradient-to-br from-[#0C2340] to-[#0F3D4F] relative overflow-hidden flex flex-col">

  <!-- Decorative breathing wave SVG (absolute, bottom-left, opacity 7%) -->
  <svg class="absolute bottom-0 left-0 pointer-events-none opacity-[0.07]" ...>
    <!-- Sinusoidal path representing a peak flow waveform -->
  </svg>

  <!-- Brand header (above card) -->
  <div class="px-8 pt-12 pb-6">
    <h1 class="font-display text-3xl font-semibold text-white tracking-tight">Peak Flow</h1>
    <p class="font-display text-sm font-light italic text-teal-200 mt-1">Atemweg-Tagebuch</p>
  </div>

  <!-- Card (grows to fill remaining screen on mobile) -->
  <div class="flex-1 bg-[#FAFAF7] rounded-t-3xl md:rounded-2xl md:flex-none md:mx-auto md:my-auto md:w-full md:max-w-md shadow-2xl p-8 md:p-10">
    ...
  </div>
</div>
```

### Login Page (`/login`)
```
Card content:
- Heading: "Willkommen zurück" (DM Sans 600, gray-900, text-2xl)
- Subheading: "Bitte melden Sie sich an." (DM Sans 400, gray-500, text-sm)
- Gap: mb-8

Form fields:
1. E-Mail input (type=email, autocomplete=email)
2. Passwort input (type=password, autocomplete=current-password)
   └── password visibility toggle button (Lucide Eye/EyeOff, absolute right-3)

Error zone (below fields, before button):
- HlmAlert with AlertCircle icon + error message text
- animate-in slide-in-from-top-2 fade-in duration-300

Button: "Anmelden →" (full-width, teal-600, h-12)

Footer:
"Noch kein Konto? → Jetzt registrieren" (link to /register)
```

### Register Page (`/register`)
```
Card content:
- Heading: "Konto erstellen" (same style)
- Subheading: "Für Sie und Ihre Patienten."

Form fields:
1. E-Mail input
2. Passwort input (+ visibility toggle)
3. Passwort bestätigen input (+ visibility toggle)

Error zone (same as login)

Button: "Registrieren →" (full-width, teal-600, h-12)

Footer:
"Bereits registriert? → Anmelden" (link to /login)
```

---

## Component Specifications

### Input Fields
spartan/ui `HlmInputDirective` with these Tailwind overrides applied in the Helm CSS:
```
w-full h-12 px-4 rounded-xl
bg-white
border border-[#E5E4DF]
focus:border-teal-500 focus:ring-1 focus:ring-teal-500 focus:outline-none
transition-colors duration-150
text-gray-900 placeholder:text-gray-400 text-sm
```

Error state (add when field has error): `border-red-400 focus:border-red-500 focus:ring-red-500`

Field error text below input: `text-sm text-red-500 mt-1`

### Password Input Wrapper
```html
<div class="relative">
  <input hlmInput type="password" ... class="pr-12" />
  <button type="button" class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
    <lucide-icon name="eye" size="18" />
  </button>
</div>
```

### Primary CTA Button
spartan/ui `HlmButtonDirective`:
```
w-full h-12 mt-6
bg-teal-600 hover:bg-teal-700
text-white font-medium
rounded-xl
transition-all duration-200
hover:shadow-md
disabled:opacity-60 disabled:cursor-not-allowed
```

Loading state: replace arrow with `<lucide-icon name="loader-2" class="animate-spin" size="18" />`

### Error Alert
spartan/ui `HlmAlertDirective`:
```
border-l-4 border-red-500
bg-red-50
rounded-xl p-3
flex items-start gap-2
text-sm text-red-700
```
Icon: `<lucide-icon name="alert-circle" size="16" class="text-red-500 mt-0.5 shrink-0" />`

### Navigation Link
```html
<p class="text-center text-sm text-gray-500 mt-6">
  Noch kein Konto?
  <a routerLink="/register" class="text-teal-600 font-medium hover:underline ml-1">
    Jetzt registrieren
  </a>
</p>
```

---

## Background Wave SVG

Inline in the page component template, positioned absolute bottom-left:
```html
<svg
  class="absolute bottom-0 left-0 pointer-events-none opacity-[0.07] w-full"
  viewBox="0 0 1440 320"
  xmlns="http://www.w3.org/2000/svg"
  preserveAspectRatio="none"
>
  <path
    fill="none"
    stroke="white"
    stroke-width="2"
    d="M0,160 C120,100 240,220 360,160 C480,100 600,220 720,160 C840,100 960,220 1080,160 C1200,100 1320,220 1440,160"
  />
  <!-- Second wave slightly offset for depth -->
  <path
    fill="none"
    stroke="white"
    stroke-width="1.5"
    opacity="0.5"
    d="M0,200 C180,140 360,260 540,200 C720,140 900,260 1080,200 C1260,140 1380,230 1440,200"
  />
</svg>
```

---

## Animations

| Element | Class |
|---------|-------|
| Card entrance (mobile slide up) | `animate-in slide-in-from-bottom-4 fade-in duration-500` |
| Error alert appearance | `animate-in slide-in-from-top-2 fade-in duration-300` |
| Input focus ring | CSS `transition-colors duration-150` |
| Button hover lift | `hover:shadow-md transition-all duration-200` |
| Loading spinner | Lucide `Loader2` + `animate-spin` |

Requires `tailwindcss-animate` plugin in `tailwind.config.js`:
```js
plugins: [require('tailwindcss-animate')]
```

---

## Tailwind Config Summary

```js
// apps/frontend/tailwind.config.js
const { createGlobPatternsForDependencies } = require('@nx/angular/tailwind');
const { join } = require('path');

module.exports = {
  content: [
    join(__dirname, 'src/**/!(*.stories|*.spec).{ts,html}'),
    ...createGlobPatternsForDependencies(__dirname),
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['Fraunces', 'serif'],
        body: ['DM Sans', 'sans-serif'],
      },
      colors: {
        brand: {
          DEFAULT: '#0D9488',
          dark: '#0F766E',
        },
        zone: {
          green: '#10B981',
          yellow: '#F59E0B',
          red: '#F43F5E',
        },
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
```

---

## Global Styles (`src/styles.css`)

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --color-brand: #0D9488;
  --color-brand-dark: #0F766E;
  --color-accent: #D97706;
  --color-surface: #FAFAF7;
  --color-bg-from: #0C2340;
  --color-bg-to: #0F3D4F;
  --color-zone-green: #10B981;
  --color-zone-yellow: #F59E0B;
  --color-zone-red: #F43F5E;
}

* {
  box-sizing: border-box;
}

html, body {
  height: 100%;
  margin: 0;
  padding: 0;
}

body {
  font-family: 'DM Sans', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.font-display {
  font-family: 'Fraunces', serif;
}
```

---

## Mobile Responsiveness

| Breakpoint | Behavior |
|-----------|---------|
| `< 768px` (mobile) | Card fills full width, `rounded-t-3xl` only, sticks to bottom of screen. Brand header floats above. |
| `≥ 768px` (tablet+) | Centered card, `max-w-md`, `rounded-2xl`, vertically centered on gradient background. |

---

## Accessibility Notes

- All inputs must have visible labels (not just placeholders)
- Form uses `aria-describedby` to link error messages to their fields
- Error alerts use `role="alert"` for screen reader announcement
- Password toggle button has `aria-label="Passwort anzeigen"` / `aria-label="Passwort verbergen"`
- Color contrast: white text on teal-600 passes AA (5.8:1 ratio)
- Gray-900 text on cream card passes AAA

---

## Files Created/Modified by `/frontend`

| File | Purpose |
|------|---------|
| `apps/frontend/src/index.html` | Add Google Fonts preconnect + stylesheet links |
| `apps/frontend/src/styles.css` | CSS variables, font-family, global resets |
| `apps/frontend/tailwind.config.js` | Custom colors, fonts, tailwindcss-animate plugin |
| `apps/frontend/src/app/features/auth/login-page/login-page.component.ts` | Login component logic |
| `apps/frontend/src/app/features/auth/login-page/login-page.component.html` | Login template |
| `apps/frontend/src/app/features/auth/register-page/register-page.component.ts` | Register component logic |
| `apps/frontend/src/app/features/auth/register-page/register-page.component.html` | Register template |
