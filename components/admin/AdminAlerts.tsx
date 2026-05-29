import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabase/client';

export default function AdminAlerts() {
  const [criticals, setCriticals] = useState<any[]>([]);
  useEffect(() => {
    supabase.from('analyses').select('report_id, payload, created_at')
      .order('created_at', { ascending: false }).limit(200)
      .then(({ data }) => {
        const c = (data ?? []).filter((a: any) => a.payload?.priority === 'critical' || a.payload?.priority === 'high');
        setCriticals(c);
      });
  }, []);
  return (
    <div>
      <h2 className="text-xl font-bold mb-3">Alertas IA (alta/critica)</h2>
      {criticals.length === 0 && <p className="text-green-600">Sin alertas criticas.</p>}
      <ul className="space-y-2">
        {criticals.map((c, i) => (
          <li key={i} className="border-l-4 border-red-500 pl-3">
            <span className="font-semibold">[{c.payload.priority}]</span> {c.payload.summary?.slice(0, 120)}...
            <span className="text-xs text-gray-400 ml-2">{new Date(c.created_at).toLocaleDateString()}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
