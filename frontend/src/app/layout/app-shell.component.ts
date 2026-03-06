import { Component, OnDestroy, OnInit, computed, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '../core/services/auth.service';
import { SettingsService } from '../core/services/settings.service';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app-shell.component.html',
  styleUrls: ['./app-shell.component.scss']
})
export class AppShellComponent implements OnInit, OnDestroy {
  private readonly authService = inject(AuthService);
  private readonly settingsService = inject(SettingsService);
  private readonly router = inject(Router);
  private settingsLoadSubscription: Subscription | null = null;

  readonly user = this.authService.user;
  readonly medicationManagementUrl = computed(() => this.settingsService.settings()?.medicationManagementUrl ?? null);

  ngOnInit(): void {
    if (this.settingsService.settings()) {
      return;
    }

    this.settingsLoadSubscription = this.settingsService.getSettings().subscribe({
      error: () => {
        // Ignore header-link load errors here; settings page handles detailed feedback.
      }
    });
  }

  ngOnDestroy(): void {
    this.settingsLoadSubscription?.unsubscribe();
    this.settingsLoadSubscription = null;
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: () => this.router.navigateByUrl('/auth/login')
    });
  }
}
