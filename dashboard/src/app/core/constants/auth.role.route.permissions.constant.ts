import { Roles } from '@core/constants/auth.role.constants';
import { RoutePaths } from '@core/constants/routes.constants';

export const RoleRoutePermissions: Record<string, string[]> = {
  [Roles.SUPER_ADMIN]: [
    RoutePaths.ACCOUNT,
    RoutePaths.CLIENT_MANAGEMENT,
    RoutePaths.DASHBOARD,
    RoutePaths.DATA_MANAGEMENT,
  ],
  [Roles.ADMIN]: [
    RoutePaths.ACCOUNT,
    RoutePaths.DASHBOARD,
    RoutePaths.CLIENT_MANAGEMENT,
    RoutePaths.DATA_MANAGEMENT,
  ],
  [Roles.CLIENT]: [RoutePaths.ACCOUNT, RoutePaths.DASHBOARD],
};
