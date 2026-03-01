import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, NgZone, OnDestroy, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DateTime } from 'luxon';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import QRCode from 'qrcode';
import { ExportService } from '../core/services/export.service';
import { SettingsService } from '../core/services/settings.service';
import { ThemeService } from '../core/services/theme.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly settingsService = inject(SettingsService);
  private readonly exportService = inject(ExportService);
  private readonly themeService = inject(ThemeService);
  private readonly ngZone = inject(NgZone);
  private readonly cdr = inject(ChangeDetectorRef);
  private statusTimer: ReturnType<typeof setTimeout> | null = null;
  private exportMessageTimer: ReturnType<typeof setTimeout> | null = null;
  private loadGuardTimer: ReturnType<typeof setTimeout> | null = null;
  private loadSubscription: Subscription | null = null;
  private exportMonthsLoadSubscription: Subscription | null = null;
  private destroyed = false;

  loading = false;
  saving = false;
  regeneratingToken = false;
  statusMessage = '';
  statusType: 'success' | 'error' = 'success';
  qrCodeDataUrl = '';
  fastLoginUrl: string | null = null;
  exportingPdf = false;
  exportMonthsLoading = false;
  exportMessage = '';
  exportMessageType: 'success' | 'error' = 'success';
  availableExportMonths: string[] = [];
  private selectedExportMonths = new Set<string>();
  readonly isDarkTheme = this.themeService.isDark;

  readonly form = this.fb.group({
    timezone: ['Europe/Berlin', [Validators.required]],
    personalBestLpm: [null as number | null, [Validators.min(50), Validators.max(900)]],
    fastLoginEnabled: [false, [Validators.required]]
  });

  ngOnInit(): void {
    this.loadAvailableExportMonths();
    this.loadSettings();
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    this.clearLoadState();
    this.clearExportMonthsLoadState();
    this.clearStatusTimer();
    this.clearExportMessageTimer();
  }

  get hasStatusMessage(): boolean {
    return !!this.statusMessage;
  }

  get fastLoginEnabled(): boolean {
    return this.form.controls.fastLoginEnabled.value ?? false;
  }

  get hasExportMessage(): boolean {
    return !!this.exportMessage;
  }

  get selectedExportMonthCount(): number {
    return this.availableExportMonths.filter((month) => this.selectedExportMonths.has(month)).length;
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  saveSettings(): void {
    if (this.form.invalid || this.saving) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    this.saving = true;
    this.clearStatus();
    this.requestViewRefresh();

    this.settingsService
      .updateSettings({
        timezone: value.timezone?.trim() || 'Europe/Berlin',
        personalBestLpm: value.personalBestLpm,
        fastLoginEnabled: value.fastLoginEnabled ?? false
      })
      .pipe(
        finalize(() => {
          this.ngZone.run(() => {
            this.saving = false;
            this.requestViewRefresh();
          });
        })
      )
      .subscribe({
        next: (settings) => {
          this.ngZone.run(() => {
            this.applySettings(settings);
            this.setStatus('Einstellungen gespeichert.', 'success');
            this.loadAvailableExportMonths();
            this.requestViewRefresh();
          });
        },
        error: (error) => {
          this.ngZone.run(() => {
            this.setStatus(error?.error?.error ?? 'Einstellungen konnten nicht gespeichert werden.', 'error');
            this.requestViewRefresh();
          });
        }
      });
  }

  regenerateFastLoginToken(): void {
    if (this.regeneratingToken) {
      return;
    }

    this.regeneratingToken = true;
    this.clearStatus();
    this.requestViewRefresh();

    this.settingsService
      .updateSettings({
        fastLoginEnabled: true,
        regenerateFastLoginToken: true
      })
      .pipe(
        finalize(() => {
          this.ngZone.run(() => {
            this.regeneratingToken = false;
            this.requestViewRefresh();
          });
        })
      )
      .subscribe({
        next: (settings) => {
          this.ngZone.run(() => {
            this.form.patchValue({ fastLoginEnabled: settings.fastLoginEnabled }, { emitEvent: false });
            this.applySettings(settings);
            this.setStatus('Fast-Login-Token neu generiert.', 'success');
            this.requestViewRefresh();
          });
        },
        error: (error) => {
          this.ngZone.run(() => {
            this.setStatus(error?.error?.error ?? 'Fast-Login-Token konnte nicht neu generiert werden.', 'error');
            this.requestViewRefresh();
          });
        }
      });
  }

  copyFastLoginLink(): void {
    if (!this.fastLoginUrl) {
      return;
    }

    if (!navigator.clipboard?.writeText) {
      this.setStatus('Zwischenablage wird von diesem Browser nicht unterstuetzt.', 'error');
      return;
    }

    void navigator.clipboard.writeText(this.fastLoginUrl).then(
      () => this.setStatus('Fast-Login-Link kopiert.', 'success'),
      () => this.setStatus('Fast-Login-Link konnte nicht kopiert werden.', 'error')
    );
  }

  isExportMonthSelected(month: string): boolean {
    return this.selectedExportMonths.has(month);
  }

  formatExportMonth(month: string): string {
    return DateTime.fromFormat(month, 'yyyy-MM').setLocale('de').toFormat('LLLL yyyy');
  }

  toggleExportMonth(month: string, event: Event): void {
    const isChecked = (event.target as HTMLInputElement).checked;
    if (isChecked) {
      this.selectedExportMonths.add(month);
    } else {
      this.selectedExportMonths.delete(month);
    }
    this.requestViewRefresh();
  }

  exportSelectedMonthsPdf(): void {
    if (this.exportingPdf) {
      return;
    }

    if (this.exportMonthsLoading) {
      return;
    }

    if (this.availableExportMonths.length === 0) {
      this.setExportMessage('Es sind keine Monate mit Daten verfuegbar.', 'error');
      return;
    }

    const months = [...this.selectedExportMonths].sort((a, b) => a.localeCompare(b));
    if (months.length === 0) {
      this.setExportMessage('Bitte mindestens einen Monat fuer den Export auswaehlen.', 'error');
      return;
    }

    this.exportingPdf = true;
    this.clearExportMessage();
    this.requestViewRefresh();

    this.exportService.exportMeasurementsPdf(months).subscribe({
      next: (response) => {
        this.ngZone.run(() => {
          try {
            this.downloadBlob(
              response.body,
              this.extractFilenameFromDisposition(response.headers.get('content-disposition'))
            );
            this.setExportMessage('PDF-Export erfolgreich erstellt.', 'success');
          } catch {
            this.setExportMessage('PDF konnte nicht heruntergeladen werden.', 'error');
          }
          this.exportingPdf = false;
          this.requestViewRefresh();
        });
      },
      error: () => {
        this.ngZone.run(() => {
          this.exportingPdf = false;
          this.setExportMessage('PDF-Export fehlgeschlagen.', 'error');
          this.requestViewRefresh();
        });
      }
    });
  }

  private loadSettings(): void {
    this.clearLoadState();
    this.loading = true;
    this.clearStatus();
    this.requestViewRefresh();

    this.loadGuardTimer = setTimeout(() => {
      this.ngZone.run(() => {
        this.clearLoadState();
        this.loading = false;
        this.setStatus('Zeitueberschreitung beim Laden der Einstellungen.', 'error');
        this.requestViewRefresh();
      });
    }, 12_000);

    this.loadSubscription = this.settingsService
      .getSettings()
      .pipe(
        finalize(() => {
          this.ngZone.run(() => {
            this.loading = false;
            this.requestViewRefresh();
          });
        })
      )
      .subscribe({
        next: (settings) => {
          this.ngZone.run(() => {
            this.clearLoadState();
            this.applySettings(settings);
            this.requestViewRefresh();
          });
        },
        error: (error) => {
          this.ngZone.run(() => {
            this.clearLoadState();
            this.setStatus(error?.error?.error ?? 'Einstellungen konnten nicht geladen werden.', 'error');
            this.requestViewRefresh();
          });
        }
      });
  }

  private applySettings(settings: {
    timezone: string;
    personalBestLpm: number | null;
    fastLoginEnabled: boolean;
    fastLoginUrl: string | null;
  }): void {
    this.form.patchValue(
      {
        timezone: settings.timezone,
        personalBestLpm: settings.personalBestLpm,
        fastLoginEnabled: settings.fastLoginEnabled
      },
      { emitEvent: false }
    );

    this.fastLoginUrl = settings.fastLoginUrl;
    void this.updateQrCode();
  }

  private async updateQrCode(): Promise<void> {
    if (!this.fastLoginUrl) {
      this.qrCodeDataUrl = '';
      this.requestViewRefresh();
      return;
    }

    try {
      this.qrCodeDataUrl = await QRCode.toDataURL(this.fastLoginUrl, {
        margin: 1,
        width: 220
      });
      this.requestViewRefresh();
    } catch {
      this.qrCodeDataUrl = '';
      this.setStatus('QR-Code konnte nicht erzeugt werden.', 'error');
      this.requestViewRefresh();
    }
  }

  private setStatus(message: string, type: 'success' | 'error'): void {
    this.clearStatusTimer();
    this.statusType = type;
    this.statusMessage = message;
    this.requestViewRefresh();
    this.statusTimer = setTimeout(() => {
      this.ngZone.run(() => {
        this.statusMessage = '';
        this.requestViewRefresh();
      });
    }, 5000);
  }

  private loadAvailableExportMonths(): void {
    this.clearExportMonthsLoadState();
    this.exportMonthsLoading = true;
    this.requestViewRefresh();

    this.exportMonthsLoadSubscription = this.exportService
      .getAvailableMonths()
      .pipe(
        finalize(() => {
          this.ngZone.run(() => {
            this.exportMonthsLoading = false;
            this.requestViewRefresh();
          });
        })
      )
      .subscribe({
        next: (response) => {
          this.ngZone.run(() => {
            this.availableExportMonths = response.months;
            this.syncSelectedExportMonths();
            this.requestViewRefresh();
          });
        },
        error: (error) => {
          this.ngZone.run(() => {
            this.availableExportMonths = [];
            this.selectedExportMonths.clear();
            this.setExportMessage(
              error?.error?.error ?? 'Verfuegbare Export-Monate konnten nicht geladen werden.',
              'error'
            );
            this.requestViewRefresh();
          });
        }
      });
  }

  private syncSelectedExportMonths(): void {
    const validMonths = new Set(this.availableExportMonths);
    const nextSelection = [...this.selectedExportMonths].filter((month) => validMonths.has(month));

    if (nextSelection.length === 0 && this.availableExportMonths.length > 0) {
      nextSelection.push(this.availableExportMonths[0]);
    }

    this.selectedExportMonths = new Set(nextSelection);
  }

  private setExportMessage(message: string, type: 'success' | 'error'): void {
    this.clearExportMessageTimer();
    this.exportMessageType = type;
    this.exportMessage = message;
    this.requestViewRefresh();
    this.exportMessageTimer = setTimeout(() => {
      this.ngZone.run(() => {
        this.exportMessage = '';
        this.requestViewRefresh();
      });
    }, 5000);
  }

  private clearExportMessage(): void {
    this.clearExportMessageTimer();
    this.exportMessage = '';
  }

  private clearExportMessageTimer(): void {
    if (this.exportMessageTimer) {
      clearTimeout(this.exportMessageTimer);
      this.exportMessageTimer = null;
    }
  }

  private extractFilenameFromDisposition(disposition: string | null): string {
    if (!disposition) {
      return `peak-flow-export-${DateTime.local().toFormat('yyyyLLdd-HHmmss')}.pdf`;
    }

    const match = disposition.match(/filename\*?=(?:UTF-8''|")?([^\";]+)/i);
    const encodedName = match?.[1]?.trim();
    if (!encodedName) {
      return `peak-flow-export-${DateTime.local().toFormat('yyyyLLdd-HHmmss')}.pdf`;
    }

    try {
      return decodeURIComponent(encodedName.replace(/"/g, ''));
    } catch {
      return encodedName.replace(/"/g, '');
    }
  }

  private downloadBlob(blob: Blob | null, filename: string): void {
    if (!blob) {
      throw new Error('Missing PDF body');
    }

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.rel = 'noopener';
    anchor.click();
    URL.revokeObjectURL(url);
  }

  private clearStatus(): void {
    this.clearStatusTimer();
    this.statusMessage = '';
  }

  private clearStatusTimer(): void {
    if (this.statusTimer) {
      clearTimeout(this.statusTimer);
      this.statusTimer = null;
    }
  }

  private clearExportMonthsLoadState(): void {
    if (this.exportMonthsLoadSubscription) {
      this.exportMonthsLoadSubscription.unsubscribe();
      this.exportMonthsLoadSubscription = null;
    }
  }

  private clearLoadState(): void {
    if (this.loadGuardTimer) {
      clearTimeout(this.loadGuardTimer);
      this.loadGuardTimer = null;
    }

    if (this.loadSubscription) {
      this.loadSubscription.unsubscribe();
      this.loadSubscription = null;
    }
  }

  private requestViewRefresh(): void {
    if (this.destroyed) {
      return;
    }
    queueMicrotask(() => {
      if (this.destroyed) {
        return;
      }
      this.cdr.detectChanges();
    });
  }
}
