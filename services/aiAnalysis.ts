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
