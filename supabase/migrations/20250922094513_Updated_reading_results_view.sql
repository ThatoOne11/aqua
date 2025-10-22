create or replace view public.reading_results_view as
select
  c.id as client_id,
  c.display_name as client_name,
  s.id as site_id,
  s.name as site_name,
  coa.id as coa_id,
  coa.reading_date as coa_reading_date,
  COALESCE(
    r."time",
    (
      coa.reading_date::timestamp without time zone AT TIME ZONE 'Europe/London'::text
    )
  ) as sample_dt,
  date_trunc(
    'month'::text,
    (
      COALESCE(
        r."time",
        (
          coa.reading_date::timestamp without time zone AT TIME ZONE 'Europe/London'::text
        )
      ) AT TIME ZONE 'Europe/London'::text
    )
  )::date as month_start,
  st.display_name as coa_status,
  r.id as reading_id,
  r.floor,
  r.area,
  r.location,
  r.outlet,
  r.feed_type_id,
  ft.display_name as feed_type,
  r.flush_type_id,
  flt.display_name as flush_type,
  rr.id as reading_result_id,
  rr.value,
  rr.result_type_id,
  rt.display_name as result_type,
  rt.unit_of_measurement as unit,
  prm.reading_parameter_type_id as parameter_type_id,
  rpt.display_name as parameter_type,
  (
    exists (
      select
        1
      from
        reading_alert ra
      where
        ra.reading_id = r.id
        and ra.result_type_id = rr.result_type_id
        and COALESCE(ra.ignored, false) = false
    )
  ) as is_fail
from
  reading_results rr
  join readings r on r.id = rr.reading_id
  join certificate_of_analysis coa on coa.id = r.certificate_of_analysis_id
  join clients c on c.id = coa.client_id
  left join sites s on s.id = coa.site_id
  join result_types rt on rt.id = rr.result_type_id
  left join parameter_result_mapping prm on prm.result_type_id = rr.result_type_id
  left join reading_parameter_types rpt on rpt.id = prm.reading_parameter_type_id
  join certificate_of_analysis_status st on st.id = coa.status_id
  left join feed_types ft on ft.id = r.feed_type_id
  left join flush_types flt on flt.id = r.flush_type_id
where
  st.display_name is distinct from 'Pending'::text
  and (
    coa.reading_parameter_type_ids is null
    or prm.reading_parameter_type_id is null
    or (
      prm.reading_parameter_type_id = any (coa.reading_parameter_type_ids)
    )
  );