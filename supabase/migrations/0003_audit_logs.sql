create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  action text not null,
  entity_type text,
  entity_id uuid,
  metadata jsonb default '{}',
  created_at timestamptz default now()
);
alter table public.audit_logs enable row level security;
create policy "admins_read_audit" on public.audit_logs for select
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'administrador'));
create policy "system_insert_audit" on public.audit_logs for insert with check (true);
