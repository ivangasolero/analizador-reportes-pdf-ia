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
