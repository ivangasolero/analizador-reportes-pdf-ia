import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabase/client';

export default function AdminAuditLog() {
  const [logs, setLogs] = useState<any[]>([]);
  useEffect(() => {
    supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(100)
      .then(({ data }) => setLogs(data ?? []));
  }, []);
  return (
    <div>
      <h2 className="text-xl font-bold mb-3">Auditoria</h2>
      <table className="w-full text-xs">
        <thead><tr><th>Fecha</th><th>Accion</th><th>Entidad</th><th>Usuario</th></tr></thead>
        <tbody>
          {logs.map((l) => (
            <tr key={l.id} className="border-b">
              <td>{new Date(l.created_at).toLocaleString()}</td>
              <td>{l.action}</td>
              <td>{l.entity_type}/{l.entity_id?.slice(0,8)}</td>
              <td>{l.user_id?.slice(0,8)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
