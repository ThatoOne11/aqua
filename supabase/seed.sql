insert into public.roles
  (id, name)
values
  ('1c404b13-1705-485a-99c7-68c6f5b69a03', 'super-admin'),
  ('fed22552-1609-4e3d-a3ac-09a50eb1ac54', 'admin'),
  ('686c928b-034c-4858-862c-9ccb32226c2f', 'client');


grant usage on schema public to supabase_auth_admin;

grant execute
  on function public.custom_access_token_hook
  to supabase_auth_admin;

revoke execute
  on function public.custom_access_token_hook
  from authenticated, anon, public;

grant all
  on table public.roles
to supabase_auth_admin;

grant all
  on table public.users
to supabase_auth_admin;


-- =========================
-- CERTIFICATE OF ANALYSIS STATUS
-- =========================
insert into public.certificate_of_analysis_status (id, display_name) values
  ('b354c5de-c40b-4c4a-a0ac-ff3009466545', 'Pending'),
  ('b7abbefb-99a1-40ec-83de-efb9f90acbb0', 'Completed'),
  ('3e5e5489-0c37-4d90-b622-ecd7dd147ebd', 'Reviewed')
on conflict (id) do update
  set display_name = excluded.display_name;

-- =========================
-- FEED TYPES
-- =========================
insert into public.feed_types (id, field_name, display_name, active) values
  ('f1dff132-3967-40d4-b344-63bc2c72cf9a', 'cold',  'Cold',  true),
  ('7dc9ef47-321f-44c6-b31c-fe4e154e9150', 'hot',   'Hot',   true),
  ('9947c49e-bcb2-4724-88b0-f93f259c2b95', 'mixed', 'Mixed', true)
on conflict (id) do update
  set field_name  = excluded.field_name,
      display_name = excluded.display_name,
      active       = excluded.active;

-- =========================
-- FLUSH TYPES
-- =========================
insert into public.flush_types (id, field_name, display_name, active) values
  ('5ae561c5-f627-4a82-83f9-3da8b37b0304', 'pre',    'Pre',    true),
  ('5a80af04-860f-4890-b472-f69ba51b2568', 'post',   'Post',   true),
  ('365d13de-4091-40d2-8bbc-64b17a26f9ea', 'stored', 'Stored', true)
on conflict (id) do update
  set field_name  = excluded.field_name,
      display_name = excluded.display_name,
      active       = excluded.active;

-- =========================
-- READING PARAMETER TYPES (exact names)
-- =========================
insert into public.reading_parameter_types (id, field_name, display_name, active) values
  ('30ef62c3-ddf7-4209-bed9-0e1b4bbe0732', 'TVC E Coli and Coliform', 'TVC E Coli and Coliform', true),
  ('6ecbebda-b0aa-46cb-adf8-b4ff30a5233f', 'Legionella',              'Legionella',              true),
  ('be20bd52-63c3-4dff-b400-4ea411c28000', 'Pseudomonas Aeruginosa',  'Pseudomonas Aeruginosa',  true),
  ('4fb1c476-951d-4402-b9af-5b16c3067dcd', 'Lead',                    'Lead',                    true),
  ('fd450bb8-a7d3-427a-acd5-b2b6d8f7cd78', 'Enterococci',             'Enterococci',             true),
  ('8c1c649b-1e63-4523-9baa-7e8c545c0149', 'Silver',                  'Silver',                  true),
  ('828ce547-ad2c-4021-8415-7063157ef330', 'Copper',                  'Copper',                  true)
on conflict (id) do update
  set field_name   = excluded.field_name,
      display_name = excluded.display_name,
      active       = excluded.active;

-- =========================
-- RESULT TYPES (exact CSV headers)
-- =========================
insert into public.result_types (id, display_name, field_name, unit_of_measurement, active) values
  ('fcbb4a30-ecfd-441a-9ab3-5162ccc6032b', 'TVC37',           'TVC37Result',         'CFU/L', true),
  ('2c270538-f068-4e5f-bdfb-f8eeec447fdf', 'TVC22',           'TVC22Result',         'CFU/L', true),
  ('5be7576c-bedb-4072-ba7d-7e29e38a3321', 'E.Coli',          'EColiResult',         'CFU/L', true),
  ('a24da767-70d1-4405-af9d-fb0b4fe19599', 'Coliform',        'ColiformResult',      'CFU/L', true),
  ('bf140fcd-f251-4da9-af75-a47d652b8443', 'Legionella',      'LegionellaResult',    'CFU/L', true),
  ('bdd25926-4374-4f4d-b157-c9d72f23ac54', 'Pseudo Aeru',     'PseudoAeruResult',    'CFU/L', true),
  ('3f089773-44e8-48ac-a693-23457c8a1917', 'Pseudo Species',  'PseudoSpeciesResult', 'CFU/L', true),
  ('ccf5e30f-0253-42ef-a2bd-bbb79966dcb8', 'Lead',            'LeadResult',          'mg/L',  true),
  ('c51cf851-09fb-4219-959c-d50db504749c', 'Enterococci',     'EnterococciResult',   'CFU/L', true),
  ('9db36ca7-c5f5-4728-bafb-141d6ab71460', 'Silver',          'SilverResult',        'mg/L',  true),
  ('f7f8d7a6-d571-47ab-94c6-f97aa094d47e', 'Copper',          'CopperResult',        'mg/L',  true)
on conflict (id) do update
  set display_name        = excluded.display_name,
      field_name          = excluded.field_name,
      unit_of_measurement = excluded.unit_of_measurement,
      active              = excluded.active;

-- =========================
-- PARAMETER <-> RESULT MAPPINGS
-- (composite PK ensures uniqueness)
-- =========================
insert into public.parameter_result_mapping (reading_parameter_type_id, result_type_id) values
  -- TVC E Coli and Coliform
  ('30ef62c3-ddf7-4209-bed9-0e1b4bbe0732', '2c270538-f068-4e5f-bdfb-f8eeec447fdf'), -- TVC22
  ('30ef62c3-ddf7-4209-bed9-0e1b4bbe0732', '5be7576c-bedb-4072-ba7d-7e29e38a3321'), -- E.Coli
  ('30ef62c3-ddf7-4209-bed9-0e1b4bbe0732', 'a24da767-70d1-4405-af9d-fb0b4fe19599'), -- Coliform
  ('30ef62c3-ddf7-4209-bed9-0e1b4bbe0732', 'fcbb4a30-ecfd-441a-9ab3-5162ccc6032b'), -- TVC37

  -- Lead
  ('4fb1c476-951d-4402-b9af-5b16c3067dcd', 'ccf5e30f-0253-42ef-a2bd-bbb79966dcb8'), -- Lead

  -- Legionella
  ('6ecbebda-b0aa-46cb-adf8-b4ff30a5233f', 'bf140fcd-f251-4da9-af75-a47d652b8443'), -- Legionella

  -- Copper
  ('828ce547-ad2c-4021-8415-7063157ef330', 'f7f8d7a6-d571-47ab-94c6-f97aa094d47e'), -- Copper

  -- Silver
  ('8c1c649b-1e63-4523-9baa-7e8c545c0149', '9db36ca7-c5f5-4728-bafb-141d6ab71460'), -- Silver

  -- Pseudomonas Aeruginosa
  ('be20bd52-63c3-4dff-b400-4ea411c28000', '3f089773-44e8-48ac-a693-23457c8a1917'), -- Pseudo Species
  ('be20bd52-63c3-4dff-b400-4ea411c28000', 'bdd25926-4374-4f4d-b157-c9d72f23ac54'), -- Pseudo Aeru

  -- Enterococci
  ('fd450bb8-a7d3-427a-acd5-b2b6d8f7cd78', 'c51cf851-09fb-4219-959c-d50db504749c')  -- Enterococci
on conflict (reading_parameter_type_id, result_type_id) do nothing;
