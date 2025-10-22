export namespace RoutePaths {
  export const ACCOUNT = 'account';
  export const DASHBOARD = 'dashboard';
  export const CLIENT_MANAGEMENT = 'client-management';
  export const DATA_MANAGEMENT = 'data-management';
}
export namespace AccountRoutePaths {
  export const PASSWORD_RESET = `/${RoutePaths.ACCOUNT}/password-reset`;
  export const MFA = `/${RoutePaths.ACCOUNT}/mfa`;
  export const LOGIN = `/${RoutePaths.ACCOUNT}/login`;
  export const ONBOARDING_SIGN_UP = `/${RoutePaths.ACCOUNT}/sign-up`;
  export const USER_MANAGEMENT = `/${RoutePaths.ACCOUNT}/user-management`;
}

export namespace AccountRouteSubPaths {
  export const PASSWORD_RESET = `password-reset`;
  export const MFA = `mfa`;
  export const LOGIN = `login`;
  export const ONBOARDING_SIGN_UP = `sign-up`;
  export const EMAIL_PASSTHROUGH = `passthrough`;
  export const SETUP_ISSUE = `setup-issue`;
  export const USER_MANAGEMENT = `user-management`;
}

export const ADMIN_LANDING_PAGE = `/${RoutePaths.DATA_MANAGEMENT}`;
export const CLIENT_LANDING_PAGE = `/${RoutePaths.DASHBOARD}`;
