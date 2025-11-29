import React from 'react';
import type { HistoryItem as HistoryItemType } from '../types';
import Section from './Section';
import HistoryItem from './HistoryItem';
import { HistoryIcon } from './icons/HistoryIcon';

interface HistoryListProps {
    history: HistoryItemType[];
    onView: (id: string) => void;
    onReanalyze: (id: string) => void;
    onDelete: (id: string) => void;
}

const HistoryList: React.FC<HistoryListProps> = ({ history, onView, onReanalyze, onDelete }) => {
    return (
        <div className="mt-12">
             <Section title="Historial de Análisis" icon={<HistoryIcon className="w-6 h-6" />}>
                {history.length > 0 ? (
                    <div className="space-y-4">
                        {history.map(item => (
                            <HistoryItem 
                                key={item.id} 
                                item={item} 
                                onView={onView} 
                                onReanalyze={onReanalyze}
                                onDelete={onDelete}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8 px-4 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg">
                        <p className="text-slate-500 dark:text-slate-400">
                            No hay reportes analizados todavía.
                        </p>
                        <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
                            ¡Sube tu primer PDF para empezar!
                        </p>
                    </div>
                )}
            </Section>
        </div>
    );
};

export default HistoryList;