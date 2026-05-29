-- Politicas RLS: usuario ve solo lo suyo; admin ve todo.

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin' and is_active = true
  );
$$;

-- profiles
alter table public.profiles enable row level security;
drop policy if exists "profile_self_read" on public.profiles;
drop policy if exists "profile_admin_all" on public.profiles;
create policy "profile_self_read" on public.profiles
  for select using (auth.uid() = id or public.is_admin());
create policy "profile_admin_all" on public.profiles
  for all using (public.is_admin()) with check (public.is_admin());

-- reports
alter table public.reports enable row level security;
drop policy if exists "reports_owner" on public.reports;
drop policy if exists "reports_admin" on public.reports;
create policy "reports_owner" on public.reports
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "reports_admin" on public.reports
  for all using (public.is_admin()) with check (public.is_admin());

-- ai_responses
alter table public.ai_responses enable row level security;
drop policy if exists "air_owner" on public.ai_responses;
drop policy if exists "air_admin" on public.ai_responses;
create policy "air_owner" on public.ai_responses
  for all using (
    exists (select 1 from public.reports r where r.id = ai_responses.report_id and r.user_id = auth.uid())
  ) with check (true);
create policy "air_admin" on public.ai_responses
  for all using (public.is_admin()) with check (public.is_admin());
