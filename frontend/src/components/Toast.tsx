import React, { useEffect } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, X } from 'lucide-react';

interface ToastProps {
  message: string;
  type: 'success' | 'warning' | 'error' | null;
  show: boolean;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, type, show, onClose }) => {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        onClose();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  if (!show || !type) return null;

  const bgStyles = {
    success: 'bg-emerald-500/20 border-emerald-500/30 text-emerald-600 dark:text-emerald-400',
    warning: 'bg-amber-500/20 border-amber-500/30 text-amber-600 dark:text-amber-400',
    error: 'bg-rose-500/20 border-rose-500/30 text-rose-600 dark:text-rose-400',
  };

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-500" />,
    error: <XCircle className="w-5 h-5 text-rose-500" />,
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 animate-in slide-in-from-bottom duration-300">
      <div className={`glass-card flex items-center gap-3 px-4 py-3 rounded-xl border ${bgStyles[type]} max-w-sm`}>
        {icons[type]}
        <div className="flex-1 text-sm font-medium pr-2">
          {message}
        </div>
        <button 
          onClick={onClose} 
          className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
