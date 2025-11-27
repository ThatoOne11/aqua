// supabase/functions/csv-upload/types.ts
export type CoaInsert = {
  uploaded_by: string | null;
  client_id: string;
  site_id: string;
  reading_parameter_type_ids: string[];
  reading_date: string; // "YYYY-MM-DD HH:MM:SS" (no TZ)
  status_id: string;
  raw_data: Record<string, unknown>;
  file_name?: string | null;
  username: string | null;
  project_manager: string | null;
  job_reference: string | null;
  team_leader: string | null;
  zeta_safe_client_id: string | null;
  zeta_safe_client_api: string | null;
};

export type ReadingInsert = {
  certificate_of_analysis_id?: string;
  time: string; // NOT NULL
  floor: string | null;
  area: string | null;
  location: string | null;
  outlet: string | null;
  feed_type_id: string;
  flush_type_id: string;
  provided_id: string | null;
};

export type ReadingResultInsert = {
  result_type_id: string;
  reading_id: string;
  value: number;
  temperature: number | null;
  comments: string | null;
};
