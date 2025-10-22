-- =========================================================
-- SCHEMA: Core tables + helpful indexes + basic RLS (auth required)
-- =========================================================

-- ========= LOOKUP TABLES =========
create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  display_name text not null,
  active boolean not null default true
);

create table if not exists public.feed_types (
  id uuid primary key default gen_random_uuid(),
  field_name text not null,
  display_name text not null,
  active boolean not null default true
);
create unique index if not exists feed_types_field_name_uniq
  on public.feed_types(field_name);

create table if not exists public.flush_types (
  id uuid primary key default gen_random_uuid(),
  field_name text not null,
  display_name text not null,
  active boolean not null default true
);
create unique index if not exists flush_types_field_name_uniq
  on public.flush_types(field_name);

create table if not exists public.certificate_of_analysis_status (
  id uuid primary key default gen_random_uuid(),
  display_name text not null
);
create unique index if not exists coa_status_display_name_uniq
  on public.certificate_of_analysis_status(display_name);

-- ========= CATALOGS =========
create table if not exists public.reading_parameter_types (
  id uuid primary key default gen_random_uuid(),
  field_name text not null,
  display_name text not null,
  active boolean not null default true
);
create unique index if not exists reading_parameter_types_field_name_uniq
  on public.reading_parameter_types(field_name);

create table if not exists public.result_types (
  id uuid primary key default gen_random_uuid(),
  display_name text not null,
  field_name text not null,
  unit_of_measurement text,
  active boolean not null default true
);
create unique index if not exists result_types_field_name_uniq
  on public.result_types(field_name);

--DELETE FROM public.reading_results;
--DELETE FROM public.parameter_result_mapping;
-- DELETE FROM public.result_types;

-- ========= SITES =========
create table if not exists public.sites (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  client_id uuid not null references public.clients(id),
  created_at timestamptz not null default now(),
  last_modified timestamptz,
  created_by uuid references auth.users(id),
  edited_by uuid references auth.users(id)
);
create unique index if not exists sites_client_name_uniq
  on public.sites (client_id, name);

-- ========= COA / READINGS / RESULTS =========
create table if not exists public.certificate_of_analysis (
  id uuid primary key default gen_random_uuid(),
  uploaded_at timestamptz not null default now(),
  uploaded_by uuid references auth.users(id),
  client_id uuid not null references public.clients(id),
  site_id uuid not null references public.sites(id),
  reading_parameter_type_ids uuid[],   -- array of reading_parameter_types; FK not enforced on array
  reading_date timestamptz,
  status_id uuid references public.certificate_of_analysis_status(id),
  raw_data jsonb
);

create table if not exists public.readings (
  id uuid primary key default gen_random_uuid(),
  certificate_of_analysis_id uuid not null references public.certificate_of_analysis(id),
  time timestamptz not null,
  floor text,
  area text,
  location text,
  outlet text,
  feed_type_id uuid references public.feed_types(id),
  flush_type_id uuid references public.flush_types(id)
);

create table if not exists public.reading_results (
  id uuid primary key default gen_random_uuid(),
  result_type_id uuid not null references public.result_types(id),
  reading_id uuid not null references public.readings(id),
  value numeric not null
);
-- prevent duplicate (reading, result_type)
create unique index if not exists reading_results_unique_pair
  on public.reading_results (reading_id, result_type_id);

-- mapping of parameter → required results
create table if not exists public.parameter_result_mapping (
  reading_parameter_type_id uuid not null references public.reading_parameter_types(id),
  result_type_id uuid not null references public.result_types(id),
  primary key (reading_parameter_type_id, result_type_id)
);

-- ========= ALERTS (optional, kept from earlier schema) =========
create table if not exists public.alert_definitions (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  condition text not null,
  result_type_id uuid not null references public.result_types(id),
  value numeric not null,
  active boolean not null default true
);

create table if not exists public.reading_alert (
  id uuid primary key default gen_random_uuid(),
  reading_id uuid not null references public.readings(id),
  result_type_id uuid not null references public.result_types(id),
  reading_value numeric not null,
  alert_value numeric not null,
  alert_condition text not null,
  note text,
  ignored boolean not null default false
);

-- ========= Helpful indexes =========
create index if not exists idx_readings_coa_id on public.readings(certificate_of_analysis_id);
create index if not exists idx_reading_results_reading_id on public.reading_results(reading_id);
create index if not exists idx_reading_results_result_type_id on public.reading_results(result_type_id);
create index if not exists idx_coa_client_site on public.certificate_of_analysis(client_id, site_id);

-- =========================================================
-- RLS: authenticated users only (valid JWT)
-- =========================================================

-- Enable RLS on all relevant tables
alter table public.clients                        enable row level security;
alter table public.feed_types                     enable row level security;
alter table public.flush_types                    enable row level security;
alter table public.certificate_of_analysis_status enable row level security;

alter table public.reading_parameter_types        enable row level security;
alter table public.result_types                   enable row level security;
alter table public.parameter_result_mapping       enable row level security;

alter table public.sites                          enable row level security;

alter table public.certificate_of_analysis        enable row level security;
alter table public.readings                       enable row level security;
alter table public.reading_results                enable row level security;

-- (optional) If you also want RLS on alerts, uncomment:
-- alter table public.alert_definitions enable row level security;
-- alter table public.reading_alert      enable row level security;

-- ========== clients ==========
drop policy if exists clients_auth_select on public.clients;
drop policy if exists clients_auth_insert on public.clients;
drop policy if exists clients_auth_update on public.clients;
drop policy if exists clients_auth_delete on public.clients;

create policy clients_auth_select on public.clients
  for select using (auth.uid() is not null);
create policy clients_auth_insert on public.clients
  for insert with check (auth.uid() is not null);
create policy clients_auth_update on public.clients
  for update using (auth.uid() is not null) with check (auth.uid() is not null);
create policy clients_auth_delete on public.clients
  for delete using (auth.uid() is not null);

-- ========== feed_types ==========
drop policy if exists feed_types_auth_select on public.feed_types;
drop policy if exists feed_types_auth_insert on public.feed_types;
drop policy if exists feed_types_auth_update on public.feed_types;
drop policy if exists feed_types_auth_delete on public.feed_types;

create policy feed_types_auth_select on public.feed_types
  for select using (auth.uid() is not null);
create policy feed_types_auth_insert on public.feed_types
  for insert with check (auth.uid() is not null);
create policy feed_types_auth_update on public.feed_types
  for update using (auth.uid() is not null) with check (auth.uid() is not null);
create policy feed_types_auth_delete on public.feed_types
  for delete using (auth.uid() is not null);

-- ========== flush_types ==========
drop policy if exists flush_types_auth_select on public.flush_types;
drop policy if exists flush_types_auth_insert on public.flush_types;
drop policy if exists flush_types_auth_update on public.flush_types;
drop policy if exists flush_types_auth_delete on public.flush_types;

create policy flush_types_auth_select on public.flush_types
  for select using (auth.uid() is not null);
create policy flush_types_auth_insert on public.flush_types
  for insert with check (auth.uid() is not null);
create policy flush_types_auth_update on public.flush_types
  for update using (auth.uid() is not null) with check (auth.uid() is not null);
create policy flush_types_auth_delete on public.flush_types
  for delete using (auth.uid() is not null);

-- ========== certificate_of_analysis_status ==========
drop policy if exists coa_status_auth_select on public.certificate_of_analysis_status;
drop policy if exists coa_status_auth_insert on public.certificate_of_analysis_status;
drop policy if exists coa_status_auth_update on public.certificate_of_analysis_status;
drop policy if exists coa_status_auth_delete on public.certificate_of_analysis_status;

create policy coa_status_auth_select on public.certificate_of_analysis_status
  for select using (auth.uid() is not null);
create policy coa_status_auth_insert on public.certificate_of_analysis_status
  for insert with check (auth.uid() is not null);
create policy coa_status_auth_update on public.certificate_of_analysis_status
  for update using (auth.uid() is not null) with check (auth.uid() is not null);
create policy coa_status_auth_delete on public.certificate_of_analysis_status
  for delete using (auth.uid() is not null);

-- ========== reading_parameter_types ==========
drop policy if exists rpt_auth_select on public.reading_parameter_types;
drop policy if exists rpt_auth_insert on public.reading_parameter_types;
drop policy if exists rpt_auth_update on public.reading_parameter_types;
drop policy if exists rpt_auth_delete on public.reading_parameter_types;

create policy rpt_auth_select on public.reading_parameter_types
  for select using (auth.uid() is not null);
create policy rpt_auth_insert on public.reading_parameter_types
  for insert with check (auth.uid() is not null);
create policy rpt_auth_update on public.reading_parameter_types
  for update using (auth.uid() is not null) with check (auth.uid() is not null);
create policy rpt_auth_delete on public.reading_parameter_types
  for delete using (auth.uid() is not null);

-- ========== result_types ==========
drop policy if exists result_types_auth_select on public.result_types;
drop policy if exists result_types_auth_insert on public.result_types;
drop policy if exists result_types_auth_update on public.result_types;
drop policy if exists result_types_auth_delete on public.result_types;

create policy result_types_auth_select on public.result_types
  for select using (auth.uid() is not null);
create policy result_types_auth_insert on public.result_types
  for insert with check (auth.uid() is not null);
create policy result_types_auth_update on public.result_types
  for update using (auth.uid() is not null) with check (auth.uid() is not null);
create policy result_types_auth_delete on public.result_types
  for delete using (auth.uid() is not null);

-- ========== parameter_result_mapping ==========
drop policy if exists prm_auth_select on public.parameter_result_mapping;
drop policy if exists prm_auth_insert on public.parameter_result_mapping;
drop policy if exists prm_auth_update on public.parameter_result_mapping;
drop policy if exists prm_auth_delete on public.parameter_result_mapping;

create policy prm_auth_select on public.parameter_result_mapping
  for select using (auth.uid() is not null);
create policy prm_auth_insert on public.parameter_result_mapping
  for insert with check (auth.uid() is not null);
create policy prm_auth_update on public.parameter_result_mapping
  for update using (auth.uid() is not null) with check (auth.uid() is not null);
create policy prm_auth_delete on public.parameter_result_mapping
  for delete using (auth.uid() is not null);

-- ========== sites ==========
drop policy if exists sites_auth_select on public.sites;
drop policy if exists sites_auth_insert on public.sites;
drop policy if exists sites_auth_update on public.sites;
drop policy if exists sites_auth_delete on public.sites;

create policy sites_auth_select on public.sites
  for select using (auth.uid() is not null);
create policy sites_auth_insert on public.sites
  for insert with check (auth.uid() is not null);
create policy sites_auth_update on public.sites
  for update using (auth.uid() is not null) with check (auth.uid() is not null);
create policy sites_auth_delete on public.sites
  for delete using (auth.uid() is not null);

-- ========== certificate_of_analysis ==========
drop policy if exists coa_auth_select on public.certificate_of_analysis;
drop policy if exists coa_auth_insert on public.certificate_of_analysis;
drop policy if exists coa_auth_update on public.certificate_of_analysis;
drop policy if exists coa_auth_delete on public.certificate_of_analysis;

create policy coa_auth_select on public.certificate_of_analysis
  for select using (auth.uid() is not null);
create policy coa_auth_insert on public.certificate_of_analysis
  for insert with check (auth.uid() is not null);
create policy coa_auth_update on public.certificate_of_analysis
  for update using (auth.uid() is not null) with check (auth.uid() is not null);
create policy coa_auth_delete on public.certificate_of_analysis
  for delete using (auth.uid() is not null);

-- ========== readings ==========
drop policy if exists readings_auth_select on public.readings;
drop policy if exists readings_auth_insert on public.readings;
drop policy if exists readings_auth_update on public.readings;
drop policy if exists readings_auth_delete on public.readings;

create policy readings_auth_select on public.readings
  for select using (auth.uid() is not null);
create policy readings_auth_insert on public.readings
  for insert with check (auth.uid() is not null);
create policy readings_auth_update on public.readings
  for update using (auth.uid() is not null) with check (auth.uid() is not null);
create policy readings_auth_delete on public.readings
  for delete using (auth.uid() is not null);

-- ========== reading_results ==========
drop policy if exists rr_auth_select on public.reading_results;
drop policy if exists rr_auth_insert on public.reading_results;
drop policy if exists rr_auth_update on public.reading_results;
drop policy if exists rr_auth_delete on public.reading_results;

create policy rr_auth_select on public.reading_results
  for select using (auth.uid() is not null);
create policy rr_auth_insert on public.reading_results
  for insert with check (auth.uid() is not null);
create policy rr_auth_update on public.reading_results
  for update using (auth.uid() is not null) with check (auth.uid() is not null);
create policy rr_auth_delete on public.reading_results
  for delete using (auth.uid() is not null);

-- Drop if you re-run locally
drop view if exists public.v_finalized_readings_norm;

-- Expose normalized columns for duplicate checks (no synthetic keys)
create or replace view public.v_finalized_readings_norm as
select
  r.id                                      as reading_id,
  coa.id                                    as certificate_of_analysis_id,
  coa.client_id,
  coa.site_id,
  -- canonical date/time (UTC) so comparisons are deterministic
  (r.time at time zone 'UTC')::date         as reading_date,
  to_char(r.time at time zone 'UTC','YYYY-MM-DD HH24:MI:SS')
                                            as time_utc,
  lower(coalesce(r.floor,    ''))           as floor_norm,
  lower(coalesce(r.area,     ''))           as area_norm,
  lower(coalesce(r.location, ''))           as location_norm,
  lower(coalesce(r.outlet,   ''))           as outlet_norm,
  r.feed_type_id,
  r.flush_type_id
from public.readings r
join public.certificate_of_analysis coa
  on coa.id = r.certificate_of_analysis_id
-- exclude PENDING COAs (use your seeded Pending status UUID)
where coa.status_id <> 'b354c5de-c40b-4c4a-a0ac-ff3009466545';