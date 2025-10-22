import { inject, Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Site } from '@client-management/models/dtos/site.model';
import { UserForClient } from '@client-management/models/dtos/user-for-client.model';
import { User } from '@client-management/models/dtos/user.model';
import { SiteService } from '@client-management/services/site.service';
import {
  SupabaseEdgeFunctions,
  SupabaseTables,
} from '@core/constants/supabase.constants';
import { SupabaseClientService } from '@core/services/supabase-client.service';
import { coaFields } from '@data-management/constants/static-columns.constant';
import { InsertReadingAlert } from '@data-management/models/review-alerts/reading-alert.model';
import { AlertModel } from '@data-management/models/review-alerts/reviewed-alert.model';
import { EditedReadings } from '@data-management/models/review-upload/edited-reading';
import { ErrorDialog } from '@shared-components/error-dialog/error-dialog';

@Injectable({
  providedIn: 'root',
})
export class UploadConfirmService {
  private supabaseClientService = inject(SupabaseClientService);
  private siteService = inject(SiteService);
  private dialog = inject(MatDialog);

  public async submitReviewedAnalysis(
    alerts: AlertModel[],
    editedReadings: EditedReadings,
    coaId: string,
    clientId: string,
    siteId: string | null,
    siteName: string | null,
    currentSelectedUsers: User[]
  ) {
    const usersToBeCreated = currentSelectedUsers.filter(
      (u) => !u.id || u.id.trim() === ''
    );
    const isValid = await this.prevalidate(usersToBeCreated);
    if (!isValid) {
      throw new Error('prevalidation failed');
    }
    let currentStage = 'save alert(s)';
    try {
      //if saving alerts fail, continue?
      await this.saveAlerts(alerts);
      currentStage = 'save reading changes(s)';
      await this.saveReadingChanges(editedReadings);

      //create new users and link to client
      currentStage = 'create new users';
      const createdUsers = await this.createUsersAndLinkToClient(
        clientId,
        usersToBeCreated
      );
      //link users to site
      const existingUsers = currentSelectedUsers.filter(
        (u) => u.id && u.id.trim() !== ''
      );
      const allUsersToBeLinkedToSite = [...createdUsers, ...existingUsers];
      currentStage = 'link users to the site';
      await this.saveAndLinkUsersToSite(
        clientId,
        siteId,
        siteName,
        allUsersToBeLinkedToSite
      );
      currentStage = 'complete the certificate of analysis';
      await this.completeCoa(coaId);

      try {
        currentStage = 'send alerts email';
        await this.sendAlertsEmail(coaId);
      } catch (e) {
        console.error('[UploadConfirmService] sendAlertsEmail failed', e);

        this.dialog.open(ErrorDialog, {
          data: {
            message: 'Upload succeeded, but sending alert emails failed.',
          },
        });
      }
    } catch {
      this.dialog.open(ErrorDialog, {
        data: {
          message:
            'Something unexpected happened while attempting to ' + currentStage,
        },
      });
      throw new Error('Failed to upload');
    }
  }

  private async prevalidate(usersToBeCreated: User[]): Promise<boolean> {
    const { data, error } = await this.supabaseClientService.supabaseClient
      .from(SupabaseTables.USERS)
      .select('*')
      .in(
        'email',
        usersToBeCreated.map((u) => u.email)
      );
    if (data && data?.length > 0) {
      const existingEmailAddresses = usersToBeCreated
        .map((u) => u.email)
        .join(', ');
      this.dialog.open(ErrorDialog, {
        data: {
          message: existingEmailAddresses + ' email(s) already exist',
        },
      });
      return false;
    }
    return true;
  }

  private async saveAlerts(alerts: AlertModel[]): Promise<void> {
    const rows = alerts.map(this.mapAlertToRow);
    const insertReadAlerts = await this.supabaseClientService.supabaseClient
      .from('reading_alert')
      .insert(rows);
    if (insertReadAlerts.error) throw insertReadAlerts.error;
  }

  private async saveReadingChanges(editedReadings: EditedReadings) {
    const { highLevelReadings, readingResults } =
      this.getHighLevelReadingsAndReadingResults(editedReadings);
    await this.saveReading(highLevelReadings);
    await this.saveReadingResults(readingResults);
  }

  private async saveAndLinkUsersToSite(
    clientId: string,
    siteId: string | null,
    siteName: string | null,
    allUsersToBeLinkedToSite: User[]
  ) {
    if (!siteId && siteName) {
      const newSite = await this.saveSite(siteName, clientId);
      siteId = newSite.id;
    }
    await this.linkUsersToSite(siteId!, allUsersToBeLinkedToSite);
  }

  private async saveReading(highLevelReadings: EditedReadings) {
    for (const [readingId, edits] of Object.entries(highLevelReadings)) {
      for (const edit of edits) {
        const updateObj: Record<string, any> = {};
        updateObj[edit.field] = edit.newValue;

        const { error } = await this.supabaseClientService.supabaseClient
          .from('readings')
          .update(updateObj)
          .eq('id', readingId);

        if (error) throw error;
      }
    }
  }

  private async saveReadingResults(readingResults: EditedReadings) {
    const { data: resultTypes, error } =
      await this.supabaseClientService.supabaseClient
        .from('result_types')
        .select('id, display_name');

    if (error) throw error;

    const typeMap = Object.fromEntries(
      resultTypes.map((rt) => [
        rt.display_name.toLowerCase().replace(/\s+/g, '_'),
        rt.id.toLowerCase(),
      ])
    );

    const updates: {
      reading_id: string;
      result_type_id: string;
      value: number;
    }[] = [];

    for (const [readingId, edits] of Object.entries(readingResults)) {
      for (const edit of edits) {
        const resultTypeId = typeMap[edit.field];
        if (!resultTypeId) continue;

        updates.push({
          reading_id: readingId,
          result_type_id: resultTypeId,
          value: Number(edit.newValue),
        });
      }
    }

    for (const u of updates) {
      const { error } = await this.supabaseClientService.supabaseClient
        .from('reading_results')
        .update({ value: u.value })
        .eq('reading_id', u.reading_id)
        .eq('result_type_id', u.result_type_id);

      if (error) throw error;
    }
  }

  private async saveSite(siteName: string, clientId: string): Promise<Site> {
    const currentUser =
      await this.supabaseClientService.supabaseClient.auth.getUser();
    const { data: site, error: insertSite } =
      await this.supabaseClientService.supabaseClient
        .from(SupabaseTables.SITES)
        .insert({
          name: siteName,
          client_id: clientId,
          created_by: currentUser.data.user!.id,
        });
    if (insertSite) throw insertSite;
    return site!;
  }

  private async createUsersAndLinkToClient(
    clientId: string,
    newUsers: User[]
  ): Promise<User[]> {
    const users: UserForClient[] = newUsers.map(
      (u) => new UserForClient(u.id, u.display_name, u.email)
    );
    if (newUsers && newUsers?.length > 0) {
      const { data: userData, error: userError } =
        await this.supabaseClientService.supabaseClient.functions.invoke(
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
      const { data, error } = await this.supabaseClientService.supabaseClient
        .from(SupabaseTables.USERS)
        .select('*')
        .in(
          'email',
          newUsers.map((u) => u.email)
        );
      return data ?? [];
    }
    return [];
  }

  private async linkUsersToSite(siteId: string, currentSelectedUsers: User[]) {
    await this.siteService.addUsersToSite(
      siteId,
      currentSelectedUsers.map((u) => u.id)
    );
  }

  private async completeCoa(coaId: string) {
    await this.supabaseClientService.supabaseClient;
    const { data: coaStatus, error: coaStatusError } =
      await this.supabaseClientService.supabaseClient
        .from('certificate_of_analysis_status')
        .select('id')
        .eq('display_name', 'Completed')
        .single();
    if (coaStatusError) throw coaStatusError;
    const updateCoa = await this.supabaseClientService.supabaseClient
      .from('certificate_of_analysis')
      .update({ status_id: coaStatus.id })
      .eq('id', coaId);
    if (updateCoa.error) throw updateCoa.error;
  }

  private getHighLevelReadingsAndReadingResults(
    editedReadings: EditedReadings
  ): { highLevelReadings: EditedReadings; readingResults: EditedReadings } {
    const highLevelReadings: EditedReadings = {};
    const readingResults: EditedReadings = {};

    for (const [readingId, edits] of Object.entries(editedReadings)) {
      const highLevelReadingsEdits = edits.filter((e) =>
        coaFields.includes(e.field)
      );
      const readingResultsEdits = edits.filter(
        (e) => !coaFields.includes(e.field)
      );

      if (highLevelReadingsEdits.length > 0) {
        highLevelReadings[readingId] = highLevelReadingsEdits;
      }
      if (readingResultsEdits.length > 0) {
        readingResults[readingId] = readingResultsEdits;
      }
    }

    return { highLevelReadings, readingResults };
  }

  private mapAlertToRow(alert: AlertModel): InsertReadingAlert {
    return {
      reading_id: alert.readingId,
      result_type_id: alert.resultTypeId,
      reading_value: alert.readingValue,
      alert_value: alert.alertValue,
      alert_condition: alert.alertCondition,
      note: alert.note,
      ignored: alert.ignored,
      reading_result_id: alert.readingResultId,
    };
  }

  private async sendAlertsEmail(coaId: string): Promise<void> {
    const { error } =
      await this.supabaseClientService.supabaseClient.functions.invoke(
        SupabaseEdgeFunctions.SEND_ALERTS_EMAIL,
        { body: { coa_id: coaId } }
      );
    if (error) throw error;
  }
}
