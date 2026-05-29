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
