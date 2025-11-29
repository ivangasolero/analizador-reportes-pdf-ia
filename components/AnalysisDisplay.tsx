
import React from 'react';
import type { AnalysisResult, ReportFeedback } from '../types';
import MetricCard from './MetricCard';
import Section from './Section';
import FeedbackDisplay from './FeedbackDisplay';
import { SummaryIcon } from './icons/SummaryIcon';
import { ChartBarIcon } from './icons/ChartBarIcon';
import { LightbulbIcon } from './icons/LightbulbIcon';
import { TrophyIcon } from './icons/TrophyIcon';
import { DownloadIcon } from './icons/DownloadIcon';
import { DocumentCheckIcon } from './icons/DocumentCheckIcon';
import { TagIcon } from './icons/TagIcon';
import { PdfFileIcon } from './icons/PdfFileIcon';


interface AnalysisDisplayProps {
    result: AnalysisResult;
    onReset: () => void;
    fileName: string;
    onDownloadMd: () => void;
    onDownloadPdf: () => void;
    onGetFeedback: () => void;
    feedback: ReportFeedback | null;
    isFeedbackLoading: boolean;
    feedbackError: string | null;
}

const AnalysisDisplay: React.FC<AnalysisDisplayProps> = ({ result, onReset, fileName, onDownloadMd, onDownloadPdf, onGetFeedback, feedback, isFeedbackLoading, feedbackError }) => {
    return (
        <div className="space-y-8 animate-fade-in">
            <div className="pb-4 border-b border-slate-200 dark:border-slate-700">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Análisis de: <span className="text-brand-primary">{fileName}</span></h2>
                <div className="mt-2 flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                    <TagIcon className="w-5 h-5" />
                    <span className="font-semibold">Tipo de Reporte Detectado:</span>
                    <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200 rounded-full font-medium">{result.detectedRole}</span>
                </div>
            </div>
            
            <Section title="Resumen Ejecutivo" icon={<SummaryIcon className="w-6 h-6" />}>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{result.summary}</p>
            </Section>

            <Section title="Métricas Clave" icon={<ChartBarIcon className="w-6 h-6" />}>
                {result.keyMetrics.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {result.keyMetrics.map((metric, index) => (
                            <MetricCard key={index} metric={metric} />
                        ))}
                    </div>
                ) : (
                    <p className="text-slate-500 dark:text-slate-400">No se encontraron métricas clave.</p>
                )}
            </Section>

            <Section title="Recomendaciones" icon={<LightbulbIcon className="w-6 h-6" />}>
                <ul className="space-y-3 list-disc list-inside text-slate-600 dark:text-slate-300">
                    {result.recommendations.map((rec, index) => (
                        <li key={index}><span className="font-medium text-slate-800 dark:text-slate-200">{rec}</span></li>
                    ))}
                </ul>
            </Section>
            
            <Section title="Logros Destacados" icon={<TrophyIcon className="w-6 h-6" />}>
                 <ul className="space-y-3 list-disc list-inside text-slate-600 dark:text-slate-300">
                    {result.achievements.map((ach, index) => (
                        <li key={index}><span className="font-medium text-slate-800 dark:text-slate-200">{ach}</span></li>
                    ))}
                </ul>
            </Section>

            <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-4 pt-6">
                <button
                    onClick={onReset}
                    className="w-full sm:w-auto px-6 py-2 bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200 font-semibold rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors duration-200"
                >
                    Analizar otro reporte
                </button>
                 <button
                    onClick={onDownloadPdf}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors duration-200"
                >
                    <PdfFileIcon className="w-5 h-5" />
                    Descargar PDF
                </button>
                <button
                    onClick={onDownloadMd}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2 bg-brand-secondary text-white font-semibold rounded-lg hover:bg-emerald-600 transition-colors duration-200"
                >
                    <DownloadIcon className="w-5 h-5" />
                    Descargar Markdown
                </button>
            </div>

             <div className="pt-6 mt-6 border-t-2 border-dashed border-slate-300 dark:border-slate-600">
                {!feedback && !isFeedbackLoading && !feedbackError && (
                    <div className="text-center animate-fade-in">
                        <h3 className="text-xl font-bold text-slate-700 dark:text-slate-200 mb-2">¿Quieres mejorar tu reporte?</h3>
                        <p className="text-slate-500 dark:text-slate-400 mb-4">Obtén una evaluación de calidad y sugerencias para hacer tu comunicación más efectiva.</p>
                        <button
                            onClick={onGetFeedback}
                            disabled={isFeedbackLoading}
                            className="flex items-center justify-center gap-2 mx-auto px-6 py-3 bg-slate-600 text-white font-bold rounded-lg shadow-lg hover:bg-slate-700 disabled:bg-slate-400 transform hover:scale-105 transition-all duration-300"
                        >
                           <DocumentCheckIcon className="w-6 h-6" />
                           Evaluar Calidad del Reporte
                        </button>
                    </div>
                )}

                {isFeedbackLoading && (
                    <div className="flex flex-col items-center justify-center text-center p-4">
                        <svg className="animate-spin h-8 w-8 text-brand-primary mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <p className="font-semibold text-slate-700 dark:text-slate-300">Evaluando la calidad del reporte...</p>
                    </div>
                )}
                
                {feedbackError && (
                    <div className="mt-4 text-center text-red-500 bg-red-100 dark:bg-red-900/50 border border-red-500 rounded-lg p-3">
                        <p><strong>Error:</strong> {feedbackError}</p>
                    </div>
                )}

                {feedback && <FeedbackDisplay feedback={feedback} />}
            </div>
        </div>
    );
};

export default AnalysisDisplay;
