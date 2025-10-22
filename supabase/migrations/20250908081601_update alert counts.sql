
alter table public.reading_alert
  add column if not exists reading_result_id uuid
  references public.reading_results(id) on delete cascade;


create or replace function public.filter_options_function(
  p_start               timestamptz,
  p_end                 timestamptz,
  p_client_ids          uuid[] default null,
  p_site_ids            uuid[] default null,
  p_floors              text[] default null,
  p_areas               text[] default null,
  p_locations           text[] default null,
  p_outlets             text[] default null,
  p_feed_type_ids       uuid[] default null,
  p_flush_type_ids      uuid[] default null,
  p_parameter_type_ids  uuid[] default null,
  p_result_type_ids     uuid[] default null
)
returns jsonb
language sql
stable
as $$
with base0 as (
  select *
  from public.reading_results_view
  where sample_dt >= p_start
    and sample_dt <= p_end
    and (p_client_ids         is null or client_id         = any(p_client_ids))
    and (p_site_ids           is null or site_id           = any(p_site_ids))
    and (p_floors             is null or floor             = any(p_floors))
    and (p_areas              is null or area              = any(p_areas))
    and (p_locations          is null or location          = any(p_locations))
    and (p_outlets            is null or outlet            = any(p_outlets))
    and (p_feed_type_ids      is null or feed_type_id      = any(p_feed_type_ids))
    and (p_flush_type_ids     is null or flush_type_id     = any(p_flush_type_ids))
    and (p_parameter_type_ids is null or parameter_type_id = any(p_parameter_type_ids))
    and (p_result_type_ids    is null or result_type_id    = any(p_result_type_ids))
),
alerts as (
  select distinct reading_result_id
  from public.reading_alert
  where coalesce(ignored, false) = false
),
base as (
  -- keep all columns from base0, but add a DISTINCTLY-NAMED flag
  select
    b0.*,
    exists (
      select 1 from alerts a
      where a.reading_result_id = b0.reading_result_id
    ) as is_fail_flag
  from base0 b0
),

summary as (
  select
    count(*)::int                                        as total,
    count(*) filter (where not is_fail_flag)::int        as passed,
    count(*) filter (where is_fail_flag)::int            as failed
  from base
),

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
  count(distinct rr.result_type_id)::integer as result_types_count
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
