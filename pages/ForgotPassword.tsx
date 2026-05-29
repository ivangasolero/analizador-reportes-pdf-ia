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
