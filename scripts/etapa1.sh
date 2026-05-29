#!/usr/bin/env bash
# TSF Control Center - Etapa 1 - Auth Supabase + Roles + RLS
# Uso: bash scripts/etapa1.sh    (desde la raiz del repo, en rama feat/multiusuario)
# No toca: main, services/geminiService.ts, App.tsx, index.tsx
set -euo pipefail

BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$BRANCH" != "feat/multiusuario" ]; then
  echo "ERROR: debes estar en feat/multiusuario (estas en $BRANCH)" >&2
  exit 1
fi

mkdir -p lib contexts components pages supabase/migrations

# ---------- 1) lib/supabase.ts ----------
cat > lib/supabase.ts <<'EOF'
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!url || !anon) {
  console.warn('[supabase] Faltan VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY.');
}

export const supabase: SupabaseClient = createClient(
  url ?? 'https://placeholder.supabase.co',
  anon ?? 'placeholder-anon-key',
  { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } }
);

export type AppRole = 'admin' | 'direccion' | 'marketing' | 'administracion' | 'soporte';

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: AppRole | null;
  department_id: string | null;
  is_active: boolean;
  created_at: string;
}
EOF

# ---------- 2) contexts/AuthContext.tsx ----------
cat > contexts/AuthContext.tsx <<'EOF'
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase, type Profile } from '../lib/supabase';

interface AuthContextValue {
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signInWithPassword: (email: string, password: string) => Promise<{ error: string | null }>;
  signInWithMagicLink: (email: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (error) { console.warn('[auth] profile:', error.message); setProfile(null); return; }
    setProfile(data as Profile);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (session?.user?.id) await fetchProfile(session.user.id);
  }, [session, fetchProfile]);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      if (data.session?.user) fetchProfile(data.session.user.id).finally(() => setLoading(false));
      else setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      if (s?.user) fetchProfile(s.user.id); else setProfile(null);
    });
    return () => { mounted = false; sub.subscription.unsubscribe(); };
  }, [fetchProfile]);

  const signInWithPassword: AuthContextValue['signInWithPassword'] = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  };
  const signInWithMagicLink: AuthContextValue['signInWithMagicLink'] = async (email) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin + '/dashboard' },
    });
    return { error: error?.message ?? null };
  };
  const signOut = async () => { await supabase.auth.signOut(); setProfile(null); };

  return (
    <AuthContext.Provider value={{ session, profile, loading, signInWithPassword, signInWithMagicLink, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
};
EOF

# ---------- 3) components/ProtectedRoute.tsx ----------
cat > components/ProtectedRoute.tsx <<'EOF'
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { session, loading } = useAuth();
  const location = useLocation();
  if (loading) return <div style={{ padding: 24 }}>Cargando sesion...</div>;
  if (!session) return <Navigate to="/login" state={{ from: location }} replace />;
  return <>{children}</>;
};
EOF

# ---------- 4) components/RoleRoute.tsx ----------
cat > components/RoleRoute.tsx <<'EOF'
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import type { AppRole } from '../lib/supabase';

export const RoleRoute: React.FC<{ allow: AppRole[]; children: React.ReactNode }> = ({ allow, children }) => {
  const { profile, loading } = useAuth();
  if (loading) return <div style={{ padding: 24 }}>Verificando permisos...</div>;
  if (!profile || !profile.role || !allow.includes(profile.role)) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
};
EOF

# ---------- 5) components/AppHeader.tsx ----------
cat > components/AppHeader.tsx <<'EOF'
import React from 'react';
import { useAuth } from '../contexts/AuthContext';

export const AppHeader: React.FC = () => {
  const { session, profile, signOut } = useAuth();
  if (!session) return null;
  return (
    <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px', borderBottom: '1px solid #2a2a2a', background: '#0f0f10', color: '#e5e5e5' }}>
      <div><strong>TSF Control Center</strong> <span style={{ opacity: 0.6, fontSize: 12 }}>Inteligencia Operativa Empresarial</span></div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', fontSize: 13 }}>
        <span>{session.user.email}</span>
        <span style={{ opacity: 0.7 }}>{profile?.role ?? 'sin-rol'}</span>
        <button onClick={signOut} style={{ padding: '6px 12px', background: '#1f1f22', color: '#fff', border: '1px solid #333', borderRadius: 6, cursor: 'pointer' }}>Cerrar sesion</button>
      </div>
    </header>
  );
};
EOF

# ---------- 6) pages/Login.tsx ----------
cat > pages/Login.tsx <<'EOF'
import React, { useState } from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const LoginPage: React.FC = () => {
  const { session, signInWithPassword, signInWithMagicLink } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'password' | 'magic'>('password');
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const loc = useLocation();

  if (session) {
    const from = (loc.state as { from?: { pathname?: string } })?.from?.pathname ?? '/dashboard';
    return <Navigate to={from} replace />;
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setMsg(null);
    const r = mode === 'password' ? await signInWithPassword(email, password) : await signInWithMagicLink(email);
    setBusy(false);
    if (r.error) setMsg(r.error);
    else if (mode === 'magic') setMsg('Revisa tu email para el enlace de acceso.');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#0a0a0b', color: '#e5e5e5' }}>
      <form onSubmit={onSubmit} style={{ width: 360, padding: 24, background: '#111114', borderRadius: 12, border: '1px solid #222' }}>
        <h1 style={{ fontSize: 20, marginBottom: 4 }}>TSF Control Center</h1>
        <p style={{ opacity: 0.6, fontSize: 13, marginBottom: 18 }}>Inteligencia Operativa Empresarial</p>
        <label style={{ fontSize: 12, opacity: 0.7 }}>Email</label>
        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} style={{ width: '100%', padding: 10, marginTop: 4, marginBottom: 12, background: '#0a0a0b', color: '#fff', border: '1px solid #2a2a2a', borderRadius: 6 }} />
        {mode === 'password' && (
          <>
            <label style={{ fontSize: 12, opacity: 0.7 }}>Contrasena</label>
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} style={{ width: '100%', padding: 10, marginTop: 4, marginBottom: 12, background: '#0a0a0b', color: '#fff', border: '1px solid #2a2a2a', borderRadius: 6 }} />
          </>
        )}
        <button type="submit" disabled={busy} style={{ width: '100%', padding: 12, background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', marginBottom: 10 }}>
          {busy ? 'Procesando...' : mode === 'password' ? 'Iniciar sesion' : 'Enviar magic link'}
        </button>
        <button type="button" onClick={() => setMode(mode === 'password' ? 'magic' : 'password')} style={{ width: '100%', padding: 8, background: 'transparent', color: '#9ca3af', border: '1px solid #2a2a2a', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>
          {mode === 'password' ? 'Usar magic link en su lugar' : 'Usar contrasena en su lugar'}
        </button>
        {msg && <p style={{ marginTop: 12, fontSize: 12, color: '#f87171' }}>{msg}</p>}
        <p style={{ marginTop: 16, fontSize: 12, textAlign: 'center' }}><Link to="/forgot-password" style={{ color: '#60a5fa' }}>Olvide mi contrasena</Link></p>
      </form>
    </div>
  );
};
EOF

# ---------- 7) pages/ForgotPassword.tsx ----------
cat > pages/ForgotPassword.tsx <<'EOF'
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setMsg(null);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + '/update-password',
    });
    setBusy(false);
    setMsg(error ? error.message : 'Revisa tu email para restablecer la contrasena.');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#0a0a0b', color: '#e5e5e5' }}>
      <form onSubmit={onSubmit} style={{ width: 360, padding: 24, background: '#111114', borderRadius: 12, border: '1px solid #222' }}>
        <h1 style={{ fontSize: 18, marginBottom: 12 }}>Restablecer contrasena</h1>
        <input type="email" required placeholder="tu@empresa.com" value={email} onChange={(e) => setEmail(e.target.value)} style={{ width: '100%', padding: 10, marginBottom: 12, background: '#0a0a0b', color: '#fff', border: '1px solid #2a2a2a', borderRadius: 6 }} />
        <button type="submit" disabled={busy} style={{ width: '100%', padding: 12, background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>{busy ? 'Enviando...' : 'Enviar enlace'}</button>
        {msg && <p style={{ marginTop: 12, fontSize: 12 }}>{msg}</p>}
        <p style={{ marginTop: 16, fontSize: 12, textAlign: 'center' }}><Link to="/login" style={{ color: '#60a5fa' }}>Volver al login</Link></p>
      </form>
    </div>
  );
};
EOF

# ---------- 8) pages/UpdatePassword.tsx ----------
cat > pages/UpdatePassword.tsx <<'EOF'
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export const UpdatePasswordPage: React.FC = () => {
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const nav = useNavigate();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setMsg(null);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) setMsg(error.message);
    else { setMsg('Contrasena actualizada.'); setTimeout(() => nav('/dashboard'), 1200); }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#0a0a0b', color: '#e5e5e5' }}>
      <form onSubmit={onSubmit} style={{ width: 360, padding: 24, background: '#111114', borderRadius: 12, border: '1px solid #222' }}>
        <h1 style={{ fontSize: 18, marginBottom: 12 }}>Nueva contrasena</h1>
        <input type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} style={{ width: '100%', padding: 10, marginBottom: 12, background: '#0a0a0b', color: '#fff', border: '1px solid #2a2a2a', borderRadius: 6 }} />
        <button type="submit" disabled={busy} style={{ width: '100%', padding: 12, background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>{busy ? 'Guardando...' : 'Actualizar'}</button>
        {msg && <p style={{ marginTop: 12, fontSize: 12 }}>{msg}</p>}
      </form>
    </div>
  );
};
EOF

# ---------- 9) supabase/seed.sql ----------
cat > supabase/seed.sql <<'EOF'
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
EOF

# ---------- 10) supabase/migrations/0002_rls_policies.sql ----------
cat > supabase/migrations/0002_rls_policies.sql <<'EOF'
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
EOF

echo '\n[etapa1] Archivos creados. Procediendo a instalar y buildear...'

npm install
npm run build

echo '\n[etapa1] Build OK. Listo para commit y push.'
echo 'Ejecuta manualmente:'
echo '  git add -A && git commit -m "feat(etapa1): auth supabase + roles + RLS + protected routes" && git push origin feat/multiusuario'
