import { inject, Injectable } from '@angular/core';
import { SupabaseTables } from '@core/constants/supabase.constants';
import { SupabaseClientService } from '@core/services/supabase-client.service';

@Injectable({
  providedIn: 'root',
})
export class UserClientService {
  private supabase = inject(SupabaseClientService);

  public async getClientDetailsForUser(
    userId: string
  ): Promise<{ clientId: string; clientName: string } | null> {
    try {
      const { data, error } = await this.supabase.supabaseClient
        .from(SupabaseTables.USER_CLIENT_MAPPING)
        .select(`client_id, ${SupabaseTables.CLIENTS}(display_name)`)
        .eq('user_id', userId)
        .maybeSingle(); // ensures we only get one mapping row

      if (error) {
        console.error('Error fetching client details:', error);
        return null;
      }

      if (data && data.clients) {
        let clientName: string;

        if (Array.isArray(data.clients)) {
          //if it's an array, take first element safely
          clientName = data.clients[0]?.display_name ?? '';
        } else {
          //if it's an object, use directly
          clientName = (data.clients as { display_name: string }).display_name;
        }

        return {
          clientId: data.client_id,
          clientName,
        };
      }

      return null;
    } catch (e) {
      console.error('Exception fetching client details:', e);
      return null;
    }
  }

  public async getClientUsers(
    clientId: string
  ): Promise<{ display_name: string }[] | null> {
    try {
      const { data, error } = await this.supabase.supabaseClient
        .from(SupabaseTables.USER_CLIENT_MAPPING)
        .select(`client_id, ${SupabaseTables.USERS}(display_name)`)
        .eq('client_id', clientId)
        .eq('active', true);

      if (error) {
        console.error('Error fetching client users:', error);
        return null;
      }

      if (!data) {
        console.warn('No users found for client', clientId);
        return null;
      }

      //normalize result to always return array of { display_name: string }
      const users = data
        .map((d) => {
          const u = d.users as { display_name?: string } | null;
          return u?.display_name ? { display_name: u.display_name } : null;
        })
        .filter((u): u is { display_name: string } => u !== null);

      return users;
    } catch (e) {
      console.error('Exception fetching client users:', e);
      return null;
    }
  }
}
