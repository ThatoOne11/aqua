create table if not exists public.user_site_mapping (
  user_id uuid not null,
  site_id uuid not null,
  constraint user_site_mapping_pkey primary key (user_id, site_id),
  constraint user_site_mapping_user_id_fkey foreign KEY (user_id) references users (id) on update CASCADE,
  constraint user_site_mapping_site_id_fkey foreign KEY (site_id) references sites (id) on update CASCADE
) TABLESPACE pg_default;

alter table "public"."user_site_mapping" enable row level security;

create policy "Enable deletion for admin and superadmin users"
on "public"."user_site_mapping"
for DELETE
to public
using (
	((auth.jwt() ->> 'user_role'::text) = ANY (ARRAY['admin'::text, 'superadmin'::text]))
);

create policy "Enable insert for admin and superadmin users"
on "public"."user_site_mapping"
for INSERT
to public
with check (
	((auth.jwt() ->> 'user_role'::text) = ANY (ARRAY['admin'::text, 'superadmin'::text]))
);

create policy "Enable read access for all authenticated users"
on "public"."user_site_mapping"
for SELECT
to authenticated
using (
  true
);