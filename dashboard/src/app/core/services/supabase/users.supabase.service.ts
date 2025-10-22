import { inject, Injectable } from '@angular/core';
import { SupabaseClientService } from '../supabase-client.service';
import { SupabaseTables } from '@core/constants/supabase.constants';
import { MatDialog } from '@angular/material/dialog';
import { ErrorDialog } from '@shared-components/error-dialog/error-dialog';
import { Roles } from '@core/constants/auth.role.constants';

@Injectable({ providedIn: 'root' })
export class UserSupabaseService {
  private supabase = inject(SupabaseClientService);
  private dialog = inject(MatDialog);

  public async isEmailAddressLinkedToActiveClient(
    emails: string[]
  ): Promise<string> {
    const lowerEmails = emails.map((e) => e.toLowerCase());
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
      .in(
        'email',
        emails.map((e) => e.toLowerCase())
      )
      .eq(`${SupabaseTables.USER_CLIENT_MAPPING}.active`, true);

    if (error) {
      this.dialog.open(ErrorDialog);
      return '';
    }
    if (data && data.length > 0) {
      const duplicateUsers = data.filter(
        (item) =>
          item.user_client_mapping && item.user_client_mapping.length > 0
      );
      return duplicateUsers.map((row) => row.email).join(', ');
    }
    return '';
  }

  public async isEmailLinkedToNonClientRole(emails: string[]): Promise<string> {
    const { data, error } = await this.supabase.supabaseClient
      .from(SupabaseTables.USERS)
      .select(
        ` email,
            ${SupabaseTables.ROLES} (
              name,
              id
            )
          `
      )
      .in(
        'email',
        emails.map((e) => e.toLowerCase())
      )
      .in(`${SupabaseTables.ROLES}.name`, [Roles.SUPER_ADMIN, Roles.ADMIN]);

    if (error) {
      this.dialog.open(ErrorDialog);
      return '';
    }
    if (data && data.length > 0) {
      const nonClientUsers = data.filter((u) => u.roles);
      return nonClientUsers.map((row) => row.email).join(', ');
    }
    return '';
  }

  public async getExistingEmailAddresses(emails: string[]): Promise<string> {
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
      .in('email', emails)
      .eq(`${SupabaseTables.USER_CLIENT_MAPPING}.active`, false);

    if (error) {
      this.dialog.open(ErrorDialog);
      return '';
    }
    if (data && data.length > 0) {
      const duplicateUsers = data.filter(
        (item) =>
          !item.user_client_mapping || item.user_client_mapping.length === 0
      );
      return duplicateUsers.map((row) => row.email).join(', ');
    }
    return '';
  }

  public async getExistingInActiveEmailAddressesFromClient(
    clientId: string,
    emails: string[]
  ): Promise<string> {
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
      .in('email', emails)
      .eq(`${SupabaseTables.USER_CLIENT_MAPPING}.active`, false)
      .eq(`${SupabaseTables.USER_CLIENT_MAPPING}.client_id`, clientId);

    if (error) {
      this.dialog.open(ErrorDialog);
      return '';
    }
    if (data && data.length > 0) {
      const duplicateUsers = data.filter(
        (item) =>
          item.user_client_mapping && item.user_client_mapping.length > 0
      );
      return duplicateUsers.map((row) => row.email).join(', ');
    }
    return '';
  }
}
