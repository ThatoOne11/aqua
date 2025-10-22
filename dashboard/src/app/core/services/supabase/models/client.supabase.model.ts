import { UserForClient } from '@client-management/models/dtos/user-for-client.model';
import { AlertForClient } from '@client-management/models/dtos/alert-for-client.model';

export class SupabaseClient {
  id: string;
  display_name: string;
  lastActivity: string;
  archived: boolean;
  lastModified: string;
  editedBy: string;
  created_at: string;
  created_by: string;

  constructor(
    id: string,
    display_name: string,
    lastActivity: string,
    archived: boolean,
    lastModified: string,
    editedBy: string,
    created_at: string,
    created_by: string
  ) {
    this.id = id;
    this.display_name = display_name;
    this.lastActivity = lastActivity;
    this.archived = archived;
    this.lastModified = lastModified;
    this.editedBy = editedBy;
    this.created_at = created_at;
    this.created_by = created_by;
  }
}
