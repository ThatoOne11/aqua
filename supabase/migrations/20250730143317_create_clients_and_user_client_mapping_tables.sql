create table "public"."clients" (
    "id" uuid not null default gen_random_uuid(),
    "display_name" text not null,
    "lastActivity" timestamp with time zone not null default (now() AT TIME ZONE 'utc'::text),
    "archived" boolean not null default false,
    "created_at" timestamp with time zone not null default (now() AT TIME ZONE 'utc'::text),
    "created_by" uuid not null,
    "lastModified" timestamp with time zone,
    "editedBy" uuid
);


alter table "public"."clients" enable row level security;

create table "public"."userClientMapping" (
    "userId" uuid not null,
    "clientId" uuid not null
);


alter table "public"."userClientMapping" enable row level security;

CREATE UNIQUE INDEX clients_pkey ON public.clients USING btree (id);

CREATE UNIQUE INDEX "userClientMapping_pkey" ON public."userClientMapping" USING btree ("userId", "clientId");

alter table "public"."clients" add constraint "clients_pkey" PRIMARY KEY using index "clients_pkey";

alter table "public"."userClientMapping" add constraint "userClientMapping_pkey" PRIMARY KEY using index "userClientMapping_pkey";

alter table "public"."clients" add constraint "clients_created_by_fkey" FOREIGN KEY (created_by) REFERENCES users(id) not valid;

alter table "public"."clients" validate constraint "clients_created_by_fkey";

alter table "public"."clients" add constraint "clients_editedBy_fkey" FOREIGN KEY ("editedBy") REFERENCES users(id) not valid;

alter table "public"."clients" validate constraint "clients_editedBy_fkey";

alter table "public"."userClientMapping" add constraint "userClientMapping_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES clients(id) not valid;

alter table "public"."userClientMapping" validate constraint "userClientMapping_clientId_fkey";

alter table "public"."userClientMapping" add constraint "userClientMapping_clientId_fkey1" FOREIGN KEY ("clientId") REFERENCES clients(id) not valid;

alter table "public"."userClientMapping" validate constraint "userClientMapping_clientId_fkey1";

alter table "public"."userClientMapping" add constraint "userClientMapping_userId_fkey" FOREIGN KEY ("userId") REFERENCES users(id) not valid;

alter table "public"."userClientMapping" validate constraint "userClientMapping_userId_fkey";

alter table "public"."userClientMapping" add constraint "userClientMapping_userId_fkey1" FOREIGN KEY ("userId") REFERENCES users(id) not valid;

alter table "public"."userClientMapping" validate constraint "userClientMapping_userId_fkey1";

grant delete on table "public"."clients" to "anon";

grant insert on table "public"."clients" to "anon";

grant references on table "public"."clients" to "anon";

grant select on table "public"."clients" to "anon";

grant trigger on table "public"."clients" to "anon";

grant truncate on table "public"."clients" to "anon";

grant update on table "public"."clients" to "anon";

grant delete on table "public"."clients" to "authenticated";

grant insert on table "public"."clients" to "authenticated";

grant references on table "public"."clients" to "authenticated";

grant select on table "public"."clients" to "authenticated";

grant trigger on table "public"."clients" to "authenticated";

grant truncate on table "public"."clients" to "authenticated";

grant update on table "public"."clients" to "authenticated";

grant delete on table "public"."clients" to "service_role";

grant insert on table "public"."clients" to "service_role";

grant references on table "public"."clients" to "service_role";

grant select on table "public"."clients" to "service_role";

grant trigger on table "public"."clients" to "service_role";

grant truncate on table "public"."clients" to "service_role";

grant update on table "public"."clients" to "service_role";

grant delete on table "public"."userClientMapping" to "anon";

grant insert on table "public"."userClientMapping" to "anon";

grant references on table "public"."userClientMapping" to "anon";

grant select on table "public"."userClientMapping" to "anon";

grant trigger on table "public"."userClientMapping" to "anon";

grant truncate on table "public"."userClientMapping" to "anon";

grant update on table "public"."userClientMapping" to "anon";

grant delete on table "public"."userClientMapping" to "authenticated";

grant insert on table "public"."userClientMapping" to "authenticated";

grant references on table "public"."userClientMapping" to "authenticated";

grant select on table "public"."userClientMapping" to "authenticated";

grant trigger on table "public"."userClientMapping" to "authenticated";

grant truncate on table "public"."userClientMapping" to "authenticated";

grant update on table "public"."userClientMapping" to "authenticated";

grant delete on table "public"."userClientMapping" to "service_role";

grant insert on table "public"."userClientMapping" to "service_role";

grant references on table "public"."userClientMapping" to "service_role";

grant select on table "public"."userClientMapping" to "service_role";

grant trigger on table "public"."userClientMapping" to "service_role";

grant truncate on table "public"."userClientMapping" to "service_role";

grant update on table "public"."userClientMapping" to "service_role";

create policy "Enable insert for authenticated users only"
on "public"."clients"
as permissive
for insert
to authenticated
with check (true);


create policy "Enable read access for all users"
on "public"."clients"
as permissive
for select
to public
using (true);


create policy "Enable insert for authenticated users only"
on "public"."userClientMapping"
as permissive
for insert
to authenticated
with check (true);


create policy "Enable read access for all users"
on "public"."userClientMapping"
as permissive
for select
to public
using (true);



