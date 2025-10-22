create or replace function public.coa_warnings_function(p_coa_id uuid)
returns jsonb
language sql
stable
as $$
with this_coa as (
  select
    coa.id      as coa_id,
    coa.site_id as site_id,
    s.name      as site_name
  from public.certificate_of_analysis coa
  left join public.sites s on s.id = coa.site_id
  where coa.id = p_coa_id
),

active_coas as (
  select aco.id
  from public.certificate_of_analysis aco
  join public.certificate_of_analysis_status st on st.id = aco.status_id
  join this_coa t on t.site_id = aco.site_id
  where st.display_name = 'Completed'
    and aco.id <> t.coa_id
),
has_active as (
  select exists (select 1 from active_coas) as has_active
),

new_site as (
  select jsonb_build_object(
    'coa_id',         t.coa_id,
    'site_id',        t.site_id,
    'site_name',      t.site_name,
    'has_active_coa', false,
    'is_new_site',    true,
    'new_floors',     '[]'::jsonb,
    'new_areas',      '[]'::jsonb,
    'new_locations',  '[]'::jsonb,
    'new_outlets',    '[]'::jsonb
  ) as payload
  from this_coa t, has_active ha
  where not ha.has_active
),

curr as (
  select
    lower(btrim(r.floor))    as k_floor,    r.floor,
    lower(btrim(r.area))     as k_area,     r.area,
    lower(btrim(r.location)) as k_location, r.location,
    lower(btrim(r.outlet))   as k_outlet,   r.outlet
  from public.readings r
  join this_coa t on t.coa_id = r.certificate_of_analysis_id
),

exist as (
  select
    lower(btrim(r.floor))    as k_floor,
    lower(btrim(r.area))     as k_area,
    lower(btrim(r.location)) as k_location,
    lower(btrim(r.outlet))   as k_outlet
  from public.readings r
  join active_coas ac on ac.id = r.certificate_of_analysis_id
),

curr_floors as (
  select k_floor, min(floor) as floor
  from curr
  group by k_floor
),
curr_areas as (
  select k_floor, k_area, min(floor) as floor, min(area) as area
  from curr
  group by k_floor, k_area
),
curr_locations as (
  select k_floor, k_area, k_location,
         min(floor) as floor, min(area) as area, min(location) as location
  from curr
  group by k_floor, k_area, k_location
),
curr_outlets as (
  select k_floor, k_area, k_location, k_outlet,
         min(floor) as floor, min(area) as area, min(location) as location, min(outlet) as outlet
  from curr
  group by k_floor, k_area, k_location, k_outlet
),

exist_floors as (
  select distinct k_floor from exist
),
exist_areas as (
  select distinct k_floor, k_area from exist
),
exist_locations as (
  select distinct k_floor, k_area, k_location from exist
),
exist_outlets as (
  select distinct k_floor, k_area, k_location, k_outlet from exist
),

new_floors_raw as (
  select cf.floor, cf.k_floor
  from curr_floors cf
  where not exists (select 1 from exist_floors ef where ef.k_floor = cf.k_floor)
),
new_areas_raw as (
  select jsonb_build_object('floor', ca.floor, 'area', ca.area) as item,
         ca.k_floor, ca.k_area
  from curr_areas ca
  where not exists (
    select 1 from exist_areas ea
    where ea.k_floor = ca.k_floor and ea.k_area = ca.k_area
  )
),
new_locations_raw as (
  select jsonb_build_object('floor', cl.floor, 'area', cl.area, 'location', cl.location) as item,
         cl.k_floor, cl.k_area, cl.k_location
  from curr_locations cl
  where not exists (
    select 1 from exist_locations el
    where el.k_floor = cl.k_floor and el.k_area = cl.k_area and el.k_location = cl.k_location
  )
),
new_outlets_raw as (
  select jsonb_build_object('floor', co.floor, 'area', co.area, 'location', co.location, 'outlet', co.outlet) as item,
         co.k_floor, co.k_area, co.k_location, co.k_outlet
  from curr_outlets co
  where not exists (
    select 1 from exist_outlets eo
    where eo.k_floor = co.k_floor and eo.k_area = co.k_area
      and eo.k_location = co.k_location and eo.k_outlet = co.k_outlet
  )
),

new_areas as (
  select na.item, na.k_floor, na.k_area
  from new_areas_raw na
  left join new_floors_raw nf on nf.k_floor = na.k_floor
  where nf.k_floor is null
),
new_locations as (
  select nl.item, nl.k_floor, nl.k_area, nl.k_location
  from new_locations_raw nl
  left join new_areas_raw na on na.k_floor = nl.k_floor and na.k_area = nl.k_area
  where na.k_area is null
),
new_outlets as (
  select no.item
  from new_outlets_raw no
  left join new_locations_raw nl
    on nl.k_floor = no.k_floor and nl.k_area = no.k_area and nl.k_location = no.k_location
  where nl.k_location is null
),

details as (
  select jsonb_build_object(
    'coa_id',         t.coa_id,
    'site_id',        t.site_id,
    'site_name',      t.site_name,
    'has_active_coa', true,
    'is_new_site',    false,
    'new_floors',     coalesce((select jsonb_agg(floor order by lower(floor), floor) from new_floors_raw), '[]'::jsonb),
    'new_areas',      coalesce((select jsonb_agg(item  order by lower(item->>'floor'), lower(item->>'area')) from new_areas), '[]'::jsonb),
    'new_locations',  coalesce((select jsonb_agg(item  order by lower(item->>'floor'), lower(item->>'area'), lower(item->>'location')) from new_locations), '[]'::jsonb),
    'new_outlets',    coalesce((select jsonb_agg(item  order by lower(item->>'floor'), lower(item->>'area'), lower(item->>'location'), lower(item->>'outlet')) from new_outlets), '[]'::jsonb)
  ) as payload
  from this_coa t, has_active ha
  where ha.has_active
)

select payload from new_site
union all
select payload from details;
$$;

-- permissions
grant execute on function public.coa_warnings_function(uuid) to authenticated;

