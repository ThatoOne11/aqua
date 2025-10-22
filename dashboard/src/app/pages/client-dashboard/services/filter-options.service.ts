import { Injectable, inject } from '@angular/core';
import { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseClientService } from '@core/services/supabase-client.service';
import {
  FilterOptionsResponse,
  FilterParams,
  ReadingResultViewRow,
} from '@client-dashboard/models/filters/filters.model';
import {
  SupabaseRpcFunctions,
  SupabaseViews,
} from '@core/constants/supabase.constants';

@Injectable({ providedIn: 'root' })
export class FilterOptionsService {
  private readonly supabase = inject(SupabaseClientService)
    .supabaseClient as SupabaseClient;

  /**
   * Calls Postgres RPC: public.filter_options_function(...)
   * Your SQL returns `jsonb_build_object(...) AS options`, so unwrap if needed.
   */
  async getFilterOptions(params: FilterParams): Promise<FilterOptionsResponse> {
    const { data, error } = await this.supabase
      .rpc(SupabaseRpcFunctions.FILTER_OPTIONS_FUNCTION, params)
      .single();

    if (error) throw error;

    const payload = (data as any)?.options ?? data ?? {};
    return {
      summary: payload.summary ?? undefined,
      sites: payload.sites ?? [],
      floors: payload.floors ?? [],
      areas: payload.areas ?? [],
      locations: payload.locations ?? [],
      outlets: payload.outlets ?? [],
      feed_types: payload.feed_types ?? [],
      flush_types: payload.flush_types ?? [],
      parameter_types: payload.parameter_types ?? [],
      result_types: payload.result_types ?? [],
    } satisfies FilterOptionsResponse;
  }

  /**
   *Fetches the raw, filtered reading results for client-side processing.
   * This builds a query against the `reading_results_view` directly.
   */
  async getRawResults(params: FilterParams): Promise<ReadingResultViewRow[]> {
    let query = this.supabase.from(SupabaseViews.READING_RESULTS_VIEW).select(`
      coa_id,
      month_start,
      is_fail,
      parameter_type,
      parameter_type_id,
      reading_result_id,
      sample_dt,
      value,
      feed_type,
      flush_type,
      unit,
      result_type_id
    `);

    // Dynamically apply all active filters to the query
    if (params.p_start) query = query.gte('sample_dt', params.p_start);
    if (params.p_end) query = query.lte('sample_dt', params.p_end);
    if (params.p_client_ids) query = query.in('client_id', params.p_client_ids);
    if (params.p_site_ids) query = query.in('site_id', params.p_site_ids);
    if (params.p_floors) query = query.in('floor', params.p_floors);
    if (params.p_areas) query = query.in('area', params.p_areas);
    if (params.p_locations) query = query.in('location', params.p_locations);
    if (params.p_outlets) query = query.in('outlet', params.p_outlets);
    if (params.p_parameter_type_ids)
      query = query.in('parameter_type_id', params.p_parameter_type_ids);

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching raw results', error);
      throw error;
    }

    return data;
  }
}
