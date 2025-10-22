create or replace view public.reading_results_view as
select
  c.id as client_id,
  c.display_name as client_name,
  s.id as site_id,
  s.name as site_name,
  coa.id as coa_id,
  coa.reading_date as coa_reading_date,
  COALESCE(coa.reading_date, r."time") as sample_dt,
  date_trunc(
    'month'::text,
    COALESCE(coa.reading_date, r."time")
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

create or replace function public.filter_options_function(
  p_start timestamptz,
  p_end   timestamptz,
  p_client_ids uuid[] default null,
  p_site_ids   uuid[] default null,
  p_floors     text[]  default null,
  p_areas      text[]  default null,
  p_locations  text[]  default null,
  p_outlets    text[]  default null,
  p_feed_type_ids  uuid[] default null,
  p_flush_type_ids uuid[] default null,
  p_parameter_type_ids uuid[] default null,
  p_result_type_ids    uuid[] default null
)
returns jsonb
language sql
stable
as $$
with base as (
  select *
  from public.reading_results_view
  where sample_dt >= p_start
    and sample_dt <= p_end
    and (p_client_ids is null or client_id = any(p_client_ids))
    and (p_site_ids   is null or site_id   = any(p_site_ids))
    and (p_floors     is null or floor     = any(p_floors))
    and (p_areas      is null or area      = any(p_areas))
    and (p_locations  is null or location  = any(p_locations))
    and (p_outlets    is null or outlet    = any(p_outlets))
    and (p_feed_type_ids  is null or feed_type_id  = any(p_feed_type_ids))
    and (p_flush_type_ids is null or flush_type_id = any(p_flush_type_ids))
    and (p_parameter_type_ids is null or parameter_type_id = any(p_parameter_type_ids))
    and (p_result_type_ids    is null or result_type_id    = any(p_result_type_ids))
),
-- overall pass/fail summary for current filter state
summary as (
  select
    count(*)::int                                        as total,
    count(*) filter (where not is_fail)::int             as passed,
    count(*) filter (where is_fail)::int                 as failed
  from base
),
-- Option lists (same shapes as before)
site_rows as (
  select site_id, min(site_name) as site_name
  from base
  where site_id is not null
  group by site_id
),
floor_rows as (
  select min(floor) as floor
  from base
  where floor is not null
  group by lower(floor)
),
area_rows as (
  select min(area) as area
  from base
  where area is not null
  group by lower(area)
),
location_rows as (
  select min(location) as location
  from base
  where location is not null
  group by lower(location)
),
outlet_rows as (
  select min(outlet) as outlet
  from base
  where outlet is not null
  group by lower(outlet)
),
feed_type_rows as (
  select feed_type_id, min(feed_type) as feed_type
  from base
  where feed_type_id is not null
  group by feed_type_id
),
flush_type_rows as (
  select flush_type_id, min(flush_type) as flush_type
  from base
  where flush_type_id is not null
  group by flush_type_id
),
parameter_type_rows as (
  select parameter_type_id, min(parameter_type) as parameter_type
  from base
  where parameter_type_id is not null
  group by parameter_type_id
),
result_type_rows as (
  select result_type_id, min(result_type) as result_type
  from base
  where result_type_id is not null
  group by result_type_id
)
select jsonb_build_object(
  -- NEW: overall pass/fail counts & percentages
  'summary',
    coalesce(
      (
        select jsonb_build_object(
          'total',  total,
          'passed', passed,
          'failed', failed,
          'pass_pct', round(100.0 * passed / nullif(total,0), 1),
          'fail_pct', round(100.0 * failed / nullif(total,0), 1)
        )
        from summary
      ),
      jsonb_build_object('total',0,'passed',0,'failed',0,'pass_pct',null,'fail_pct',null)
    ),

  -- The existing option arrays (unchanged shapes)
  'sites',
    coalesce(
      (select jsonb_agg(jsonb_build_object('id', site_id, 'name', site_name)
                        order by lower(site_name), site_name)
       from site_rows),
      '[]'::jsonb),
  'floors',
    coalesce((select jsonb_agg(floor    order by lower(floor), floor)       from floor_rows),    '[]'::jsonb),
  'areas',
    coalesce((select jsonb_agg(area     order by lower(area), area)         from area_rows),     '[]'::jsonb),
  'locations',
    coalesce((select jsonb_agg(location order by lower(location), location) from location_rows), '[]'::jsonb),
  'outlets',
    coalesce((select jsonb_agg(outlet   order by lower(outlet), outlet)     from outlet_rows),   '[]'::jsonb),
  'feed_types',
    coalesce(
      (select jsonb_agg(jsonb_build_object('id', feed_type_id,  'name', feed_type)
                        order by lower(feed_type), feed_type)
       from feed_type_rows),
      '[]'::jsonb),
  'flush_types',
    coalesce(
      (select jsonb_agg(jsonb_build_object('id', flush_type_id, 'name', flush_type)
                        order by lower(flush_type), flush_type)
       from flush_type_rows),
      '[]'::jsonb),
  'parameter_types',
    coalesce(
      (select jsonb_agg(jsonb_build_object('id', parameter_type_id, 'name', parameter_type)
                        order by lower(parameter_type), parameter_type)
       from parameter_type_rows),
      '[]'::jsonb),
  'result_types',
    coalesce(
      (select jsonb_agg(jsonb_build_object('id', result_type_id,    'name', result_type)
                        order by lower(result_type), result_type)
       from result_type_rows),
      '[]'::jsonb)
) as options;
$$;

-- ===== view: allow reads (RLS enforced on base tables) =====
grant select on public.reading_results_view to authenticated;

-- ===== function: allow execute to authenticated =====
-- keep SECURITY INVOKER (default) so table RLS still applies
revoke all on function public.filter_options_function(
  timestamptz, timestamptz,
  uuid[], uuid[],
  text[], text[], text[], text[],
  uuid[], uuid[], uuid[], uuid[]
) from public;

grant execute on function public.filter_options_function(
  timestamptz, timestamptz,
  uuid[], uuid[],
  text[], text[], text[], text[],
  uuid[], uuid[], uuid[], uuid[]
) to authenticated;