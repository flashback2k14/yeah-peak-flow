import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { LoginComponent } from './login.component';
import { AuthService } from '../core/services/auth.service';

describe('LoginComponent', () => {
  let fixture: ComponentFixture<LoginComponent>;
  let component: LoginComponent;
  let authServiceSpy: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    authServiceSpy = jasmine.createSpyObj<AuthService>('AuthService', ['login']);
    authServiceSpy.login.and.returnValue(of({ id: '1', email: 'test@example.com' }));

    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [{ provide: AuthService, useValue: authServiceSpy }, provideRouter([])]
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('validiert E-Mail und blockiert ungueltiges Formular', () => {
    component.form.setValue({ email: 'ungueltig', password: 'Passwort123' });

    component.submit();

    expect(component.form.invalid).toBeTrue();
    expect(authServiceSpy.login).not.toHaveBeenCalled();
  });

  it('ruft login bei gueltigem Formular auf', () => {
    component.form.setValue({ email: 'test@example.com', password: 'Passwort123' });

    component.submit();

    expect(authServiceSpy.login).toHaveBeenCalledWith('test@example.com', 'Passwort123');
  });
});
