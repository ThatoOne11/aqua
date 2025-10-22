-- Create the public.roles table
create table if not exists public.roles (
  user_id uuid primary key,
  name text not null
);

-- Create the users table
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  email text not null,
  created_at timestamp with time zone default now(),
  created_by uuid references public.users(id) on delete set null,
  role_id uuid references public.roles(user_id) on delete set null
);

-- Create the auth hook function
create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb
language plpgsql
stable
as $$
  declare
    claims jsonb;
    user_role varchar;
  begin
    -- Fetch the user role in the roles table
    select name into user_role from public.roles where user_id = (event->>'user_id')::uuid;

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
  end;
$$;

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
