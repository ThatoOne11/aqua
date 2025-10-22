--Alert_Definitions
create policy "Enable insert for admin and superadmin users"
on "public"."alert_definitions"
to authenticated
with check (
  ((auth.jwt() ->> 'user_role'::text) = ANY (ARRAY['admin'::text, 'superadmin'::text]))
);

create policy "Enable read access for all authenticated users"
on "public"."alert_definitions"
to authenticated
using (
  true
);

create policy "Enable update for admin and superadmin users"
on "public"."alert_definitions"
to authenticated
using (
  ((auth.jwt() ->> 'user_role'::text) = ANY (ARRAY['admin'::text, 'superadmin'::text]))
);

--Clients
create policy "Enable insert for admin and superadmin users"
on "public"."clients"
to authenticated
with check (
  ((auth.jwt() ->> 'user_role'::text) = ANY (ARRAY['admin'::text, 'superadmin'::text]))
);

create policy "Enable read access for all authenticated users"
on "public"."clients"
to authenticated
using (
  true
);

create policy "Enable update for admin and superadmin users"
on "public"."clients"
to authenticated
using (
  ((auth.jwt() ->> 'user_role'::text) = ANY (ARRAY['admin'::text, 'superadmin'::text]))
);

drop policy if exists "Enable insert for authenticated users only"
on public.clients;

drop policy if exists "Enable read access for all users"
on public.clients;

--Result_types
create policy "Enable read access for authenticated users"
on "public"."result_types"
to authenticated
using (
  true
);

--user_client_mapping
create policy "Enable insert for admin and superadmin users"
on "public"."user_client_mapping"
to authenticated
with check (
  ((auth.jwt() ->> 'user_role'::text) = ANY (ARRAY['admin'::text, 'superadmin'::text]))
);

create policy "Enable read access for all authenticated users"
on "public"."user_client_mapping"
to authenticated
using (
  true
);

create policy "Enable update for admin and superadmin users"
on "public"."user_client_mapping"
to authenticated
using (
  ((auth.jwt() ->> 'user_role'::text) = ANY (ARRAY['admin'::text, 'superadmin'::text]))
);

drop policy if exists "Enable insert for authenticated users only"
on public.user_client_mapping;

drop policy if exists "Enable read access for all users"
on public.user_client_mapping;

--users
create policy "Enable insert for admin and superadmin users"
on "public"."users"
to authenticated
with check (
  ((auth.jwt() ->> 'user_role'::text) = ANY (ARRAY['admin'::text, 'superadmin'::text]))
);

create policy "Enable update for admin and superadmin users"
on "public"."users"
to authenticated
using (
  ((auth.jwt() ->> 'user_role'::text) = ANY (ARRAY['admin'::text, 'superadmin'::text]))
);

drop policy if exists "Enable insert for authenticated users only"
on public.users;

