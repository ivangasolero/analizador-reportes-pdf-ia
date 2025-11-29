import type { AnalysisResult, ReportFeedback, ConsolidatedAnalysis } from '../types';

export const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });
};

export const base64ToFile = (base64: string, filename: string): File => {
    const arr = base64.split(',');
    const mimeMatch = arr[0].match(/:(.*?);/);
    if (!mimeMatch) {
      throw new Error("Could not determine mime type from base64 string");
    }
    const mime = mimeMatch[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while(n--){
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, {type:mime});
}

const formatMarkdown = (result: AnalysisResult, fileName: string, feedback?: ReportFeedback | null): string => {
    let md = `# Análisis del Reporte: ${fileName}\n\n`;

    md += `> **Análisis Dirigido a:** Departamento de ${result.detectedRole}\n\n`;

    md += `## Resumen Ejecutivo\n`;
    md += `${result.summary}\n\n`;

    md += `## Métricas Clave\n`;
    if (result.keyMetrics.length > 0) {
        md += `| Métrica | Valor | Contexto |\n`;
        md += `|---|---|---|\n`;
        result.keyMetrics.forEach(m => {
            md += `| ${m.metric} | ${m.value} | ${m.context || ''} |\n`;
        });
    } else {
        md += `No se encontraron métricas clave.\n`;
    }
    md += `\n`;

    md += `## Recomendaciones\n`;
    result.recommendations.forEach(r => {
        md += `* ${r}\n`;
    });
    md += `\n`;

    md += `## Logros Destacados\n`;
    result.achievements.forEach(a => {
        md += `* ${a}\n`;
    });
    md += `\n`;
    
    if (feedback) {
        md += `\n---\n\n# Evaluación de Calidad del Reporte\n\n`;
        
        md += `## Evaluación General\n`;
        md += `**Puntuación: ${feedback.qualityEvaluation.score}/10**\n\n`;
        md += `${feedback.qualityEvaluation.summary}\n\n`;
        
        md += `## Análisis Detallado de Calidad\n`;
        md += `${feedback.detailedAnalysis}\n\n`;
        
        md += `## Aspectos a Mejorar\n`;
        feedback.areasForImprovement.forEach(item => {
            md += `* **${item.point}:** ${item.explanation}\n`;
        });
        md += `\n`;
        
        md += `## Sugerencias de Optimización\n`;
        feedback.optimizationSuggestions.forEach(sugg => {
            md += `* ${sugg}\n`;
        });
        md += `\n`;
    }

    return md;
}

const formatConsolidatedMarkdown = (analysis: ConsolidatedAnalysis): string => {
    let md = `# Análisis Ejecutivo Consolidado\n\n`;
    md += `> Generado por IA basado en reportes departamentales.\n\n`;

    md += `## Resumen Estratégico General\n`;
    md += `${analysis.strategicSummary}\n\n`;

    md += `## Insights Interdepartamentales\n`;
    analysis.crossDepartmentInsights.forEach(insight => {
        md += `* ${insight}\n`;
    });
    md += `\n`;

    md += `## Recomendaciones Estratégicas de Negocio\n`;
    analysis.businessRecommendations.forEach(rec => {
        md += `* ${rec}\n`;
    });
    md += `\n`;

    return md;
};


export const downloadAnalysis = (result: AnalysisResult, fileName: string, feedback?: ReportFeedback | null) => {
    const formattedText = formatMarkdown(result, fileName, feedback);
    const blob = new Blob([formattedText], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const safeFileName = fileName.replace(/\.[^/.]+$/, "");
    link.download = `Analisis-${safeFileName}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};

export const downloadConsolidatedAnalysis = (analysis: ConsolidatedAnalysis) => {
    const formattedText = formatConsolidatedMarkdown(analysis);
    const blob = new Blob([formattedText], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const dateStr = new Date().toISOString().split('T')[0];
    link.download = `Analisis-Consolidado-${dateStr}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};