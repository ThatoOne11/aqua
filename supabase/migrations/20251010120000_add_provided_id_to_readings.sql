DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'readings'
      AND column_name  = 'provided_id'
  ) THEN
    ALTER TABLE public.readings
    ADD COLUMN provided_id TEXT;
  END IF;
END $$;

drop function if exists "public"."fetch_readings_function"(p_coa_id uuid);

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.fetch_readings_function(p_coa_id uuid)
 RETURNS TABLE(reading_id uuid, provided_id text, certificate_of_analysis_id uuid, sample_time timestamp with time zone, sample_time_formatted text, floor text, area text, location text, outlet text, feed_type text, flush_type text, parameters text, coa_results_list jsonb)
 LANGUAGE sql
 STABLE
AS $function$
with this_coa as (
  select id, reading_parameter_type_ids
  from public.certificate_of_analysis
  where id = p_coa_id
),
param_names as (
  select
    string_agg(distinct rpt.display_name, ', ' order by rpt.display_name) as parameters_txt
  from this_coa t
  left join public.reading_parameter_types rpt
    on rpt.id = any(t.reading_parameter_type_ids)
),
coa_readings as (
  select
    r.id,
    r.provided_id,
    r.certificate_of_analysis_id,
    r."time"         as sample_time,
    to_char(r.time, 'HH24:MI:SS') as sample_time_formatted ,
    r.floor,
    r.area,
    r.location,
    r.outlet,
    ft.display_name  as feed_type,
    flt.display_name as flush_type
  from public.readings r
  left join public.feed_types  ft  on ft.id  = r.feed_type_id
  left join public.flush_types flt on flt.id = r.flush_type_id
  where r.certificate_of_analysis_id = p_coa_id
),
coa_results as (
  select
    rr.reading_id,
    jsonb_build_object(
      'reading_result_id', rr.id,
      'result_type_id',    rr.result_type_id,
      'result_type',       rt.display_name,
      'value',             rr.value
    ) as result_json
  from public.reading_results rr
  join public.result_types rt on rt.id = rr.result_type_id
  where rr.reading_id in (select id from coa_readings)
)
select
  r.id                            as reading_id,
  r.provided_id,
  r.certificate_of_analysis_id,
  r.sample_time,
  r.sample_time_formatted,
  r.floor,
  r.area,
  r.location,
  r.outlet,
  r.feed_type,
  r.flush_type,
  (select parameters_txt from param_names) as parameters,
  coalesce(
    jsonb_agg(cr.result_json order by (cr.result_json->>'result_type')) 
      filter (where cr.result_json is not null),
    '[]'::jsonb
  )                               as coa_results_list
from coa_readings r
left join coa_results cr on cr.reading_id = r.id
group by
  r.id, r.provided_id, r.certificate_of_analysis_id, r.sample_time,
  r.floor, r.area, r.location, r.outlet, r.feed_type, r.flush_type, r.sample_time_formatted
order by case when r.provided_id ~ '^\d+$' then 0 else 1 end, case when r.provided_id ~ '^\d+$' then r.provided_id::bigint else 0 end, r.id;
$function$
;