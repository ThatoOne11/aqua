-- ===== view: allow reads (RLS enforced on base tables) =====
grant select on public.v_finalized_readings_norm to authenticated;

-- ===== reading_alert: open RLS for authenticated =====
alter table public.reading_alert enable row level security;


-- Allow SELECT to all authenticated users
create policy reading_alert_sel_all
on public.reading_alert
for select
to authenticated
using (true);

-- Allow INSERT to all authenticated users
create policy reading_alert_ins_all
on public.reading_alert
for insert
to authenticated
with check (true);

-- Allow UPDATE to all authenticated users
create policy reading_alert_upd_all
on public.reading_alert
for update
to authenticated
using (true)
with check (true);

-- Allow DELETE to all authenticated users
create policy reading_alert_del_all
on public.reading_alert
for delete
to authenticated
using (true);

-- Table-level grants (RLS still applies, but we open it anyway)
grant select, insert, update, delete on public.reading_alert to authenticated;
