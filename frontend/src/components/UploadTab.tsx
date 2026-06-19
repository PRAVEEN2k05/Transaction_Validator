import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, FileText, CheckCircle2, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

interface UploadTabProps {
  onUploadSuccess: (fileInfo: any) => void;
  isUploading: boolean;
  setIsUploading: (val: boolean) => void;
  setErrorToast: (msg: string) => void;
}

export const UploadTab: React.FC<UploadTabProps> = ({
  onUploadSuccess,
  isUploading,
  setIsUploading,
  setErrorToast
}) => {
  const [progress, setProgress] = useState(0);
  const [fileDetails, setFileDetails] = useState<{ name: string; size: number } | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    const file = acceptedFiles[0];
    
    // Set file details to display
    setFileDetails({
      name: file.name,
      size: file.size
    });
    
    setIsUploading(true);
    setProgress(0);

    // Simulate progress bar before API completes to give dynamic interaction
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        return prev + 15;
      });
    }, 150);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('use_demo', 'false');

      const response = await fetch('http://localhost:8000/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || 'Failed to upload dataset.');
      }

      const fileInfo = await response.json();
      setProgress(100);
      clearInterval(interval);
      
      setTimeout(() => {
        setIsUploading(false);
        onUploadSuccess(fileInfo);
      }, 500);

    } catch (err: any) {
      clearInterval(interval);
      setIsUploading(false);
      setProgress(0);
      setFileDetails(null);
      setErrorToast(err.message || 'Error uploading file.');
    }
  }, [onUploadSuccess, setIsUploading, setErrorToast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    },
    maxFiles: 1
  });

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = 2;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="glass-card w-full max-w-2xl p-8 rounded-3xl border border-white/20 dark:border-zinc-800 flex flex-col items-center text-center shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />
        
        <h2 className="text-2xl font-bold mb-2 text-zinc-800 dark:text-zinc-100">Upload Transaction Dataset</h2>
        <p className="text-zinc-500 dark:text-zinc-400 text-sm max-w-md mb-8">
          Drag and drop your transaction spreadsheet (.csv, .xlsx, .xls) to validate currencies, country phones, negative prices, duplicate IDs, and format integrity.
        </p>

        {/* Dropzone Container */}
        {!isUploading && !fileDetails && (
          <div
            {...getRootProps()}
            className={`w-full border-2 border-dashed rounded-2xl p-10 cursor-pointer transition-all duration-300 flex flex-col items-center justify-center ${
              isDragActive
                ? 'border-violet-500 bg-violet-500/5 scale-[1.01]'
                : 'border-zinc-300 dark:border-zinc-800 hover:border-violet-500/50 hover:bg-violet-500/2'
            }`}
          >
            <input {...getInputProps()} />
            <div className="p-4 bg-violet-500/10 rounded-full mb-4 text-violet-500 animate-float-slow">
              <UploadCloud className="w-10 h-10" />
            </div>
            
            <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
              {isDragActive ? 'Drop your spreadsheet here...' : 'Drag and drop file here, or click to browse'}
            </p>
            <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-2">
              Supports CSV, XLSX, XLS up to 50MB
            </p>
          </div>
        )}

        {/* Upload Status / Progress Bar */}
        {(isUploading || progress > 0) && fileDetails && (
          <div className="w-full glass-panel rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-violet-500/10 rounded-xl text-violet-500">
                <FileText className="w-6 h-6" />
              </div>
              <div className="flex-1 text-left min-w-0">
                <h4 className="text-sm font-bold text-zinc-800 dark:text-zinc-200 truncate">
                  {fileDetails.name}
                </h4>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {formatBytes(fileDetails.size)}
                </p>
              </div>
              {progress < 100 ? (
                <RefreshCw className="w-5 h-5 text-violet-500 animate-spin" />
              ) : (
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              )}
            </div>

            {/* Progress Track */}
            <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-2 rounded-full overflow-hidden mb-2">
              <motion.div 
                className="bg-gradient-to-r from-violet-600 to-indigo-500 h-full rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.2 }}
              />
            </div>
            
            <div className="flex justify-between items-center text-xs text-zinc-500 dark:text-zinc-400">
              <span>{progress < 100 ? 'Uploading and parsing dataset...' : 'Upload completed'}</span>
              <span className="font-bold">{progress}%</span>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};
