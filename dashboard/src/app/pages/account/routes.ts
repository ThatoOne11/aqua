import { Routes } from '@angular/router';
import { PasswordReset } from '@account/components/password-reset/password-reset';
import { LoginComponent } from '@account/components/login/login.component';
import { OnboardingSignUp } from './components/onboarding-sign-up/onboarding-sign-up';
import { MultifactorAuthentication } from './components/multifactor-authentication/multifactor-authentication';
import { Unauthorized } from './components/unauthorized/unauthorized';
import { AccountRouteSubPaths } from '@core/constants/routes.constants';
import { EmailPassthrough } from './components/email-passthrough/email-passthrough';
import { AccountSetupIssue } from './components/account-setup-issue/account-setup-issue';
import { UserManagementComponent } from './components/user-management/user-management.component';

export const ACCOUNT_ROUTES_WITH_NO_GUARD: Routes = [
  {
    path: '',
    component: LoginComponent,
  },
  {
    path: AccountRouteSubPaths.LOGIN,
    component: LoginComponent,
  },
  {
    path: AccountRouteSubPaths.ONBOARDING_SIGN_UP,
    component: OnboardingSignUp,
  },
  {
    path: 'unauthorized',
    component: Unauthorized,
  },
  {
    path: AccountRouteSubPaths.PASSWORD_RESET,
    component: PasswordReset,
  },
  {
    path: AccountRouteSubPaths.EMAIL_PASSTHROUGH,
    component: EmailPassthrough,
  },
  {
    path: AccountRouteSubPaths.SETUP_ISSUE,
    component: AccountSetupIssue,
  },
];

export const ACCOUNT_ROUTES_WITH_AUTH_GUARD: Routes = [
  {
    path: AccountRouteSubPaths.MFA,
    component: MultifactorAuthentication,
  },
  {
    path: AccountRouteSubPaths.USER_MANAGEMENT,
    component: UserManagementComponent,
  },
];

export const ACCOUNT_ROUTES_WITH_MFA_GUARD: Routes = [
  {
    path: AccountRouteSubPaths.PASSWORD_RESET,
    component: PasswordReset,
  },
  {
    path: AccountRouteSubPaths.SETUP_ISSUE,
    component: AccountSetupIssue,
  },
];
