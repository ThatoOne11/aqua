create table if not exists public.user_pinned_clients (
  user_id uuid not null,
  client_id uuid not null,
  constraint user_pinned_clients_pkey primary key (user_id, client_id),
  constraint user_pinned_clients_client_id_fkey foreign KEY (client_id) references clients (id) on delete CASCADE,
  constraint user_pinned_clients_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE
) TABLESPACE pg_default;


create or replace view public.clients_view as
select
  id,
  display_name,
  "lastActivity",
  archived,
  created_at,
  created_by,
  "lastModified",
  "editedBy",
  (
    exists (
      select
        1
      from
        user_pinned_clients upc
      where
        upc.client_id = c.id
        and upc.user_id = auth.uid ()
    )
  ) as is_pinned
from
  clients c;

  