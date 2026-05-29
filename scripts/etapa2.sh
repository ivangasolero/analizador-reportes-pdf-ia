#!/usr/bin/env bash
# TSF Control Center - Etapa 2 - IA serverless (Gemini server-side)
# Mueve la invocacion a Gemini fuera del frontend.
# NO modifica services/geminiService.ts (queda como referencia legacy hasta Etapa 3).
# Crea: api/analyze.ts real, services/aiAnalysis.ts wrapper, types compartidos.
set -euo pipefail

BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$BRANCH" != "feat/multiusuario" ]; then
  echo "ERROR: debes estar en feat/multiusuario (estas en $BRANCH)" >&2
  exit 1
fi

mkdir -p api services lib

# ---------- 1) api/analyze.ts (Vercel serverless) ----------
cat > api/analyze.ts <<'EOF'
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI } from '@google/genai';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL ?? '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY ?? '';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method_not_allowed' });
    return;
  }
  if (!GEMINI_API_KEY) {
    res.status(501).json({ error: 'gemini_not_configured' });
    return;
  }

  // 1. Autenticar usuario por bearer token de Supabase
  const auth = req.headers.authorization ?? '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) { res.status(401).json({ error: 'missing_token' }); return; }

  const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, { auth: { persistSession: false } });
  const { data: userData, error: userErr } = await sb.auth.getUser(token);
  if (userErr || !userData.user) { res.status(401).json({ error: 'invalid_token' }); return; }
  const userId = userData.user.id;

  // 2. Body: { reportText: string, reportId?: string }
  const { reportText, reportId } = (req.body ?? {}) as { reportText?: string; reportId?: string };
  if (!reportText || reportText.length < 20) {
    res.status(400).json({ error: 'report_text_required' });
    return;
  }

  // 3. Llamada a Gemini server-side
  const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
  const prompt = `Analiza el siguiente reporte operativo y devuelve JSON con campos: summary, keyMetrics[], achievements[], issues[], recommendations[], priority(low|medium|high|critical). Reporte:\n\n${reportText}`;

  let analysisJson: unknown;
  try {
    const resp = await ai.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: prompt,
      config: { responseMimeType: 'application/json' },
    });
    const text = resp.text ?? '{}';
    analysisJson = JSON.parse(text);
  } catch (e) {
    console.error('[api/analyze] gemini error:', e);
    res.status(502).json({ error: 'gemini_failed' });
    return;
  }

  // 4. Persistir en ai_responses si hay reportId
  if (reportId) {
    await sb.from('ai_responses').insert({
      report_id: reportId,
      payload: analysisJson,
      created_by: userId,
    });
  }

  res.status(200).json({ ok: true, analysis: analysisJson });
}
EOF

# ---------- 2) services/aiAnalysis.ts (wrapper frontend que llama al endpoint) ----------
cat > services/aiAnalysis.ts <<'EOF'
import { supabase } from '../lib/supabase';

export interface AIAnalysis {
  summary: string;
  keyMetrics: Array<{ label: string; value: string | number }>;
  achievements: string[];
  issues: string[];
  recommendations: string[];
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export async function analyzeReport(reportText: string, reportId?: string): Promise<AIAnalysis> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('not_authenticated');

  const resp = await fetch('/api/analyze', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + session.access_token,
    },
    body: JSON.stringify({ reportText, reportId }),
  });

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(err.error ?? 'analyze_failed');
  }
  const data = await resp.json();
  return data.analysis as AIAnalysis;
}
EOF

echo '\n[etapa2] Archivos creados.'
echo 'IMPORTANTE: services/geminiService.ts NO fue modificado. Sigue siendo legacy.'
echo 'En Etapa 3, el componente nuevo de reportes usara services/aiAnalysis.ts en lugar del legacy.'
echo ''
echo 'Para instalar deps adicionales si hace falta:'
echo '  npm install @vercel/node @google/genai'
echo ''
echo 'Build y push:'
echo '  npm run build'
echo '  git add -A && git commit -m "feat(etapa2): IA serverless con auth supabase" && git push origin feat/multiusuario'
