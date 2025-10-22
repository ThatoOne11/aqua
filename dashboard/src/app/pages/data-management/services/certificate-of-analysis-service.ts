import { inject, Injectable } from '@angular/core';
import {
  SupabaseEdgeFunctions,
  SupabaseViews,
} from '@core/constants/supabase.constants';
import { SupabaseClientService } from '@core/services/supabase-client.service';
import {
  extractErrorMessages,
  normalize,
} from '@data-management/mappers/coa-upload-mapper';
import {
  flattenReadings,
  getHeaders,
} from '@data-management/mappers/reading-mapper';
import { CoaImportHistoryResult } from '@data-management/models/import-history/coa-import-history-model';
import {
  CoaDetails,
  CoaUploadViewModel,
} from '@data-management/models/review-upload/coa-details.model';
import { Reading } from '@data-management/models/review-upload/flattened-reading.model';
import {
  CsvUploadResponse,
  CsvUploadResult,
} from '@data-management/models/upload/csv-upload-response.model';
import { FunctionsFetchError, FunctionsHttpError } from '@supabase/supabase-js';

@Injectable({
  providedIn: 'root',
})
export class CertificateOfAnalysisService {
  private supabase = inject(SupabaseClientService).supabaseClient;

  public async getCoaDetails(coaId: string): Promise<CoaDetails | null> {
    const { data, error } = await this.supabase
      .from(SupabaseViews.CERTIFICAT_OF_ANALYSIS_VIEW)
      .select('*')
      .eq('coa_id', coaId)
      .single();

    if (error) {
      console.error('[CoaService] getCoaDetails error', error);
      return null;
    }
    return data as CoaDetails;
  }

  public async getCoaReadingsResults(
    coaId: string,
    opts?: { limit?: number; offset?: number; orderAsc?: boolean }
  ): Promise<Reading[]> {
    const limit = opts?.limit ?? 500;
    const offset = opts?.offset ?? 0;
    const orderAsc = opts?.orderAsc ?? false;

    const { data, error } = await this.supabase
      .rpc('fetch_readings_function', {
        p_coa_id: coaId,
      })
      .order('sample_time', { ascending: orderAsc })
      .range(offset, offset + limit - 1);
    if (error) {
      console.error('[CoaService] getCoaReadingsResults error', error);
      return [];
    }
    return (data ?? []) as Reading[];
  }

  // Convenience to fetch both in parallel
  public async getCoaBundle(
    coaId: string,
    opts?: { limit?: number; offset?: number; orderAsc?: boolean }
  ): Promise<CoaUploadViewModel> {
    const [details, readings] = await Promise.all([
      this.getCoaDetails(coaId),
      this.getCoaReadingsResults(coaId, opts),
    ]);
    const flattenedReadings = flattenReadings(readings);
    const headers = getHeaders(flattenedReadings);
    return {
      details,
      readings: flattenedReadings,
      headers,
    };
  }

  async uploadCsv(file: File): Promise<CsvUploadResult> {
    const form = new FormData();
    form.append('file', file, file.name);

    const { data, error, response } =
      await this.supabase.functions.invoke<CsvUploadResponse>(
        SupabaseEdgeFunctions.CSV_UPLOAD,
        {
          body: form,
        }
      );

    if (error) {
      const msg =
        (error as FunctionsHttpError | FunctionsFetchError)?.message ??
        'Edge function call failed';
      const respBody = await response?.json();

      const secondaryMessages = extractErrorMessages(respBody?.Error ?? '');
      console.error({ extract: extractErrorMessages(msg) });
      return {
        ok: false,
        message: msg,
        errors: [...secondaryMessages],
        id: undefined,
      };
    }

    // Normalize server payloads to a common shape
    const normalized = normalize(data!);
    return normalized;
  }

  async getCoaImportHistory(): Promise<CoaImportHistoryResult[]> {
    const { data, error } = await this.supabase
      .from(SupabaseViews.IMPORT_HISTORY_VIEW)
      .select(
        `
      id,
      clientId:client_id,
      clientName:client_name,
      siteName:site_name,
      dateUploaded:date_uploaded,
      fileName:file_name,
      uploadedBy:uploaded_by,
      numReadings:num_readings
    `
      );

    if (error) {
      console.error('Error fetching summaries:', error);
      throw error;
    }

    return data;
  }
}
