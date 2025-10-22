alter table public.reading_results
add column comments text;

create or replace view public.reading_results_for_alerts_view as
select
  c.id as client_id,
  c.display_name as client_name,
  s.id as site_id,
  s.name as site_name,
  coa.id as coa_id,
  r."time",
  r.id as reading_id,
  r.floor,
  r.area,
  r.location,
  r.outlet,
  rr.id as reading_result_id,
  rr.value,
  rr.result_type_id,
  rt.display_name as result_type,
  rt.unit_of_measurement as unit,
  prm.reading_parameter_type_id as parameter_type_id,
  rpt.display_name as parameter_name,
  rr.comments
from
  readings r
  left join reading_results rr on rr.reading_id = r.id
  left join certificate_of_analysis coa on coa.id = r.certificate_of_analysis_id
  join clients c on c.id = coa.client_id
  left join sites s on s.id = coa.site_id
  left join result_types rt on rt.id = rr.result_type_id
  left join parameter_result_mapping prm on prm.result_type_id = rr.result_type_id
  left join reading_parameter_types rpt on rpt.id = prm.reading_parameter_type_id
where
  coa.reading_parameter_type_ids is null
  or prm.reading_parameter_type_id is null
  or (
    prm.reading_parameter_type_id = any (coa.reading_parameter_type_ids)
  );