#!/usr/bin/env bash
# Etapa 3 - Panel de Usuario (multiusuario)
# Genera componentes NUEVOS sin tocar geminiService.ts (legacy) ni App.tsx existente.
# Uso: bash scripts/etapa3.sh && git add -A && git commit -m 'feat(etapa3): panel usuario (upload/history/detail/export)'
set -euo pipefail

mkdir -p components utils

cat > utils/exportPdf.ts <<'EOF'
import jsPDF from 'jspdf';
import type { AIAnalysis } from '../services/aiAnalysis';

export function exportAnalysisToPdf(reportName: string, a: AIAnalysis) {
  const doc = new jsPDF();
  let y = 15;
  doc.setFontSize(16);
  doc.text('TSF Control Center - Reporte IA', 10, y); y += 8;
  doc.setFontSize(11);
  doc.text('Archivo: ' + reportName, 10, y); y += 8;
  doc.text('Prioridad: ' + a.priority, 10, y); y += 10;
  doc.setFontSize(13); doc.text('Resumen Ejecutivo', 10, y); y += 6;
  doc.setFontSize(10);
  doc.splitTextToSize(a.summary, 190).forEach((l: string) => { doc.text(l, 10, y); y += 5; });
  y += 4; doc.setFontSize(13); doc.text('Insights', 10, y); y += 6; doc.setFontSize(10);
  a.insights.forEach((i) => { doc.splitTextToSize('- ' + i, 190).forEach((l: string) => { doc.text(l, 10, y); y += 5; }); });
  y += 4; doc.setFontSize(13); doc.text('Recomendaciones', 10, y); y += 6; doc.setFontSize(10);
  a.recommendations.forEach((r) => { doc.splitTextToSize('- ' + r, 190).forEach((l: string) => { doc.text(l, 10, y); y += 5; }); });
  doc.save(reportName.replace(/\.pdf$/i, '') + '-analisis.pdf');
}
EOF

cat > components/ReportUpload.tsx <<'EOF'
import React, { useState } from 'react';
import { supabase } from '../supabase/client';
import { analyzeReport, AIAnalysis } from '../services/aiAnalysis';

export default function ReportUpload({ onAnalyzed }: { onAnalyzed?: (id: string, a: AIAnalysis) => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null); setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('not_authenticated');
      const { data: rep, error: e1 } = await supabase.from('reports')
        .insert({ user_id: user.id, name: file?.name ?? 'manual.txt', content: text })
        .select().single();
      if (e1) throw e1;
      const analysis = await analyzeReport(text, rep.id);
      await supabase.from('analyses').insert({ report_id: rep.id, user_id: user.id, payload: analysis });
      onAnalyzed?.(rep.id, analysis);
    } catch (err: any) { setError(err.message ?? 'error'); }
    finally { setLoading(false); }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <input type="file" accept=".pdf,.txt" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
      <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Pegar texto extraido del PDF" rows={8} className="w-full border p-2" />
      <button disabled={loading || !text} type="submit" className="px-3 py-2 bg-blue-600 text-white rounded">{loading ? 'Analizando...' : 'Analizar'}</button>
      {error && <p className="text-red-600 text-sm">{error}</p>}
    </form>
  );
}
EOF

cat > components/ReportHistory.tsx <<'EOF'
import React, { useEffect, useState } from 'react';
import { supabase } from '../supabase/client';

export default function ReportHistory({ onSelect }: { onSelect?: (id: string) => void }) {
  const [items, setItems] = useState<any[]>([]);
  useEffect(() => {
    supabase.from('reports').select('id,name,created_at').order('created_at', { ascending: false })
      .then(({ data }) => setItems(data ?? []));
  }, []);
  return (
    <ul className="divide-y">
      {items.map((r) => (
        <li key={r.id} className="py-2 flex justify-between">
          <span>{r.name}</span>
          <button onClick={() => onSelect?.(r.id)} className="text-blue-600">Ver</button>
        </li>
      ))}
      {items.length === 0 && <li className="py-2 text-gray-500">Sin reportes aun.</li>}
    </ul>
  );
}
EOF

cat > components/ReportDetail.tsx <<'EOF'
import React, { useEffect, useState } from 'react';
import { supabase } from '../supabase/client';
import type { AIAnalysis } from '../services/aiAnalysis';
import { exportAnalysisToPdf } from '../utils/exportPdf';

export default function ReportDetail({ reportId }: { reportId: string }) {
  const [report, setReport] = useState<any>(null);
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);
  useEffect(() => {
    (async () => {
      const { data: r } = await supabase.from('reports').select('*').eq('id', reportId).single();
      setReport(r);
      const { data: a } = await supabase.from('analyses').select('payload').eq('report_id', reportId).order('created_at', { ascending: false }).limit(1).single();
      setAnalysis((a?.payload as AIAnalysis) ?? null);
    })();
  }, [reportId]);
  if (!report) return <p>Cargando...</p>;
  return (
    <div className="space-y-3">
      <h2 className="text-xl font-semibold">{report.name}</h2>
      {analysis ? (
        <>
          <p><b>Prioridad:</b> {analysis.priority}</p>
          <p>{analysis.summary}</p>
          <button onClick={() => exportAnalysisToPdf(report.name, analysis)} className="px-3 py-2 bg-green-600 text-white rounded">Exportar PDF</button>
        </>
      ) : <p>Sin analisis.</p>}
    </div>
  );
}
EOF

cat > components/Dashboard.tsx <<'EOF'
import React, { useState } from 'react';
import ReportUpload from './ReportUpload';
import ReportHistory from './ReportHistory';
import ReportDetail from './ReportDetail';

export default function Dashboard() {
  const [selected, setSelected] = useState<string | null>(null);
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
      <section>
        <h1 className="text-2xl font-bold mb-3">TSF Control Center</h1>
        <p className="text-sm text-gray-500 mb-4">Inteligencia Operativa Empresarial</p>
        <ReportUpload onAnalyzed={(id) => setSelected(id)} />
        <h3 className="mt-6 font-semibold">Historial</h3>
        <ReportHistory onSelect={setSelected} />
      </section>
      <section>{selected && <ReportDetail reportId={selected} />}</section>
    </div>
  );
}
EOF

echo ''
echo '[etapa3] Archivos creados.'
echo 'IMPORTANTE: geminiService.ts NO se toca. App.tsx tampoco. Integrar Dashboard desde rutas protegidas.'
echo 'Deps: npm install jspdf'
echo 'Commit: git add -A && git commit -m "feat(etapa3): panel usuario" && git push'
