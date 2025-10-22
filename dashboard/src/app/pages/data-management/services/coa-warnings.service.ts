import { inject, Injectable } from '@angular/core';
import { SupabaseClientService } from '@core/services/supabase-client.service';
import { CoaWarnings } from '../models/review-upload/coa-warnings.model';
import {
  SupabaseRpcFunctions,
  SupabaseTables,
} from '@core/constants/supabase.constants';
import { User } from '@client-management/models/dtos/user.model';

@Injectable({ providedIn: 'root' })
export class CoaWarningsService {
  private supabase = inject(SupabaseClientService);

  public async getCoaWarnings(coaId: string): Promise<CoaWarnings> {
    const { data, error } = await this.supabase.supabaseClient.rpc(
      SupabaseRpcFunctions.COA_WARNINGS,
      { p_coa_id: coaId }
    );

    if (error) {
      throw new Error(error.message ?? 'Failed to fetch CoA warnings');
    }
    if (!data) {
      throw new Error('No warnings payload returned for this CoA id');
    }

    return data as CoaWarnings;
  }

  public async getClientUsers(clientId: string): Promise<User[]> {
    const { data, error } = await this.supabase.supabaseClient
      .from(SupabaseTables.USER_CLIENT_MAPPING)
      .select(
        `
          ${SupabaseTables.USERS} ( id, display_name, email )
        `
      )
      .eq('client_id', clientId)
      .eq('active', true);

    if (error) {
      console.log(error);
      throw new Error(error.message ?? 'Failed to get client users');
    }

    return (data ?? []).map((row: any) => row.users) as User[];
  }
}
