-- =========================================
-- View: public.certificate_of_analysis_view
-- =========================================
create or replace view public.certificate_of_analysis_view as
select
  coa.id                              as coa_id,
  c.id                                as client_id,
  c.display_name                      as client_name,
  s.id                                as site_id,
  s.name                              as site_name,
  st.display_name                     as coa_status,
  coa.reading_date                    as coa_reading_date,

  -- Use COA.reading_date if present, otherwise first/last reading time
  min(coalesce(coa.reading_date, r."time")) as first_sample_dt,
  max(coalesce(coa.reading_date, r."time")) as last_sample_dt,

  count(distinct r.id)::int           as readings_count,
  count(rr.id)::int                   as results_count,

  -- Fail = there exists a non-ignored alert for (reading, result_type)
  count(rr.id) filter (
    where exists (
      select 1
      from public.reading_alert ra
      where ra.reading_id = r.id
        and ra.result_type_id = rr.result_type_id
        and coalesce(ra.ignored, false) = false
    )
  )::int                               as failed_count,

  ( count(rr.id)
    - count(rr.id) filter (
        where exists (
          select 1
          from public.reading_alert ra
          where ra.reading_id = r.id
            and ra.result_type_id = rr.result_type_id
            and coalesce(ra.ignored, false) = false
        )
      )
  )::int                               as passed_count,

  count(distinct prm.reading_parameter_type_id)::int as parameter_types_count,
  count(distinct rr.result_type_id)::int             as result_types_count

from public.certificate_of_analysis coa
join public.clients c
  on c.id = coa.client_id
left join public.sites s
  on s.id = coa.site_id
join public.certificate_of_analysis_status st
  on st.id = coa.status_id

left join public.readings r
  on r.certificate_of_analysis_id = coa.id
left join public.reading_results rr
  on rr.reading_id = r.id
left join public.parameter_result_mapping prm
  on prm.result_type_id = rr.result_type_id

-- NOTE: No status filter (Pending included). No parameter gating.
group by
  coa.id, c.id, c.display_name, s.id, s.name, st.display_name, coa.reading_date;



create or replace function public.fetch_readings_function (p_coa_id uuid)
returns table (
  reading_id                   uuid,
  certificate_of_analysis_id   uuid,
  sample_time                  timestamptz,
  floor                        text,
  area                         text,
  location                     text,
  outlet                       text,
  feed_type                    text,
  flush_type                   text,
  coa_results_list             jsonb   -- array of result objects
)
language sql
stable
as $$
with coa_readings as (
  select
    r.id,
    r.certificate_of_analysis_id,
    r."time"                     as sample_time,
    r.floor,
    r.area,
    r.location,
    r.outlet,
    ft.display_name              as feed_type,
    flt.display_name             as flush_type
  from public.readings r
  left join public.feed_types  ft  on ft.id  = r.feed_type_id
  left join public.flush_types flt on flt.id = r.flush_type_id
  where r.certificate_of_analysis_id = p_coa_id
),
coa_results as (
  select
    rr.reading_id,
    jsonb_build_object(
      'reading_result_id',        rr.id,
      'result_type_id',           rr.result_type_id,
      'result_type',              rt.display_name,
      'value',                    rr.value
    ) as result_json
  from public.reading_results rr
  join public.result_types rt
    on rt.id = rr.result_type_id
  where rr.reading_id in (select id from coa_readings)
)
select
  r.id                             as reading_id,
  r.certificate_of_analysis_id,
  r.sample_time,
  r.floor,
  r.area,
  r.location,
  r.outlet,
  r.feed_type,
  r.flush_type,
  coalesce(
    jsonb_agg(cr.result_json)
      filter (where cr.result_json is not null),
    '[]'::jsonb
  )                                as coa_results_list
from coa_readings r
left join coa_results cr
  on cr.reading_id = r.id
group by
  r.id, r.certificate_of_analysis_id, r.sample_time,
  r.floor, r.area, r.location, r.outlet, r.feed_type, r.flush_type
order by r.sample_time nulls last, r.id;
$$;



-- Allow your app role to call it
grant execute on function public.fetch_readings_function(uuid) to authenticated;




-- ======================
-- Grants (unchanged)
-- ======================
grant select on public.certificate_of_analysis_view to authenticated;

