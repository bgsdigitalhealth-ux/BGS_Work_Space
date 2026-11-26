import React, { useState } from 'react';
import { LogIn, Lock, Calendar, ShieldCheck, AlertCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const DashboardPunchLockGate: React.FC = () => {
  const { todayAttendance, handlePunchIn, currentUser, isAttendanceLoading } = useApp();
  const [isProcessing, setIsProcessing] = useState(false);

  const isPunchedIn = todayAttendance?.status === 'punched_in';

  // Do not show the gate if attendance is still loading or user is already punched in
  if (isAttendanceLoading || isPunchedIn) {
    return null;
  }

  const onPunchInClick = async () => {
    setIsProcessing(true);
    try {
      await handlePunchIn();
    } finally {
      setIsProcessing(false);
    }
  };

  const formattedDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

  return (
    <div className="relative z-30 my-4 animate-in fade-in zoom-in-95 duration-300">
      <div className="relative overflow-hidden rounded-3xl border-2 border-amber-300/80 bg-gradient-to-br from-white via-amber-50/40 to-orange-50/60 shadow-xl shadow-amber-500/10 p-6 sm:p-8">
        {/* Ambient background glow accents */}
        <div className="absolute -top-16 -right-16 w-60 h-60 rounded-full bg-amber-400/15 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-60 h-60 rounded-full bg-orange-400/15 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Left: Attention Icon & Greeting */}
          <div className="flex items-start gap-4 sm:gap-5 min-w-0">
            <div className="relative shrink-0">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center shadow-lg shadow-amber-600/30">
                <Lock className="w-7 h-7 sm:w-8 sm:h-8 animate-pulse" />
              </div>
              <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-red-500 border-2 border-white flex items-center justify-center text-[10px] text-white font-black">
                !
              </span>
            </div>

            <div className="min-w-0 space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-200 shadow-xs">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                  Workspace Attendance Required
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                  Status: Punched Out
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Hello, {currentUser?.name || 'Teammate'}! Punch In to Start Work
              </h2>

              <p className="text-xs sm:text-sm text-slate-600 font-medium max-w-2xl leading-relaxed">
                Your workspace dashboard and task actions are <strong className="text-slate-800 font-bold">locked</strong> until you punch in. Start your attendance session to begin managing your assignments.
              </p>
            </div>
          </div>

          {/* Right: Big Punch CTA (Zero live clock or time display) */}
          <div className="flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-end gap-3.5 shrink-0 bg-white/90 backdrop-blur-md p-4 sm:p-5 rounded-2xl border border-amber-200/80 shadow-md">
            <div className="text-left sm:text-right">
              <div className="flex items-center sm:justify-end gap-1.5 text-xs font-bold text-slate-600">
                <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                <span>{formattedDate}</span>
              </div>
            </div>

            <button
              type="button"
              disabled={isProcessing}
              onClick={onPunchInClick}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm sm:text-base shadow-lg shadow-emerald-600/30 hover:shadow-emerald-600/40 hover:-translate-y-0.5 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed select-none"
            >
              <LogIn className={`w-5 h-5 ${isProcessing ? 'animate-spin' : ''}`} />
              <span>{isProcessing ? 'Recording Attendance...' : 'Punch In (Present)'}</span>
            </button>

            <div className="text-[11px] font-semibold text-slate-500 text-left sm:text-right">
              Instant dashboard unlock
            </div>
          </div>
        </div>

        {/* Bottom Lock Notice Banner */}
        <div className="mt-5 pt-4 border-t border-amber-200/60 flex items-center justify-between text-xs text-amber-900 font-medium flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Lock className="w-3.5 h-3.5 text-amber-700 shrink-0" />
            <span>Dashboard interactivity is disabled. Click <strong>Punch In</strong> to activate all features.</span>
          </div>
          <div className="text-[11px] text-slate-500 font-semibold flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            Auto-syncs across your manager & team
          </div>
        </div>
      </div>
    </div>
  );
};
