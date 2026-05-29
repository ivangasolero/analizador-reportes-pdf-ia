// Vercel Serverless Function: /api/analyze
// Etapa 0 - skeleton. Mueve la llamada a Gemini fuera del cliente.
// La implementacion final reutilizara la logica de services/ del repo original
// (Etapa 2: importar desde ../services/aiAnalysis).
//
// Flujo previsto:
//  1. Validar JWT de Supabase (header Authorization: Bearer <token>).
//  2. Cargar report_id desde body, verificar pertenencia (RLS via service role).
//  3. Descargar PDF del bucket 'reports' (storage.from('reports').download).
//  4. Llamar Gemini con la API key del servidor (process.env.GEMINI_API_KEY).
//  5. Persistir en ai_responses + derivar alerts segun severity.
//  6. Devolver el analisis al cliente.

import type { VercelRequest, VercelResponse } from '@vercel/node';

export const config = { runtime: 'nodejs20.x', maxDuration: 60 };

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const geminiKey = process.env.GEMINI_API_KEY;
  const supabaseUrl = process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!geminiKey || !supabaseUrl || !serviceRole) {
    return res.status(500).json({
      error: 'Missing server env vars',
      missing: {
        GEMINI_API_KEY: !geminiKey,
        SUPABASE_URL: !supabaseUrl,
        SUPABASE_SERVICE_ROLE_KEY: !serviceRole,
      },
    });
  }

  const { report_id } = (req.body ?? {}) as { report_id?: string };
  if (!report_id) return res.status(400).json({ error: 'report_id is required' });

  // TODO (Etapa 2):
  //   - Verificar JWT del usuario.
  //   - Descargar PDF del Storage.
  //   - Invocar la logica IA reutilizada de services/ (no reescribir).
  //   - Insertar ai_responses y alerts.
  return res.status(501).json({
    status: 'not_implemented',
    stage: 'etapa-0-skeleton',
    received: { report_id },
    next: 'Etapa 2: portar services/ del repo y conectar Gemini + Supabase service role.',
  });
}
