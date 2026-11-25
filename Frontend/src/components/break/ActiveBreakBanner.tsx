import React, { useState, useEffect } from 'react';
import { Coffee, Clock, CheckCircle2, Edit3, Trash2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { BreakTimeRecord } from '../../types';

export const ActiveBreakBanner: React.FC = () => {
  const {
    activeTeamBreaks,
    currentUser,
    handleEndBreak,
    handleDeleteBreak,
    refreshActiveBreaks,
    setUserNav,
    setManagerNav,
    setAdminNav
  } = useApp();
  const [, setTick] = useState(0);

  // Update live countdown every second
  useEffect(() => {
    if (!activeTeamBreaks || activeTeamBreaks.length === 0) return;
    const timer = setInterval(() => {
      setTick(t => t + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [activeTeamBreaks]);

  if (!activeTeamBreaks || activeTeamBreaks.length === 0) {
    return null;
  }

  const navigateToBreakTime = () => {
    if (currentUser?.role === 'manager') setManagerNav('break-time');
    else if (currentUser?.role === 'admin') setAdminNav('break-time');
    else setUserNav('break-time');
  };

  const parseTimeInput = (str?: string) => {
    if (!str) return null;
    const clean = str.trim().toUpperCase();
    const match = clean.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/);
    if (!match) return null;
    let rawH = parseInt(match[1], 10);
    const m = parseInt(match[2], 10);
    const meridiemRaw = match[3] as 'AM' | 'PM' | undefined;
    const meridiem = meridiemRaw || (rawH >= 12 ? 'PM' : 'AM');
    let h24 = rawH;
    if (meridiem === 'PM') {
      if (rawH < 12) h24 = rawH + 12;
      else h24 = 12;
    } else if (meridiem === 'AM') {
      if (rawH === 12) h24 = 0;
      else h24 = rawH;
    }
    return { hours24: h24, minutes: m };
  };

  const formatRemaining = (toTimestamp: string | Date, fromTimeStr?: string, toTimeStr?: string) => {
    const now = new Date();
    let endMs = new Date(toTimestamp).getTime();

    // Guard against cloud server UTC offset drift
    if (toTimeStr) {
      const pEnd = parseTimeInput(toTimeStr);
      if (pEnd) {
        let localEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), pEnd.hours24, pEnd.minutes, 0, 0);
        if (fromTimeStr) {
          const pStart = parseTimeInput(fromTimeStr);
          if (pStart) {
            const localStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), pStart.hours24, pStart.minutes, 0, 0);
            if (localEnd.getTime() <= localStart.getTime()) {
              localEnd = new Date(localEnd.getTime() + 24 * 60 * 60 * 1000);
            }
          }
        }
        if (Math.abs(endMs - localEnd.getTime()) > 60 * 60 * 1000) {
          endMs = localEnd.getTime();
        }
      }
    }

    const diff = Math.max(0, Math.floor((endMs - Date.now()) / 1000));
    if (diff <= 0) {
      setTimeout(() => refreshActiveBreaks(), 500);
      return 'Ending now...';
    }
    const hours = Math.floor(diff / 3600);
    const minutes = Math.floor((diff % 3600) / 60);
    const seconds = diff % 60;
    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds < 10 ? '0' : ''}${seconds}s left`;
    }
    return `${minutes}m ${seconds < 10 ? '0' : ''}${seconds}s left`;
  };

  // Strict User-Based Isolation: regular users only see their own active break banner.
  // Managers and Admins see their team members' active break notices.
  const visibleBreaks = (activeTeamBreaks || []).filter((brk: BreakTimeRecord) => {
    const isMe = currentUser?.id && (brk.userId === currentUser.id || brk.userEmail?.toLowerCase() === currentUser.email?.toLowerCase());
    if (currentUser?.role === 'user') {
      return isMe;
    }
    return true;
  });

  if (!visibleBreaks || visibleBreaks.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3 mb-6">
      {visibleBreaks.map((brk: BreakTimeRecord) => {
        const isMe = currentUser?.id && (brk.userId === currentUser.id || brk.userEmail?.toLowerCase() === currentUser.email?.toLowerCase());
        const isManagerOrAdmin = currentUser?.role === 'manager' || currentUser?.role === 'admin';
        const remainingText = formatRemaining(brk.toTimestamp, brk.fromTime, brk.toTime);

        return (
          <div
            key={brk.id || brk.customId}
            className={`relative overflow-hidden rounded-2xl border p-4 sm:p-5 shadow-md transition-all ${
              isMe
                ? 'bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-600/15 border-amber-300 dark:border-amber-700/60 shadow-amber-500/5'
                : 'bg-gradient-to-r from-indigo-50/90 via-purple-50/80 to-blue-50/90 border-indigo-200/90 shadow-indigo-500/5'
            }`}
          >
            {/* Background Accent Glow */}
            <div className="absolute top-0 right-0 -mt-6 -mr-6 w-32 h-32 rounded-full bg-amber-400/10 blur-2xl pointer-events-none" />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
              {/* Left Info */}
              <div className="flex items-start sm:items-center gap-3.5">
                <div
                  className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
                    isMe
                      ? 'bg-gradient-to-br from-amber-500 to-orange-600 text-white'
                      : 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white'
                  }`}
                >
                  <Coffee className="w-5 h-5 animate-bounce" />
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-slate-900 text-base">
                      {isMe ? 'You are on a Break' : `${brk.userName} is on a Break`}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                      {brk.reason || 'Break'}
                    </span>
                    {brk.teamName && (
                      <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-white/80 text-slate-600 border border-slate-200/80">
                        {brk.teamName}
                      </span>
                    )}
                  </div>

                  <p className="text-xs sm:text-sm text-slate-600 font-medium mt-0.5 flex items-center gap-2 flex-wrap">
                    <span>
                      Scheduled: <strong className="text-slate-800">{brk.fromTime} - {brk.toTime}</strong>
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="inline-flex items-center gap-1 text-amber-700 font-semibold">
                      <Clock className="w-3.5 h-3.5" />
                      {remainingText}
                    </span>
                  </p>
                </div>
              </div>

              {/* Right Action */}
              <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-center flex-wrap">
                <div className="text-right hidden md:block mr-1">
                  <div className="text-[11px] uppercase tracking-wider font-bold text-slate-400">Status</div>
                  <div className="text-xs font-semibold text-emerald-600 flex items-center gap-1 justify-end">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block" />
                    Active Break
                  </div>
                </div>

                {isMe ? (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={navigateToBreakTime}
                      className="px-3 py-2 rounded-xl text-xs sm:text-sm font-bold bg-white/95 hover:bg-white text-slate-800 border border-slate-200/90 shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                      title="Modify your break schedule"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Modify</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleEndBreak(brk.id || brk.customId || '')}
                      className="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-sm transition-all flex items-center gap-1.5 cursor-pointer hover:shadow-md"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>End Early</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteBreak(brk.id || brk.customId || '')}
                      className="p-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 transition-all cursor-pointer"
                      title="Delete this active break"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={navigateToBreakTime}
                      className="px-3 py-1.5 rounded-xl bg-white/90 hover:bg-white border border-slate-200 text-xs font-semibold text-indigo-600 cursor-pointer transition shadow-xs"
                    >
                      View Team Schedule
                    </button>
                    {isManagerOrAdmin && (
                      <button
                        type="button"
                        onClick={() => handleDeleteBreak(brk.id || brk.customId || '')}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 cursor-pointer transition"
                        title="Delete break record (Manager / Admin)"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
