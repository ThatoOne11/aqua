create or replace view "public"."import_history_view" as  SELECT coa.id,
    c.id AS client_id,
    c.display_name AS client_name,
    s.name AS site_name,
    coa.uploaded_at AS date_uploaded,
    coa.file_name,
    u.display_name AS uploaded_by,
    count(*) AS num_readings
   FROM ((((certificate_of_analysis coa
     JOIN clients c ON ((coa.client_id = c.id)))
     JOIN sites s ON ((coa.site_id = s.id)))
     JOIN readings r ON ((coa.id = r.certificate_of_analysis_id)))
     JOIN users u ON ((coa.uploaded_by = u.id)))
  WHERE (coa.status_id = 'b7abbefb-99a1-40ec-83de-efb9f90acbb0'::uuid)
  GROUP BY coa.id, c.id, c.display_name, s.name, coa.uploaded_at, coa.file_name, u.display_name
  ORDER BY coa.uploaded_at DESC;



