import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { setItem, getItem } from '@core/store/session.store';
import { AccountService } from '@account/services/account.service';
import { AccountRouteSubPaths } from '@core/constants/routes.constants';
import { AuthConstants } from '@core/constants/auth.constants';
import { Roles } from '@core/constants/auth.role.constants';

export const accountSetupGuard: CanActivateFn = async (route, state) => {
  const accountService = inject(AccountService);
  const userRole = getItem(AuthConstants.USER_ROLE);
  const router = inject(Router);
  const activeClientSessionName = 'hasActiveClient';
  var isUserMappedToActiveClient = getItem(activeClientSessionName);

  if (userRole == Roles.CLIENT) {
    isUserMappedToActiveClient =
      await accountService.IsUserMappedToActiveClient();
    setItem(activeClientSessionName, isUserMappedToActiveClient);
    if (isUserMappedToActiveClient != true) {
      router.navigate(['account/' + AccountRouteSubPaths.SETUP_ISSUE]);
    }
  }
  return true;
};
