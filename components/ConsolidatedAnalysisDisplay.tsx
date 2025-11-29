

import React, { useState, useCallback } from 'react';
import type { ConsolidatedAnalysis, ChatMessage } from '../types';
import { askConsolidatedQuestion } from '../services/geminiService';
import { downloadConsolidatedAnalysis } from '../utils/fileUtils';
import { generateConsolidatedPdf } from '../utils/pdfGenerator';
import Section from './Section';
import { BuildingOffice2Icon } from './icons/BuildingOffice2Icon';
import { ArrowsRightLeftIcon } from './icons/ArrowsRightLeftIcon';
import { ChartPieIcon } from './icons/ChartPieIcon';
import { ChatBubbleLeftRightIcon } from './icons/ChatBubbleLeftRightIcon';
import { DownloadIcon } from './icons/DownloadIcon';
import { PdfFileIcon } from './icons/PdfFileIcon';

interface ConsolidatedAnalysisDisplayProps {
    analysis: ConsolidatedAnalysis | null;
    isLoading: boolean;
    error: string | null;
}

const ConsolidatedAnalysisDisplay: React.FC<ConsolidatedAnalysisDisplayProps> = ({ analysis, isLoading, error }) => {
    
    const [question, setQuestion] = useState('');
    const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
    const [isChatLoading, setIsChatLoading] = useState(false);
    const [chatError, setChatError] = useState<string | null>(null);

    const handleAskQuestion = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        if (!question.trim() || !analysis || isChatLoading) return;

        const newQuestion: ChatMessage = { role: 'user', text: question };
        setChatHistory(prev => [...prev, newQuestion]);
        setQuestion('');
        setIsChatLoading(true);
        setChatError(null);

        try {
            const answerText = await askConsolidatedQuestion(analysis, question, chatHistory);
            const newAnswer: ChatMessage = { role: 'model', text: answerText };
            setChatHistory(prev => [...prev, newAnswer]);
        } catch (err: any) {
            setChatError(err.message || "Ocurrió un error al obtener la respuesta.");
        } finally {
            setIsChatLoading(false);
        }

    }, [question, analysis, chatHistory, isChatLoading]);

    const handleDownloadMd = () => {
        if (analysis) {
            downloadConsolidatedAnalysis(analysis);
        }
    };

    const handleDownloadPdf = () => {
        if (analysis) {
            generateConsolidatedPdf(analysis);
        }
    };

    if (isLoading) {
        return (
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8 transition-all duration-300 animate-fade-in">
                <div className="flex flex-col items-center justify-center text-center p-4">
                    <svg className="animate-spin h-8 w-8 text-brand-primary mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="font-semibold text-slate-700 dark:text-slate-300">Generando análisis ejecutivo consolidado...</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Sintetizando insights de todos los departamentos.</p>
                </div>
            </div>
        );
    }
    
    if (error) {
         return (
             <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8 transition-all duration-300 animate-fade-in">
                <div className="mt-4 text-center text-red-500 bg-red-100 dark:bg-red-900/50 border border-red-500 rounded-lg p-3">
                    <p><strong>Error:</strong> {error}</p>
                </div>
             </div>
        );
    }

    if (!analysis) {
        return null;
    }

    return (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8 transition-all duration-300 animate-fade-in">
             <div className="text-center mb-8">
                 <h2 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100">Análisis Ejecutivo Consolidado</h2>
                 <p className="mt-2 text-md text-slate-500 dark:text-slate-400">Una visión estratégica del negocio basada en los reportes departamentales.</p>
             </div>
             <div className="space-y-8">
                <Section title="Resumen Estratégico General" icon={<BuildingOffice2Icon className="w-6 h-6" />}>
                    <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{analysis.strategicSummary}</p>
                </Section>

                <Section title="Insights Interdepartamentales" icon={<ArrowsRightLeftIcon className="w-6 h-6" />}>
                    <ul className="space-y-3 list-disc list-inside text-slate-600 dark:text-slate-300">
                        {analysis.crossDepartmentInsights.map((insight, index) => (
                            <li key={index}><span className="font-medium text-slate-800 dark:text-slate-200">{insight}</span></li>
                        ))}
                    </ul>
                </Section>
                
                <Section title="Recomendaciones Estratégicas de Negocio" icon={<ChartPieIcon className="w-6 h-6" />}>
                     <ul className="space-y-3 list-disc list-inside text-slate-600 dark:text-slate-300">
                        {analysis.businessRecommendations.map((rec, index) => (
                            <li key={index}><span className="font-medium text-slate-800 dark:text-slate-200">{rec}</span></li>
                        ))}
                    </ul>
                </Section>
             </div>

             <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-4 py-8 border-b border-dashed border-slate-300 dark:border-slate-600">
                 <button
                    onClick={handleDownloadPdf}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors duration-200"
                >
                    <PdfFileIcon className="w-5 h-5" />
                    Descargar PDF Consolidado
                </button>
                <button
                    onClick={handleDownloadMd}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2 bg-brand-secondary text-white font-semibold rounded-lg hover:bg-emerald-600 transition-colors duration-200"
                >
                    <DownloadIcon className="w-5 h-5" />
                    Descargar Markdown
                </button>
             </div>

             <div className="pt-8 mt-4">
                <Section title="Preguntas Estratégicas" icon={<ChatBubbleLeftRightIcon className="w-6 h-6"/>}>
                    <div className="space-y-4">
                        <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg max-h-96 overflow-y-auto space-y-4">
                            {chatHistory.length === 0 && (
                                <p className="text-center text-slate-500 dark:text-slate-400">Haz una pregunta para empezar la conversación.</p>
                            )}
                            {chatHistory.map((msg, index) => (
                                <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-xl p-3 rounded-lg ${msg.role === 'user' ? 'bg-indigo-500 text-white' : 'bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-slate-200'}`}>
                                        <p>{msg.text}</p>
                                    </div>
                                </div>
                            ))}
                             {isChatLoading && (
                                <div className="flex justify-start">
                                    <div className="max-w-xl p-3 rounded-lg bg-slate-200 dark:bg-slate-600">
                                        <div className="flex items-center space-x-2">
                                            <div className="w-2 h-2 bg-slate-500 rounded-full animate-pulse"></div>
                                            <div className="w-2 h-2 bg-slate-500 rounded-full animate-pulse [animation-delay:0.2s]"></div>
                                            <div className="w-2 h-2 bg-slate-500 rounded-full animate-pulse [animation-delay:0.4s]"></div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {chatError && (
                            <div className="text-center text-red-500 text-sm">
                                <p><strong>Error:</strong> {chatError}</p>
                            </div>
                        )}

                        <form onSubmit={handleAskQuestion} className="flex items-center gap-2">
                            <input
                                type="text"
                                value={question}
                                onChange={(e) => setQuestion(e.target.value)}
                                placeholder="Ej: ¿Qué relación hay entre marketing y soporte?"
                                className="flex-grow p-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-brand-primary focus:outline-none transition"
                                disabled={isChatLoading}
                            />
                            <button
                                type="submit"
                                disabled={isChatLoading || !question.trim()}
                                className="px-5 py-3 bg-brand-primary text-white font-bold rounded-lg shadow-md hover:bg-indigo-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors"
                            >
                                Enviar
                            </button>
                        </form>
                    </div>
                </Section>
             </div>
        </div>
    );
};

export default ConsolidatedAnalysisDisplay;