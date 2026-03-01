import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { AuthService } from '../core/services/auth.service';

@Component({
  selector: 'app-fast-login',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './fast-login.component.html',
  styleUrls: ['./auth.component.scss']
})
export class FastLoginComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  loading = true;
  errorMessage = '';

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token')?.trim() ?? '';
    if (!token) {
      this.loading = false;
      this.errorMessage = 'Fast-Login-Token fehlt.';
      return;
    }

    this.authService
      .fastLogin(token)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: () => this.router.navigateByUrl('/app/entry'),
        error: (error) => {
          this.errorMessage = error?.error?.error ?? 'Fast-Login fehlgeschlagen.';
        }
      });
  }
}
