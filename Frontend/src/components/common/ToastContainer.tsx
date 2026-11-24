import React from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, Loader2, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'processing';

export interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
  title?: string;
  duration?: number;
}

interface ToastContainerProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="fixed top-5 right-5 z-[130] flex flex-col gap-2.5 max-w-sm sm:max-w-md w-full pointer-events-none">
      {toasts.map((toast) => {
        const isError = toast.type === 'error';
        const isWarning = toast.type === 'warning';
        const isProcessing = toast.type === 'processing';
        const isInfo = toast.type === 'info';

        return (
          <div
            key={toast.id}
            className="pointer-events-auto w-full animate-in slide-in-from-top-4 fade-in duration-300 transition-all"
          >
            <div
              className={`rounded-2xl p-4 border shadow-2xl flex items-start gap-3.5 relative overflow-hidden backdrop-blur-md ${
                isError
                  ? 'bg-slate-900/95 text-white border-rose-500/40 shadow-rose-950/30'
                  : isWarning
                  ? 'bg-slate-900/95 text-white border-amber-500/40 shadow-amber-950/30'
                  : isProcessing
                  ? 'bg-slate-900/95 text-white border-purple-500/40 shadow-purple-950/30'
                  : isInfo
                  ? 'bg-slate-900/95 text-white border-indigo-500/40 shadow-indigo-950/30'
                  : 'bg-slate-900/95 text-white border-emerald-500/40 shadow-emerald-950/30'
              }`}
            >
              {/* Subtle Animated Top Indicator Line */}
              <div
                className={`absolute top-0 left-0 right-0 h-1 ${
                  isError
                    ? 'bg-rose-500'
                    : isWarning
                    ? 'bg-amber-500'
                    : isProcessing
                    ? 'bg-purple-500 animate-pulse'
                    : isInfo
                    ? 'bg-indigo-500'
                    : 'bg-emerald-500'
                }`}
              />

              <div className="mt-0.5 shrink-0">
                {isError ? (
                  <AlertCircle className="w-5 h-5 text-rose-400" />
                ) : isWarning ? (
                  <AlertTriangle className="w-5 h-5 text-amber-400" />
                ) : isProcessing ? (
                  <Loader2 className="w-5 h-5 text-purple-400 animate-spin" />
                ) : isInfo ? (
                  <Info className="w-5 h-5 text-indigo-400" />
                ) : (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                )}
              </div>

              <div className="flex-1 min-w-0 pr-2">
                {toast.title && (
                  <h4 className="text-xs font-bold text-white mb-0.5 tracking-tight">
                    {toast.title}
                  </h4>
                )}
                <p className="text-xs text-slate-200 leading-relaxed font-medium">
                  {toast.message}
                </p>
              </div>

              <button
                type="button"
                onClick={() => onDismiss(toast.id)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition cursor-pointer shrink-0"
                title="Dismiss notification"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};
