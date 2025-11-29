import React, { useState, useCallback, useEffect } from 'react';
import type { AnalysisResult, HistoryItem, ReportFeedback, ConsolidatedAnalysis, ReportRole } from './types';
import { analyzeReport, getReportFeedback, getConsolidatedAnalysis } from './services/geminiService';
import { extractTextFromPDF } from './services/pdfService';
import { loadHistory, saveHistory } from './utils/localStorage';
import { fileToBase64, base64ToFile, downloadAnalysis } from './utils/fileUtils';
import { generatePdf } from './utils/pdfGenerator';
import FileUpload from './components/FileUpload';
import AnalysisDisplay from './components/AnalysisDisplay';
import HistoryList from './components/HistoryList';
import ConsolidatedAnalysisDisplay from './components/ConsolidatedAnalysisDisplay';
import { DocumentMagnifyingGlassIcon } from './components/icons/DocumentMagnifyingGlassIcon';

const App: React.FC = () => {
    const [file, setFile] = useState<File | null>(null);
    const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [history, setHistory] = useState<HistoryItem[]>([]);
    
    const [reportFeedback, setReportFeedback] = useState<ReportFeedback | null>(null);
    const [isFeedbackLoading, setIsFeedbackLoading] = useState<boolean>(false);
    const [feedbackError, setFeedbackError] = useState<string | null>(null);

    const [consolidatedAnalysis, setConsolidatedAnalysis] = useState<ConsolidatedAnalysis | null>(null);
    const [isConsolidatedLoading, setIsConsolidatedLoading] = useState<boolean>(false);
    const [consolidatedError, setConsolidatedError] = useState<string | null>(null);

    useEffect(() => {
        setHistory(loadHistory());
    }, []);

    // Effect to trigger consolidated analysis
    useEffect(() => {
        const checkAndRunConsolidatedAnalysis = async () => {
            const requiredRoles: ReportRole[] = ['Marketing', 'Administración', 'Soporte y Herramientas', 'Análisis'];
            const availableRoles = new Set(history.map(item => item.analysisResult.detectedRole));
            
            const hasAllRequiredRoles = requiredRoles.every(role => availableRoles.has(role));

            if (hasAllRequiredRoles && history.length > 0) {
                 // The history is already sorted, so find will get the latest one
                const reportsToAnalyze = requiredRoles.map(role => {
                    const latestReport = history.find(item => item.analysisResult.detectedRole === role);
                    return latestReport ? { role: latestReport.analysisResult.detectedRole, text: latestReport.extractedText, timestamp: latestReport.timestamp } : null;
                }).filter((item): item is NonNullable<typeof item> => item !== null);

                if (reportsToAnalyze.length < requiredRoles.length) return;

                const lastAnalysisTime = Math.max(...reportsToAnalyze.map(r => r.timestamp));
                const consolidatedTimestamp = localStorage.getItem('consolidatedTimestamp');
                
                if (consolidatedTimestamp && parseInt(consolidatedTimestamp, 10) >= lastAnalysisTime) {
                    // check if consolidatedAnalysis is already in state
                    if(consolidatedAnalysis) return;
                }

                setIsConsolidatedLoading(true);
                setConsolidatedError(null);
                try {
                    const analysisPayload = reportsToAnalyze.map(({ role, text }) => ({ role, text }));
                    const result = await getConsolidatedAnalysis(analysisPayload);
                    setConsolidatedAnalysis(result);
                    localStorage.setItem('consolidatedTimestamp', lastAnalysisTime.toString());
                } catch (err: any) {
                    setConsolidatedError(err.message || "Error al generar análisis consolidado.");
                } finally {
                    setIsConsolidatedLoading(false);
                }
            } else {
                // If we no longer meet the criteria, clear the old analysis
                if (consolidatedAnalysis) {
                    setConsolidatedAnalysis(null);
                    localStorage.removeItem('consolidatedTimestamp');
                }
            }
        };

        checkAndRunConsolidatedAnalysis();
    }, [history, consolidatedAnalysis]);

    const updateHistory = (newHistory: HistoryItem[]) => {
        const sortedHistory = newHistory.sort((a, b) => b.timestamp - a.timestamp);
        setHistory(sortedHistory);
        saveHistory(sortedHistory);
    }

    const handleFileChange = (selectedFile: File | null) => {
        setFile(selectedFile);
        setError(null);
        setReportFeedback(null);
        setFeedbackError(null);
    };

    const performAnalysis = useCallback(async (pdfFile: File) => {
        setIsLoading(true);
        setError(null);
        setAnalysisResult(null);
        setReportFeedback(null);
        setFeedbackError(null);

        try {
            const extractedText = await extractTextFromPDF(pdfFile);
            if (!extractedText.trim()) {
                throw new Error("No se pudo extraer texto del PDF o el archivo está vacío.");
            }
            
            const result = await analyzeReport(extractedText);
            setAnalysisResult(result);

            const fileContent = await fileToBase64(pdfFile);
            const newHistoryItem: HistoryItem = {
                id: `${Date.now()}-${pdfFile.name}`,
                fileName: pdfFile.name,
                fileContent,
                extractedText,
                analysisResult: result,
                reportFeedback: null,
                timestamp: Date.now()
            };
            
            const filteredHistory = history.filter(item => item.fileName !== pdfFile.name);
            updateHistory([newHistoryItem, ...filteredHistory]);

        } catch (err: any) {
            console.error("Analysis failed:", err);
            setError(err.message || "Ocurrió un error inesperado durante el análisis.");
        } finally {
            setIsLoading(false);
        }
    }, [history]);


    const handleAnalyzeClick = useCallback(async () => {
        if (!file) {
            setError("Por favor, selecciona un archivo PDF primero.");
            return;
        }
        await performAnalysis(file);
    }, [file, performAnalysis]);


    const handleReset = () => {
        setFile(null);
        setAnalysisResult(null);
        setError(null);
        setIsLoading(false);
        setReportFeedback(null);
        setFeedbackError(null);
        setIsFeedbackLoading(false);
    }

    const handleDownloadMd = () => {
        if (analysisResult && file) {
            downloadAnalysis(analysisResult, file.name, reportFeedback);
        }
    };
    
    const handleDownloadPdf = () => {
        if(analysisResult && file) {
            generatePdf(analysisResult, file.name, reportFeedback);
        }
    }

    const handleViewHistory = (id: string) => {
        const item = history.find(h => h.id === id);
        if (item) {
            setFile(base64ToFile(item.fileContent, item.fileName));
            setAnalysisResult(item.analysisResult);
            setReportFeedback(item.reportFeedback || null);
            setError(null);
            setFeedbackError(null);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }

    const handleReanalyzeHistory = (id: string) => {
        const item = history.find(h => h.id === id);
        if (item) {
            const fileToReanalyze = base64ToFile(item.fileContent, item.fileName);
            setFile(fileToReanalyze);
            setAnalysisResult(null);
            setReportFeedback(null);
            setError(null);
            setFeedbackError(null);
            window.scrollTo({ top: 0, behavior: 'smooth' });
            performAnalysis(fileToReanalyze);
        }
    }

    const handleDeleteHistory = (id: string) => {
        const itemToDelete = history.find(h => h.id === id);
        const newHistory = history.filter(h => h.id !== id);
        updateHistory(newHistory);
        
        if (itemToDelete && file && itemToDelete.fileName === file.name) {
            handleReset();
        }
    };
    
    const handleGetFeedback = useCallback(async () => {
        if (!file || !analysisResult) {
            setFeedbackError("No se puede obtener feedback sin un archivo y un análisis previo.");
            return;
        }
        
        setIsFeedbackLoading(true);
        setFeedbackError(null);
        setReportFeedback(null);
        
        try {
            const extractedText = await extractTextFromPDF(file);
            // FIX: Corrected typo from getReportfeedback to getReportFeedback
            const feedback = await getReportFeedback(extractedText);
            setReportFeedback(feedback);
            
            const currentItemIndex = history.findIndex(h => h.fileName === file.name);
            if (currentItemIndex > -1) {
                const updatedItem = { ...history[currentItemIndex], reportFeedback: feedback };
                const newHistory = [...history];
                newHistory[currentItemIndex] = updatedItem;
                updateHistory(newHistory);
            }
            
        } catch (err: any) {
            setFeedbackError(err.message || "Ocurrió un error inesperado al obtener el feedback.");
        } finally {
            setIsFeedbackLoading(false);
        }
    }, [file, analysisResult, history]);


    const renderMainContent = () => {
        if (isLoading) {
             return (
                 <div className="flex flex-col items-center justify-center text-center p-8 min-h-[200px]">
                     <svg className="animate-spin h-10 w-10 text-brand-primary mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                         <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                         <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                     </svg>
                     <p className="text-lg font-semibold text-slate-700 dark:text-slate-300">Analizando tu reporte...</p>
                     <p className="text-sm text-slate-500 dark:text-slate-400">Esto puede tardar unos segundos.</p>
                 </div>
            );
        }

        if (analysisResult) {
            return <AnalysisDisplay 
                        result={analysisResult} 
                        onReset={handleReset} 
                        fileName={file?.name || ''} 
                        onDownloadMd={handleDownloadMd} 
                        onDownloadPdf={handleDownloadPdf}
                        onGetFeedback={handleGetFeedback}
                        feedback={reportFeedback}
                        isFeedbackLoading={isFeedbackLoading}
                        feedbackError={feedbackError}
                    />;
        }
        
        return (
            <div className="flex flex-col items-center animate-fade-in">
                <FileUpload onFileChange={handleFileChange} file={file} />
                {error && (
                    <div className="mt-4 text-center text-red-500 bg-red-100 dark:bg-red-900/50 border border-red-500 rounded-lg p-3 w-full max-w-lg">
                        <p><strong>Error:</strong> {error}</p>
                    </div>
                )}
                <button
                    onClick={handleAnalyzeClick}
                    disabled={!file || isLoading}
                    className="mt-6 flex items-center justify-center gap-2 w-full max-w-xs px-6 py-3 bg-brand-primary text-white font-bold rounded-lg shadow-lg hover:bg-indigo-700 disabled:bg-slate-400 disabled:cursor-not-allowed transform hover:scale-105 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-indigo-500/50"
                >
                    <DocumentMagnifyingGlassIcon className="w-6 h-6" />
                    Analizar Reporte
                </button>
            </div>
        );
    }


    return (
        <div className="min-h-screen bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200 flex flex-col items-center p-4 sm:p-6 lg:p-8">
            <div className="w-full max-w-4xl mx-auto">
                <header className="text-center mb-8 animate-fade-in">
                    <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-brand-secondary">
                        Analizador de Reportes PDF
                    </h1>
                    <p className="mt-2 text-lg text-slate-600 dark:text-slate-400">
                        Sube un reporte y obtén un análisis detallado con IA en segundos.
                    </p>
                </header>

                <main className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8 transition-all duration-300">
                   {renderMainContent()}
                </main>

                {(isConsolidatedLoading || consolidatedError || consolidatedAnalysis) && (
                    <div className="w-full max-w-4xl mx-auto mt-8">
                        <ConsolidatedAnalysisDisplay 
                            analysis={consolidatedAnalysis}
                            isLoading={isConsolidatedLoading}
                            error={consolidatedError}
                        />
                    </div>
                )}
                
                 <footer className="text-center mt-8 text-slate-500 dark:text-slate-400 text-sm">
                    <p>Potenciado por Google Gemini</p>
                </footer>
            </div>

            <div className="w-full max-w-4xl mx-auto">
                <HistoryList 
                    history={history} 
                    onView={handleViewHistory} 
                    onReanalyze={handleReanalyzeHistory} 
                    onDelete={handleDeleteHistory}
                />
            </div>
        </div>
    );
};

export default App;