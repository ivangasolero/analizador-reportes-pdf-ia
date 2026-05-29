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
