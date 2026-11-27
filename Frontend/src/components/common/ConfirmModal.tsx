import React, { useState, useEffect } from 'react';
import { AlertTriangle, Trash2, HelpCircle, X, MessageSquare, Check } from 'lucide-react';

export interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'primary' | 'warning';
  isPrompt?: boolean;
  promptPlaceholder?: string;
  promptDefaultValue?: string;
  onConfirm: (inputValue?: string) => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'primary',
  isPrompt = false,
  promptPlaceholder = 'Enter feedback...',
  promptDefaultValue = '',
  onConfirm,
  onCancel
}) => {
  const [inputValue, setInputValue] = useState(promptDefaultValue);

  useEffect(() => {
    if (isOpen) {
      setInputValue(promptDefaultValue);
    }
  }, [isOpen, promptDefaultValue]);

  if (!isOpen) return null;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onCancel();
    } else if (e.key === 'Enter' && !isPrompt) {
      e.preventDefault();
      onConfirm();
    }
  };

  const isDanger = variant === 'danger';
  const isWarning = variant === 'warning';

  return (
    <div
      className="fixed inset-0 z-[120] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onCancel}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-white rounded-2xl max-w-md w-full max-h-[90dvh] overflow-y-auto responsive-dialog p-5 sm:p-6 shadow-2xl border border-slate-200/80 transform animate-in zoom-in-95 duration-200 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Accent Strip */}
        <div
          className={`absolute top-0 left-0 right-0 h-1.5 ${
            isDanger
              ? 'bg-rose-500'
              : isWarning
              ? 'bg-amber-500'
              : 'bg-indigo-600'
          }`}
        />

        {/* Close button */}
        <button
          type="button"
          onClick={onCancel}
          className="touch-target absolute top-3 right-3 text-slate-400 hover:text-slate-600 p-2 rounded-xl hover:bg-slate-100 transition cursor-pointer"
          title="Close dialog"
          aria-label="Close dialog"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start gap-3 sm:gap-4 mb-4">
          <div
            className={`w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center shrink-0 ${
              isDanger
                ? 'bg-rose-50 text-rose-600 ring-4 ring-rose-50/50'
                : isWarning
                ? 'bg-amber-50 text-amber-600 ring-4 ring-amber-50/50'
                : 'bg-indigo-50 text-indigo-600 ring-4 ring-indigo-50/50'
            }`}
          >
            {isDanger ? (
              <Trash2 className="w-5 h-5" />
            ) : isWarning ? (
              <AlertTriangle className="w-5 h-5" />
            ) : isPrompt ? (
              <MessageSquare className="w-5 h-5" />
            ) : (
              <HelpCircle className="w-5 h-5" />
            )}
          </div>

          <div className="flex-1 min-w-0 pr-6">
            <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">{title}</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mt-1.5 whitespace-pre-line">
              {message}
            </p>
          </div>
        </div>

        {/* Optional prompt input */}
        {isPrompt && (
          <div className="mt-3 mb-4">
            <textarea
              autoFocus
              rows={3}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={promptPlaceholder}
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 resize-none font-medium"
            />
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 mt-5 pt-3 border-t border-slate-100 flex-wrap sm:flex-nowrap">
          <button
            type="button"
            onClick={onCancel}
            className="touch-target px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold text-xs sm:text-sm transition cursor-pointer w-full sm:w-auto"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={() => onConfirm(isPrompt ? inputValue : undefined)}
            className={`touch-target px-5 py-2.5 rounded-xl text-white font-semibold text-xs sm:text-sm transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer w-full sm:w-auto ${
              isDanger
                ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/30'
                : isWarning
                ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/30'
                : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/30'
            }`}
          >
            <Check className="w-4 h-4" />
            <span>{confirmText}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
