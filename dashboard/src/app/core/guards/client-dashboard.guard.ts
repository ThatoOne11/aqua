import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { getItem } from '@core/store/session.store';
import { AuthConstants } from '@core/constants/auth.constants';
import { Roles } from '@core/constants/auth.role.constants';
import { ClientManagementService } from '@client-management/services/client-management.service';
import { RoutesService } from '@core/services/routes.service';
import { AuthService } from '@core/services/auth/auth.service';

export const clientDashboardGuard: CanActivateFn = async (route) => {
  const router = inject(Router);
  const clientManagementService = inject(ClientManagementService);
  const routesService = inject(RoutesService);
  const authService = inject(AuthService);

  const userRole = getItem(AuthConstants.USER_ROLE);
  const userId = (await authService.getAuthenticatedUser())?.id;
  const clientId = route.paramMap.get('id');

  if (userRole === Roles.ADMIN || userRole === Roles.SUPER_ADMIN) {
    return true;
  }

  if (!userRole || !userId || !clientId) {
    router.navigateByUrl('not-found');
    return false;
  }

  // checking whether a user is mapped to a specific client dashboard.
  if (userRole === Roles.CLIENT) {
    const hasAccess = await clientManagementService.isUserAssociatedWithClient(
      userId,
      clientId
    );
    if (hasAccess) {
      return true;
    } else {
      console.warn(
        `Unauthorized access attempt by client to dashboard: ${clientId}`
      );
      return router.parseUrl(routesService.getLandingPage());
    }
  }
  return router.parseUrl(routesService.getLandingPage());
};
