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
    and (p_client_ids      is null or client_id      = any(p_client_ids))
    and (p_site_ids        is null or site_id        = any(p_site_ids))
    and (p_feed_type_ids   is null or feed_type_id   = any(p_feed_type_ids))
    and (p_flush_type_ids  is null or flush_type_id  = any(p_flush_type_ids))
    and (p_result_type_ids is null or result_type_id = any(p_result_type_ids))
),

-- take only the 3 most recent readings per specific outlet at each location (per client/site)
last3_per_outlet as (
  select *
  from (
    select
      b.*,
      row_number() over (
        partition by b.client_id, b.site_id, b.location, b.outlet
        order by b.sample_dt desc
      ) as rn
    from base b
    where b.location is not null
      and b.outlet   is not null
  ) t
  where rn <= 3
),

-- collapse those 3 (or fewer) readings into a single outlet "state"
-- is_fail = true if ANY of the last 3 readings failed
outlet_state as (
  select
    client_id,
    site_id,
    site_name,
    floor,
    area,
    location,
    outlet,
    feed_type_id,
    feed_type,
    flush_type_id,
    flush_type,
    parameter_type_id,
    parameter_type,
    result_type_id,
    result_type,
    bool_or(is_fail) as is_fail
  from last3_per_outlet
  group by
    client_id,
    site_id, site_name,
    floor, area, location, outlet,
    feed_type_id, feed_type,
    flush_type_id, flush_type,
    parameter_type_id, parameter_type,
    result_type_id, result_type
),

summary as (
  select count(*)::int total,
         count(*) filter (where not is_fail)::int passed,
         count(*) filter (where is_fail)::int failed
  from outlet_state
),

site_rows as (
  select distinct site_id, site_name
  from outlet_state
  where site_id is not null
),
site_stats as (
  select site_id,
         count(*)::int total,
         count(*) filter (where is_fail)::int failed,
         count(*) filter (where not is_fail)::int passed
  from outlet_state
  where site_id is not null
  group by site_id
),

floor_rows as (
  select distinct lower(floor) as key, floor as name
  from outlet_state
  where floor is not null
),
floor_stats as (
  select lower(floor) as key,
         count(*)::int total,
         count(*) filter (where is_fail)::int failed,
         count(*) filter (where not is_fail)::int passed
  from outlet_state
  where floor is not null
  group by lower(floor)
),

area_rows as (
  select distinct lower(area) as key, area as name
  from outlet_state
  where area is not null
    and (p_floors is null or lower(floor) in (select lower(unnest(p_floors))))
),
area_stats as (
  select lower(area) as key,
         count(*)::int total,
         count(*) filter (where is_fail)::int failed,
         count(*) filter (where not is_fail)::int passed
  from outlet_state
  where area is not null
    and (p_floors is null or lower(floor) in (select lower(unnest(p_floors))))
  group by lower(area)
),

location_rows as (
  select distinct lower(location) as key, location as name
  from outlet_state
  where location is not null
    and (p_areas   is null or lower(area)   in (select lower(unnest(p_areas))))
    and (p_floors  is null or lower(floor)  in (select lower(unnest(p_floors))))
),
location_stats as (
  select lower(location) as key,
         count(*)::int total,
         count(*) filter (where is_fail)::int failed,
         count(*) filter (where not is_fail)::int passed
  from outlet_state
  where location is not null
    and (p_areas   is null or lower(area)   in (select lower(unnest(p_areas))))
    and (p_floors  is null or lower(floor)  in (select lower(unnest(p_floors))))
  group by lower(location)
),

outlet_rows as (
  select distinct lower(outlet) as key, outlet as name
  from outlet_state
  where outlet is not null
    and (p_locations is null or lower(location) in (select lower(unnest(p_locations))))
    and (p_areas     is null or lower(area)     in (select lower(unnest(p_areas))))
    and (p_floors    is null or lower(floor)    in (select lower(unnest(p_floors))))
),
outlet_stats as (
  select lower(outlet) as key,
         count(*)::int total,
         count(*) filter (where is_fail)::int failed,
         count(*) filter (where not is_fail)::int passed
  from outlet_state
  where outlet is not null
    and (p_locations is null or lower(location) in (select lower(unnest(p_locations))))
    and (p_areas     is null or lower(area)     in (select lower(unnest(p_areas))))
    and (p_floors    is null or lower(floor)    in (select lower(unnest(p_floors))))
  group by lower(outlet)
),

feed_rows as (
  select distinct feed_type_id as id, feed_type as name
  from outlet_state
  where feed_type_id is not null
),
feed_stats as (
  select feed_type_id as id,
         count(*)::int total,
         count(*) filter (where is_fail)::int failed,
         count(*) filter (where not is_fail)::int passed
  from outlet_state
  where feed_type_id is not null
  group by feed_type_id
),

flush_rows as (
  select distinct flush_type_id as id, flush_type as name
  from outlet_state
  where flush_type_id is not null
),
flush_stats as (
  select flush_type_id as id,
         count(*)::int total,
         count(*) filter (where is_fail)::int failed,
         count(*) filter (where not is_fail)::int passed
  from outlet_state
  where flush_type_id is not null
  group by flush_type_id
),

param_rows as (
  select distinct parameter_type_id as id, parameter_type as name
  from outlet_state
  where parameter_type_id is not null
),
param_stats as (
  select parameter_type_id as id,
         count(*)::int total,
         count(*) filter (where is_fail)::int failed,
         count(*) filter (where not is_fail)::int passed
  from outlet_state
  where parameter_type_id is not null
  group by parameter_type_id
),

result_rows as (
  select id, display_name as name, "order"
  from public.result_types
  where id in (select distinct result_type_id from base where result_type_id is not null)
),
result_stats as (
  select result_type_id as id,
         count(*)::int total,
         count(*) filter (where is_fail)::int failed,
         count(*) filter (where not is_fail)::int passed
  from outlet_state
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
      'id', r.id, 
      'name', r.name,
      'order', r.order,
      'total', coalesce(s.total,0),
      'passed', coalesce(s.passed,0),
      'failed', coalesce(s.failed,0),
      'fail_pct', case when s.total>0 then round(100.0*s.failed/s.total,1) else null end
    ) order by r.order), '[]'::jsonb)
    from result_rows r left join result_stats s using(id)
  )
)
$$;