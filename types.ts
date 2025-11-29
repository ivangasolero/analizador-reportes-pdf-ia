

export type ReportRole = 'Marketing' | 'Administración' | 'Soporte y Herramientas' | 'Análisis' | 'General';

export interface Metric {
    metric: string;
    value: string;
    context?: string;
}

export interface AnalysisResult {
    detectedRole: ReportRole;
    summary: string;
    keyMetrics: Metric[];
    recommendations: string[];
    achievements: string[];
}

export interface AreaForImprovement {
    point: string;
    explanation: string;
}

export interface QualityEvaluation {
    score: number; // Score from 1 to 10
    summary: string;
}

export interface ReportFeedback {
    detailedAnalysis: string;
    areasForImprovement: AreaForImprovement[];
    qualityEvaluation: QualityEvaluation;
    optimizationSuggestions: string[];
}

export interface ConsolidatedAnalysis {
    strategicSummary: string;
    crossDepartmentInsights: string[];
    businessRecommendations: string[];
}

export interface HistoryItem {
  id: string;
  fileName: string;
  fileContent: string; // Base64 encoded PDF
  extractedText: string;
  analysisResult: AnalysisResult;
  reportFeedback?: ReportFeedback | null;
  timestamp: number;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}
