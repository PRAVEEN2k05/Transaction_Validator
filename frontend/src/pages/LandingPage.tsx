import React from 'react';
import { motion } from 'framer-motion';
import { UploadCloud, Play, CheckCircle, Globe, Layers, Sparkles } from 'lucide-react';

interface LandingPageProps {
  onStartUpload: () => void;
  onStartDemo: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onStartUpload, onStartDemo }) => {
  return (
    <div className="relative min-h-[90vh] flex flex-col justify-center items-center px-4 overflow-hidden py-10">
      
      {/* Dynamic Background Glowing Blobs */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-violet-500/10 dark:bg-violet-600/20 rounded-full blur-[100px] animate-pulse-slow pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-500/10 dark:bg-blue-600/10 rounded-full blur-[120px] animate-pulse-slow pointer-events-none" />

      {/* Hero Content */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-center z-10 max-w-4xl mx-auto flex flex-col items-center"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass-panel text-xs text-violet-600 dark:text-violet-400 font-semibold mb-6 animate-bounce-slow">
          <Sparkles className="w-4 h-4 text-violet-500" />
          <span>Next-Generation Processing Engine</span>
        </div>

        <h1 className="text-4xl md:text-7xl font-extrabold tracking-tight bg-gradient-to-r from-zinc-900 via-violet-800 to-zinc-700 dark:from-white dark:via-violet-400 dark:to-zinc-400 bg-clip-text text-transparent pb-4 leading-tight">
          Global Transaction <br />
          <span className="bg-gradient-to-r from-violet-600 to-indigo-500 bg-clip-text text-transparent">Validator AI</span>
        </h1>
        
        <p className="text-zinc-600 dark:text-zinc-400 text-lg md:text-xl max-w-2xl mt-4 leading-relaxed font-normal">
          Validate, clean and process international transaction datasets with AI-powered intelligence.
        </p>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mt-10">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onStartUpload}
            className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl font-semibold shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 transition-all duration-300"
          >
            <UploadCloud className="w-5 h-5" />
            Upload Dataset
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onStartDemo}
            className="flex items-center gap-2 px-8 py-4 glass-card text-zinc-800 dark:text-white rounded-xl font-semibold hover:bg-white dark:hover:bg-zinc-800/80 transition-all duration-300"
          >
            <Play className="w-4 h-4 fill-current text-zinc-600 dark:text-zinc-400" />
            View Demo
          </motion.button>
        </div>
      </motion.div>

      {/* Floating Interactive Showcase Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl w-full mt-24 relative z-10 px-4">
        
        {/* Floating Card 1: CSV Validation */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          whileHover={{ y: -8 }}
          className="glass-card p-6 rounded-2xl relative overflow-hidden flex flex-col justify-between"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
          <div>
            <div className="p-3 bg-emerald-500/10 rounded-xl w-fit mb-4">
              <CheckCircle className="w-6 h-6 text-emerald-500" />
            </div>
            <h3 className="font-bold text-lg text-zinc-800 dark:text-white mb-2">CSV Validation</h3>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm leading-relaxed">
              Verify headers, currencies, format limits, and identify duplicates instantly.
            </p>
          </div>
          <div className="mt-6 flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 w-fit px-2.5 py-1 rounded-full">
            <span>Accuracy Tracker</span>
          </div>
        </motion.div>

        {/* Floating Card 2: Data Cleaning */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          whileHover={{ y: -8 }}
          className="glass-card p-6 rounded-2xl relative overflow-hidden flex flex-col justify-between"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-violet-500/10 rounded-full blur-2xl pointer-events-none" />
          <div>
            <div className="p-3 bg-violet-500/10 rounded-xl w-fit mb-4">
              <Sparkles className="w-6 h-6 text-violet-500" />
            </div>
            <h3 className="font-bold text-lg text-zinc-800 dark:text-white mb-2">Data Cleaning</h3>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm leading-relaxed">
              Auto-fix formats, replace nulls, trim trailing spaces, and standardize inputs with 1-click.
            </p>
          </div>
          <div className="mt-6 flex items-center gap-2 text-xs font-semibold text-violet-600 dark:text-violet-400 bg-violet-500/10 w-fit px-2.5 py-1 rounded-full">
            <span>Smart Normalizer</span>
          </div>
        </motion.div>

        {/* Floating Card 3: Country Rules */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          whileHover={{ y: -8 }}
          className="glass-card p-6 rounded-2xl relative overflow-hidden flex flex-col justify-between"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
          <div>
            <div className="p-3 bg-blue-500/10 rounded-xl w-fit mb-4">
              <Globe className="w-6 h-6 text-blue-500" />
            </div>
            <h3 className="font-bold text-lg text-zinc-800 dark:text-white mb-2">Country Rules</h3>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm leading-relaxed">
              Verify mobile number digits by matching specific international region configurations.
            </p>
          </div>
          <div className="mt-6 flex items-center gap-2 text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-500/10 w-fit px-2.5 py-1 rounded-full">
            <span>Region Enforcer</span>
          </div>
        </motion.div>

        {/* Floating Card 4: Chunk Generation */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          whileHover={{ y: -8 }}
          className="glass-card p-6 rounded-2xl relative overflow-hidden flex flex-col justify-between"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
          <div>
            <div className="p-3 bg-amber-500/10 rounded-xl w-fit mb-4">
              <Layers className="w-6 h-6 text-amber-500" />
            </div>
            <h3 className="font-bold text-lg text-zinc-800 dark:text-white mb-2">Chunk Generation</h3>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm leading-relaxed">
              Divide massive worksheets containing &gt; 10,000 transaction rows into compressed ZIP subsets.
            </p>
          </div>
          <div className="mt-6 flex items-center gap-2 text-xs font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 w-fit px-2.5 py-1 rounded-full">
            <span>High Performance</span>
          </div>
        </motion.div>

      </div>
    </div>
  );
};
