-- Ensure pgTAP is available
create extension if not exists pgtap with schema extensions;

begin;

-- Make pgTAP helpers resolvable (plan/ok/finish/etc.)
set local search_path to extensions, public;

-- We don't know your public.users schema, so temporarily drop the FK
-- (safe: the whole test runs in a transaction and ends with ROLLBACK)
alter table public.clients drop constraint if exists clients_created_by_fkey;

-- Plan
select plan(7);

-- schema-qualified (works regardless of search_path)
select extensions.function_returns('public', 'coa_warnings_function', ARRAY['uuid'], 'jsonb');


-- ---------- FIXTURES ----------
-- Ensure a 'Completed' status exists (unique on display_name)
with got as (
  select id from public.certificate_of_analysis_status
  where display_name = 'Completed'
  limit 1
),
ins as (
  insert into public.certificate_of_analysis_status (display_name)
  select 'Completed'
  where not exists (select 1 from got)
  returning id
)
select 1;

-- Minimal client (display_name is NOT NULL; created_by required but FK dropped above)
insert into public.clients (id, display_name, created_by)
values (
  '00000000-0000-0000-0000-0000000000c9'::uuid,
  'Test Client',
  '00000000-0000-0000-0000-00000000aa01'::uuid
)
on conflict (id) do nothing;

-- Site for that client
insert into public.sites (id, name, client_id, created_at)
values (
  '00000000-0000-0000-0000-0000000000aa'::uuid,
  'Alpha Site',
  '00000000-0000-0000-0000-0000000000c9'::uuid,
  now()
)
on conflict (id) do nothing;

-- The "current" COA (the one we test)
insert into public.certificate_of_analysis (id, client_id, site_id, status_id, uploaded_at)
select
  '00000000-0000-0000-0000-0000000000c1'::uuid,
  '00000000-0000-0000-0000-0000000000c9'::uuid,
  '00000000-0000-0000-0000-0000000000aa'::uuid,
  (select id from public.certificate_of_analysis_status where display_name = 'Completed' limit 1),
  now()
on conflict (id) do nothing;

-- One baseline reading for the CURRENT COA
insert into public.readings (certificate_of_analysis_id, "time", floor, area, location, outlet)
values
('00000000-0000-0000-0000-0000000000c1'::uuid, now(), 'G', 'Reception', 'Sink', 'Tap 1');

-- ---------- 2) NEW-SITE BRANCH ----------
-- No other Completed COAs yet for this site
select results_eq(
  $$ select public.coa_warnings_function('00000000-0000-0000-0000-0000000000c1'::uuid) $$,
  $$
  values (
    jsonb_build_object(
      'coa_id',         '00000000-0000-0000-0000-0000000000c1',
      'site_id',        '00000000-0000-0000-0000-0000000000aa',
      'site_name',      'Alpha Site',
      'has_active_coa', false,
      'is_new_site',    true,
      'new_floors',     '[]'::jsonb,
      'new_areas',      '[]'::jsonb,
      'new_locations',  '[]'::jsonb,
      'new_outlets',    '[]'::jsonb
    )
  )
  $$,
  'new-site branch returns expected payload'
);

-- ---------- Seed an ACTIVE (Completed) COA for the same site ----------
insert into public.certificate_of_analysis (id, client_id, site_id, status_id, uploaded_at)
select
  '00000000-0000-0000-0000-0000000000a0'::uuid,   -- << valid hex UUID (replaces ...p0)
  '00000000-0000-0000-0000-0000000000c9'::uuid,
  '00000000-0000-0000-0000-0000000000aa'::uuid,
  (select id from public.certificate_of_analysis_status where display_name='Completed' limit 1),
  now()
on conflict (id) do nothing;

-- Existing readings for the ACTIVE (old) COA
insert into public.readings (certificate_of_analysis_id, "time", floor, area, location, outlet)
values
('00000000-0000-0000-0000-0000000000a0'::uuid, now(), 'G', 'Reception', 'Sink', 'Tap 1');

-- Add "new" items on the CURRENT COA
insert into public.readings (certificate_of_analysis_id, "time", floor, area, location, outlet)
values
('00000000-0000-0000-0000-0000000000c1'::uuid, now(), '1', 'Reception', 'Sink', 'Tap 1'),          -- new floor
('00000000-0000-0000-0000-0000000000c1'::uuid, now(), 'G', 'Kitchen',  'Sink', 'Tap 1'),           -- new area
('00000000-0000-0000-0000-0000000000c1'::uuid, now(), 'G', 'Reception','Boiler Room', 'Outlet A'), -- new location
('00000000-0000-0000-0000-0000000000c1'::uuid, now(), 'G', 'Reception','Sink', 'Tap 2');           -- new outlet

-- ---------- 3) HAS-ACTIVE BRANCH ----------
select results_eq(
  $$ select public.coa_warnings_function('00000000-0000-0000-0000-0000000000c1'::uuid) $$,
  $$
  values (
    jsonb_build_object(
      'coa_id',         '00000000-0000-0000-0000-0000000000c1',
      'site_id',        '00000000-0000-0000-0000-0000000000aa',
      'site_name',      'Alpha Site',
      'has_active_coa', true,
      'is_new_site',    false,
      'new_floors',     to_jsonb(ARRAY['1']),
      'new_areas',      jsonb_build_array(jsonb_build_object('floor','G','area','Kitchen')),
      'new_locations',  jsonb_build_array(jsonb_build_object('floor','G','area','Reception','location','Boiler Room')),
      'new_outlets',    jsonb_build_array(jsonb_build_object('floor','G','area','Reception','location','Sink','outlet','Tap 2'))
    )
  )
  $$,
  'has-active branch returns expected payload'
);

-- 4–7) Sanity checks
select cmp_ok(
  (select jsonb_array_length(public.coa_warnings_function('00000000-0000-0000-0000-0000000000c1'::uuid)->'new_floors')),
  '=', 1,
  'one new floor'
);
select cmp_ok(
  (select jsonb_array_length(public.coa_warnings_function('00000000-0000-0000-0000-0000000000c1'::uuid)->'new_areas')),
  '=', 1,
  'one new area'
);
select cmp_ok(
  (select jsonb_array_length(public.coa_warnings_function('00000000-0000-0000-0000-0000000000c1'::uuid)->'new_locations')),
  '=', 1,
  'one new location'
);
select cmp_ok(
  (select jsonb_array_length(public.coa_warnings_function('00000000-0000-0000-0000-0000000000c1'::uuid)->'new_outlets')),
  '=', 1,
  'one new outlet'
);

-- Wrap up (rollback also restores the dropped FK)
select * from finish();
rollback;
