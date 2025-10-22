import { inject, Injectable } from '@angular/core';
import { SupabaseClientService } from '../supabase-client.service';
import { SupabaseTables } from '@core/constants/supabase.constants';
import { MatDialog } from '@angular/material/dialog';
import { ErrorDialog } from '@shared-components/error-dialog/error-dialog';
import { SupabaseClient } from './models/client.supabase.model';
import { UserForClient } from '@client-management/models/dtos/user-for-client.model';

@Injectable({ providedIn: 'root' })
export class ClientSupabaseService {
  private supabase = inject(SupabaseClientService);
  private dialog = inject(MatDialog);

  public async getSameClientNames(
    clientName: string
  ): Promise<SupabaseClient | null> {
    const { data, error } = await this.supabase.supabaseClient
      .from(SupabaseTables.CLIENTS)
      .select('*')
      .ilike('display_name', clientName);

    if (error) {
      this.dialog.open(ErrorDialog);
    }
    if (data && data.length > 1) {
      this.dialog.open(ErrorDialog, {
        data: {
          message:
            'Duplicate client names exist within the system, please address before proceeding',
        },
      });
    }
    if (data && data.length > 0) {
      return data[0];
    }
    return null;
  }

  public async reactivateClient(clientId: string) {
    const { error } = await this.supabase.supabaseClient
      .from(SupabaseTables.CLIENTS)
      .update({
        archived: false,
      })
      .eq('id', clientId);

    if (error) {
      this.dialog.open(ErrorDialog);
    }
  }
}
