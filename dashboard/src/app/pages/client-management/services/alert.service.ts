import { inject, Injectable } from '@angular/core';
import { AlertForClient } from '@client-management/models/dtos/alert-for-client.model';
import { SupabaseTables } from '@core/constants/supabase.constants';
import { LoaderService } from '@core/services/loading.service';
import { SupabaseClientService } from '@core/services/supabase-client.service';
import { ResultType } from '@static/models/dto/result-type.model';
@Injectable({
  providedIn: 'root',
})
export class AlertService {
  private supabase = inject(SupabaseClientService);

  public async AddAlerts(clientId: string, alertsForClient: AlertForClient[]) {
    const currentUser = await this.supabase.supabaseClient.auth.getUser();
    if (!alertsForClient) {
      return;
    }
    const alertRows = alertsForClient.map((alert) => ({
      client_id: clientId,
      condition: alert.condition,
      value: alert.value,
      result_type_id: alert.resultType.id,
      created_by: currentUser.data.user!.id,
    }));
    const { error } = await this.supabase.supabaseClient
      .from(SupabaseTables.ALERT_DEFINITIONS)
      .insert(alertRows);

    if (error) {
      console.error('alertDefinitionInsertError: ', error);
    }
  }
}
