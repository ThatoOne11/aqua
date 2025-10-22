alter table if exists public.certificate_of_analysis
  add column if not exists username text default null,
  add column if not exists project_manager text default null,
  add column if not exists job_reference text default null,
  add column if not exists team_leader text default null,
  add column if not exists zeta_safe_client_id text default null,
  add column if not exists zeta_safe_client_api text default null;

create or replace view public.certificate_of_analysis_view as
select
  coa.id as coa_id,
  c.id as client_id,
  c.display_name as client_name,
  s.id as site_id,
  s.name as site_name,
  st.display_name as coa_status,
  coa.reading_date as coa_reading_date,
  min(coalesce(coa.reading_date, r."time")) as first_sample_dt,
  max(coalesce(coa.reading_date, r."time")) as last_sample_dt,
  count(distinct r.id)::integer as readings_count,
  count(rr.id)::integer as results_count,
  count(rr.id) filter (
    where exists (
      select 1
      from public.reading_alert ra
      where ra.reading_result_id = rr.id
        and coalesce(ra.ignored,false) = false
    )
  )::integer as failed_count,
  (
    count(rr.id)
    - count(rr.id) filter (
        where exists (
          select 1
          from public.reading_alert ra
          where ra.reading_result_id = rr.id
            and coalesce(ra.ignored,false) = false
        )
      )
  )::integer as passed_count,
  count(distinct prm.reading_parameter_type_id)::integer as parameter_types_count,
  count(distinct rr.result_type_id)::integer as result_types_count,
  coa.username as coa_username,
  coa.project_manager as coa_project_manager,
  coa.job_reference as coa_job_reference,
  coa.team_leader as coa_team_leader,
  coa.zeta_safe_client_id as coa_zeta_safe_client_id,
  coa.zeta_safe_client_api as coa_zeta_safe_client_api
from public.certificate_of_analysis coa
join public.clients c  on c.id  = coa.client_id
left join public.sites s on s.id = coa.site_id
join public.certificate_of_analysis_status st on st.id = coa.status_id
left join public.readings r         on r.certificate_of_analysis_id = coa.id
left join public.reading_results rr on rr.reading_id               = r.id
left join public.parameter_result_mapping prm
       on prm.result_type_id = rr.result_type_id
group by
  coa.id, c.id, c.display_name, s.id, s.name, st.display_name, coa.reading_date;