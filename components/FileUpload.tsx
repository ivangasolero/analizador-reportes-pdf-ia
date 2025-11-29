import React, { useState, useCallback, useRef, useEffect } from 'react';
import { DocumentArrowUpIcon } from './icons/DocumentArrowUpIcon';
import { DocumentIcon } from './icons/DocumentIcon';

interface FileUploadProps {
    onFileChange: (file: File | null) => void;
    file?: File | null;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileChange, file }) => {
    const [isDragging, setIsDragging] = useState(false);
    const [fileName, setFileName] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setFileName(file?.name || null);
    }, [file]);

    const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
    }, []);

    const handleFile = useCallback((selectedFile: File | null) => {
        if (selectedFile && selectedFile.type === 'application/pdf') {
            setFileName(selectedFile.name);
            onFileChange(selectedFile);
        } else {
            setFileName(null);
            onFileChange(null);
            // Optionally show an error message
        }
    }, [onFileChange]);

    const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
            handleFile(files[0]);
        }
    }, [handleFile]);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            handleFile(files[0]);
        }
    };
    
    const handleButtonClick = () => {
        fileInputRef.current?.click();
    };

    return (
        <div 
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={handleButtonClick}
            className={`w-full max-w-lg p-8 border-2 border-dashed rounded-lg text-center cursor-pointer transition-all duration-300 ${
                isDragging 
                ? 'border-brand-primary bg-indigo-50 dark:bg-indigo-900/30' 
                : 'border-slate-300 dark:border-slate-600 hover:border-brand-primary hover:bg-slate-50 dark:hover:bg-slate-700/50'
            }`}
        >
            <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileSelect} 
                className="hidden" 
                accept="application/pdf"
            />
            {fileName ? (
                <div className="flex flex-col items-center text-brand-secondary">
                    <DocumentIcon className="w-16 h-16 mb-4" />
                    <p className="font-semibold text-lg">{fileName}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Archivo seleccionado. ¡Listo para analizar!</p>
                </div>
            ) : (
                <div className="flex flex-col items-center text-slate-500 dark:text-slate-400">
                    <DocumentArrowUpIcon className="w-16 h-16 mb-4" />
                    <p className="font-semibold text-lg">Arrastra y suelta tu reporte PDF aquí</p>
                    <p className="text-sm mt-1">o <span className="text-brand-primary font-bold">haz clic para seleccionar un archivo</span></p>
                    <p className="text-xs mt-4 text-slate-400 dark:text-slate-500">Solo se aceptan archivos PDF</p>
                </div>
            )}
        </div>
    );
};

export default FileUpload;