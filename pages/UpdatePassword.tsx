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
