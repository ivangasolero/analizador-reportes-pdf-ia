import React from 'react';
import type { HistoryItem as HistoryItemType } from '../types';
import { EyeIcon } from './icons/EyeIcon';
import { ArrowPathIcon } from './icons/ArrowPathIcon';
import { TrashIcon } from './icons/TrashIcon';

interface HistoryItemProps {
    item: HistoryItemType;
    onView: (id: string) => void;
    onReanalyze: (id: string) => void;
    onDelete: (id: string) => void;
}

const HistoryItem: React.FC<HistoryItemProps> = ({ item, onView, onReanalyze, onDelete }) => {
    const date = new Date(item.timestamp).toLocaleString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });

    return (
        <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow duration-200">
            <div>
                <p className="font-semibold text-slate-800 dark:text-slate-200">{item.fileName}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">{date}</p>
            </div>
            <div className="flex items-center gap-2">
                <button 
                    onClick={() => onView(item.id)} 
                    title="Ver Análisis"
                    className="p-2 text-slate-500 hover:text-brand-primary dark:text-slate-400 dark:hover:text-indigo-400 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                    <EyeIcon className="w-5 h-5" />
                </button>
                <button 
                    onClick={() => onReanalyze(item.id)} 
                    title="Volver a Analizar"
                    className="p-2 text-slate-500 hover:text-brand-secondary dark:text-slate-400 dark:hover:text-emerald-400 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                    <ArrowPathIcon className="w-5 h-5" />
                </button>
                <button 
                    onClick={() => onDelete(item.id)} 
                    title="Eliminar Reporte"
                    className="p-2 text-slate-500 hover:text-red-500 dark:text-slate-400 dark:hover:text-red-400 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                    <TrashIcon className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
};

export default HistoryItem;