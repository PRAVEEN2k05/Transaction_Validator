import React, { useState } from 'react';
import { 
  FileDown, Layers, Sparkles, AlertCircle, RefreshCw, 
  CheckCircle, ToggleLeft, ToggleRight, ArrowDown 
} from 'lucide-react';

interface ChunkInfo {
  filename: string;
  rows_count: number;
  download_url: string;
}

interface SplitResponse {
  file_id: string;
  is_split: boolean;
  total_chunks: number;
  chunks: ChunkInfo[];
  zip_download_url: string;
}

interface CleaningOptions {
  auto_fix: boolean;
  remove_whitespace: boolean;
  convert_text_case: string;
  remove_duplicates: boolean;
  standardize_dates: boolean;
  replace_null_values: boolean;
  normalize_payment_modes: boolean;
}

interface DownloadTabProps {
  fileId: string;
  totalRows: number;
  isCleaned: boolean;
  setIsCleaned: (val: boolean) => void;
  chunks: SplitResponse | null;
  setChunks: (chunks: SplitResponse) => void;
  onShowToast: (message: string, type: 'success' | 'warning' | 'error') => void;
}

export const DownloadTab: React.FC<DownloadTabProps> = ({
  fileId,
  totalRows,
  isCleaned,
  setIsCleaned,
  chunks,
  setChunks,
  onShowToast
}) => {
  const [isCleaning, setIsCleaning] = useState(false);
  const [isSplitting, setIsSplitting] = useState(false);
  
  // Custom states for cleaning options
  const [options, setOptions] = useState<CleaningOptions>({
    auto_fix: true,
    remove_whitespace: true,
    convert_text_case: 'none',
    remove_duplicates: true,
    standardize_dates: true,
    replace_null_values: true,
    normalize_payment_modes: true
  });

  const toggleOption = (key: keyof CleaningOptions) => {
    if (key === 'auto_fix') {
      const newVal = !options.auto_fix;
      setOptions({
        auto_fix: newVal,
        remove_whitespace: newVal,
        convert_text_case: newVal ? 'none' : 'none',
        remove_duplicates: newVal,
        standardize_dates: newVal,
        replace_null_values: newVal,
        normalize_payment_modes: newVal
      });
    } else {
      setOptions(prev => ({
        ...prev,
        [key]: !prev[key]
      }));
    }
  };

  /*const handleClean = async () => {
    setIsCleaning(true);
    try {
      const response = await fetch('https://transaction-validator-backend-jse9.onrender.com/clean', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          file_id: fileId,
          options: options
        })
      });

      if (!response.ok) {
        throw new Error('Data cleaning service failed.');
      }

      const res = await response.json();
      setIsCleaned(true);
      onShowToast(`Smart cleaning completed! Fixed ${res.fixed_nulls} nulls, ${res.fixed_dates} dates, and filtered ${res.removed_duplicates} duplicates.`, 'success');
      
      // Auto-trigger chunk split if rows > 10,000 (or offer split anyway)
      if (totalRows > 10000) {
        handleSplit(10000);
      }
    } catch (err: any) {
      onShowToast(err.message || 'Cleaning failed.', 'error');
    } finally {
      setIsCleaning(false);
    }
  };*/

  const handleClean = async () => {
  setIsCleaning(true);

  try {
    const response = await fetch(
      'https://transaction-validator-backend-jse9.onrender.com/clean',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          file_id: fileId,
          options: {
            trim_whitespace: options.remove_whitespace,
            standardize_dates: options.standardize_dates,
            replace_nulls: options.replace_null_values,
            normalize_payments: options.normalize_payment_modes,
            remove_duplicates: options.remove_duplicates,
            text_case: options.convert_text_case
          }
        })
      }
    );

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.detail || 'Data cleaning service failed.');
    } 

   // const res = await response.json();

    setIsCleaned(true);

    onShowToast(
      'Smart cleaning completed successfully!',
      'success'
    );

    if (totalRows > 10000) {
      handleSplit(10000);
    }

  } catch (err: any) {
    onShowToast(err.message || 'Cleaning failed.', 'error');
  } finally {
    setIsCleaning(false);
  }
};

  const handleSplit = async (size = 10000) => {
    setIsSplitting(true);
    try {
      const response = await fetch('https://transaction-validator-backend-jse9.onrender.com/split', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          file_id: fileId,
          chunk_size: size
        })
      });

      if (!response.ok) {
        throw new Error('Dataset split operation failed.');
      }

      const res = await response.json();
      setChunks(res);
      onShowToast(`Dataset partitioned into ${res.total_chunks} chunks successfully!`, 'success');
    } catch (err: any) {
      onShowToast(err.message || 'Chunk split failed.', 'error');
    } finally {
      setIsSplitting(false);
    }
  };

  const triggerDownload = async (url: string, filename: string) => {
    try {
      const requestUrl = url.includes('/download/chunks/') 
        ? `https://transaction-validator-backend-jse9.onrender.com${url}`
        : `https://transaction-validator-backend-jse9.onrender.com${url}?file_id=${fileId}`;
        
      const res = await fetch(requestUrl);
      if (!res.ok) throw new Error("Server error occurred during download.");
      
      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = blobUrl;
      
      // Determine file extension and name based on route
      let actualFilename = filename;
      if (url.includes('/download/cleaned')) {
        actualFilename = `cleaned_transactions_${fileId}.csv`;
      } else if (url.includes('/download/report')) {
        actualFilename = `validation_report_${fileId}.csv`;
      } else if (url.includes('/download/errors')) {
        actualFilename = `error_report_${fileId}.csv`;
      } else if (url.includes('/download/chunks') && filename.toLowerCase().includes('zip')) {
        actualFilename = `chunks_${fileId}.zip`;
      } else {
        // Fallback for individual chunks
        actualFilename = filename.endsWith('.csv') ? filename : `${filename}.csv`;
      }
      
      a.download = actualFilename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(blobUrl);
      
      onShowToast(`${filename} downloaded successfully!`, 'success');
    } catch (err: any) {
      onShowToast(`Download failed: ${err.message}`, 'error');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full pb-10">
      
      {/* Smart Cleaning Configurations */}
      <div className="lg:col-span-1 glass-card p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-lg flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 mb-4 border-b border-zinc-200 dark:border-zinc-800 pb-3">
            <Sparkles className="w-5 h-5 text-violet-500" />
            <h3 className="text-md font-bold text-zinc-800 dark:text-zinc-200">Smart AI Cleaning</h3>
          </div>
          
          <p className="text-zinc-500 text-xs leading-relaxed mb-6">
            Apply automated format cleaners to replace null properties with defaults, remove blank rows, standardize payment methods, and clean duplicate transactions.
          </p>

          {/* Toggle Switches */}
          <div className="space-y-4">
            
            {/* Auto Fix Option */}
            <div className="flex justify-between items-center text-xs">
              <div>
                <h4 className="font-bold text-zinc-700 dark:text-zinc-300">1-Click Auto Fix</h4>
                <p className="text-[10px] text-zinc-400">Apply all options automatically</p>
              </div>
              <button onClick={() => toggleOption('auto_fix')}>
                {options.auto_fix ? (
                  <ToggleRight className="w-8 h-8 text-violet-600 dark:text-violet-400" />
                ) : (
                  <ToggleLeft className="w-8 h-8 text-zinc-400" />
                )}
              </button>
            </div>

            {/* Remove Whitespace */}
            <div className="flex justify-between items-center text-xs opacity-80">
              <div>
                <h4 className="font-semibold text-zinc-700 dark:text-zinc-300">Trim Whitespace</h4>
                <p className="text-[10px] text-zinc-400">Strip leading and trailing spaces</p>
              </div>
              <button onClick={() => toggleOption('remove_whitespace')} disabled={options.auto_fix}>
                {options.remove_whitespace ? (
                  <ToggleRight className="w-8 h-8 text-violet-600 dark:text-violet-400" />
                ) : (
                  <ToggleLeft className="w-8 h-8 text-zinc-400" />
                )}
              </button>
            </div>

            {/* Standardize Dates */}
            <div className="flex justify-between items-center text-xs opacity-80">
              <div>
                <h4 className="font-semibold text-zinc-700 dark:text-zinc-300">Standardize Dates</h4>
                <p className="text-[10px] text-zinc-400">Normalize formats to YYYY-MM-DD</p>
              </div>
              <button onClick={() => toggleOption('standardize_dates')} disabled={options.auto_fix}>
                {options.standardize_dates ? (
                  <ToggleRight className="w-8 h-8 text-violet-600 dark:text-violet-400" />
                ) : (
                  <ToggleLeft className="w-8 h-8 text-zinc-400" />
                )}
              </button>
            </div>

            {/* Replace Nulls */}
            <div className="flex justify-between items-center text-xs opacity-80">
              <div>
                <h4 className="font-semibold text-zinc-700 dark:text-zinc-300">Replace Null Values</h4>
                <p className="text-[10px] text-zinc-400">Substitute blanks with default values</p>
              </div>
              <button onClick={() => toggleOption('replace_null_values')} disabled={options.auto_fix}>
                {options.replace_null_values ? (
                  <ToggleRight className="w-8 h-8 text-violet-600 dark:text-violet-400" />
                ) : (
                  <ToggleLeft className="w-8 h-8 text-zinc-400" />
                )}
              </button>
            </div>

            {/* Normalize Payment Mode */}
            <div className="flex justify-between items-center text-xs opacity-80">
              <div>
                <h4 className="font-semibold text-zinc-700 dark:text-zinc-300">Normalize Payments</h4>
                <p className="text-[10px] text-zinc-400">Map aliases to standard categories</p>
              </div>
              <button onClick={() => toggleOption('normalize_payment_modes')} disabled={options.auto_fix}>
                {options.normalize_payment_modes ? (
                  <ToggleRight className="w-8 h-8 text-violet-600 dark:text-violet-400" />
                ) : (
                  <ToggleLeft className="w-8 h-8 text-zinc-400" />
                )}
              </button>
            </div>

            {/* Remove Duplicates */}
            <div className="flex justify-between items-center text-xs opacity-80">
              <div>
                <h4 className="font-semibold text-zinc-700 dark:text-zinc-300">Remove Duplicate IDs</h4>
                <p className="text-[10px] text-zinc-400">Discard duplicate transaction entries</p>
              </div>
              <button onClick={() => toggleOption('remove_duplicates')} disabled={options.auto_fix}>
                {options.remove_duplicates ? (
                  <ToggleRight className="w-8 h-8 text-violet-600 dark:text-violet-400" />
                ) : (
                  <ToggleLeft className="w-8 h-8 text-zinc-400" />
                )}
              </button>
            </div>

            {/* Text Casing Selector */}
            <div className="flex flex-col gap-1.5 opacity-80 pt-2 border-t border-zinc-100 dark:border-zinc-800">
              <label className="text-[10px] uppercase font-bold text-zinc-400">Convert Text Casing</label>
              <select
                value={options.convert_text_case}
                onChange={(e) => setOptions(prev => ({ ...prev, convert_text_case: e.target.value }))}
                disabled={options.auto_fix}
                className="glass-input px-3 py-2 text-xs text-zinc-600 dark:text-zinc-300 bg-white dark:bg-zinc-900"
              >
                <option value="none">No casing transformation</option>
                <option value="upper">UPPERCASE</option>
                <option value="lower">lowercase</option>
                <option value="title">Title Case</option>
              </select>
            </div>

          </div>
        </div>

        <button
          onClick={handleClean}
          disabled={isCleaning}
          className="mt-6 flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-xs font-bold rounded-xl shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-violet-500/20 transition-all duration-300"
        >
          {isCleaning ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              Cleaning Dataset...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Execute Smart Clean
            </>
          )}
        </button>
      </div>

      {/* Exporters / Downloads grid */}
      <div className="lg:col-span-2 flex flex-col gap-6">
        
        {/* Core Downloader Hub */}
        <div className="glass-card p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-lg flex-1">
          <div className="flex items-center gap-2 mb-6 border-b border-zinc-200 dark:border-zinc-800 pb-3">
            <FileDown className="w-5 h-5 text-violet-500" />
            <h3 className="text-md font-bold text-zinc-800 dark:text-zinc-200">Export Center</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Export Card 1: Cleaned CSV */}
            <div className="glass-panel p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between h-40">
              <div>
                <div className="flex items-center justify-between text-xs font-bold text-zinc-700 dark:text-zinc-200">
                  Cleaned CSV
                  {isCleaned && <CheckCircle className="w-4 h-4 text-emerald-500" />}
                </div>
                <p className="text-[10px] text-zinc-400 mt-2">
                  Complete dataset with resolved formatting errors, normalized texts, and standardized date types.
                </p>
              </div>
              <button
                onClick={() => triggerDownload('/download/cleaned', 'Cleaned Dataset CSV')}
                disabled={!isCleaned}
                className="w-full flex items-center justify-center gap-2 py-2 text-xs font-bold bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-zinc-800 dark:hover:bg-zinc-100 rounded-lg transition-colors"
              >
                <ArrowDown className="w-4.5 h-4.5" />
                Download CSV
              </button>
            </div>

            {/* Export Card 2: Validation Report */}
            <div className="glass-panel p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between h-40">
              <div>
                <div className="flex items-center justify-between text-xs font-bold text-zinc-700 dark:text-zinc-200">
                  Validation Report
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                </div>
                <p className="text-[10px] text-zinc-400 mt-2">
                  Dataset containing original lines coupled with validation status, error lists, and AI recommendations.
                </p>
              </div>
              <button
                onClick={() => triggerDownload('/download/report', 'Validation Report CSV')}
                className="w-full flex items-center justify-center gap-2 py-2 text-xs font-bold bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-100 rounded-lg transition-colors"
              >
                <ArrowDown className="w-4.5 h-4.5" />
                Download Report
              </button>
            </div>

            {/* Export Card 3: Errors Report */}
            <div className="glass-panel p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between h-40">
              <div>
                <div className="flex items-center justify-between text-xs font-bold text-zinc-700 dark:text-zinc-200">
                  Errors Report
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                </div>
                <p className="text-[10px] text-zinc-400 mt-2">
                  Isolated list of transaction rows failing validation checks, displaying row indexes and specific errors.
                </p>
              </div>
              <button
                onClick={() => triggerDownload('/download/errors', 'Error Report CSV')}
                className="w-full flex items-center justify-center gap-2 py-2 text-xs font-bold bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-100 rounded-lg transition-colors"
              >
                <ArrowDown className="w-4.5 h-4.5" />
                Download Errors
              </button>
            </div>

          </div>
        </div>

        {/* Dataset Partitioning / Chunk cards list */}
        <div className="glass-card p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-lg flex-1">
          <div className="flex items-center justify-between mb-6 border-b border-zinc-200 dark:border-zinc-800 pb-3">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-violet-500" />
              <h3 className="text-md font-bold text-zinc-800 dark:text-zinc-200">Dataset Chunk Partitioning</h3>
            </div>
            
            {totalRows > 10000 && !chunks && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 border border-amber-500/20 text-amber-500">
                <AlertCircle className="w-3 h-3" />
                Split Required (&gt;10k rows)
              </span>
            )}
          </div>

          <p className="text-zinc-500 text-xs leading-relaxed mb-6">
            For rapid database ingestion, partition large transactions datasets into individual csv chunk files (10,000 rows each) compressed inside a ZIP package.
          </p>

          {/* If not split yet, show trigger button */}
          {!chunks ? (
            <div className="flex flex-col items-center justify-center py-6 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl">
              <button
                onClick={() => handleSplit(10000)}
                disabled={isSplitting}
                className="flex items-center gap-2 px-6 py-3 bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold rounded-lg shadow-sm hover:shadow transition-all disabled:opacity-50"
              >
                {isSplitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Partitioning Dataset...
                  </>
                ) : (
                  <>
                    <Layers className="w-4 h-4" />
                    Partition Dataset (10k chunks)
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              
              {/* ZIP Download button */}
              <div className="flex justify-between items-center bg-violet-500/5 dark:bg-violet-600/5 p-4 border border-violet-500/15 rounded-xl">
                <div className="text-xs">
                  <h4 className="font-bold text-zinc-800 dark:text-zinc-200">All Chunks Archive</h4>
                  <p className="text-[10px] text-zinc-400">Total partitions: {chunks.total_chunks}</p>
                </div>
                <button
                  onClick={() => triggerDownload(chunks.zip_download_url, 'ZIP Chunks Archive')}
                  className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 text-white text-xs font-bold rounded-lg shadow-sm hover:shadow transition-colors"
                >
                  <FileDown className="w-4 h-4" />
                  Download ZIP
                </button>
              </div>

              {/* Chunk list cards scroll */}
              <div className="max-h-48 overflow-y-auto space-y-2.5 pr-1">
                {chunks.chunks.map((item) => (
                  <div 
                    key={item.filename}
                    className="flex justify-between items-center p-3 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors"
                  >
                    <div>
                      <span className="font-bold text-zinc-700 dark:text-zinc-200">{item.filename}</span>
                      <span className="text-[10px] text-zinc-400 ml-3">Rows: {item.rows_count}</span>
                    </div>
                    <button
                      onClick={() => triggerDownload(item.download_url, item.filename)}
                      className="text-violet-600 dark:text-violet-400 font-bold hover:underline"
                    >
                      Download CSV
                    </button>
                  </div>
                ))}
              </div>

            </div>
          )}

        </div>

      </div>

    </div>
  );
};
