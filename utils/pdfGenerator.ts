
import { jsPDF } from 'jspdf';
import type { AnalysisResult, ReportFeedback, ConsolidatedAnalysis } from '../types';

const MARGIN = 20;
const FONT_SIZE_NORMAL = 12;
const FONT_SIZE_TITLE = 18;
const FONT_SIZE_H2 = 16;
const LINE_HEIGHT = 7;

const addWrappedText = (doc: jsPDF, text: string | string[], x: number, y: number, maxWidth: number) => {
    if (Array.isArray(text)) {
        text = text.join('\n');
    }
    const lines = doc.splitTextToSize(text, maxWidth);
    doc.text(lines, x, y);
    return y + lines.length * LINE_HEIGHT;
};

export const generatePdf = (result: AnalysisResult, fileName: string, feedback?: ReportFeedback | null) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const usableWidth = pageWidth - 2 * MARGIN;
    let currentY = MARGIN;

    // Header
    doc.setFontSize(FONT_SIZE_TITLE);
    doc.setFont('helvetica', 'bold');
    currentY = addWrappedText(doc, `Análisis del Reporte: ${fileName}`, MARGIN, currentY, usableWidth);
    
    doc.setFontSize(FONT_SIZE_NORMAL);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(100);
    currentY = addWrappedText(doc, `Análisis Dirigido a: Departamento de ${result.detectedRole}`, MARGIN, currentY + 2, usableWidth);
    currentY += LINE_HEIGHT;
    
    const checkPageBreak = (y: number) => {
        if (y > doc.internal.pageSize.getHeight() - MARGIN) {
            doc.addPage();
            return MARGIN;
        }
        return y;
    }

    doc.setTextColor(0);
    doc.setFont('helvetica', 'normal');

    // Summary
    doc.setFontSize(FONT_SIZE_H2);
    doc.setFont('helvetica', 'bold');
    currentY = checkPageBreak(currentY);
    doc.text('Resumen Ejecutivo', MARGIN, currentY);
    currentY += LINE_HEIGHT;
    doc.setFontSize(FONT_SIZE_NORMAL);
    doc.setFont('helvetica', 'normal');
    currentY = addWrappedText(doc, result.summary, MARGIN, currentY, usableWidth);
    currentY += LINE_HEIGHT;

    // Key Metrics
    currentY = checkPageBreak(currentY);
    doc.setFontSize(FONT_SIZE_H2);
    doc.setFont('helvetica', 'bold');
    doc.text('Métricas Clave', MARGIN, currentY);
    currentY += LINE_HEIGHT;
    doc.setFontSize(FONT_SIZE_NORMAL);
    doc.setFont('helvetica', 'normal');
    if (result.keyMetrics.length > 0) {
        result.keyMetrics.forEach(m => {
            currentY = checkPageBreak(currentY);
            const metricText = `- ${m.metric}: ${m.value} ${m.context ? `(${m.context})` : ''}`;
            currentY = addWrappedText(doc, metricText, MARGIN, currentY, usableWidth);
        });
    } else {
        currentY = addWrappedText(doc, 'No se encontraron métricas clave.', MARGIN, currentY, usableWidth);
    }
    currentY += LINE_HEIGHT;

    // Recommendations
    currentY = checkPageBreak(currentY);
    doc.setFontSize(FONT_SIZE_H2);
    doc.setFont('helvetica', 'bold');
    doc.text('Recomendaciones', MARGIN, currentY);
    currentY += LINE_HEIGHT;
    doc.setFontSize(FONT_SIZE_NORMAL);
    doc.setFont('helvetica', 'normal');
    result.recommendations.forEach(r => {
        currentY = checkPageBreak(currentY);
        currentY = addWrappedText(doc, `- ${r}`, MARGIN, currentY, usableWidth);
    });
    currentY += LINE_HEIGHT;

    // Achievements
    currentY = checkPageBreak(currentY);
    doc.setFontSize(FONT_SIZE_H2);
    doc.setFont('helvetica', 'bold');
    doc.text('Logros Destacados', MARGIN, currentY);
    currentY += LINE_HEIGHT;
    doc.setFontSize(FONT_SIZE_NORMAL);
    doc.setFont('helvetica', 'normal');
    result.achievements.forEach(a => {
        currentY = checkPageBreak(currentY);
        currentY = addWrappedText(doc, `- ${a}`, MARGIN, currentY, usableWidth);
    });

    // Feedback Section
    if (feedback) {
        currentY += LINE_HEIGHT;
        doc.setLineWidth(0.5);
        doc.line(MARGIN, currentY, pageWidth - MARGIN, currentY);
        currentY += LINE_HEIGHT;

        currentY = checkPageBreak(currentY);
        doc.setFontSize(FONT_SIZE_TITLE);
        doc.setFont('helvetica', 'bold');
        doc.text('Evaluación de Calidad del Reporte', MARGIN, currentY);
        currentY += LINE_HEIGHT;

        // Evaluation
        currentY = checkPageBreak(currentY);
        doc.setFontSize(FONT_SIZE_H2);
        doc.setFont('helvetica', 'bold');
        doc.text(`Evaluación General (Puntuación: ${feedback.qualityEvaluation.score}/10)`, MARGIN, currentY);
        currentY += LINE_HEIGHT;
        doc.setFontSize(FONT_SIZE_NORMAL);
        doc.setFont('helvetica', 'normal');
        currentY = addWrappedText(doc, feedback.qualityEvaluation.summary, MARGIN, currentY, usableWidth);
        currentY += LINE_HEIGHT;

        // Areas for improvement
        currentY = checkPageBreak(currentY);
        doc.setFontSize(FONT_SIZE_H2);
        doc.setFont('helvetica', 'bold');
        doc.text('Aspectos a Mejorar', MARGIN, currentY);
        currentY += LINE_HEIGHT;
        doc.setFontSize(FONT_SIZE_NORMAL);
        doc.setFont('helvetica', 'normal');
        feedback.areasForImprovement.forEach(item => {
            currentY = checkPageBreak(currentY);
            doc.setFont('helvetica', 'bold');
            currentY = addWrappedText(doc, `- ${item.point}:`, MARGIN, currentY, usableWidth);
            doc.setFont('helvetica', 'normal');
            currentY = addWrappedText(doc, item.explanation, MARGIN + 5, currentY, usableWidth - 5);
        });
    }

    const safeFileName = fileName.replace(/\.[^/.]+$/, "");
    doc.save(`Analisis-${safeFileName}.pdf`);
};

export const generateConsolidatedPdf = (analysis: ConsolidatedAnalysis) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const usableWidth = pageWidth - 2 * MARGIN;
    let currentY = MARGIN;

    const checkPageBreak = (y: number) => {
        if (y > doc.internal.pageSize.getHeight() - MARGIN) {
            doc.addPage();
            return MARGIN;
        }
        return y;
    }

    // Header
    doc.setFontSize(FONT_SIZE_TITLE);
    doc.setFont('helvetica', 'bold');
    currentY = addWrappedText(doc, `Análisis Ejecutivo Consolidado`, MARGIN, currentY, usableWidth);
    
    doc.setFontSize(FONT_SIZE_NORMAL);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(100);
    const dateStr = new Date().toLocaleDateString('es-ES');
    currentY = addWrappedText(doc, `Generado por IA - ${dateStr}`, MARGIN, currentY + 2, usableWidth);
    currentY += LINE_HEIGHT;

    doc.setTextColor(0);
    doc.setFont('helvetica', 'normal');

    // Strategic Summary
    doc.setFontSize(FONT_SIZE_H2);
    doc.setFont('helvetica', 'bold');
    currentY = checkPageBreak(currentY);
    doc.text('Resumen Estratégico General', MARGIN, currentY);
    currentY += LINE_HEIGHT;
    doc.setFontSize(FONT_SIZE_NORMAL);
    doc.setFont('helvetica', 'normal');
    currentY = addWrappedText(doc, analysis.strategicSummary, MARGIN, currentY, usableWidth);
    currentY += LINE_HEIGHT;

    // Insights
    currentY = checkPageBreak(currentY);
    doc.setFontSize(FONT_SIZE_H2);
    doc.setFont('helvetica', 'bold');
    doc.text('Insights Interdepartamentales', MARGIN, currentY);
    currentY += LINE_HEIGHT;
    doc.setFontSize(FONT_SIZE_NORMAL);
    doc.setFont('helvetica', 'normal');
    analysis.crossDepartmentInsights.forEach(insight => {
        currentY = checkPageBreak(currentY);
        currentY = addWrappedText(doc, `- ${insight}`, MARGIN, currentY, usableWidth);
    });
    currentY += LINE_HEIGHT;

    // Recommendations
    currentY = checkPageBreak(currentY);
    doc.setFontSize(FONT_SIZE_H2);
    doc.setFont('helvetica', 'bold');
    doc.text('Recomendaciones Estratégicas de Negocio', MARGIN, currentY);
    currentY += LINE_HEIGHT;
    doc.setFontSize(FONT_SIZE_NORMAL);
    doc.setFont('helvetica', 'normal');
    analysis.businessRecommendations.forEach(rec => {
        currentY = checkPageBreak(currentY);
        currentY = addWrappedText(doc, `- ${rec}`, MARGIN, currentY, usableWidth);
    });

    const safeDate = new Date().toISOString().split('T')[0];
    doc.save(`Analisis-Consolidado-${safeDate}.pdf`);
};
