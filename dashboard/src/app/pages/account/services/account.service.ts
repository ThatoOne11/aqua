import { inject, Injectable } from '@angular/core';
import { SupabaseTables } from '@core/constants/supabase.constants';
import { SupabaseClientService } from '@core/services/supabase-client.service';
import { UserSupabaseService } from '@core/services/supabase/users.supabase.service';
@Injectable({
  providedIn: 'root',
})
export class AccountService {
  private supabase = inject(SupabaseClientService);
  private userSupabaseService = inject(UserSupabaseService);

  public async IsUserMappedToActiveClient() {
    const currentUser = await this.supabase.supabaseClient.auth.getUser();
    const { data, error } = await this.supabase.supabaseClient
      .from(SupabaseTables.USERS)
      .select(
        ` email,
            ${SupabaseTables.USER_CLIENT_MAPPING} (
              client_id,
              active
            )
          `
      )
      .eq('email', currentUser.data.user?.email!.toLowerCase())
      .eq(`${SupabaseTables.USER_CLIENT_MAPPING}.active`, true);
    if (data && data[0].user_client_mapping.length > 0) {
      return true;
    }
    return false;
  }
}
