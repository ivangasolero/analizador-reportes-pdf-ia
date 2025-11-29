
import React from 'react';
import type { Metric } from '../types';

interface MetricCardProps {
    metric: Metric;
}

const MetricCard: React.FC<MetricCardProps> = ({ metric }) => {
    return (
        <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg shadow-md border border-slate-200 dark:border-slate-700 transform hover:scale-105 hover:shadow-xl transition-all duration-300 animate-slide-up">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 truncate">{metric.metric}</p>
            <p className="text-3xl font-bold text-brand-primary dark:text-indigo-400 mt-1">{metric.value}</p>
            {metric.context && (
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">{metric.context}</p>
            )}
        </div>
    );
};

export default MetricCard;
