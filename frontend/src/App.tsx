import { useState, useEffect } from 'react';
import { 
  ShieldCheck, UploadCloud, Cpu, FileDown, 
  Sun, Moon, LayoutDashboard, ArrowLeft 
} from 'lucide-react';
import { LandingPage } from './pages/LandingPage';
import { UploadTab } from './components/UploadTab';
import { DashboardTab } from './components/DashboardTab';
import { ValidationResultsTab } from './components/ValidationResultsTab';
import { DownloadTab } from './components/DownloadTab';
import { Toast } from './components/Toast';

type ViewState = 'landing' | 'app';
type TabState = 'upload' | 'dashboard' | 'results' | 'download';

interface FileInfo {
  file_id: string;
  filename: string;
  file_size: number;
  total_rows: number;
  columns: string[];
  preview: any[];
}

interface ValidationRow {
  row_index: number;
  status: string;
  errors: string[];
  suggestion: string | null;
  data: Record<string, string>;
}

interface ValidationInfo {
  file_id: string;
  stats: {
    total_rows: number;
    valid_records: number;
    invalid_records: number;
    countries_detected: number;
    validation_accuracy: number;
  };
  charts: {
    payment_mode_distribution: Array<{ name: string; value: number }>;
    transactions_by_country: Array<{ country: string; count: number }>;
    daily_orders: Array<{ date: string; count: number }>;
    error_distribution: Array<{ name: string; value: number }>;
  };
  validation_results: ValidationRow[];
  errors_summary: any[];
}

function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [view, setView] = useState<ViewState>('landing');
  const [activeTab, setActiveTab] = useState<TabState>('upload');
  
  // Global Upload & Validation State
  const [fileInfo, setFileInfo] = useState<FileInfo | null>(null);
  const [validationInfo, setValidationInfo] = useState<ValidationInfo | null>(null);
  const [chunksInfo, setChunksInfo] = useState<any | null>(null);
  const [isCleaned, setIsCleaned] = useState(false);
  const [activeStep, setActiveStep] = useState(1); // 1: Upload, 2: Validate, 3: Clean, 4: Chunk, 5: Download
  
  // Loader States
  const [isUploading, setIsUploading] = useState(false);
  const [isValidating, setIsValidating] = useState(false);

  // Toast notifications
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'warning' | 'error' | null;
    show: boolean;
  }>({
    message: '',
    type: null,
    show: false
  });

  // Apply Theme class on root element
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  const handleShowToast = (message: string, type: 'success' | 'warning' | 'error') => {
    setToast({ message, type, show: true });
  };

  const handleUploadSuccess = async (uploadedFile: FileInfo) => {
    setFileInfo(uploadedFile);
    setIsCleaned(false);
    setChunksInfo(null);
    setActiveStep(1); // Reset to uploaded
    
    // Automatically trigger validation run
    await triggerValidation(uploadedFile.file_id);
  };

  const triggerValidation = async (fileId: string) => {
    setIsValidating(true);
    setActiveTab('dashboard'); // Redirect to dashboard tab to show logs
    
    try {
      const response = await fetch('http://localhost:8000/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file_id: fileId }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || 'Validation failed.');
      }

      const report = await response.json();
      setValidationInfo(report);
      setActiveStep(2); // Set status to Validated
      handleShowToast('Dataset validation completed successfully!', 'success');
    } catch (err: any) {
      handleShowToast(err.message || 'Validation failed.', 'error');
      // Take back to upload if validation errors out
      setActiveTab('upload');
    } finally {
      setIsValidating(false);
    }
  };

  const handleStartDemo = async () => {
    setView('app');
    setIsUploading(true);
    setActiveTab('upload');
    setFileInfo(null);
    setValidationInfo(null);
    setChunksInfo(null);
    setIsCleaned(false);
    setActiveStep(1);

    try {
      const formData = new FormData();
      formData.append('use_demo', 'true');

      const response = await fetch('http://localhost:8000/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to load demo dataset.');
      }

      const demoFile = await response.json();
      setFileInfo(demoFile);
      setIsUploading(false);
      handleShowToast('Demo transaction dataset uploaded!', 'success');
      
      // Auto-validate demo dataset
      await triggerValidation(demoFile.file_id);
    } catch (err: any) {
      setIsUploading(false);
      handleShowToast(err.message || 'Error loading demo data.', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground transition-all duration-300 relative flex flex-col">
      
      {/* Top Navbar */}
      <header className="glass-panel sticky top-0 z-40 border-b border-white/10 w-full px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {view === 'app' && (
            <button 
              onClick={() => { setView('landing'); }}
              className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              title="Return to Landing Page"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <div className="flex items-center gap-2">
            <div className="p-2 bg-violet-600 rounded-xl text-white">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <span className="font-extrabold text-sm md:text-md bg-gradient-to-r from-zinc-800 to-zinc-600 dark:from-white dark:to-zinc-300 bg-clip-text text-transparent">
              Global Transaction Validator AI
            </span>
          </div>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-4">
          {fileInfo && view === 'app' && (
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-violet-600/10 text-violet-600 dark:text-violet-400 border border-violet-500/20">
              Active File: <strong className="truncate max-w-[120px]">{fileInfo.filename}</strong>
            </span>
          )}
          
          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-xl glass-button text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-white transition-colors"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-6">
        {view === 'landing' ? (
          <LandingPage 
            onStartUpload={() => { setView('app'); setActiveTab('upload'); }} 
            onStartDemo={handleStartDemo} 
          />
        ) : (
          <div className="py-6 flex flex-col gap-6">
            
            {/* Navigation Tabs Bar */}
            <div className="glass-panel p-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 flex gap-2 w-fit">
              
              <button
                onClick={() => setActiveTab('upload')}
                className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                  activeTab === 'upload' 
                    ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 shadow-sm' 
                    : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                }`}
              >
                <UploadCloud className="w-4 h-4" />
                Upload Center
              </button>

              <button
                onClick={() => setActiveTab('dashboard')}
                disabled={!fileInfo}
                className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                  activeTab === 'dashboard' 
                    ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 shadow-sm' 
                    : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                Dashboard Analytics
              </button>

              <button
                onClick={() => setActiveTab('results')}
                disabled={!validationInfo}
                className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                  activeTab === 'results' 
                    ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 shadow-sm' 
                    : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                }`}
              >
                <Cpu className="w-4 h-4" />
                Validation Results
              </button>

              <button
                onClick={() => setActiveTab('download')}
                disabled={!validationInfo}
                className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                  activeTab === 'download' 
                    ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 shadow-sm' 
                    : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                }`}
              >
                <FileDown className="w-4 h-4" />
                Download Center
              </button>

            </div>

            {/* Active Workspace View */}
            <div className="w-full">
              {activeTab === 'upload' && (
                <UploadTab 
                  onUploadSuccess={handleUploadSuccess}
                  isUploading={isUploading}
                  setIsUploading={setIsUploading}
                  setErrorToast={(msg) => handleShowToast(msg, 'error')}
                />
              )}

              {activeTab === 'dashboard' && (
                <DashboardTab 
                  stats={validationInfo?.stats || null}
                  charts={validationInfo?.charts || null}
                  theme={theme}
                  isValidating={isValidating}
                  activeStep={activeStep}
                />
              )}

              {activeTab === 'results' && validationInfo && (
                <ValidationResultsTab 
                  results={validationInfo.validation_results} 
                />
              )}

              {activeTab === 'download' && fileInfo && (
                <DownloadTab 
                  fileId={fileInfo.file_id}
                  totalRows={fileInfo.total_rows}
                  isCleaned={isCleaned}
                  setIsCleaned={(val) => {
                    setIsCleaned(val);
                    if (val) setActiveStep(3); // Increment step to Cleaned
                  }}
                  chunks={chunksInfo}
                  setChunks={(ch) => {
                    setChunksInfo(ch);
                    setActiveStep(4); // Increment step to Chunked
                  }}
                  onShowToast={handleShowToast}
                />
              )}
            </div>

          </div>
        )}
      </main>

      {/* Global Toast component */}
      <Toast 
        message={toast.message} 
        type={toast.type} 
        show={toast.show} 
        onClose={() => setToast(prev => ({ ...prev, show: false }))} 
      />
    </div>
  );
}

export default App;
