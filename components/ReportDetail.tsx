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
