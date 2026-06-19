import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Database, CheckSquare, AlertTriangle, Globe, Percent, 
  FileSpreadsheet, Cpu, Sparkles, Download, CheckCircle2 
} from 'lucide-react';
import { AnalyticsCharts } from '../charts/AnalyticsCharts';

interface ValidationStats {
  total_rows: number;
  valid_records: number;
  invalid_records: number;
  countries_detected: number;
  validation_accuracy: number;
}

interface LiveLog {
  time: string;
  msg: string;
  status: 'info' | 'success' | 'warn';
}

interface DashboardTabProps {
  stats: ValidationStats | null;
  charts: any;
  theme: 'light' | 'dark';
  isValidating: boolean;
  activeStep: number;  // 1: Uploaded, 2: Validated, 3: Cleaned, 4: Chunked, 5: Downloaded
}

// Simple CountUp component for animating stats numbers
const CountUp: React.FC<{ value: number; decimals?: number; duration?: number }> = ({ 
  value, 
  decimals = 0, 
  duration = 1000 
}) => {
  const [currentVal, setCurrentVal] = useState(0);

  useEffect(() => {
    let startTime: number | null = null;
    const startVal = 0;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = timestamp - startTime;
      const progressFraction = Math.min(progress / duration, 1);
      
      // Easing out quadratic
      const easeVal = progressFraction * (2 - progressFraction);
      setCurrentVal(startVal + easeVal * (value - startVal));

      if (progressFraction < 1) {
        requestAnimationFrame(animate);
      } else {
        setCurrentVal(value);
      }
    };

    requestAnimationFrame(animate);
  }, [value, duration]);

  return <span>{currentVal.toFixed(decimals)}</span>;
};

export const DashboardTab: React.FC<DashboardTabProps> = ({
  stats,
  charts,
  theme,
  isValidating,
  activeStep
}) => {
  const [liveLogs, setLiveLogs] = useState<LiveLog[]>([]);

  const rawLogs: LiveLog[] = [
    { time: '17:02:26', msg: 'Initiating dataset parser...', status: 'info' },
    { time: '17:02:27', msg: 'Columns mapping detected: order_id, customer_name, country, phone, transaction_date...', status: 'info' },
    { time: '17:02:27', msg: 'Running row-by-row phone length enforcer...', status: 'info' },
    { time: '17:02:28', msg: 'Warning: Phone number format mismatches flagged for Singapore rows', status: 'warn' },
    { time: '17:02:28', msg: 'Parsing dates against ISO and local configurations...', status: 'info' },
    { time: '17:02:29', msg: 'Identifying leap-year limits and rejecting invalid boundary days...', status: 'info' },
    { time: '17:02:29', msg: 'Checking Order ID uniqueness constraints...', status: 'info' },
    { time: '17:02:30', msg: 'Generating AI explanations and smart fix suggestions...', status: 'info' },
    { time: '17:02:30', msg: 'Validation completed successfully.', status: 'success' }
  ];

  // Simulate streaming log activity on load or when validating completes
  useEffect(() => {
    if (stats) {
      setLiveLogs([]);
      
      let index = 0;
      const interval = setInterval(() => {
        if (index < rawLogs.length) {
          setLiveLogs((prevLogs) => [...prevLogs, rawLogs[index]]);
          index++;
        } else {
          clearInterval(interval);
        }
      }, 700);

      return () => clearInterval(interval);
    }
  }, [stats]);

  if (isValidating) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <div className="relative w-20 h-20 mb-6">
          <div className="absolute inset-0 rounded-full border-4 border-t-violet-600 border-r-transparent border-b-transparent border-l-transparent animate-spin" />
          <Cpu className="absolute inset-0 m-auto text-violet-500 w-8 h-8 animate-pulse" />
        </div>
        <h3 className="text-lg font-bold text-zinc-700 dark:text-zinc-300">Processing transaction records...</h3>
        <p className="text-zinc-500 text-sm mt-1 animate-pulse">Running AI validation checks and structural cleaning.</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-6">
        <Database className="w-16 h-16 text-zinc-300 dark:text-zinc-800 mb-4 animate-bounce-slow" />
        <h3 className="text-lg font-bold text-zinc-700 dark:text-zinc-300">No Transaction Data Active</h3>
        <p className="text-zinc-500 text-sm mt-1 max-w-sm">
          Please upload a transaction dataset or load the demo file to view validation analytics.
        </p>
      </div>
    );
  }

  // Pipeline steps definition
  const steps = [
    { label: 'Upload', icon: <FileSpreadsheet className="w-4 h-4" />, step: 1 },
    { label: 'Validate', icon: <Cpu className="w-4 h-4" />, step: 2 },
    { label: 'Clean', icon: <Sparkles className="w-4 h-4" />, step: 3 },
    { label: 'Chunk', icon: <Database className="w-4 h-4" />, step: 4 },
    { label: 'Download', icon: <Download className="w-4 h-4" />, step: 5 }
  ];

  // Calculate country heatmap relative weightings for visual representation
  const countryCounts = charts?.transactions_by_country || [];
  const maxCountryVal = countryCounts.length > 0 ? Math.max(...countryCounts.map((c: any) => c.count)) : 1;

  return (
    <div className="flex flex-col gap-6 w-full pb-10">
      
      {/* 1. Validation Timeline Pipeline */}
      <div className="glass-card p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-lg">
        <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-6">Validation Pipeline</h3>
        <div className="flex flex-col md:flex-row items-center justify-between w-full gap-4 md:gap-2">
          {steps.map((item, idx) => {
            const isCompleted = item.step <= activeStep;
            return (
              <React.Fragment key={item.label}>
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl border ${
                    isCompleted 
                      ? 'bg-violet-600/10 border-violet-500 text-violet-600 dark:text-violet-400' 
                      : 'bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-400 dark:text-zinc-600'
                  } transition-all duration-300 relative`}>
                    {item.icon}
                    {isCompleted && item.step < activeStep && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 absolute -top-1 -right-1 bg-white dark:bg-zinc-950 rounded-full" />
                    )}
                  </div>
                  <div>
                    <h4 className={`text-sm font-bold ${
                      isCompleted ? 'text-zinc-800 dark:text-zinc-200' : 'text-zinc-400 dark:text-zinc-600'
                    }`}>
                      {item.label}
                    </h4>
                    <span className="text-[10px] text-zinc-400">
                      {item.step < activeStep ? 'Done' : item.step === activeStep ? 'Active' : 'Pending'}
                    </span>
                  </div>
                </div>
                {idx < steps.length - 1 && (
                  <div className="hidden md:block flex-1 h-[2px] mx-4 relative overflow-hidden bg-zinc-200 dark:bg-zinc-800">
                    <motion.div 
                      className="h-full bg-gradient-to-r from-violet-500 to-indigo-500" 
                      initial={{ width: 0 }}
                      animate={{ width: isCompleted ? '100%' : '0%' }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* 2. Statistical Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        
        {/* Metric 1: Total Rows */}
        <motion.div 
          whileHover={{ y: -4 }}
          className="glass-card p-6 rounded-2xl relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Database className="w-12 h-12" />
          </div>
          <span className="text-zinc-400 text-xs font-semibold">Total Rows</span>
          <h3 className="text-3xl font-extrabold text-zinc-800 dark:text-white mt-2">
            <CountUp value={stats.total_rows} />
          </h3>
          <p className="text-[10px] text-zinc-500 mt-2">Parsed lines of transactions</p>
        </motion.div>

        {/* Metric 2: Valid Records */}
        <motion.div 
          whileHover={{ y: -4 }}
          className="glass-card p-6 rounded-2xl relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-4 opacity-10 text-emerald-500">
            <CheckSquare className="w-12 h-12" />
          </div>
          <span className="text-zinc-400 text-xs font-semibold">Valid Records</span>
          <h3 className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-2">
            <CountUp value={stats.valid_records} />
          </h3>
          <p className="text-[10px] text-emerald-600/70 dark:text-emerald-400/70 mt-2">Clean rows passed checks</p>
        </motion.div>

        {/* Metric 3: Invalid Records */}
        <motion.div 
          whileHover={{ y: -4 }}
          className="glass-card p-6 rounded-2xl relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-4 opacity-10 text-rose-500">
            <AlertTriangle className="w-12 h-12" />
          </div>
          <span className="text-zinc-400 text-xs font-semibold">Invalid Records</span>
          <h3 className="text-3xl font-extrabold text-rose-600 dark:text-rose-400 mt-2">
            <CountUp value={stats.invalid_records} />
          </h3>
          <p className="text-[10px] text-rose-600/70 dark:text-rose-400/70 mt-2">Failed formatting/logic</p>
        </motion.div>

        {/* Metric 4: Countries Detected */}
        <motion.div 
          whileHover={{ y: -4 }}
          className="glass-card p-6 rounded-2xl relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-4 opacity-10 text-violet-500">
            <Globe className="w-12 h-12" />
          </div>
          <span className="text-zinc-400 text-xs font-semibold">Countries Detected</span>
          <h3 className="text-3xl font-extrabold text-zinc-800 dark:text-white mt-2">
            <CountUp value={stats.countries_detected} />
          </h3>
          <p className="text-[10px] text-zinc-500 mt-2">Diverse geographic scope</p>
        </motion.div>

        {/* Metric 5: Accuracy */}
        <motion.div 
          whileHover={{ y: -4 }}
          className="glass-card p-6 rounded-2xl relative overflow-hidden bg-gradient-to-br from-white/80 to-zinc-50/50 dark:from-zinc-900/60 dark:to-zinc-950/20"
        >
          <div className="absolute top-0 right-0 p-4 opacity-10 text-violet-500">
            <Percent className="w-12 h-12" />
          </div>
          <span className="text-zinc-400 text-xs font-semibold text-violet-600 dark:text-violet-400">Validation Accuracy</span>
          <h3 className="text-3xl font-extrabold bg-gradient-to-r from-violet-600 to-indigo-500 bg-clip-text text-transparent mt-2">
            <CountUp value={stats.validation_accuracy} decimals={2} />%
          </h3>
          <p className="text-[10px] text-violet-500/70 mt-2">Overall pass-through rate</p>
        </motion.div>

      </div>

      {/* 3. Live Activity Streaming & Country Heatmap List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full">
        
        {/* Live Activity Panel */}
        <div className="lg:col-span-2 glass-card p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col h-[320px]">
          <div className="flex items-center justify-between mb-4 border-b border-zinc-200 dark:border-zinc-800 pb-3">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-violet-500 animate-pulse" />
              <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200">Live Validation Stream</h3>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span className="text-[10px] text-zinc-400">Engine Active</span>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-3 font-mono text-xs pr-1">
            <AnimatePresence>
              {liveLogs.map((log, idx) => (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  key={idx}
                  className={`flex gap-3 leading-relaxed ${
                    log.status === 'success' 
                      ? 'text-emerald-500 font-semibold' 
                      : log.status === 'warn' 
                        ? 'text-amber-500' 
                        : 'text-zinc-600 dark:text-zinc-400'
                  }`}
                >
                  <span className="text-zinc-400 dark:text-zinc-600 select-none">[{log.time}]</span>
                  <span className="flex-1">{log.msg}</span>
                </motion.div>
              ))}
            </AnimatePresence>
            <div className="h-2" />
          </div>
        </div>

        {/* Country Density Heatmap List */}
        <div className="glass-card p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col h-[320px]">
          <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200 mb-4 border-b border-zinc-200 dark:border-zinc-800 pb-3 flex items-center gap-2">
            <Globe className="w-4 h-4 text-violet-500" />
            Detected Country Density
          </h3>
          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            {countryCounts.length > 0 ? (
              countryCounts.map((entry: any) => {
                const widthPercent = (entry.count / maxCountryVal) * 100;
                return (
                  <div key={entry.country} className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-zinc-700 dark:text-zinc-300">{entry.country}</span>
                      <span className="text-zinc-500 font-bold">{entry.count} txs</span>
                    </div>
                    <div className="w-full bg-zinc-100 dark:bg-zinc-800/80 h-2 rounded-full overflow-hidden">
                      <motion.div 
                        className="bg-gradient-to-r from-violet-500 to-indigo-500 h-full rounded-full" 
                        initial={{ width: 0 }}
                        animate={{ width: `${widthPercent}%` }}
                        transition={{ duration: 0.6 }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="flex justify-center items-center h-full text-xs text-zinc-400">
                No country rules tracked.
              </div>
            )}
          </div>
        </div>

      </div>

      {/* 4. Analytics Visual Charts Grid */}
      <AnalyticsCharts data={charts} theme={theme} />

    </div>
  );
};
