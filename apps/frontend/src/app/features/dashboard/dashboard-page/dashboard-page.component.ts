import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen bg-[#FAFAF7] flex items-center justify-center">
      <p class="text-gray-500">Dashboard (wird in PROJ-4 implementiert)</p>
    </div>
  `,
})
export class DashboardPageComponent {}
