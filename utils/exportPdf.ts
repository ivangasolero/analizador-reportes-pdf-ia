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
