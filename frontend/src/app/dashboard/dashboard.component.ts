import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, NgZone, OnDestroy, OnInit, effect, inject } from '@angular/core';
import { BaseChartDirective } from 'ng2-charts';
import { DateTime } from 'luxon';
import { ChartConfiguration } from 'chart.js';
import { Subscription } from 'rxjs';
import { DashboardService } from '../core/services/dashboard.service';
import { ThemeService } from '../core/services/theme.service';
import { DashboardMonthlyResponse } from '../shared/models/api.models';

type DashboardPalette = {
  beforeLine: string;
  beforePoint: string;
  afterLine: string;
  afterPoint: string;
  averageLine: string;
  averagePoint: string;
  axisText: string;
  grid: string;
};

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, OnDestroy {
  private readonly dashboardService = inject(DashboardService);
  private readonly themeService = inject(ThemeService);
  private readonly ngZone = inject(NgZone);
  private readonly cdr = inject(ChangeDetectorRef);
  private dashboardLoadSubscription: Subscription | null = null;
  private dashboardLoadGuardTimer: ReturnType<typeof setTimeout> | null = null;
  private activeLoadId = 0;
  private destroyed = false;
  private readonly lightPalette: DashboardPalette = {
    beforeLine: '#1d4ed8',
    beforePoint: '#1e40af',
    afterLine: '#dc2626',
    afterPoint: '#b91c1c',
    averageLine: '#6b7280',
    averagePoint: '#4b5563',
    axisText: '#183046',
    grid: 'rgba(24, 48, 70, 0.14)'
  };
  private readonly darkPalette: DashboardPalette = {
    beforeLine: '#7dd3fc',
    beforePoint: '#38bdf8',
    afterLine: '#fca5a5',
    afterPoint: '#f87171',
    averageLine: '#fcd34d',
    averagePoint: '#fbbf24',
    axisText: '#e8f0f7',
    grid: 'rgba(232, 240, 247, 0.25)'
  };

  monthCursor: DateTime<true | false> = DateTime.local().setLocale('de').startOf('month');
  loading = false;
  errorMessage = '';

  data: DashboardMonthlyResponse | null = null;

  lineChartData: ChartConfiguration<'line'>['data'] = {
    labels: [],
    datasets: [
      {
        data: [],
        label: 'Vor der Inhalation',
        borderColor: this.darkPalette.beforeLine,
        pointBackgroundColor: this.darkPalette.beforePoint,
        pointBorderColor: this.darkPalette.beforePoint,
        pointRadius: 4,
        borderWidth: 3,
        tension: 0.25,
        fill: false
      },
      {
        data: [],
        label: 'Nach der Inhalation',
        borderColor: this.darkPalette.afterLine,
        pointBackgroundColor: this.darkPalette.afterPoint,
        pointBorderColor: this.darkPalette.afterPoint,
        pointRadius: 4,
        borderWidth: 3,
        tension: 0.25,
        fill: false
      },
      {
        data: [],
        label: 'Durchschnitt',
        borderColor: this.darkPalette.averageLine,
        pointBackgroundColor: this.darkPalette.averagePoint,
        pointBorderColor: this.darkPalette.averagePoint,
        pointRadius: 3,
        borderWidth: 2.5,
        tension: 0.25,
        borderDash: [6, 4],
        fill: false
      }
    ]
  };

  lineChartOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        title: {
          display: true,
          text: 'Tag',
          color: this.darkPalette.axisText
        },
        ticks: {
          color: this.darkPalette.axisText
        },
        grid: {
          color: this.darkPalette.grid
        }
      },
      y: {
        beginAtZero: false,
        title: {
          display: true,
          text: 'L/min',
          color: this.darkPalette.axisText
        },
        ticks: {
          color: this.darkPalette.axisText
        },
        grid: {
          color: this.darkPalette.grid
        }
      }
    },
    plugins: {
      legend: {
        display: true,
        labels: {
          color: this.darkPalette.axisText
        }
      }
    }
  };

  constructor() {
    effect(() => {
      const useDarkPalette = this.themeService.isDark();
      this.applyPalette(useDarkPalette ? this.darkPalette : this.lightPalette);
    });
  }

  ngOnInit(): void {
    this.loadMonthlyData();
  }

  get monthLabel(): string {
    return this.monthCursor.toFormat('LLLL yyyy');
  }

  get monthInputValue(): string {
    return this.monthCursor.toFormat('yyyy-MM');
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    this.clearDashboardLoadState();
  }

  previousMonth(): void {
    this.monthCursor = this.monthCursor.minus({ months: 1 }).startOf('month');
    this.loadMonthlyData();
  }

  nextMonth(): void {
    this.monthCursor = this.monthCursor.plus({ months: 1 }).startOf('month');
    this.loadMonthlyData();
  }

  goToCurrentMonth(): void {
    this.monthCursor = DateTime.local().setLocale('de').startOf('month');
    this.loadMonthlyData();
  }

  private loadMonthlyData(): void {
    this.clearDashboardLoadState();
    const loadId = ++this.activeLoadId;

    this.loading = true;
    this.errorMessage = '';
    this.data = null;
    this.lineChartData = {
      labels: [],
      datasets: [
        { ...this.lineChartData.datasets[0], data: [] },
        { ...this.lineChartData.datasets[1], data: [] },
        { ...this.lineChartData.datasets[2], data: [] }
      ]
    };
    this.requestViewRefresh();

    this.dashboardLoadGuardTimer = setTimeout(() => {
      this.ngZone.run(() => {
        if (this.activeLoadId !== loadId) {
          return;
        }

        this.clearDashboardLoadState();
        this.loading = false;
        this.errorMessage = 'Zeitueberschreitung beim Laden des Dashboards.';
        this.requestViewRefresh();
      });
    }, 12_000);

    this.dashboardLoadSubscription = this.dashboardService.getMonthly(this.monthInputValue).subscribe({
      next: (response) => {
        this.ngZone.run(() => {
          if (this.activeLoadId !== loadId) {
            return;
          }

          try {
            this.clearDashboardLoadState();
            this.loading = false;
            this.data = response;
            this.errorMessage = '';

            this.lineChartData = {
              labels: response.series.map((point) => DateTime.fromISO(point.date).toFormat('dd.LL.')),
              datasets: [
                {
                  ...this.lineChartData.datasets[0],
                  data: response.series.map((point) => point.beforeInhalation)
                },
                {
                  ...this.lineChartData.datasets[1],
                  data: response.series.map((point) => point.afterInhalation)
                },
                {
                  ...this.lineChartData.datasets[2],
                  data: response.series.map((point) => point.avg)
                }
              ]
            };
          } catch {
            this.data = null;
            this.lineChartData = {
              labels: [],
              datasets: [
                { ...this.lineChartData.datasets[0], data: [] },
                { ...this.lineChartData.datasets[1], data: [] },
                { ...this.lineChartData.datasets[2], data: [] }
              ]
            };
            this.errorMessage = 'Dashboarddaten konnten nicht verarbeitet werden.';
          }
          this.requestViewRefresh();
        });
      },
      error: (error) => {
        this.ngZone.run(() => {
          if (this.activeLoadId !== loadId) {
            return;
          }

          this.clearDashboardLoadState();
          this.loading = false;
          this.data = null;
          this.lineChartData = {
            labels: [],
            datasets: [
              { ...this.lineChartData.datasets[0], data: [] },
              { ...this.lineChartData.datasets[1], data: [] },
              { ...this.lineChartData.datasets[2], data: [] }
            ]
          };
          this.errorMessage = error?.error?.error ?? 'Dashboarddaten konnten nicht geladen werden.';
          this.requestViewRefresh();
        });
      }
    });
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

  private applyPalette(palette: DashboardPalette): void {
    const [beforeDataset, afterDataset, averageDataset] = this.lineChartData.datasets;

    this.lineChartData = {
      ...this.lineChartData,
      datasets: [
        {
          ...beforeDataset,
          borderColor: palette.beforeLine,
          pointBackgroundColor: palette.beforePoint,
          pointBorderColor: palette.beforePoint
        },
        {
          ...afterDataset,
          borderColor: palette.afterLine,
          pointBackgroundColor: palette.afterPoint,
          pointBorderColor: palette.afterPoint
        },
        {
          ...averageDataset,
          borderColor: palette.averageLine,
          pointBackgroundColor: palette.averagePoint,
          pointBorderColor: palette.averagePoint
        }
      ]
    };

    const currentOptions = this.lineChartOptions ?? {};
    const currentScales = currentOptions.scales ?? {};
    const currentPlugins = currentOptions.plugins ?? {};
    const currentLegend = currentPlugins.legend ?? {};
    const xScale = currentScales['x'];
    const yScale = currentScales['y'];

    this.lineChartOptions = {
      ...currentOptions,
      scales: {
        ...currentScales,
        x: {
          ...xScale,
          title: {
            ...xScale?.title,
            color: palette.axisText
          },
          ticks: {
            ...xScale?.ticks,
            color: palette.axisText
          },
          grid: {
            ...xScale?.grid,
            color: palette.grid
          }
        },
        y: {
          ...yScale,
          title: {
            ...yScale?.title,
            color: palette.axisText
          },
          ticks: {
            ...yScale?.ticks,
            color: palette.axisText
          },
          grid: {
            ...yScale?.grid,
            color: palette.grid
          }
        }
      },
      plugins: {
        ...currentPlugins,
        legend: {
          ...currentLegend,
          labels: {
            ...currentLegend.labels,
            color: palette.axisText
          }
        }
      }
    };

    this.requestViewRefresh();
  }

  private clearDashboardLoadState(): void {
    if (this.dashboardLoadGuardTimer) {
      clearTimeout(this.dashboardLoadGuardTimer);
      this.dashboardLoadGuardTimer = null;
    }

    if (this.dashboardLoadSubscription) {
      this.dashboardLoadSubscription.unsubscribe();
      this.dashboardLoadSubscription = null;
    }
  }
}
