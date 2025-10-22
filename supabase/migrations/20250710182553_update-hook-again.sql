create table "public"."user_role" (
    "name" text
);


set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
AS $function$declare
    claims jsonb;
    user_role varchar;
  begin
    -- Fetch the user role in the roles table
    select r.name
    into user_role
    from public.users u
    join public.roles r on u.role_id = r.id
    where u.id = (event->>'user_id')::uuid;

    claims := event->'claims';

    if user_role is not null then
      -- Set the claim
      claims := jsonb_set(claims, '{user_role}', to_jsonb(user_role));
    else
      claims := jsonb_set(claims, '{user_role}', 'null');
    end if;

    -- Update the 'claims' object in the original event
    event := jsonb_set(event, '{claims}', claims);

    -- Return the modified or original event
    return event;
  end;$function$
;

grant delete on table "public"."user_role" to "anon";

grant insert on table "public"."user_role" to "anon";

grant references on table "public"."user_role" to "anon";

grant select on table "public"."user_role" to "anon";

grant trigger on table "public"."user_role" to "anon";

grant truncate on table "public"."user_role" to "anon";

grant update on table "public"."user_role" to "anon";

grant delete on table "public"."user_role" to "authenticated";

grant insert on table "public"."user_role" to "authenticated";

grant references on table "public"."user_role" to "authenticated";

grant select on table "public"."user_role" to "authenticated";

grant trigger on table "public"."user_role" to "authenticated";

grant truncate on table "public"."user_role" to "authenticated";

grant update on table "public"."user_role" to "authenticated";

grant delete on table "public"."user_role" to "service_role";

grant insert on table "public"."user_role" to "service_role";

grant references on table "public"."user_role" to "service_role";

grant select on table "public"."user_role" to "service_role";

grant trigger on table "public"."user_role" to "service_role";

grant truncate on table "public"."user_role" to "service_role";

grant update on table "public"."user_role" to "service_role";


