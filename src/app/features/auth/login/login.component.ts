import { Component, inject } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthSessionService } from '../../../core/services/auth-session.service';
import { DEMO_CREDENTIALS, MockAuthApiService } from '../../../core/services/mock-auth-api.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly mockAuthApiService = inject(MockAuthApiService);
  private readonly authSessionService = inject(AuthSessionService);
  private readonly router = inject(Router);

  readonly loginForm = this.formBuilder.group({
    email: ['maker.sbi@bank.com', [Validators.required, Validators.email]],
    password: ['Maker@123', [Validators.required]],
    rememberMe: [false]
  });

  readonly demoCredentials = DEMO_CREDENTIALS;

  isSubmitting = false;
  loginStatusMessage = '';

  onLogin(): void {
    this.loginForm.markAllAsTouched();
    if (this.loginForm.invalid || this.isSubmitting) {
      return;
    }

    const { email, password, rememberMe } = this.loginForm.getRawValue();
    this.isSubmitting = true;
    this.loginStatusMessage = '';

    this.mockAuthApiService
      .login({
        email: email || '',
        password: password || '',
        rememberMe: rememberMe || false
      })
      .subscribe({
        next: (response) => {
          this.loginStatusMessage = `Dummy API: ${response.message} (${response.user.role})`;
          this.authSessionService.setSession(response);
          this.isSubmitting = false;
          if (response.user.role === 'Checker') {
            void this.router.navigate(['/dashboard/checker-queue']);
            return;
          }
          void this.router.navigate(['/dashboard']);
        },
        error: (error: Error) => {
          this.loginStatusMessage = error.message || 'Dummy API failed. Please retry.';
          this.isSubmitting = false;
        }
      });
  }

  get emailError(): string {
    const control = this.loginForm.controls.email;
    if (!control.touched && !control.dirty) {
      return '';
    }
    if (control.hasError('required')) {
      return 'Email is required';
    }
    if (control.hasError('email')) {
      return 'Enter a valid email';
    }
    return '';
  }

  get passwordError(): string {
    const control = this.loginForm.controls.password;
    if (!control.touched && !control.dirty) {
      return '';
    }
    if (control.hasError('required')) {
      return 'Password is required';
    }
    return '';
  }

}
