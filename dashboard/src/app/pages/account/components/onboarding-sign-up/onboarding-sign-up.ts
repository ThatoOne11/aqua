import { Component, inject, signal } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { AccountRoutePaths } from '@core/constants/routes.constants';
import { AuthService } from '@core/services/auth/auth.service';
import { PageTitleComponent } from '@shared-components/page-title/page-title.component';

@Component({
  selector: 'app-onboarding-sign-up',
  imports: [MatButton, MatIconModule, PageTitleComponent],
  templateUrl: './onboarding-sign-up.html',
  styleUrl: './onboarding-sign-up.scss',
  standalone: true,
})
export class OnboardingSignUp {
  private authService = inject(AuthService);
  private router = inject(Router);
  errorMessage = signal<string>('');

  async ngOnInit() {
    try {
      const session = await this.authService.loginWithInvitationLink();
      if (!session) {
        this.errorMessage.set(
          'There was a problem verifying your email address. Please contact support as your invitation may have expired.'
        );
      }
    } catch (e) {
      this.errorMessage.set(
        'There was a problem verifying your email address. Please contact support as your invitation may have expired.'
      );
    }
  }

  protected ResetPassword() {
    this.router.navigate([AccountRoutePaths.MFA], {
      queryParams: { returnUrl: AccountRoutePaths.PASSWORD_RESET },
    });
  }
}
