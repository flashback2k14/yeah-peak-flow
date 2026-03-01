import { DOCUMENT } from "@angular/common";
import { Injectable, computed, inject, signal } from "@angular/core";

type ThemeMode = "light" | "dark";

const THEME_STORAGE_KEY = "peak-flow-theme";

@Injectable({ providedIn: "root" })
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly currentTheme = signal<ThemeMode>("light");

  readonly theme = this.currentTheme.asReadonly();
  readonly isDark = computed(() => this.currentTheme() === "dark");

  constructor() {
    this.initialize();
  }

  toggleTheme(): void {
    this.setTheme(this.isDark() ? "light" : "dark");
  }

  setTheme(theme: ThemeMode): void {
    this.currentTheme.set(theme);
    this.applyTheme(theme);
    this.persistTheme(theme);
  }

  private initialize(): void {
    const storedTheme = this.readStoredTheme();
    const initialTheme = storedTheme ?? this.getSystemTheme();

    this.currentTheme.set(initialTheme);
    this.applyTheme(initialTheme);
  }

  private applyTheme(theme: ThemeMode): void {
    this.document.documentElement.setAttribute("data-theme", theme);
  }

  private readStoredTheme(): ThemeMode | null {
    try {
      const value = globalThis.localStorage?.getItem(THEME_STORAGE_KEY);
      return value === "dark" || value === "light" ? value : null;
    } catch {
      return null;
    }
  }

  private persistTheme(theme: ThemeMode): void {
    try {
      globalThis.localStorage?.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // Ignore storage failures (private mode, blocked storage, ...)
    }
  }

  private getSystemTheme(): ThemeMode {
    try {
      return globalThis.matchMedia?.("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    } catch {
      return "dark";
    }
  }
}
