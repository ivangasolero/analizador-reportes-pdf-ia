import type { HistoryItem } from '../types';

const HISTORY_KEY = 'pdf_analyzer_history';

export const loadHistory = (): HistoryItem[] => {
    try {
        const storedHistory = localStorage.getItem(HISTORY_KEY);
        if (storedHistory) {
            return JSON.parse(storedHistory);
        }
    } catch (error) {
        console.error("Failed to load history from localStorage:", error);
    }
    return [];
};

export const saveHistory = (history: HistoryItem[]): void => {
    try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    } catch (error) {
        console.error("Failed to save history to localStorage:", error);
    }
};
