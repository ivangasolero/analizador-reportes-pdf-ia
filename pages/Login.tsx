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
