export interface IdName {
  id: string;
  name: string;
}

export interface FilterSummary {
  total: number;
  passed: number;
  failed: number;
  pass_pct: number | null;
  fail_pct: number | null;
}

export interface OptionWithStats {
  id?: string; // present for id-backed dims
  name: string;
  total: number;
  passed: number;
  failed: number;
  fail_pct: number | null;
}

export interface FilterOptionsResponse {
  summary?: FilterSummary;
  sites: OptionWithStats[]; // id present
  floors: OptionWithStats[]; // name only
  areas: OptionWithStats[];
  locations: OptionWithStats[];
  outlets: OptionWithStats[];
  feed_types: OptionWithStats[]; // id present
  flush_types: OptionWithStats[];
  parameter_types: OptionWithStats[];
  result_types: OptionWithStats[];
}

export interface FilterParams {
  p_start: string;
  p_end: string;
  p_client_ids: string[] | null;
  p_site_ids: string[] | null;
  p_floors: string[] | null;
  p_areas: string[] | null;
  p_locations: string[] | null;
  p_outlets: string[] | null;
  p_feed_type_ids: string[] | null;
  p_flush_type_ids: string[] | null;
  p_parameter_type_ids: string[] | null;
  p_result_type_ids: string[] | null;
}

export interface ReadingResultViewRow {
  coa_id: string;
  month_start: string; // e.g., "2025-09-01"
  is_fail: boolean;
  parameter_type: string | null;
  parameter_type_id: string | null;
  reading_result_id: string | null;
}

export interface DashboardDataResponse {
  monthly: MonthlyDataPoint[];
  parameters: AlertParameter[];
}

export interface MonthlyDataPoint {
  month: string;
  passed: number;
  failed: number;
}

export interface AlertParameter {
  parameter: string;
  parameter_id: string;
  passed: number;
  failed: number;
}

export interface LineChartRow {
  sample_dt: string;
  value: number;
  feed_type: string | null;
  flush_type: string | null;
  unit: string | null;

  parameter_type_id?: string | null;
  result_type_id?: string | null;
}
