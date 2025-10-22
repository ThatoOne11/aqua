import { inject, Injectable } from '@angular/core';
import {
  SupabaseTables,
  SupabaseViews,
} from '@core/constants/supabase.constants';
import { SupabaseClientService } from '@core/services/supabase-client.service';
import { AlertModel } from '@data-management/models/review-alerts/reviewed-alert.model';
import { EditedReadings } from '@data-management/models/review-upload/edited-reading';

@Injectable({
  providedIn: 'root',
})
export class ReadingAlertsService {
  private supabaseClientService = inject(SupabaseClientService);

  public async GenerateTriggeredAlerts(
    coaId: string,
    clientId: string
  ): Promise<AlertModel[]> {
    const alerts: AlertModel[] = [];
    const readingResults = await this.getReadingResults(coaId);

    const { data: triggers, error: getTriggerErrors } =
      await this.supabaseClientService.supabaseClient
        .from(SupabaseTables.ALERT_DEFINITIONS)
        .select('id, condition, result_type_id, value')
        .eq('client_id', clientId)
        .eq('active', true);

    if (getTriggerErrors) {
      console.error('[GenerateTriggeredAlerts] [triggers]', getTriggerErrors);
      throw new Error('Failed to fetch triggers');
    }

    readingResults.forEach((rr) => {
      triggers
        .filter((t) => t.result_type_id === rr.result_type_id)
        .forEach((t) => {
          if (this.triggerAlert(rr.value, t.value, t.condition)) {
            alerts.push({
              readingId: rr.readingId,
              resultTypeId: rr.result_type_id,
              readingValue: rr.value,
              alertValue: t.value,
              alertCondition: t.condition,
              ignored: false,
              readingResultId: rr.reading_result_id,
              time: rr.time,
              parameter: rr.parameter,
              site: rr.site,
              floor: rr.floor,
              area: rr.area,
              location: rr.location,
              outlet: rr.outlet,
              unitOfMeasurement: rr.unitOfMeasurement,
              comments: rr.comments,
              note: rr.note ?? rr.comments,
            });
          }
        });
    });

    return alerts;
  }

  public async GenerateTriggeredAlertsWithEdits(
    coaId: string,
    clientId: string,
    editedReadings: EditedReadings
  ): Promise<AlertModel[]> {
    const alerts: AlertModel[] = [];

    const readingResults = await this.getReadingResults(coaId);

    const { data: triggers, error: getTriggerErrors } =
      await this.supabaseClientService.supabaseClient
        .from(SupabaseTables.ALERT_DEFINITIONS)
        .select('id, condition, result_type_id, value')
        .eq('client_id', clientId)
        .eq('active', true);

    if (getTriggerErrors) {
      console.error('[GenerateTriggeredAlerts] [triggers]', getTriggerErrors);
      throw new Error('Failed to fetch triggers');
    }

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

    for (const [readingId, edits] of Object.entries(editedReadings)) {
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

    const updateMap = new Map<string, number>();
    updates.forEach((u) => {
      const key = `${u.reading_id}__${u.result_type_id}`;
      updateMap.set(key, u.value);
    });

    // Apply updates to readingResults
    readingResults.forEach((rr) => {
      const key = `${rr.readingId}__${rr.result_type_id}`;
      if (updateMap.has(key)) {
        rr.value = updateMap.get(key)!; // update the value
      }
    });

    readingResults.forEach((rr) => {
      triggers
        .filter((t) => t.result_type_id === rr.result_type_id)
        .forEach((t) => {
          if (this.triggerAlert(rr.value, t.value, t.condition)) {
            alerts.push({
              readingId: rr.readingId,
              resultTypeId: rr.result_type_id,
              readingValue: rr.value,
              alertValue: t.value,
              alertCondition: t.condition,
              ignored: false,
              readingResultId: rr.reading_result_id,
              time: rr.time,
              parameter: rr.parameter,
              site: rr.site,
              floor: rr.floor,
              area: rr.area,
              location: rr.location,
              outlet: rr.outlet,
              unitOfMeasurement: rr.unitOfMeasurement,
              comments: rr.comments,
            });
          }
        });
    });

    return alerts;
  }

  private async getReadingResults(coaId: string): Promise<any[]> {
    const { data: readingResultsData, error: readingResultsError } =
      await this.supabaseClientService.supabaseClient
        .from(SupabaseViews.READING_RESULTS_FOR_ALERTS_VIEW)
        .select(
          `
          client_id,
          client_name,
          site_id,
          site_name,
          coa_id,
          time,
          reading_id,
          floor,
          area,
          location,
          outlet,
          reading_result_id,
          value,
          result_type_id,
          result_type,
          unit,
          parameter_type_id,
          parameter_name,
          comments
        `
        )
        .eq('coa_id', coaId);

    if (readingResultsError) {
      console.error('[readingResultsError] [triggers]', readingResultsError);
      throw new Error('Failed to fetch reading results');
    }

    const readingResults = readingResultsData.map((result) => ({
      readingId: result.reading_id,
      time: result.time,
      result_type_id: result.result_type_id,
      value: result.value,
      reading_result_id: result.reading_result_id,
      parameter: result.parameter_name,
      site: result.site_name,
      floor: result.floor,
      area: result.area,
      location: result.location,
      outlet: result.outlet,
      unitOfMeasurement: result.unit,
      comments: result.comments,
    }));

    return readingResults;
  }

  private triggerAlert(
    reading: number,
    alertValue: number,
    operator: '<' | '>' | '=' | '<=' | '>='
  ): boolean {
    switch (operator) {
      case '<':
        return reading < alertValue;
      case '>':
        return reading > alertValue;
      case '=':
        return reading === alertValue;
      case '<=':
        return reading <= alertValue;
      case '>=':
        return reading >= alertValue;
      default:
        throw new Error(`Invalid operator: ${operator}`);
    }
  }
}
