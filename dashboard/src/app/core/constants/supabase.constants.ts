export namespace SupabaseTables {
  export const CLIENTS = 'clients';
  export const USER_PINNED_CLIENTS = 'user_pinned_clients';
  export const RESULT_TYPES = 'result_types';
  export const ROLES = 'roles';
  export const USER_CLIENT_MAPPING = 'user_client_mapping';
  export const USERS = 'users';
  export const ALERT_DEFINITIONS = 'alert_definitions';
  export const SITES = 'sites';
  export const USER_SITE_MAPPING = 'user_site_mapping';
}

export namespace SupabaseViews {
  export const CLIENTS_VIEW = 'clients_view';
  export const CERTIFICAT_OF_ANALYSIS_VIEW = 'certificate_of_analysis_view';
  export const READING_RESULTS_VIEW = 'reading_results_view';
  export const READING_RESULTS_FOR_ALERTS_VIEW =
    'reading_results_for_alerts_view';
  export const IMPORT_HISTORY_VIEW = 'import_history_view';
}

export namespace SupabaseEdgeFunctions {
  export const REGISTER_USERS = 'register-user';
  export const CSV_UPLOAD = 'csv-upload';
  export const SEND_ALERTS_EMAIL = 'send-alerts-email';
}

export namespace SupabaseRpcFunctions {
  export const COA_WARNINGS = 'coa_warnings_function';
  export const FILTER_OPTIONS_FUNCTION = 'filter_options_function';
}
