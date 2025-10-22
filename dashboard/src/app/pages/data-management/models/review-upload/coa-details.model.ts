import { FlattenedReading } from './flattened-reading.model';

export interface CoaDetails {
  coa_id: string;
  client_id: string;
  client_name: string;
  site_id: string | null;
  site_name: string | null;
  coa_status: string;
  coa_reading_date: string | null;
  first_sample_dt: string | null;
  last_sample_dt: string | null;
  readings_count: number;
  results_count: number;
  failed_count: number;
  passed_count: number;
  parameter_types_count: number;
  result_types_count: number;
  coa_username: string | null;
  coa_job_reference: string | null;
  coa_team_leader: string | null;
  coa_zeta_safe_client_id: string | null;
  coa_zeta_safe_client_api: string | null;
  coa_project_manager: string | null;
  raw_data?: any;
  file_name?: string | null;
}

export interface CoaUploadViewModel {
  details: CoaDetails | null;
  readings: FlattenedReading[];
  headers: string[];
}
