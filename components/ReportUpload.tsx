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
