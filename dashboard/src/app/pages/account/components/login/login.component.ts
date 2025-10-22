import {
  Component,
  ChangeDetectionStrategy,
  signal,
  OnInit,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { AuthService } from '@core/services/auth/auth.service';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { MfaAuthService } from '@core/services/auth/auth.mfa.service';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { AccountFormGroupBuilder } from '@account/models/form-groups/account-form-group-builder';
import { MatButtonModule } from '@angular/material/button';
import { AccountRoutePaths } from '@core/constants/routes.constants';
import { RoutesService } from '@core/services/routes.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatIconModule,
    MatInputModule,
    FormsModule,
    MatButtonModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent implements OnInit {
  private formBuilder = inject(FormBuilder);
  private authService = inject(AuthService);
  private mfaAuthService = inject(MfaAuthService);
  private router = inject(Router);
  private routesService = inject(RoutesService);
  protected accountFormGroupBuilder: AccountFormGroupBuilder;
  protected loginFormGroup: FormGroup;

  constructor() {
    this.accountFormGroupBuilder = new AccountFormGroupBuilder(
      this.formBuilder
    );
    this.loginFormGroup = this.accountFormGroupBuilder.buildLoginForm();
  }
  async ngOnInit(): Promise<void> {
    this.authService.getAuthenticatedUser().then((user) => {
      if (user) this.router.navigate([this.routesService.getLandingPage()]);
    });
  }

  hide = signal(true);
  resetPasswordMessage = signal('');
  isError = signal(false);
  clickEvent(event: MouseEvent) {
    this.hide.set(!this.hide());
    event.stopPropagation();
  }

  async onSubmit() {
    if (this.loginFormGroup.invalid) return;
    const { email, password } = this.loginFormGroup.value;

    let { data, error } = await this.authService.loginWithSupabaseClient(
      email,
      password
    );
    if (error) {
      console.error('Login failed:', error);
      this.resetPasswordMessage.set(error.message);
      this.isError.set(true);
    } else {
      const hasTotpLinked = await this.mfaAuthService.hasTotpLinked();
      if (hasTotpLinked) {
        const hasVerifiedMfa = await this.mfaAuthService.hasVerifiedMfa();
        if (!hasVerifiedMfa) {
          this.router.navigate([AccountRoutePaths.MFA], {
            queryParams: { returnUrl: this.routesService.getLandingPage() },
          });
          return;
        }
      }

      // If MFA not linked or already verified, go to landing page
      this.router.navigate([this.routesService.getLandingPage()]);
    }
  }

  requestPasswordReset() {
    const { email } = this.loginFormGroup.value;
    if (!email) {
      this.resetPasswordMessage.set(
        'Email is required to request a password reset.'
      );
      this.isError.set(true);
    } else {
      this.authService
        .requestPasswordReset(email)
        .then(() => {
          this.resetPasswordMessage.set(
            'If the account exists a password reset email has been sent.'
          );
          this.isError.set(false);
        })
        .catch((err) => {
          console.error('Reset failed:', err);
          this.resetPasswordMessage.set(
            'There was an error requesting a password reset.'
          );
          this.isError.set(true);
        });
    }
  }
}
