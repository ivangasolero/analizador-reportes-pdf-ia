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
