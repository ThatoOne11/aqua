import { Routes } from '@angular/router';
import { RoutePaths } from '@core/constants/routes.constants';
import { authGuard } from '@core/guards/auth.guard';
import { authAndMfaGuard } from '@core/guards/auth-and-mfa.guard';
import { accountSetupGuard } from '@core/guards/account-setup.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/client-dashboard/client-dashboard').then(
        (m) => m.DashboardComponent
      ),
    canActivate: [authAndMfaGuard],
  },
  {
    path: RoutePaths.ACCOUNT,
    loadChildren: () =>
      import('@account/routes').then((m) => m.ACCOUNT_ROUTES_WITH_NO_GUARD),
  },
  {
    path: RoutePaths.ACCOUNT,
    loadChildren: () =>
      import('@account/routes').then((m) => m.ACCOUNT_ROUTES_WITH_AUTH_GUARD),
    canActivate: [authGuard],
  },
  {
    path: RoutePaths.ACCOUNT,
    loadChildren: () =>
      import('@account/routes').then((m) => m.ACCOUNT_ROUTES_WITH_MFA_GUARD),
    canActivate: [authAndMfaGuard, accountSetupGuard],
  },

  {
    path: RoutePaths.DASHBOARD,
    loadComponent: () =>
      import('./pages/client-dashboard/client-dashboard').then(
        (m) => m.DashboardComponent
      ),
    canActivate: [authAndMfaGuard, accountSetupGuard],
  },
  {
    path: RoutePaths.CLIENT_MANAGEMENT,
    loadChildren: () =>
      import('@client-management/routes').then(
        (m) => m.CLIENT_MANAGEMENT_ROUTES
      ),
    canActivate: [authAndMfaGuard, accountSetupGuard],
  },
  {
    path: RoutePaths.DATA_MANAGEMENT,
    loadChildren: () =>
      import('@data-management/routes').then((m) => m.DATA_MANAGEMENT_ROUTES),
    canActivate: [authAndMfaGuard, accountSetupGuard],
  },

  {
    path: '**',
    loadComponent: () =>
      import('./pages/not-found/not-found.component').then(
        (m) => m.NotFoundComponent
      ),
  },
];
