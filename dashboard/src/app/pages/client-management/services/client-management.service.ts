import { inject, Injectable } from '@angular/core';
import { AlertForClient } from '@client-management/models/dtos/alert-for-client.model';
import { ClientSummaryView } from '@client-management/models/dtos/client-summary-view.model';
import { UserForClient } from '@client-management/models/dtos/user-for-client.model';
import {
  SupabaseEdgeFunctions,
  SupabaseTables,
  SupabaseViews,
} from '@core/constants/supabase.constants';
import { LoaderService } from '@core/services/loading.service';
import { SupabaseClientService } from '@core/services/supabase-client.service';
import { AlertService } from '@client-management/services/alert.service';
import { Client } from '@client-management/models/dtos/client.model';
import { UserSupabaseService } from '@core/services/supabase/users.supabase.service';
import { MatDialog } from '@angular/material/dialog';
import { ErrorDialog } from '@shared-components/error-dialog/error-dialog';
import { SupabaseException } from '@core/exceptions/supabase.exception';
import { SupabaseValidationException } from '@core/exceptions/supabase-validation.exception';
@Injectable({
  providedIn: 'root',
})
export class ClientManagementService {
  private supabase = inject(SupabaseClientService);
  private alertService = inject(AlertService);
  private loaderService = inject(LoaderService);
  private dialog = inject(MatDialog);
  private userSupabaseService = inject(UserSupabaseService);

  public async addClientWithUsersAndAlerts(
    clientName: string,
    users: UserForClient[],
    alerts: AlertForClient[]
  ): Promise<string> {
    const clientId = '';
    this.loaderService.loadingOn();
    try {
      await this.checkForExisitngUsers(users);
      const currentUser = await this.supabase.supabaseClient.auth.getUser();
      const clientInfo = {
        display_name: clientName,
        created_by: currentUser.data.user!.id,
      };

      const { data: client, error: insertError } =
        await this.supabase.supabaseClient
          .from(SupabaseTables.CLIENTS)
          .insert(clientInfo)
          .select('id')
          .single();

      if (insertError) {
        console.error('clientInsertError: ', insertError);
        return '';
      }

      const clientId = client.id;
      await this.alertService.AddAlerts(clientId, alerts);
      await this.registerUsers(clientId, users);
      return clientId;
    } catch (exception) {
      if (exception instanceof SupabaseException) {
        this.dialog.open(ErrorDialog, {
          data: {
            title: exception.title,
            message: exception.message,
          },
        });
      }
      return '';
    } finally {
      this.loaderService.loadingOff();
    }
  }

  private async checkForExisitngUsers(users: UserForClient[]) {
    const existingUsers =
      await this.userSupabaseService.isEmailAddressLinkedToActiveClient(
        users.map((u) => u.email)
      );
    if (existingUsers.length > 0) {
      const existingEmailErrorMessage = `Changes have not been saved. The following email address(es) are already active: ${existingUsers}. Please resolve before attempting to save again.`;
      const errorTitle = 'Duplicate users';
      throw new SupabaseValidationException(
        errorTitle,
        existingEmailErrorMessage
      );
    }
  }

  private async registerUsers(clientId: string, users: UserForClient[]) {
    const usersWithInactiveMapping = await this.setExistingUserClientMappings(
      clientId,
      users
    );
    const excludedEmails = new Set(
      usersWithInactiveMapping.map((u) => u.email)
    );

    users = users.filter((u) => !excludedEmails.has(u.email));

    if (users && users?.length > 0) {
      const { data: userData, error: userError } =
        await this.supabase.supabaseClient.functions.invoke(
          SupabaseEdgeFunctions.REGISTER_USERS,
          {
            body: {
              clientId,
              users,
            },
          }
        );

      if (userError) {
        console.error('Error registering users:', userError);
      }
    }
  }

  private async setExistingUserClientMappings(
    clientId: string,
    users: UserForClient[]
  ): Promise<UserWithMapping[]> {
    const { data, error } = await this.supabase.supabaseClient
      .from(SupabaseTables.USERS)
      .select(
        `
      id,
      display_name,
      email,
      ${SupabaseTables.USER_CLIENT_MAPPING}!left (
        client_id,
        active
      )
    `
      )
      .in(
        'email',
        users.map((u) => u.email)
      );

    const usersWithInactiveMapping = (data ?? []) as UserWithMapping[];
    const userClientMappingsUpdated: UserWithMapping[] = [];

    //Rather edit existing user client mappings to the the provided client_id and set as active
    if (usersWithInactiveMapping && usersWithInactiveMapping?.length > 0) {
      for (const user of usersWithInactiveMapping) {
        const mappings = Array.isArray(user.user_client_mapping)
          ? user.user_client_mapping
          : [];
        const shouldUpdateUserClientMapping =
          mappings.length > 0 && mappings[0].active == false;
        const shouldInsertUserClientMapping = mappings.length == 0;
        if (shouldUpdateUserClientMapping) {
          const { error } = await this.supabase.supabaseClient
            .from(SupabaseTables.USER_CLIENT_MAPPING)
            .update({
              client_id: clientId,
              active: true,
            })
            .eq('user_id', user.id);

          if (error) {
            console.error(`Failed to update user_id ${user.id}`, error);
          } else {
            userClientMappingsUpdated.push(user);
          }
        } else if (shouldInsertUserClientMapping) {
          const { error } = await this.supabase.supabaseClient
            .from(SupabaseTables.USER_CLIENT_MAPPING)
            .insert({
              user_id: user.id,
              client_id: clientId,
              active: true,
            });

          if (error) {
            console.error(
              `Failed to insert user client mapping for user_id ${user.id}`,
              error
            );
          } else {
            userClientMappingsUpdated.push(user);
          }
        }
      }
    }
    return userClientMappingsUpdated;
  }

  public async getUserClients(): Promise<ClientSummaryView[]> {
    this.loaderService.loadingOn();
    try {
      const { data: clients, error: clientsError } =
        await this.supabase.supabaseClient
          .from(SupabaseViews.CLIENTS_VIEW)
          .select('id, display_name, is_pinned')
          .eq('archived', false);

      if (clientsError) {
        console.error(
          'Error when getting client | ErrorMessage: ',
          clientsError
        );
      }
      const results = clients
        ? await Promise.all(
            clients.map(async (client) => {
              const { count, error: mappingError } =
                await this.supabase.supabaseClient
                  .from(SupabaseTables.USER_CLIENT_MAPPING)
                  .select('*', { count: 'exact', head: true })
                  .not('active', 'eq', false)
                  .eq('client_id', client.id);

              if (mappingError) {
                console.error(
                  'Mapping error for client:',
                  client.id,
                  mappingError.message
                );
              }

              const { count: siteCount, error: siteError } =
                await this.supabase.supabaseClient
                  .from(SupabaseTables.SITES)
                  .select('*', { count: 'exact', head: true })
                  .eq('client_id', client.id);

              if (siteError) {
                console.error(
                  'Site error for client:',
                  client.id,
                  siteError.message
                );
              }

              const threeMonthsAgo = new Date();
              threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

              const { count: alertCount, error: alertError } =
                await this.supabase.supabaseClient
                  .from('reading_alert')
                  .select(
                    'id, reading_id!inner(time, certificate_of_analysis_id!inner(client_id))',
                    {
                      count: 'exact',
                      head: true,
                    }
                  )
                  .eq('ignored', false)
                  .gte(
                    'reading_id.certificate_of_analysis_id.uploaded_at',
                    threeMonthsAgo.toISOString()
                  )
                  .eq(
                    'reading_id.certificate_of_analysis_id.client_id',
                    client.id
                  );

              if (alertError) {
                console.error(
                  'Alert error for client:',
                  client.id,
                  alertError.message
                );
              }

              return {
                clientId: client.id,
                clientName: client.display_name,
                numberOfUsers: count ?? 0,
                numberOfAlerts: alertCount ?? 0,
                numberOfSites: siteCount ?? 0,
                isPinned: client.is_pinned,
              };
            })
          )
        : [];
      return results;
    } catch (exception) {
      if (exception instanceof SupabaseException) {
        this.dialog.open(ErrorDialog, {
          data: {
            title: exception.title,
            message: exception.message,
          },
        });
      }
      return [];
    } finally {
      this.loaderService.loadingOff();
    }
  }

  public async inActiveEmailsLinkedToClient(
    clientId: string,
    usersForClient: UserForClient[]
  ): Promise<string> {
    return this.userSupabaseService.getExistingInActiveEmailAddressesFromClient(
      clientId,
      usersForClient.map((u) => u.email)
    );
  }

  public async saveClientChanges(
    clientId: string,
    channel: string,
    usersForClient: UserForClient[],
    alertsForClient: AlertForClient[]
  ): Promise<boolean> {
    let isSaved = false;
    try {
      const newUsers = usersForClient.filter((user) => !user.userId?.trim());
      await this.checkForExisitngUsers(newUsers);
      var currentClient = await this.getClient(clientId);
      if (currentClient.channel != channel) {
        const display_name = channel;
        const { data, error } = await this.supabase.supabaseClient
          .from(SupabaseTables.CLIENTS)
          .update({
            display_name,
          })
          .eq('id', clientId);
        if (error) {
          console.error(`Failed to update client ${clientId}:`, error);
        }
      }
      await this.patchUsersToClient(
        clientId,
        currentClient.users,
        usersForClient
      );
      await this.patchAlertsToClient(
        clientId,
        currentClient.alerts,
        alertsForClient
      );
      isSaved = true;
    } catch (exception) {
      if (exception instanceof SupabaseException) {
        Promise.resolve().then(() => {
          this.dialog.open(ErrorDialog, {
            data: {
              title: exception.title,
              message: exception.message,
            },
          });
        });
        isSaved = false;
      }
    } finally {
      return isSaved;
    }
  }

  private async patchAlertsToClient(
    clientId: string,
    alertsInDatabase: AlertForClient[],
    alertsBeingSaved: AlertForClient[]
  ) {
    const matchingAlerts = alertsBeingSaved.filter((dbAlert) =>
      alertsInDatabase.some((savedAlert) => savedAlert.id === dbAlert.id)
    );
    const newAlerts = alertsBeingSaved.filter((a) => !a.id?.trim());
    const deletedAlerts = alertsInDatabase.filter(
      (dbAlert) =>
        !alertsBeingSaved.some((savedAlert) => savedAlert.id === dbAlert.id)
    );
    if (matchingAlerts.length > 0) {
      for (const alert of matchingAlerts) {
        const { id: id, resultType, condition, value } = alert;
        const result_type_id = resultType.id;
        const { data, error } = await this.supabase.supabaseClient
          .from(SupabaseTables.ALERT_DEFINITIONS)
          .update({
            result_type_id,
            condition,
            value,
          })
          .eq('id', id);
        if (error) {
          console.error(`Failed to update alert ${id}:`, error);
        }
      }
    }
    if (newAlerts.length > 0) {
      await this.alertService.AddAlerts(clientId, newAlerts);
    }
    if (deletedAlerts.length > 0) {
      const idsToDeactivate = deletedAlerts.map((alert) => alert.id);
      const { data, error } = await this.supabase.supabaseClient
        .from(SupabaseTables.ALERT_DEFINITIONS)
        .update({ active: false })
        .in('id', idsToDeactivate);

      if (error) {
        console.error('Failed to deactivate alerts:', error);
      }
    }
  }

  private async patchUsersToClient(
    clientId: string,
    usersInDatabase: UserForClient[],
    usersBeingSaved: UserForClient[]
  ) {
    const modifiedUsers = usersBeingSaved.filter((dbUser) =>
      usersInDatabase.some(
        (savedUser) =>
          savedUser.userId === dbUser.userId &&
          savedUser.displayName != dbUser.displayName
      )
    );
    const newUsers = usersBeingSaved.filter((user) => !user.userId?.trim());
    const deletedUsers = usersInDatabase.filter(
      (dbUser) =>
        !usersBeingSaved.some((savedUser) => savedUser.userId === dbUser.userId)
    );
    if (modifiedUsers.length > 0) {
      for (const user of modifiedUsers) {
        const display_name = user.displayName;
        const { data, error } = await this.supabase.supabaseClient
          .from(SupabaseTables.USERS)
          .update({
            display_name,
          })
          .eq('id', user.userId);
        if (error) {
          console.error(`Failed to update user ${user.userId}:`, error);
        }
      }
    }
    if (newUsers.length > 0) {
      await this.registerUsers(clientId, newUsers);
    }
    if (deletedUsers.length > 0) {
      const idsToArchive = deletedUsers.map((user) => user.userId);
      const { error } = await this.supabase.supabaseClient
        .from(SupabaseTables.USER_CLIENT_MAPPING)
        .update({ active: false })
        .in('user_id', idsToArchive)
        .eq('client_id', clientId);

      if (error) {
        console.error('Failed to archive users:', error);
      }

      const { error: deletSiteMappingsError } =
        await this.supabase.supabaseClient
          .from(SupabaseTables.USER_SITE_MAPPING)
          .delete()
          .in('user_id', idsToArchive);

      if (deletSiteMappingsError) {
        console.error('Failed to archive users:', error);
      }
    }
  }

  public async getClient(clientId: string): Promise<Client> {
    const selectString = `
      *,
      ${SupabaseTables.ALERT_DEFINITIONS} (
        *,
        ${SupabaseTables.RESULT_TYPES} (*)
      ),
      ${SupabaseTables.USER_CLIENT_MAPPING} ( *,
        ${SupabaseTables.USERS} (*)
      )
    `;

    const { data, error } = await this.supabase.supabaseClient
      .from(SupabaseTables.CLIENTS)
      .select(selectString)
      .eq('id', clientId)
      .single();

    if (data) {
      data.user_client_mapping = data.user_client_mapping.filter(
        (mapping: any) => mapping.active
      );
      data.alert_definitions = data.alert_definitions.filter(
        (mapping: any) => mapping.active
      );
    }
    return new Client(
      data.display_name,
      data.user_client_mapping.map((item: any) => {
        const user = item.users;
        return new UserForClient(user.id, user.display_name, user.email);
      }),
      data.alert_definitions.map((alert: any) => {
        return new AlertForClient(
          alert.id,
          alert.result_types,
          alert.condition,
          alert.value
        );
      })
    );
  }

  public async createPinnedClient(clientId: string, userId: string) {
    const { error } = await this.supabase.supabaseClient
      .from(SupabaseTables.USER_PINNED_CLIENTS)
      .insert({ user_id: userId, client_id: clientId });

    if (error) {
      console.error('Failed to create pinned client:', error);
      throw new Error('Failed to create pinned client');
    }
  }

  public async deletePinnedClient(clientId: string, userId: string) {
    const { error } = await this.supabase.supabaseClient
      .from(SupabaseTables.USER_PINNED_CLIENTS)
      .delete()
      .eq('user_id', userId)
      .eq('client_id', clientId);
    if (error) {
      console.error('Failed to delete pinned client:', error);
      throw new Error('Failed to delete pinned client');
    }
  }

  public async isUserAssociatedWithClient(
    userId: string,
    clientId: string
  ): Promise<boolean> {
    const { data, error } = await this.supabase.supabaseClient
      .from(SupabaseTables.USER_CLIENT_MAPPING)
      .select('user_id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('client_id', clientId)
      .eq('active', true);

    if (error) {
      throw new Error(`Failed to check client association: ${error.message}`);
    }

    return data !== null; // true if a row exists, false if none
  }

  public async archiveClient(clientId: string) {
    const archiveUserClientMappings = await this.supabase.supabaseClient
      .from(SupabaseTables.USER_CLIENT_MAPPING)
      .update({ active: false })
      .eq('client_id', clientId);

    if (archiveUserClientMappings.error) {
      console.error(
        'Failed to deactivate user mappings: ',
        archiveUserClientMappings.error
      );
    }

    const archiveClient = await this.supabase.supabaseClient
      .from(SupabaseTables.CLIENTS)
      .update({ archived: true })
      .eq('id', clientId);

    if (archiveClient.error) {
      console.error('Failed to archive client: ', archiveClient.error);
    }
  }
}
