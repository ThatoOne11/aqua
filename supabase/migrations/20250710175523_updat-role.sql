alter table "public"."users" drop constraint "users_role_id_fkey";

alter table "public"."roles" drop constraint "roles_pkey";

drop index if exists "public"."roles_pkey";

alter table "public"."roles" drop column "user_id";

alter table "public"."roles" add column "id" uuid not null default gen_random_uuid();

CREATE UNIQUE INDEX roles_pkey ON public.roles USING btree (id);

alter table "public"."roles" add constraint "roles_pkey" PRIMARY KEY using index "roles_pkey";

alter table "public"."users" add constraint "users_role_id_fkey" FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE SET NULL not valid;

alter table "public"."users" validate constraint "users_role_id_fkey";