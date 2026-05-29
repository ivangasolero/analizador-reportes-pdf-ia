-- TSF Control Center: esquema inicial
-- Aplicar en SQL Editor de Supabase (proyecto nuevo, base publica).

create extension if not exists pgcrypto;

-- Departamentos
create table if not exists public.departments (
  id          uuid primary key default gen_random_uuid(),
  slug        text unique not null,
  name        text not null,
  created_at  timestamptz not null default now()
);

insert into public.departments (slug, name) values
  ('admin',                 'Administrador'),
  ('direccion_operativa',   'Direccion Operativa'),
  ('marketing',             'Marketing'),
  ('administracion',        'Administracion'),
  ('soporte_herramientas',  'Soporte de Herramientas')
on conflict (slug) do nothing;

-- Perfiles
do $$ begin
  create type public.user_status as enum ('active','suspended','invited');
exception when duplicate_object then null; end $$;

create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  email         text unique not null,
  full_name     text,
  role          text not null default 'direccion_operativa',
  department_id uuid references public.departments(id),
  status        public.user_status not null default 'invited',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin' and p.status = 'active'
  );
$$;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_dept uuid;
  v_role text;
begin
  if new.email = 'ivangasolero@gmail.com' then
    select id into v_dept from public.departments where slug = 'admin';
    v_role := 'admin';
  else
    v_role := 'direccion_operativa';
  end if;
  insert into public.profiles (id, email, role, department_id, status)
  values (new.id, new.email, v_role, v_dept, 'active')
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Reportes
do $$ begin
  create type public.report_status as enum ('uploaded','processing','analyzed','failed');
exception when duplicate_object then null; end $$;

create table if not exists public.reports (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  department_id uuid not null references public.departments(id),
  title         text not null,
  file_path     text not null,
  original_name text,
  size_bytes    bigint,
  status        public.report_status not null default 'uploaded',
  period_month  date,
  created_at    timestamptz not null default now()
);
create index if not exists reports_dept_idx   on public.reports (department_id, created_at desc);
create index if not exists reports_user_idx   on public.reports (user_id, created_at desc);
create index if not exists reports_period_idx on public.reports (period_month);

-- Respuestas IA
create table if not exists public.ai_responses (
  id              uuid primary key default gen_random_uuid(),
  report_id       uuid not null unique references public.reports(id) on delete cascade,
  model           text not null default 'gemini-1.5-pro',
  summary         text,
  insights        jsonb,
  recommendations jsonb,
  actions         jsonb,
  priorities      jsonb,
  severity        text check (severity in ('low','medium','high','critical')),
  raw             jsonb,
  created_at      timestamptz not null default now()
);

-- Alertas
create table if not exists public.alerts (
  id            uuid primary key default gen_random_uuid(),
  report_id     uuid references public.reports(id) on delete cascade,
  department_id uuid references public.departments(id),
  type          text not null,
  severity      text not null check (severity in ('low','medium','high','critical')),
  message       text not null,
  resolved      boolean not null default false,
  created_at    timestamptz not null default now()
);
create index if not exists alerts_open_idx on public.alerts (resolved, severity, created_at desc);

-- Auditoria
create table if not exists public.audit_log (
  id          bigserial primary key,
  actor_id    uuid,
  action      text not null,
  target      text,
  metadata    jsonb,
  created_at  timestamptz not null default now()
);

-- KPIs mensuales
create or replace view public.monthly_kpis as
select
  d.id   as department_id,
  d.name as department_name,
  date_trunc('month', r.created_at)::date as month,
  count(r.id) as reports_count,
  count(ar.id) filter (where ar.severity in ('high','critical')) as high_severity_count,
  count(a.id)  filter (where not a.resolved) as open_alerts
from public.departments d
left join public.reports r       on r.department_id = d.id
left join public.ai_responses ar on ar.report_id = r.id
left join public.alerts a        on a.department_id = d.id
group by d.id, d.name, date_trunc('month', r.created_at);

-- RLS
alter table public.profiles      enable row level security;
alter table public.reports       enable row level security;
alter table public.ai_responses  enable row level security;
alter table public.alerts        enable row level security;
alter table public.audit_log     enable row level security;
alter table public.departments   enable row level security;

create policy dept_read   on public.departments for select to authenticated using (true);
create policy dept_write  on public.departments for all    to authenticated using (public.is_admin()) with check (public.is_admin());

create policy prof_self_read   on public.profiles for select to authenticated using (id = auth.uid() or public.is_admin());
create policy prof_admin_write on public.profiles for all    to authenticated using (public.is_admin()) with check (public.is_admin());
create policy prof_self_update on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

create policy reports_dept_read on public.reports for select to authenticated
  using (public.is_admin() or department_id = (select department_id from public.profiles where id = auth.uid()));
create policy reports_self_insert on public.reports for insert to authenticated
  with check (user_id = auth.uid() and department_id = (select department_id from public.profiles where id = auth.uid()));
create policy reports_admin_all on public.reports for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy air_read on public.ai_responses for select to authenticated
  using (public.is_admin() or exists (
    select 1 from public.reports r
    where r.id = ai_responses.report_id
      and r.department_id = (select department_id from public.profiles where id = auth.uid())
  ));
create policy air_admin_all on public.ai_responses for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy alerts_read on public.alerts for select to authenticated
  using (public.is_admin() or department_id = (select department_id from public.profiles where id = auth.uid()));
create policy alerts_admin_all on public.alerts for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy audit_admin_read  on public.audit_log for select to authenticated using (public.is_admin());
create policy audit_admin_write on public.audit_log for all    to authenticated using (public.is_admin()) with check (public.is_admin());

-- Storage bucket (crear desde dashboard o ejecutar):
-- insert into storage.buckets (id, name, public) values ('reports','reports', false);
