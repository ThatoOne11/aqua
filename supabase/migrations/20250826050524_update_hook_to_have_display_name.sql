create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  claims jsonb := coalesce(event->'claims', '{}'::jsonb);
  v_role text;
  v_display_name text;
begin
  select r.name, u.display_name
    into v_role, v_display_name
  from public.users u
  left join public.roles r on r.id = u.role_id
  where u.id = (event->>'user_id')::uuid;

  claims := jsonb_set(claims, '{user_role}',    coalesce(to_jsonb(v_role), 'null'::jsonb), true);
  claims := jsonb_set(claims, '{display_name}', coalesce(to_jsonb(v_display_name), 'null'::jsonb), true);

  return jsonb_set(event, '{claims}', claims, true);
end;
$$;