import { UserSiteMapping } from '@client-management/models/dtos/user-site-mapping.model';

export interface Site {
  id: string;
  name: string;
  client_id: string;
  created_at: string;
  last_modified: string;
  edited_by: string;
  user_site_mapping: UserSiteMapping[];
  isExpanded: boolean;
}
