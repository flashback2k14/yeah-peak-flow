import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import {
  email as emailValidator,
  form,
  FormField,
  minLength,
  required,
  submit,
} from '@angular/forms/signals';
import { LucideAngularModule, LUCIDE_ICONS, LucideIconProvider } from 'lucide-angular';
import { AUTH_ICONS } from '../../../shared/icons';
import { AuthService } from '../../../core/services/auth.service';
import { HlmInputDirective } from '../../../shared/ui/hlm-input.directive';
import { HlmButtonDirective } from '../../../shared/ui/hlm-button.directive';

@Component({
  selector: 'app-register-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, FormField, LucideAngularModule, HlmInputDirective, HlmButtonDirective],
  providers: [{ provide: LUCIDE_ICONS, multi: true, useValue: new LucideIconProvider(AUTH_ICONS) }],
  templateUrl: './register-page.component.html',
})
export class RegisterPageComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly registerModel = signal({
    email: '',
    password: '',
    confirmPassword: '',
  });
  readonly registerForm = form(this.registerModel, (f) => {
    required(f.email, { message: 'E-Mail ist erforderlich' });
    emailValidator(f.email, { message: 'Ungültige E-Mail-Adresse' });
    required(f.password, { message: 'Passwort ist erforderlich' });
    minLength(f.password, 8, {
      message: 'Passwort muss mindestens 8 Zeichen lang sein',
    });
    required(f.confirmPassword, { message: 'Bitte Passwort bestätigen' });
  });

  readonly passwordMismatch = computed(() => {
    const { password, confirmPassword } = this.registerModel();
    return confirmPassword.length > 0 && password !== confirmPassword;
  });

  readonly isLoading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly showPassword = signal(false);
  readonly showConfirmPassword = signal(false);

  async onSubmit(event: Event): Promise<void> {
    event.preventDefault();
    await submit(this.registerForm, async () => {
      if (this.passwordMismatch()) {
        return undefined;
      }

      this.isLoading.set(true);
      this.errorMessage.set(null);
      const { email, password } = this.registerModel();
      this.auth.register(email, password).subscribe({
        next: () => {
          this.isLoading.set(false);
          this.router.navigate(['/dashboard']);
        },
        error: (err) => {
          this.isLoading.set(false);
          this.errorMessage.set(
            err?.error?.error ?? 'Registrierung fehlgeschlagen. Bitte versuchen Sie es erneut.',
          );
        },
      });
    });
  }

  togglePassword(): void {
    this.showPassword.update((v) => !v);
  }

  toggleConfirmPassword(): void {
    this.showConfirmPassword.update((v) => !v);
  }
}
