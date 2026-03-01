import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { EntryComponent } from './entry.component';
import { MeasurementsService } from '../core/services/measurements.service';

describe('EntryComponent', () => {
  let fixture: ComponentFixture<EntryComponent>;
  let component: EntryComponent;
  let measurementsServiceSpy: jasmine.SpyObj<MeasurementsService>;

  beforeEach(async () => {
    measurementsServiceSpy = jasmine.createSpyObj<MeasurementsService>('MeasurementsService', [
      'getByMonth',
      'create',
      'update',
      'remove'
    ]);

    measurementsServiceSpy.getByMonth.and.returnValue(of({ month: '2026-03', items: [] }));
    measurementsServiceSpy.create.and.returnValue(
      of({
        id: 'm1',
        measuredAt: '2026-03-01T08:00:00.000Z',
        peakFlowLpm: 400,
        inhalationTiming: 'before_inhalation',
        note: null
      })
    );
    measurementsServiceSpy.update.and.returnValue(
      of({
        id: 'm1',
        measuredAt: '2026-03-01T09:00:00.000Z',
        peakFlowLpm: 410,
        inhalationTiming: 'after_inhalation',
        note: null
      })
    );
    measurementsServiceSpy.remove.and.returnValue(of(void 0));

    await TestBed.configureTestingModule({
      imports: [EntryComponent],
      providers: [{ provide: MeasurementsService, useValue: measurementsServiceSpy }]
    }).compileComponents();

    fixture = TestBed.createComponent(EntryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('laedt den aktuellen Monat beim Start', () => {
    expect(measurementsServiceSpy.getByMonth).toHaveBeenCalled();
    expect(component.calendarRows.length).toBeGreaterThan(3);
  });

  it('wechselt den Monat und laedt Daten neu', () => {
    const previousCallCount = measurementsServiceSpy.getByMonth.calls.count();

    component.nextMonth();

    expect(measurementsServiceSpy.getByMonth.calls.count()).toBe(previousCallCount + 1);
  });
});
