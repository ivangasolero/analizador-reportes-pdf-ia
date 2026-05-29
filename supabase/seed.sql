-- Seed inicial TSF Control Center
-- Departamentos por defecto + trigger que asigna role='admin' al email principal

insert into public.departments (slug, name) values
  ('direccion', 'Direccion Operativa'),
  ('marketing', 'Marketing'),
  ('administracion', 'Administracion'),
  ('soporte', 'Soporte de Herramientas')
on conflict (slug) do nothing;

-- Trigger: cuando un usuario nuevo se inserta en auth.users, crea su profile.
-- Si el email coincide con ADMIN_EMAIL (ivangasolero@gmail.com), role='admin'.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role, is_active)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    case when new.email = 'ivangasolero@gmail.com' then 'admin'::text else null end,
    true
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
