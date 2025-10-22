revoke delete on table "public"."user_role" from "anon";

revoke insert on table "public"."user_role" from "anon";

revoke references on table "public"."user_role" from "anon";

revoke select on table "public"."user_role" from "anon";

revoke trigger on table "public"."user_role" from "anon";

revoke truncate on table "public"."user_role" from "anon";

revoke update on table "public"."user_role" from "anon";

revoke delete on table "public"."user_role" from "authenticated";

revoke insert on table "public"."user_role" from "authenticated";

revoke references on table "public"."user_role" from "authenticated";

revoke select on table "public"."user_role" from "authenticated";

revoke trigger on table "public"."user_role" from "authenticated";

revoke truncate on table "public"."user_role" from "authenticated";

revoke update on table "public"."user_role" from "authenticated";

revoke delete on table "public"."user_role" from "service_role";

revoke insert on table "public"."user_role" from "service_role";

revoke references on table "public"."user_role" from "service_role";

revoke select on table "public"."user_role" from "service_role";

revoke trigger on table "public"."user_role" from "service_role";

revoke truncate on table "public"."user_role" from "service_role";

revoke update on table "public"."user_role" from "service_role";

drop table "public"."user_role";

alter table "public"."roles" enable row level security;

alter table "public"."users" enable row level security;

create policy "Enable read access for all users"
on "public"."roles"
as permissive
for select
to public
using (true);


create policy "Enable insert for authenticated users only"
on "public"."users"
as permissive
for insert
to authenticated
with check (true);


create policy "Enable read access for all users"
on "public"."users"
as permissive
for select
to public
using (true);

-- Grant access to function to supabase_auth_admin
grant execute on function public.custom_access_token_hook to supabase_auth_admin;

-- Grant access to schema to supabase_auth_admin
grant usage on schema public to supabase_auth_admin;

-- Revoke function permissions from authenticated, anon and public
revoke execute on function public.custom_access_token_hook from authenticated, anon, public;



