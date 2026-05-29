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
