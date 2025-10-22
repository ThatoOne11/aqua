import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { getItem } from '@core/store/session.store';
import { AuthConstants } from '@core/constants/auth.constants';
import { RoleRoutePermissions } from '@core/constants/auth.role.route.permissions.constant';
import { AccountRoutePaths } from '@core/constants/routes.constants';

export const authAndMfaGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const token = getItem(AuthConstants.ACCESS_TOKEN_KEY);
  const userRole = getItem(AuthConstants.USER_ROLE);
  const mfaEnabled = getItem(AuthConstants.HAS_MFA_ENABLED_NAME);
  const mfaVerified = getItem(AuthConstants.HAS_MFA_VERIFIED_NAME);
  const allowedRoutes = RoleRoutePermissions[userRole] || [];

  // Require authentication and route access
  if (!token || !allowedRoutes.includes(route.routeConfig!.path!)) {
    router.navigate([AccountRoutePaths.LOGIN]);
    return false;
  }

  // Only enforce MFA if enabled
  if (mfaEnabled && !mfaVerified) {
    router.navigate([AccountRoutePaths.MFA], {
      queryParams: { returnUrl: route.routeConfig!.path! },
    });
    return false;
  }

  return true;
};
