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
    -- Only filter by top-level selections
    and (p_site_ids is null or site_id = any(p_site_ids))
    and (p_feed_type_ids is null or feed_type_id  = any(p_feed_type_ids))
    and (p_flush_type_ids is null or flush_type_id = any(p_flush_type_ids))
    and (p_parameter_type_ids is null or parameter_type_id = any(p_parameter_type_ids))
    and (p_result_type_ids    is null or result_type_id    = any(p_result_type_ids))
),
summary as (
  select count(*)::int total,
         count(*) filter (where not is_fail)::int passed,
         count(*) filter (where is_fail)::int     failed
  from base
),
-- Sites
site_rows as (
  select distinct site_id, site_name
  from public.reading_results_view
  where site_id is not null
    and (p_client_ids is null or client_id = any(p_client_ids))
),
site_stats as (
  select site_id,
         count(*)::int total,
         count(*) filter (where is_fail)::int failed,
         count(*) filter (where not is_fail)::int passed
  from base
  where site_id is not null
  group by site_id
),
-- Floors
floor_rows as (
  select distinct lower(floor) as key, floor as name
  from public.reading_results_view
  where floor is not null
    and (p_site_ids is null or site_id = any(p_site_ids))
),
floor_stats as (
  select lower(floor) as key,
         count(*)::int total,
         count(*) filter (where is_fail)::int failed,
         count(*) filter (where not is_fail)::int passed
  from base
  where floor is not null
  group by lower(floor)
),
-- Areas
area_rows as (
  select distinct lower(area) as key, area as name
  from public.reading_results_view
  where area is not null
    and (p_floors is null or lower(floor) = any(p_floors))
),
area_stats as (
  select lower(area) as key,
         count(*)::int total,
         count(*) filter (where is_fail)::int failed,
         count(*) filter (where not is_fail)::int passed
  from base
  where area is not null
  group by lower(area)
),
-- Locations
location_rows AS (
  SELECT DISTINCT lower(location) AS key, location AS name
  FROM public.reading_results_view
  WHERE location IS NOT NULL
    AND (
      p_areas IS NULL 
      OR lower(area) IN (SELECT lower(unnest(p_areas)))
    )
),
location_stats as (
  select lower(location) as key,
         count(*)::int total,
         count(*) filter (where is_fail)::int failed,
         count(*) filter (where not is_fail)::int passed
  from base
  where location is not null
  group by lower(location)
),
-- Outlets
outlet_rows AS (
  SELECT DISTINCT lower(outlet) AS key, outlet AS name
  FROM public.reading_results_view
  WHERE outlet IS NOT NULL
    AND (
      p_locations IS NULL 
      OR lower(location) IN (SELECT lower(unnest(p_locations)))
    )
),
outlet_stats as (
  select lower(outlet) as key,
         count(*)::int total,
         count(*) filter (where is_fail)::int failed,
         count(*) filter (where not is_fail)::int passed
  from base
  where outlet is not null
  group by lower(outlet)
),
-- Feed types
feed_rows as (
  select distinct feed_type_id as id, feed_type as name
  from public.reading_results_view
  where feed_type_id is not null
),
feed_stats as (
  select feed_type_id as id,
         count(*)::int total,
         count(*) filter (where is_fail)::int failed,
         count(*) filter (where not is_fail)::int passed
  from base
  where feed_type_id is not null
  group by feed_type_id
),
-- Flush types
flush_rows as (
  select distinct flush_type_id as id, flush_type as name
  from public.reading_results_view
  where flush_type_id is not null
),
flush_stats as (
  select flush_type_id as id,
         count(*)::int total,
         count(*) filter (where is_fail)::int failed,
         count(*) filter (where not is_fail)::int passed
  from base
  where flush_type_id is not null
  group by flush_type_id
),
-- Parameter types
param_rows as (
  select distinct parameter_type_id as id, parameter_type as name
  from base
  where parameter_type_id is not null
),
param_stats as (
  select parameter_type_id as id,
         count(*)::int total,
         count(*) filter (where is_fail)::int failed,
         count(*) filter (where not is_fail)::int passed
  from base
  where parameter_type_id is not null
  group by parameter_type_id
),
-- Result types
result_rows as (
  select distinct result_type_id as id, result_type as name
  from public.reading_results_view
  where result_type_id is not null
),
result_stats as (
  select result_type_id as id,
         count(*)::int total,
         count(*) filter (where is_fail)::int failed,
         count(*) filter (where not is_fail)::int passed
  from base
  where result_type_id is not null
  group by result_type_id
)
select jsonb_build_object(
  'summary', (select jsonb_build_object(
       'total',  total,
       'passed', passed,
       'failed', failed,
       'pass_pct', round(100.0 * passed / nullif(total,0), 1),
       'fail_pct', round(100.0 * failed / nullif(total,0), 1)
     ) from summary),
  'sites', (
    select coalesce(jsonb_agg(jsonb_build_object(
      'id', r.site_id,
      'name', r.site_name,
      'total', coalesce(s.total,0),
      'passed', coalesce(s.passed,0),
      'failed', coalesce(s.failed,0),
      'fail_pct', case when s.total>0 then round(100.0*s.failed/s.total,1) else null end
    ) order by lower(r.site_name)), '[]'::jsonb)
    from site_rows r left join site_stats s using(site_id)
  ),
  'floors', (
    select coalesce(jsonb_agg(jsonb_build_object(
      'name', r.name,
      'total', coalesce(s.total,0),
      'passed', coalesce(s.passed,0),
      'failed', coalesce(s.failed,0),
      'fail_pct', case when s.total>0 then round(100.0*s.failed/s.total,1) else null end
    ) order by lower(r.name)), '[]'::jsonb)
    from floor_rows r left join floor_stats s using(key)
  ),
  'areas', (
    select coalesce(jsonb_agg(jsonb_build_object(
      'name', r.name,
      'total', coalesce(s.total,0),
      'passed', coalesce(s.passed,0),
      'failed', coalesce(s.failed,0),
      'fail_pct', case when s.total>0 then round(100.0*s.failed/s.total,1) else null end
    ) order by lower(r.name)), '[]'::jsonb)
    from area_rows r left join area_stats s using(key)
  ),
  'locations', (
    select coalesce(jsonb_agg(jsonb_build_object(
      'name', r.name,
      'total', coalesce(s.total,0),
      'passed', coalesce(s.passed,0),
      'failed', coalesce(s.failed,0),
      'fail_pct', case when s.total>0 then round(100.0*s.failed/s.total,1) else null end
    ) order by lower(r.name)), '[]'::jsonb)
    from location_rows r left join location_stats s using(key)
  ),
  'outlets', (
    select coalesce(jsonb_agg(jsonb_build_object(
      'name', r.name,
      'total', coalesce(s.total,0),
      'passed', coalesce(s.passed,0),
      'failed', coalesce(s.failed,0),
      'fail_pct', case when s.total>0 then round(100.0*s.failed/s.total,1) else null end
    ) order by lower(r.name)), '[]'::jsonb)
    from outlet_rows r left join outlet_stats s using(key)
  ),
  'feed_types', (
    select coalesce(jsonb_agg(jsonb_build_object(
      'id', r.id, 'name', r.name,
      'total', coalesce(s.total,0),
      'passed', coalesce(s.passed,0),
      'failed', coalesce(s.failed,0),
      'fail_pct', case when s.total>0 then round(100.0*s.failed/s.total,1) else null end
    ) order by lower(r.name)), '[]'::jsonb)
    from feed_rows r left join feed_stats s using(id)
  ),
  'flush_types', (
    select coalesce(jsonb_agg(jsonb_build_object(
      'id', r.id, 'name', r.name,
      'total', coalesce(s.total,0),
      'passed', coalesce(s.passed,0),
      'failed', coalesce(s.failed,0),
      'fail_pct', case when s.total>0 then round(100.0*s.failed/s.total,1) else null end
    ) order by lower(r.name)), '[]'::jsonb)
    from flush_rows r left join flush_stats s using(id)
  ),
  'parameter_types', (
    select coalesce(jsonb_agg(jsonb_build_object(
      'id', r.id, 'name', r.name,
      'total', coalesce(s.total,0),
      'passed', coalesce(s.passed,0),
      'failed', coalesce(s.failed,0),
      'fail_pct', case when s.total>0 then round(100.0*s.failed/s.total,1) else null end
    ) order by lower(r.name)), '[]'::jsonb)
    from param_rows r left join param_stats s using(id)
  ),
  'result_types', (
    select coalesce(jsonb_agg(jsonb_build_object(
      'id', r.id, 'name', r.name,
      'total', coalesce(s.total,0),
      'passed', coalesce(s.passed,0),
      'failed', coalesce(s.failed,0),
      'fail_pct', case when s.total>0 then round(100.0*s.failed/s.total,1) else null end
    ) order by lower(r.name)), '[]'::jsonb)
    from result_rows r left join result_stats s using(id)
  )
) as options;
$$;