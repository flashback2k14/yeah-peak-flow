import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { DashboardComponent } from './dashboard/dashboard.component';
import { EntryComponent } from './entry/entry.component';
import { LoginComponent } from './auth/login.component';
import { RegisterComponent } from './auth/register.component';
import { FastLoginComponent } from './auth/fast-login.component';
import { AppShellComponent } from './layout/app-shell.component';
import { SettingsComponent } from './settings/settings.component';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'app/entry' },
  { path: 'auth/login', component: LoginComponent },
  { path: 'auth/register', component: RegisterComponent },
  { path: 'auth/fast-login', component: FastLoginComponent },
  {
    path: 'app',
    component: AppShellComponent,
    canActivate: [authGuard],
    children: [
      { path: 'entry', component: EntryComponent },
      { path: 'dashboard', component: DashboardComponent },
      { path: 'settings', component: SettingsComponent },
      { path: '', pathMatch: 'full', redirectTo: 'entry' }
    ]
  },
  { path: '**', redirectTo: 'app/entry' }
];
