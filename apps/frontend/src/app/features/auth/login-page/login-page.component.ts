import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { email as emailValidator, form, FormField, required, submit } from '@angular/forms/signals';
import { LucideAngularModule, LUCIDE_ICONS, LucideIconProvider } from 'lucide-angular';
import { AUTH_ICONS } from '../../../shared/icons';
import { AuthService } from '../../../core/services/auth.service';
import { HlmInputDirective } from '../../../shared/ui/hlm-input.directive';
import { HlmButtonDirective } from '../../../shared/ui/hlm-button.directive';

@Component({
  selector: 'app-login-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, FormField, LucideAngularModule, HlmInputDirective, HlmButtonDirective],
  providers: [{ provide: LUCIDE_ICONS, multi: true, useValue: new LucideIconProvider(AUTH_ICONS) }],
  templateUrl: './login-page.component.html',
})
export class LoginPageComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly loginModel = signal({ email: '', password: '' });
  readonly loginForm = form(this.loginModel, (f) => {
    required(f.email, { message: 'E-Mail ist erforderlich' });
    emailValidator(f.email, { message: 'Ungültige E-Mail-Adresse' });
    required(f.password, { message: 'Passwort ist erforderlich' });
  });

  readonly isLoading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly showPassword = signal(false);

  async onSubmit(event: Event): Promise<void> {
    event.preventDefault();
    await submit(this.loginForm, async () => {
      this.isLoading.set(true);
      this.errorMessage.set(null);
      const { email, password } = this.loginModel();
      this.auth.login(email, password).subscribe({
        next: () => {
          this.isLoading.set(false);
          this.router.navigate(['/dashboard']);
        },
        error: (err) => {
          this.isLoading.set(false);
          this.errorMessage.set(
            err?.error?.error ?? 'Anmeldung fehlgeschlagen. Bitte versuchen Sie es erneut.',
          );
        },
      });
    });
  }

  togglePassword(): void {
    this.showPassword.update((v) => !v);
  }
}
