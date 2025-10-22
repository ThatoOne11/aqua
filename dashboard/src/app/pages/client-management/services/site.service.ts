import { inject, Injectable } from '@angular/core';
import { Site } from '@client-management/models/dtos/site.model';
import { SupabaseTables } from '@core/constants/supabase.constants';
import { SupabaseClientService } from '@core/services/supabase-client.service';

@Injectable({ providedIn: 'root' })
export class SiteService {
  private supabase = inject(SupabaseClientService);

  public async getSitesWithUsersByClient(clientId: string): Promise<Site[]> {
    const { data, error } = await this.supabase.supabaseClient
      .from(SupabaseTables.SITES)
      .select(
        `
        id,
        name,
        client_id,
        created_at,
        last_modified,
        edited_by,
        ${SupabaseTables.USER_SITE_MAPPING} (
          user_id,
          ${SupabaseTables.USERS} ( id, email, display_name )
        )
      `
      )
      .eq('client_id', clientId);

    if (error) {
      console.error('Error fetching sites with users:', error);
      throw error;
    }

    const result = (data as any[]).map((site) => ({
      ...site,
      user_site_mapping: site.user_site_mapping.map((m: any) => ({
        ...m,
        user: m.users,
        isExpanded: false,
      })),
    })) as Site[];

    return result;
  }

  public async addUserToSite(siteId: string, userId: string) {
    const { error } = await this.supabase.supabaseClient
      .from(SupabaseTables.USER_SITE_MAPPING)
      .upsert(
        { user_id: userId, site_id: siteId },
        {
          onConflict: 'user_id,site_id',
          ignoreDuplicates: true,
        }
      );

    if (error) {
      console.error('Failed to add user to site:', error);
      throw new Error('Failed to add user to site');
    }
  }

  public async addUsersToSite(siteId: string, userIds: string[]) {
    const clean = Array.from(
      new Set(userIds.map((id) => id?.trim()).filter(Boolean) as string[])
    );
    if (!clean.length) return;

    const mappingsToAdd = clean.map((uid) => ({
      user_id: uid,
      site_id: siteId,
    }));

    const { error } = await this.supabase.supabaseClient
      .from(SupabaseTables.USER_SITE_MAPPING)
      .upsert(mappingsToAdd, {
        onConflict: 'user_id,site_id',
        ignoreDuplicates: true,
      });

    if (error) {
      console.error('Failed to add users to site:', error);
      throw new Error('Failed to add users to site');
    }
  }

  public async deleteUsersFromSite(siteId: string, userIds: string[]) {
    const { error } = await this.supabase.supabaseClient
      .from(SupabaseTables.USER_SITE_MAPPING)
      .delete()
      .in('user_id', userIds)
      .eq('site_id', siteId);

    if (error) {
      console.error('Error deleting user site mappings:', error);
      throw error;
    }
  }

  public async getSiteWithUsers(siteId: string): Promise<Site> {
    const { data, error } = await this.supabase.supabaseClient
      .from(SupabaseTables.SITES)
      .select('*, user_site_mapping(*)')
      .eq('id', siteId)
      .single();

    if (error) throw error;
    return data as Site;
  }
}
