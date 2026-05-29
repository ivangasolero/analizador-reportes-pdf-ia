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
