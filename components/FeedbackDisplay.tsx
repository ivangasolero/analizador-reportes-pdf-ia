import React from 'react';
import type { ReportFeedback } from '../types';
import Section from './Section';
import { ClipboardDocumentListIcon } from './icons/ClipboardDocumentListIcon';
import { ChecklistIcon } from './icons/ChecklistIcon';
import { GaugeIcon } from './icons/GaugeIcon';
import { SparklesIcon } from './icons/SparklesIcon';

interface FeedbackDisplayProps {
    feedback: ReportFeedback;
}

const QualityScore: React.FC<{ score: number }> = ({ score }) => {
    const percentage = score * 10;
    const getColor = (p: number) => {
        if (p < 40) return 'bg-red-500';
        if (p < 70) return 'bg-yellow-500';
        return 'bg-green-500';
    };

    return (
        <div className="flex items-center gap-4">
            <div className="w-full bg-slate-200 dark:bg-slate-600 rounded-full h-4">
                <div
                    className={`h-4 rounded-full transition-all duration-1000 ease-out ${getColor(percentage)}`}
                    style={{ width: `${percentage}%` }}
                ></div>
            </div>
            <span className="text-xl font-bold text-slate-700 dark:text-slate-200">{score}/10</span>
        </div>
    );
};

const FeedbackDisplay: React.FC<FeedbackDisplayProps> = ({ feedback }) => {
    return (
        <div className="space-y-8 animate-fade-in">
            <h3 className="text-2xl font-bold text-center text-slate-800 dark:text-slate-100">
                Evaluación de Calidad del Reporte
            </h3>

            <Section title="Evaluación General" icon={<GaugeIcon className="w-6 h-6" />}>
                <QualityScore score={feedback.qualityEvaluation.score} />
                <p className="mt-3 text-slate-600 dark:text-slate-300 leading-relaxed">{feedback.qualityEvaluation.summary}</p>
            </Section>
            
            <Section title="Análisis Detallado de Calidad" icon={<ClipboardDocumentListIcon className="w-6 h-6" />}>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{feedback.detailedAnalysis}</p>
            </Section>

            <Section title="Aspectos a Mejorar" icon={<ChecklistIcon className="w-6 h-6" />}>
                <div className="space-y-4">
                    {feedback.areasForImprovement.map((item, index) => (
                        <div key={index} className="p-4 bg-slate-50 dark:bg-slate-700/50 border-l-4 border-yellow-500 rounded-r-lg">
                           <h4 className="font-bold text-slate-800 dark:text-slate-200">{item.point}</h4>
                           <p className="mt-1 text-slate-600 dark:text-slate-300">{item.explanation}</p>
                        </div>
                    ))}
                </div>
            </Section>

            <Section title="Sugerencias de Optimización" icon={<SparklesIcon className="w-6 h-6" />}>
                 <ul className="space-y-3 list-disc list-inside text-slate-600 dark:text-slate-300">
                    {feedback.optimizationSuggestions.map((sugg, index) => (
                        <li key={index}><span className="font-medium text-slate-800 dark:text-slate-200">{sugg}</span></li>
                    ))}
                </ul>
            </Section>

        </div>
    );
};

export default FeedbackDisplay;
