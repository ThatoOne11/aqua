drop policy "Enable insert for authenticated users only" on "public"."userClientMapping";

drop policy "Enable read access for all users" on "public"."userClientMapping";

revoke delete on table "public"."userClientMapping" from "anon";

revoke insert on table "public"."userClientMapping" from "anon";

revoke references on table "public"."userClientMapping" from "anon";

revoke select on table "public"."userClientMapping" from "anon";

revoke trigger on table "public"."userClientMapping" from "anon";

revoke truncate on table "public"."userClientMapping" from "anon";

revoke update on table "public"."userClientMapping" from "anon";

revoke delete on table "public"."userClientMapping" from "authenticated";

revoke insert on table "public"."userClientMapping" from "authenticated";

revoke references on table "public"."userClientMapping" from "authenticated";

revoke select on table "public"."userClientMapping" from "authenticated";

revoke trigger on table "public"."userClientMapping" from "authenticated";

revoke truncate on table "public"."userClientMapping" from "authenticated";

revoke update on table "public"."userClientMapping" from "authenticated";

revoke delete on table "public"."userClientMapping" from "service_role";

revoke insert on table "public"."userClientMapping" from "service_role";

revoke references on table "public"."userClientMapping" from "service_role";

revoke select on table "public"."userClientMapping" from "service_role";

revoke trigger on table "public"."userClientMapping" from "service_role";

revoke truncate on table "public"."userClientMapping" from "service_role";

revoke update on table "public"."userClientMapping" from "service_role";

alter table "public"."userClientMapping" drop constraint "userClientMapping_clientId_fkey";

alter table "public"."userClientMapping" drop constraint "userClientMapping_clientId_fkey1";

alter table "public"."userClientMapping" drop constraint "userClientMapping_userId_fkey";

alter table "public"."userClientMapping" drop constraint "userClientMapping_userId_fkey1";

alter table "public"."userClientMapping" drop constraint "userClientMapping_pkey";

drop index if exists "public"."userClientMapping_pkey";

drop table "public"."userClientMapping";


  create table "public"."alert_definitions" (
    "id" uuid not null default gen_random_uuid(),
    "client_id" uuid not null,
    "created_by" uuid not null,
    "created_at" timestamp with time zone not null default (now() AT TIME ZONE 'utc'::text),
    "condition" text not null,
    "result_type_id" uuid not null,
    "value" numeric not null,
    "active" boolean not null default true
      );


alter table "public"."alert_definitions" enable row level security;


  create table "public"."result_types" (
    "id" uuid not null default gen_random_uuid(),
    "display_name" text not null,
    "field_name" text not null,
    "unit_of_measurement" text not null,
    "active" boolean not null default true
      );


alter table "public"."result_types" enable row level security;


  create table "public"."user_client_mapping" (
    "user_id" uuid not null,
    "client_id" uuid not null,
    "active" boolean not null default true
      );


alter table "public"."user_client_mapping" enable row level security;

CREATE UNIQUE INDEX alert_definitions_pkey ON public.alert_definitions USING btree (id);

CREATE UNIQUE INDEX result_types_pkey ON public.result_types USING btree (id);

CREATE UNIQUE INDEX user_client_mapping_pkey ON public.user_client_mapping USING btree (user_id, client_id);

alter table "public"."alert_definitions" add constraint "alert_definitions_pkey" PRIMARY KEY using index "alert_definitions_pkey";

alter table "public"."result_types" add constraint "result_types_pkey" PRIMARY KEY using index "result_types_pkey";

alter table "public"."user_client_mapping" add constraint "user_client_mapping_pkey" PRIMARY KEY using index "user_client_mapping_pkey";

alter table "public"."alert_definitions" add constraint "alert_definitions_client_id_fkey" FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE not valid;

alter table "public"."alert_definitions" validate constraint "alert_definitions_client_id_fkey";

alter table "public"."alert_definitions" add constraint "alert_definitions_created_by_fkey" FOREIGN KEY (created_by) REFERENCES users(id) not valid;

alter table "public"."alert_definitions" validate constraint "alert_definitions_created_by_fkey";

alter table "public"."alert_definitions" add constraint "alert_definitions_result_type_id_fkey" FOREIGN KEY (result_type_id) REFERENCES result_types(id) ON DELETE CASCADE not valid;

alter table "public"."alert_definitions" validate constraint "alert_definitions_result_type_id_fkey";

alter table "public"."user_client_mapping" add constraint "userClientMapping_client_id_fkey" FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE not valid;

alter table "public"."user_client_mapping" validate constraint "userClientMapping_client_id_fkey";

alter table "public"."user_client_mapping" add constraint "userClientMapping_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE not valid;

alter table "public"."user_client_mapping" validate constraint "userClientMapping_user_id_fkey";

grant delete on table "public"."alert_definitions" to "anon";

grant insert on table "public"."alert_definitions" to "anon";

grant references on table "public"."alert_definitions" to "anon";

grant select on table "public"."alert_definitions" to "anon";

grant trigger on table "public"."alert_definitions" to "anon";

grant truncate on table "public"."alert_definitions" to "anon";

grant update on table "public"."alert_definitions" to "anon";

grant delete on table "public"."alert_definitions" to "authenticated";

grant insert on table "public"."alert_definitions" to "authenticated";

grant references on table "public"."alert_definitions" to "authenticated";

grant select on table "public"."alert_definitions" to "authenticated";

grant trigger on table "public"."alert_definitions" to "authenticated";

grant truncate on table "public"."alert_definitions" to "authenticated";

grant update on table "public"."alert_definitions" to "authenticated";

grant delete on table "public"."alert_definitions" to "service_role";

grant insert on table "public"."alert_definitions" to "service_role";

grant references on table "public"."alert_definitions" to "service_role";

grant select on table "public"."alert_definitions" to "service_role";

grant trigger on table "public"."alert_definitions" to "service_role";

grant truncate on table "public"."alert_definitions" to "service_role";

grant update on table "public"."alert_definitions" to "service_role";

grant delete on table "public"."result_types" to "anon";

grant insert on table "public"."result_types" to "anon";

grant references on table "public"."result_types" to "anon";

grant select on table "public"."result_types" to "anon";

grant trigger on table "public"."result_types" to "anon";

grant truncate on table "public"."result_types" to "anon";

grant update on table "public"."result_types" to "anon";

grant delete on table "public"."result_types" to "authenticated";

grant insert on table "public"."result_types" to "authenticated";

grant references on table "public"."result_types" to "authenticated";

grant select on table "public"."result_types" to "authenticated";

grant trigger on table "public"."result_types" to "authenticated";

grant truncate on table "public"."result_types" to "authenticated";

grant update on table "public"."result_types" to "authenticated";

grant delete on table "public"."result_types" to "service_role";

grant insert on table "public"."result_types" to "service_role";

grant references on table "public"."result_types" to "service_role";

grant select on table "public"."result_types" to "service_role";

grant trigger on table "public"."result_types" to "service_role";

grant truncate on table "public"."result_types" to "service_role";

grant update on table "public"."result_types" to "service_role";

grant delete on table "public"."user_client_mapping" to "anon";

grant insert on table "public"."user_client_mapping" to "anon";

grant references on table "public"."user_client_mapping" to "anon";

grant select on table "public"."user_client_mapping" to "anon";

grant trigger on table "public"."user_client_mapping" to "anon";

grant truncate on table "public"."user_client_mapping" to "anon";

grant update on table "public"."user_client_mapping" to "anon";

grant delete on table "public"."user_client_mapping" to "authenticated";

grant insert on table "public"."user_client_mapping" to "authenticated";

grant references on table "public"."user_client_mapping" to "authenticated";

grant select on table "public"."user_client_mapping" to "authenticated";

grant trigger on table "public"."user_client_mapping" to "authenticated";

grant truncate on table "public"."user_client_mapping" to "authenticated";

grant update on table "public"."user_client_mapping" to "authenticated";

grant delete on table "public"."user_client_mapping" to "service_role";

grant insert on table "public"."user_client_mapping" to "service_role";

grant references on table "public"."user_client_mapping" to "service_role";

grant select on table "public"."user_client_mapping" to "service_role";

grant trigger on table "public"."user_client_mapping" to "service_role";

grant truncate on table "public"."user_client_mapping" to "service_role";

grant update on table "public"."user_client_mapping" to "service_role";


  create policy "Enable insert for authenticated users only"
  on "public"."user_client_mapping"
  as permissive
  for insert
  to authenticated
with check (true);



  create policy "Enable read access for all users"
  on "public"."user_client_mapping"
  as permissive
  for select
  to public
using (true);



