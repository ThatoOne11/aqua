create or replace view "public"."reading_results_view" as  SELECT c.id AS client_id,
    c.display_name AS client_name,
    s.id AS site_id,
    s.name AS site_name,
    coa.id AS coa_id,
    coa.reading_date AS coa_reading_date,
    COALESCE(r."time", coa.reading_date) AS sample_dt,
    (date_trunc('month'::text, COALESCE(coa.reading_date, r."time")))::date AS month_start,
    st.display_name AS coa_status,
    r.id AS reading_id,
    COALESCE(NULLIF(btrim(r.floor), ''::text), 'unset'::text) AS floor,
    COALESCE(NULLIF(btrim(r.area), ''::text), 'unset'::text) AS area,
    r.location,
    r.outlet,
    r.feed_type_id,
    ft.display_name AS feed_type,
    r.flush_type_id,
    flt.display_name AS flush_type,
    rr.id AS reading_result_id,
    rr.value,
    rr.result_type_id,
    rt.display_name AS result_type,
    rt.unit_of_measurement AS unit,
    prm.reading_parameter_type_id AS parameter_type_id,
    rpt.display_name AS parameter_type,
    (EXISTS ( SELECT 1
           FROM reading_alert ra
          WHERE ((ra.reading_id = r.id) AND (ra.result_type_id = rr.result_type_id) AND (COALESCE(ra.ignored, false) = false)))) AS is_fail,
    rr.temperature,
    rr.comments
   FROM ((((((((((reading_results rr
     JOIN readings r ON ((r.id = rr.reading_id)))
     JOIN certificate_of_analysis coa ON ((coa.id = r.certificate_of_analysis_id)))
     JOIN clients c ON ((c.id = coa.client_id)))
     LEFT JOIN sites s ON ((s.id = coa.site_id)))
     JOIN result_types rt ON ((rt.id = rr.result_type_id)))
     LEFT JOIN parameter_result_mapping prm ON ((prm.result_type_id = rr.result_type_id)))
     LEFT JOIN reading_parameter_types rpt ON ((rpt.id = prm.reading_parameter_type_id)))
     JOIN certificate_of_analysis_status st ON ((st.id = coa.status_id)))
     LEFT JOIN feed_types ft ON ((ft.id = r.feed_type_id)))
     LEFT JOIN flush_types flt ON ((flt.id = r.flush_type_id)))
  WHERE ((st.id = 'b7abbefb-99a1-40ec-83de-efb9f90acbb0'::uuid) AND ((coa.reading_parameter_type_ids IS NULL) OR (prm.reading_parameter_type_id IS NULL) OR (prm.reading_parameter_type_id = ANY (coa.reading_parameter_type_ids))));