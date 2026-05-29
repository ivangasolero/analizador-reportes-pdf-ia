#!/usr/bin/env bash
# Etapa 4 - Admin Panel + Auditoria + Alertas IA
# Genera componentes admin NUEVOS. Solo accesible con rol 'administrador'.
# Super-admin: ivangasolero@gmail.com
# Uso: bash scripts/etapa4.sh && git add -A && git commit -m 'feat(etapa4): admin panel + audit + alerts'
set -euo pipefail

mkdir -p components/admin services

# --- Migration 0003: audit_logs table ---
mkdir -p supabase/migrations
cat > supabase/migrations/0003_audit_logs.sql <<'EOF'
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
EOF

# --- Service: auditService.ts ---
cat > services/auditService.ts <<'EOF'
import { supabase } from '../supabase/client';

export type AuditAction = 'report_created' | 'analysis_run' | 'user_invited' | 'user_suspended' | 'role_changed' | 'export_pdf';

export async function logAudit(action: AuditAction, entityType?: string, entityId?: string, metadata?: Record<string, unknown>) {
  const { data: { user } } = await supabase.auth.getUser();
  await supabase.from('audit_logs').insert({
    user_id: user?.id,
    action,
    entity_type: entityType,
    entity_id: entityId,
    metadata: metadata ?? {},
  });
}
EOF

# --- Component: AdminUserList.tsx ---
cat > components/admin/AdminUserList.tsx <<'EOF'
import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabase/client';
import { logAudit } from '../../services/auditService';

interface Profile { id: string; email: string; role: string; status: string; created_at: string; }

export default function AdminUserList() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('soporte_herramientas');

  useEffect(() => { loadUsers(); }, []);
  async function loadUsers() {
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    setUsers((data as Profile[]) ?? []);
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.auth.admin.inviteUserByEmail(inviteEmail, { data: { role: inviteRole } });
    if (!error) { await logAudit('user_invited', 'user', undefined, { email: inviteEmail, role: inviteRole }); setInviteEmail(''); loadUsers(); }
  }

  async function toggleSuspend(u: Profile) {
    const newStatus = u.status === 'active' ? 'suspended' : 'active';
    await supabase.from('profiles').update({ status: newStatus }).eq('id', u.id);
    await logAudit('user_suspended', 'user', u.id, { newStatus });
    loadUsers();
  }

  async function changeRole(u: Profile, newRole: string) {
    await supabase.from('profiles').update({ role: newRole }).eq('id', u.id);
    await logAudit('role_changed', 'user', u.id, { from: u.role, to: newRole });
    loadUsers();
  }

  const roles = ['administrador', 'direccion_operativa', 'marketing', 'administracion', 'soporte_herramientas'];

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Gestion de Usuarios</h2>
      <form onSubmit={handleInvite} className="flex gap-2">
        <input value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="email@empresa.com" className="border p-2 flex-1" />
        <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value)} className="border p-2">
          {roles.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
        <button type="submit" className="bg-blue-600 text-white px-3 py-2 rounded">Invitar</button>
      </form>
      <table className="w-full text-sm">
        <thead><tr><th>Email</th><th>Rol</th><th>Estado</th><th>Acciones</th></tr></thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id} className="border-b">
              <td>{u.email}</td>
              <td>
                <select value={u.role} onChange={(e) => changeRole(u, e.target.value)} className="border p-1">
                  {roles.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </td>
              <td>{u.status}</td>
              <td><button onClick={() => toggleSuspend(u)} className="text-red-600">{u.status === 'active' ? 'Suspender' : 'Activar'}</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
EOF

# --- Component: AdminAuditLog.tsx ---
cat > components/admin/AdminAuditLog.tsx <<'EOF'
import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabase/client';

export default function AdminAuditLog() {
  const [logs, setLogs] = useState<any[]>([]);
  useEffect(() => {
    supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(100)
      .then(({ data }) => setLogs(data ?? []));
  }, []);
  return (
    <div>
      <h2 className="text-xl font-bold mb-3">Auditoria</h2>
      <table className="w-full text-xs">
        <thead><tr><th>Fecha</th><th>Accion</th><th>Entidad</th><th>Usuario</th></tr></thead>
        <tbody>
          {logs.map((l) => (
            <tr key={l.id} className="border-b">
              <td>{new Date(l.created_at).toLocaleString()}</td>
              <td>{l.action}</td>
              <td>{l.entity_type}/{l.entity_id?.slice(0,8)}</td>
              <td>{l.user_id?.slice(0,8)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
EOF

# --- Component: AdminAlerts.tsx (resumen ejecutivo IA) ---
cat > components/admin/AdminAlerts.tsx <<'EOF'
import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabase/client';

export default function AdminAlerts() {
  const [criticals, setCriticals] = useState<any[]>([]);
  useEffect(() => {
    supabase.from('analyses').select('report_id, payload, created_at')
      .order('created_at', { ascending: false }).limit(200)
      .then(({ data }) => {
        const c = (data ?? []).filter((a: any) => a.payload?.priority === 'critical' || a.payload?.priority === 'high');
        setCriticals(c);
      });
  }, []);
  return (
    <div>
      <h2 className="text-xl font-bold mb-3">Alertas IA (alta/critica)</h2>
      {criticals.length === 0 && <p className="text-green-600">Sin alertas criticas.</p>}
      <ul className="space-y-2">
        {criticals.map((c, i) => (
          <li key={i} className="border-l-4 border-red-500 pl-3">
            <span className="font-semibold">[{c.payload.priority}]</span> {c.payload.summary?.slice(0, 120)}...
            <span className="text-xs text-gray-400 ml-2">{new Date(c.created_at).toLocaleDateString()}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
EOF

# --- Component: AdminDashboard.tsx (layout admin) ---
cat > components/admin/AdminDashboard.tsx <<'EOF'
import React, { useState } from 'react';
import AdminUserList from './AdminUserList';
import AdminAuditLog from './AdminAuditLog';
import AdminAlerts from './AdminAlerts';

type Tab = 'users' | 'audit' | 'alerts';

export default function AdminDashboard() {
  const [tab, setTab] = useState<Tab>('users');
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-1">TSF Control Center - Admin</h1>
      <p className="text-sm text-gray-500 mb-4">Panel de Administracion</p>
      <nav className="flex gap-4 mb-6 border-b pb-2">
        <button onClick={() => setTab('users')} className={tab === 'users' ? 'font-bold' : ''}>Usuarios</button>
        <button onClick={() => setTab('audit')} className={tab === 'audit' ? 'font-bold' : ''}>Auditoria</button>
        <button onClick={() => setTab('alerts')} className={tab === 'alerts' ? 'font-bold' : ''}>Alertas IA</button>
      </nav>
      {tab === 'users' && <AdminUserList />}
      {tab === 'audit' && <AdminAuditLog />}
      {tab === 'alerts' && <AdminAlerts />}
    </div>
  );
}
EOF

echo ''
echo '[etapa4] Archivos creados:'
echo '  - supabase/migrations/0003_audit_logs.sql'
echo '  - services/auditService.ts'
echo '  - components/admin/AdminUserList.tsx'
echo '  - components/admin/AdminAuditLog.tsx'
echo '  - components/admin/AdminAlerts.tsx'
echo '  - components/admin/AdminDashboard.tsx'
echo ''
echo 'IMPORTANTE: AdminDashboard solo accesible desde ruta protegida con role=administrador (ya definido en Etapa 1).'
echo 'Super-admin: ivangasolero@gmail.com'
echo 'Ejecutar migracion: psql $DATABASE_URL < supabase/migrations/0003_audit_logs.sql'
echo 'Commit: git add -A && git commit -m "feat(etapa4): admin panel + audit + alerts" && git push'
