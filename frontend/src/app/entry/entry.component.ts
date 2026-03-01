import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, ElementRef, NgZone, OnDestroy, OnInit, ViewChild, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DateTime } from 'luxon';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { MeasurementsService } from '../core/services/measurements.service';
import { Measurement } from '../shared/models/api.models';

interface DayCell {
  dateKey: string;
  dayNumber: number;
  inMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  measurementCount: number;
}

type InhalationTiming = 'before_inhalation' | 'after_inhalation';

@Component({
  selector: 'app-entry',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './entry.component.html',
  styleUrls: ['./entry.component.scss']
})
export class EntryComponent implements OnInit, OnDestroy {
  @ViewChild('createPeakFlowInput') private createPeakFlowInput?: ElementRef<HTMLInputElement>;

  private readonly fb = inject(FormBuilder);
  private readonly measurementsService = inject(MeasurementsService);
  private readonly ngZone = inject(NgZone);
  private readonly cdr = inject(ChangeDetectorRef);
  private monthLoadSubscription: Subscription | null = null;
  private monthLoadGuardTimer: ReturnType<typeof setTimeout> | null = null;
  private actionMessageTimer: ReturnType<typeof setTimeout> | null = null;
  private calendarErrorTimer: ReturnType<typeof setTimeout> | null = null;
  private activeLoadId = 0;
  private destroyed = false;

  readonly weekdayLabels = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

  monthCursor: DateTime<true | false> = DateTime.local().setLocale('de').startOf('month');
  selectedDay: DateTime<true | false> = DateTime.local().setLocale('de').startOf('day');

  calendarRows: DayCell[][] = [];
  selectedDayMeasurements: Measurement[] = [];

  private readonly measurementsByDay = new Map<string, Measurement[]>();

  loading = false;
  creating = false;
  updating = false;
  deletingId: string | null = null;
  calendarErrorMessage = '';
  actionMessage = '';
  actionMessageType: 'success' | 'error' = 'success';
  editingId: string | null = null;
  createNoteExpanded = false;

  readonly createForm = this.fb.group({
    time: [DateTime.local().toFormat('HH:mm'), [Validators.required, Validators.pattern(/^([01]\d|2[0-3]):([0-5]\d)$/)]],
    peakFlowLpm: [null as number | null, [Validators.required, Validators.min(50), Validators.max(900)]],
    inhalationTiming: ['before_inhalation' as InhalationTiming, [Validators.required]],
    note: ['', [Validators.maxLength(500)]]
  });

  readonly editForm = this.fb.nonNullable.group({
    time: ['', [Validators.required, Validators.pattern(/^([01]\d|2[0-3]):([0-5]\d)$/)]],
    peakFlowLpm: [400, [Validators.required, Validators.min(50), Validators.max(900)]],
    inhalationTiming: ['before_inhalation' as InhalationTiming, [Validators.required]],
    note: ['', [Validators.maxLength(500)]]
  });

  ngOnInit(): void {
    if (!this.selectedDay.hasSame(this.monthCursor, 'month')) {
      this.selectedDay = this.monthCursor.startOf('day');
    }
    // Render local calendar grid immediately; API data fills measurement counts afterwards.
    this.rebuildCalendar();
    this.updateSelectedDayMeasurements();
    this.loadMonth();
  }

  get monthLabel(): string {
    return this.monthCursor.toFormat('LLLL yyyy');
  }

  get monthInputValue(): string {
    return this.monthCursor.toFormat('yyyy-MM');
  }

  get selectedDayLabel(): string {
    return this.selectedDay.toFormat('cccc, dd.LL.yyyy');
  }

  get showCalendarStatus(): boolean {
    return this.loading;
  }

  get calendarStatusMessage(): string {
    return 'Kalenderdaten werden geladen...';
  }

  get hasActionMessage(): boolean {
    return !!this.actionMessage;
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    this.clearMonthLoadState();
    this.clearActionMessageTimer();
    this.clearCalendarErrorTimer();
  }

  previousMonth(): void {
    this.monthCursor = this.monthCursor.minus({ months: 1 }).startOf('month');
    this.syncSelectedDayToCurrentMonth();
    this.loadMonth();
  }

  nextMonth(): void {
    this.monthCursor = this.monthCursor.plus({ months: 1 }).startOf('month');
    this.syncSelectedDayToCurrentMonth();
    this.loadMonth();
  }

  goToCurrentMonth(): void {
    this.monthCursor = DateTime.local().setLocale('de').startOf('month');
    this.selectedDay = DateTime.local().setLocale('de').startOf('day');
    this.loadMonth();
  }

  onMonthInputChange(value: string): void {
    const parsed = DateTime.fromFormat(value, 'yyyy-MM').setLocale('de').startOf('month');
    if (!parsed.isValid) {
      return;
    }

    this.monthCursor = parsed;
    this.syncSelectedDayToCurrentMonth();
    this.loadMonth();
  }

  selectDay(day: DayCell): void {
    this.selectedDay = DateTime.fromISO(day.dateKey).setLocale('de').startOf('day');
    this.updateSelectedDayMeasurements();
    this.rebuildCalendar();
  }

  createMeasurement(): void {
    if (this.createForm.invalid || this.creating) {
      this.createForm.markAllAsTouched();
      return;
    }

    const formValue = this.createForm.getRawValue();
    const measuredAt = this.combineDayAndTime(this.selectedDay, formValue.time ?? '00:00');
    const inhalationTiming = formValue.inhalationTiming ?? 'before_inhalation';
    const peakFlowLpm = formValue.peakFlowLpm;

    if (peakFlowLpm === null) {
      this.createForm.controls.peakFlowLpm.markAsTouched();
      return;
    }

    this.creating = true;
    this.clearActionMessage();
    this.requestViewRefresh();

    this.measurementsService
      .create({
        measuredAt,
        peakFlowLpm: Number(peakFlowLpm),
        inhalationTiming,
        note: formValue.note?.trim() || null
      })
      .pipe(
        finalize(() => {
          this.ngZone.run(() => {
            this.creating = false;
            this.requestViewRefresh();
          });
        })
      )
      .subscribe({
        next: () => {
          this.ngZone.run(() => {
            this.createForm.patchValue({
              peakFlowLpm: null,
              inhalationTiming: 'before_inhalation',
              note: ''
            });
            this.createForm.markAsPristine();
            this.createForm.markAsUntouched();
            this.createNoteExpanded = false;
            this.focusCreatePeakFlowInput();
            this.setActionSuccess('Messung erfolgreich gespeichert.');
            this.loadMonth();
          });
        },
        error: (error) => {
          this.ngZone.run(() => {
            this.setActionError(error?.error?.error ?? 'Messung konnte nicht gespeichert werden.');
          });
        }
      });
  }

  startEdit(item: Measurement): void {
    const when = DateTime.fromISO(item.measuredAt);
    this.editingId = item.id;
    this.editForm.setValue({
      time: when.toFormat('HH:mm'),
      peakFlowLpm: item.peakFlowLpm,
      inhalationTiming: item.inhalationTiming,
      note: item.note ?? ''
    });
  }

  cancelEdit(): void {
    this.editingId = null;
  }

  saveEdit(item: Measurement): void {
    if (this.editForm.invalid || this.updating) {
      this.editForm.markAllAsTouched();
      return;
    }

    const formValue = this.editForm.getRawValue();
    const measuredAt = this.combineDayAndTime(this.selectedDay, formValue.time);

    this.updating = true;
    this.clearActionMessage();
    this.requestViewRefresh();

    this.measurementsService
      .update(item.id, {
        measuredAt,
        peakFlowLpm: Number(formValue.peakFlowLpm),
        inhalationTiming: formValue.inhalationTiming,
        note: formValue.note.trim() || null
      })
      .pipe(
        finalize(() => {
          this.ngZone.run(() => {
            this.updating = false;
            this.requestViewRefresh();
          });
        })
      )
      .subscribe({
        next: () => {
          this.ngZone.run(() => {
            this.editingId = null;
            this.setActionSuccess('Messung erfolgreich aktualisiert.');
            this.loadMonth();
          });
        },
        error: (error) => {
          this.ngZone.run(() => {
            this.setActionError(error?.error?.error ?? 'Messung konnte nicht aktualisiert werden.');
          });
        }
      });
  }

  deleteMeasurement(item: Measurement): void {
    if (this.deletingId) {
      return;
    }

    this.deletingId = item.id;
    this.clearActionMessage();
    this.requestViewRefresh();

    this.measurementsService
      .remove(item.id)
      .pipe(
        finalize(() => {
          this.ngZone.run(() => {
            this.deletingId = null;
            this.requestViewRefresh();
          });
        })
      )
      .subscribe({
        next: () => {
          this.ngZone.run(() => {
            if (this.editingId === item.id) {
              this.editingId = null;
            }
            this.setActionSuccess('Messung erfolgreich geloescht.');
            this.loadMonth();
          });
        },
        error: (error) => {
          this.ngZone.run(() => {
            this.setActionError(error?.error?.error ?? 'Messung konnte nicht geloescht werden.');
          });
        }
      });
  }

  trackByDate(_index: number, item: DayCell): string {
    return item.dateKey;
  }

  trackByMeasurement(_index: number, item: Measurement): string {
    return item.id;
  }

  inhalationTimingLabel(value: InhalationTiming): string {
    return value === 'after_inhalation' ? 'Nach der Inhalation' : 'Vor der Inhalation';
  }

  toggleCreateNoteField(): void {
    this.createNoteExpanded = !this.createNoteExpanded;
  }

  private loadMonth(): void {
    this.clearMonthLoadState();
    const loadId = ++this.activeLoadId;

    this.loading = true;
    this.clearCalendarErrorMessage();
    this.measurementsByDay.clear();
    this.rebuildCalendar();
    this.updateSelectedDayMeasurements();
    this.requestViewRefresh();

    this.monthLoadGuardTimer = setTimeout(() => {
      this.ngZone.run(() => {
        if (this.activeLoadId !== loadId) {
          return;
        }

        this.monthLoadSubscription?.unsubscribe();
        this.monthLoadSubscription = null;
        this.monthLoadGuardTimer = null;
        this.loading = false;
        this.setCalendarErrorMessage('Zeitueberschreitung beim Laden. Bitte pruefe die Backend-Verbindung.');
        this.rebuildCalendar();
        this.updateSelectedDayMeasurements();
        this.requestViewRefresh();
      });
    }, 12_000);

    this.monthLoadSubscription = this.measurementsService.getByMonth(this.monthInputValue).subscribe({
      next: (response) => {
        this.ngZone.run(() => {
          if (this.activeLoadId !== loadId) {
            return;
          }

          this.clearMonthLoadState();
          this.loading = false;
          this.measurementsByDay.clear();

          for (const measurement of response.items) {
            const measuredAt = DateTime.fromISO(measurement.measuredAt);
            if (!measuredAt.isValid) {
              continue;
            }

            const key = measuredAt.toISODate();
            if (!key) {
              continue;
            }

            const items = this.measurementsByDay.get(key) ?? [];
            items.push(measurement);
            this.measurementsByDay.set(key, items);
          }

          this.rebuildCalendar();
          this.updateSelectedDayMeasurements();
          this.requestViewRefresh();
        });
      },
      error: (error) => {
        this.ngZone.run(() => {
          if (this.activeLoadId !== loadId) {
            return;
          }

          this.clearMonthLoadState();
          this.loading = false;
          this.setCalendarErrorMessage(
            error?.error?.error ?? 'Daten konnten nicht geladen werden. Bitte pruefe die Backend-Verbindung.'
          );
          this.rebuildCalendar();
          this.updateSelectedDayMeasurements();
          this.requestViewRefresh();
        });
      }
    });
  }

  private clearActionMessage(): void {
    this.clearActionMessageTimer();
    this.actionMessage = '';
  }

  private setActionSuccess(message: string): void {
    this.actionMessageType = 'success';
    this.actionMessage = message;
    this.scheduleActionMessageClear(4000);
    this.requestViewRefresh();
  }

  private setActionError(message: string): void {
    this.actionMessageType = 'error';
    this.actionMessage = message;
    this.scheduleActionMessageClear(6000);
    this.requestViewRefresh();
  }

  private scheduleActionMessageClear(delayMs: number): void {
    this.clearActionMessageTimer();
    this.actionMessageTimer = setTimeout(() => {
      this.ngZone.run(() => {
        this.actionMessage = '';
        this.requestViewRefresh();
      });
    }, delayMs);
  }

  private clearActionMessageTimer(): void {
    if (this.actionMessageTimer) {
      clearTimeout(this.actionMessageTimer);
      this.actionMessageTimer = null;
    }
  }

  private setCalendarErrorMessage(message: string): void {
    this.clearCalendarErrorTimer();
    this.calendarErrorMessage = message;
    this.requestViewRefresh();
    this.calendarErrorTimer = setTimeout(() => {
      this.ngZone.run(() => {
        this.calendarErrorMessage = '';
        this.requestViewRefresh();
      });
    }, 7000);
  }

  private clearCalendarErrorMessage(): void {
    this.clearCalendarErrorTimer();
    this.calendarErrorMessage = '';
  }

  private clearCalendarErrorTimer(): void {
    if (this.calendarErrorTimer) {
      clearTimeout(this.calendarErrorTimer);
      this.calendarErrorTimer = null;
    }
  }

  private clearMonthLoadState(): void {
    if (this.monthLoadGuardTimer) {
      clearTimeout(this.monthLoadGuardTimer);
      this.monthLoadGuardTimer = null;
    }

    if (this.monthLoadSubscription) {
      this.monthLoadSubscription.unsubscribe();
      this.monthLoadSubscription = null;
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

  private rebuildCalendar(): void {
    const firstVisible = this.monthCursor.startOf('week');
    const lastVisible = this.monthCursor.endOf('month').endOf('week');

    const allDays: DayCell[] = [];

    let cursor = firstVisible;
    while (cursor <= lastVisible) {
      const key = cursor.toISODate() ?? '';
      allDays.push({
        dateKey: key,
        dayNumber: cursor.day,
        inMonth: cursor.hasSame(this.monthCursor, 'month'),
        isToday: cursor.hasSame(DateTime.local(), 'day'),
        isSelected: cursor.hasSame(this.selectedDay, 'day'),
        measurementCount: (this.measurementsByDay.get(key) ?? []).length
      });
      cursor = cursor.plus({ days: 1 });
    }

    const rows: DayCell[][] = [];
    for (let i = 0; i < allDays.length; i += 7) {
      rows.push(allDays.slice(i, i + 7));
    }

    this.calendarRows = rows;
  }

  private updateSelectedDayMeasurements(): void {
    const key = this.selectedDay.toISODate() ?? '';
    const items = this.measurementsByDay.get(key) ?? [];

    this.selectedDayMeasurements = [...items].sort((a, b) => b.measuredAt.localeCompare(a.measuredAt));
  }

  private syncSelectedDayToCurrentMonth(): void {
    if (!this.selectedDay.hasSame(this.monthCursor, 'month')) {
      this.selectedDay = this.monthCursor.startOf('day');
    }
  }

  private combineDayAndTime(day: DateTime<true | false>, time: string): string {
    const [hours, minutes] = time.split(':').map(Number);
    return day.set({ hour: hours, minute: minutes, second: 0, millisecond: 0 }).toISO() ?? '';
  }

  private focusCreatePeakFlowInput(): void {
    queueMicrotask(() => {
      this.createPeakFlowInput?.nativeElement.focus();
    });
  }
}
