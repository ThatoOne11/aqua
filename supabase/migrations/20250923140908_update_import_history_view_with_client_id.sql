drop view if exists import_history_view;
create view public.import_history_view as
select
  coa.id,
  c.id as client_id,
  c.display_name as client_name,
  s.name as site_name,
  coa.uploaded_at as date_uploaded,
  coa.file_name,
  u.display_name as uploaded_by,
  count(*) as num_readings
from
  certificate_of_analysis coa
  join clients c on coa.client_id = c.id
  join sites s on coa.site_id = s.id
  join readings r on coa.id = r.certificate_of_analysis_id
  join users u on coa.uploaded_by = u.id
where
  coa.status_id = 'b7abbefb-99a1-40ec-83de-efb9f90acbb0'::uuid
group by
  coa.id,
  c.id,
  c.display_name,
  s.name,
  coa.uploaded_at,
  coa.file_name,
  u.display_name;