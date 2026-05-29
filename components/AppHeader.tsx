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
