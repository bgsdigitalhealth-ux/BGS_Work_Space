import React, { useState } from 'react';
import { X, PauseCircle, AlertCircle } from 'lucide-react';

interface PauseReasonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  taskTitle: string;
}

const PRESET_REASONS = [
  'Lunch Break',
  'Team Meeting',
  'Blocked on Assets / Approvals',
  'Technical / Environment Issue',
  'Client Discussion',
  'Personal Break'
];

export const PauseReasonModal: React.FC<PauseReasonModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  taskTitle
}) => {
  const [selectedPreset, setSelectedPreset] = useState<string>('Lunch Break');
  const [customReason, setCustomReason] = useState<string>('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalReason = customReason.trim() ? customReason.trim() : selectedPreset;
    if (!finalReason) return;
    onConfirm(finalReason);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl max-w-md w-full max-h-[90dvh] overflow-y-auto shadow-2xl border border-gray-100 transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-amber-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center font-bold">
              <PauseCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">Pause Task Work</h3>
              <p className="text-xs text-gray-500 font-medium">Please provide a reason to pause the active timer</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Current Task</p>
            <p className="text-sm font-bold text-slate-900 line-clamp-1 mt-0.5">{taskTitle}</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-2">
              Select Pause Reason <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {PRESET_REASONS.map((reason) => (
                <button
                  key={reason}
                  type="button"
                  onClick={() => {
                    setSelectedPreset(reason);
                    setCustomReason('');
                  }}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold text-left transition border ${
                    selectedPreset === reason && !customReason
                      ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                      : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  {reason}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Or Custom Reason (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Assisting another department..."
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
            />
          </div>

          <div className="flex items-center gap-2 p-3 rounded-xl bg-blue-50/70 border border-blue-100 text-[11px] text-blue-700">
            <AlertCircle className="w-4 h-4 shrink-0 text-blue-600" />
            <span>Pause duration and timestamp will be logged on the server and verified when you resume.</span>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition shadow-md shadow-amber-500/20 flex items-center gap-2"
            >
              <PauseCircle className="w-4 h-4" />
              <span>Confirm & Pause</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
