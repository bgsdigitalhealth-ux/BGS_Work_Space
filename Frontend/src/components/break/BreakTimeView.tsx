import React, { useState, useEffect, useMemo } from 'react';
import {
  Coffee,
  Clock,
  CheckCircle2,
  Users,
  History,
  Edit3,
  X,
  Save,
  Trash2,
  Calendar,
  AlertCircle,
  Timer
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { BreakTimeRecord } from '../../types';

// Helper to parse 12-hour AM/PM time strings (e.g., "11:34 AM", "12:04 PM")
interface ParsedTime {
  valid: boolean;
  hours24: number; // 0-23
  minutes: number; // 0-59
  meridiem: 'AM' | 'PM';
  displayStr: string; // e.g. "11:34 AM"
  totalMinutes: number; // Minutes from 00:00 midnight
}

const parseTimeInput = (str: string): ParsedTime | null => {
  if (!str) return null;
  const clean = str.trim().toUpperCase();
  const match = clean.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/);
  if (!match) return null;

  let rawH = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  const meridiemRaw = match[3] as 'AM' | 'PM' | undefined;

  if (rawH < 1 || rawH > 12 || m < 0 || m > 59) {
    // If entered in 24-hour style without AM/PM (e.g. 14:30)
    if (rawH >= 0 && rawH <= 23 && !meridiemRaw) {
      const h24 = rawH;
      const meridiem = h24 >= 12 ? 'PM' : 'AM';
      const displayH = h24 === 0 ? 12 : h24 > 12 ? h24 - 12 : h24;
      return {
        valid: true,
        hours24: h24,
        minutes: m,
        meridiem,
        displayStr: `${String(displayH).padStart(2, '0')}:${String(m).padStart(2, '0')} ${meridiem}`,
        totalMinutes: h24 * 60 + m
      };
    }
    return null;
  }

  const meridiem = meridiemRaw || (rawH >= 12 ? 'PM' : 'AM');
  let h24 = rawH;
  if (meridiem === 'PM') {
    if (rawH < 12) h24 = rawH + 12;
    else h24 = 12; // 12 PM is 12:00 (Noon)
  } else if (meridiem === 'AM') {
    if (rawH === 12) h24 = 0; // 12 AM is 00:00 (Midnight)
    else h24 = rawH;
  }

  const displayStr = `${String(rawH).padStart(2, '0')}:${String(m).padStart(2, '0')} ${meridiem}`;

  return {
    valid: true,
    hours24: h24,
    minutes: m,
    meridiem,
    displayStr,
    totalMinutes: h24 * 60 + m
  };
};

export const BreakTimeView: React.FC = () => {
  const {
    currentUser,
    members,
    activeTeamBreaks,
    todayTeamBreaks,
    handleStartBreak,
    handleUpdateBreak,
    handleEndBreak,
    handleDeleteBreak,
    refreshActiveBreaks,
    refreshTodayBreaks
  } = useApp();

  // Find user's member context for team identification
  const myEmail = (currentUser?.email || '').trim().toLowerCase();
  const myMember = (members || []).find(
    m =>
      (currentUser?.id && (m.id === currentUser.id || (m as any).userId === currentUser.id)) ||
      (myEmail && m.email && m.email.toLowerCase() === myEmail)
  );

  const teamName = currentUser?.team || myMember?.role || 'My Team';
  const departmentName = currentUser?.department || 'General';

  // Format current time into clean 12-hour AM/PM format
  const formatTimeStr = (d: Date) => {
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const [fromTime, setFromTime] = useState('');
  const [toTime, setToTime] = useState('');
  const [reason, setReason] = useState('Tea / Coffee Break');
  const [editingBreakId, setEditingBreakId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [, setTick] = useState(0);

  // Initialize default times on mount (Now to +30 mins)
  useEffect(() => {
    const now = new Date();
    const end = new Date(now.getTime() + 30 * 60 * 1000);
    setFromTime(formatTimeStr(now));
    setToTime(formatTimeStr(end));
  }, []);

  // Live timer tick for real-time countdown updates
  useEffect(() => {
    const timer = setInterval(() => {
      setTick(t => t + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const myActiveBreak = (activeTeamBreaks || []).find(
    b => currentUser?.id && (b.userId === currentUser.id || b.userEmail?.toLowerCase() === currentUser.email?.toLowerCase())
  );

  const otherTeamBreaks = (activeTeamBreaks || []).filter(
    b => !currentUser?.id || (b.userId !== currentUser.id && b.userEmail?.toLowerCase() !== currentUser.email?.toLowerCase())
  );

  // Time Validation and AM/PM Difference Calculation
  const { parsedStart, parsedEnd, validationError, durationInfo, suggestedFix } = useMemo(() => {
    const pStart = parseTimeInput(fromTime);
    const pEnd = parseTimeInput(toTime);

    if (!pStart) {
      return {
        parsedStart: null,
        parsedEnd: null,
        validationError: 'Please enter a valid start time (e.g. 11:34 AM)',
        durationInfo: null,
        suggestedFix: null
      };
    }
    if (!pEnd) {
      return {
        parsedStart: pStart,
        parsedEnd: null,
        validationError: 'Please enter a valid end time (e.g. 12:04 PM)',
        durationInfo: null,
        suggestedFix: null
      };
    }

    const diffMinutes = pEnd.totalMinutes - pStart.totalMinutes;

    if (diffMinutes < 0) {
      // User entered an end time earlier than start time on the same day.
      // E.g. 11:34 AM to 12:04 AM (user meant PM)
      let suggestion: string | null = null;
      if (pStart.meridiem === 'AM' && pEnd.meridiem === 'AM' && pEnd.hours24 === 0) {
        // Entered 12:xx AM instead of 12:xx PM
        suggestion = `${String(pEnd.hours24 === 0 ? 12 : pEnd.hours24).padStart(2, '0')}:${String(pEnd.minutes).padStart(2, '0')} PM`;
      } else if (pStart.meridiem === 'AM' && pEnd.meridiem === 'AM') {
        suggestion = `${toTime.replace(/AM/i, 'PM').trim()}`;
      }

      return {
        parsedStart: pStart,
        parsedEnd: pEnd,
        validationError: `End time (${pEnd.displayStr}) is earlier than start time (${pStart.displayStr}). Check AM and PM difference. (12:00 PM is Noon, 12:00 AM is Midnight).`,
        durationInfo: null,
        suggestedFix: suggestion
      };
    }

    if (diffMinutes === 0) {
      return {
        parsedStart: pStart,
        parsedEnd: pEnd,
        validationError: 'Start time and end time cannot be identical.',
        durationInfo: null,
        suggestedFix: null
      };
    }

    const hours = Math.floor(diffMinutes / 60);
    const mins = diffMinutes % 60;
    const decimalHours = (diffMinutes / 60).toFixed(1).replace(/\.0$/, '');

    let text = '';
    if (hours > 0 && mins > 0) {
      text = `${hours} hr ${mins} min${mins > 1 ? 's' : ''}`;
    } else if (hours > 0) {
      text = `${hours} hr${hours > 1 ? 's' : ''}`;
    } else {
      text = `${mins} min${mins > 1 ? 's' : ''}`;
    }

    return {
      parsedStart: pStart,
      parsedEnd: pEnd,
      validationError: null,
      durationInfo: {
        text,
        hours,
        mins,
        decimalHours,
        totalMinutes: diffMinutes
      },
      suggestedFix: null
    };
  }, [fromTime, toTime]);

  // Quick preset button handler (adds +15m, +30m, +45m, +1h to start time)
  const applyPresetMinutes = (additionalMinutes: number) => {
    let baseDate = new Date();
    if (parsedStart) {
      baseDate.setHours(parsedStart.hours24, parsedStart.minutes, 0, 0);
    }
    const targetDate = new Date(baseDate.getTime() + additionalMinutes * 60 * 1000);
    setToTime(formatTimeStr(targetDate));
  };

  // Start editing an active break
  const handleStartEdit = (b: BreakTimeRecord) => {
    setEditingBreakId(b.id || b.customId || null);
    setFromTime(b.fromTime);
    setToTime(b.toTime);
    setReason(b.reason || 'Break');
    window.scrollTo({ top: 120, behavior: 'smooth' });
  };

  // Cancel edit mode
  const handleCancelEdit = () => {
    setEditingBreakId(null);
    const now = new Date();
    const end = new Date(now.getTime() + 30 * 60 * 1000);
    setFromTime(formatTimeStr(now));
    setToTime(formatTimeStr(end));
    setReason('Tea / Coffee Break');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (validationError) {
      alert(validationError);
      return;
    }

    const finalFrom = parsedStart ? parsedStart.displayStr : fromTime.trim();
    const finalTo = parsedEnd ? parsedEnd.displayStr : toTime.trim();

    // Compute exact local ISO timestamps with user timezone
    const now = new Date();
    const startObj = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      parsedStart ? parsedStart.hours24 : now.getHours(),
      parsedStart ? parsedStart.minutes : now.getMinutes(),
      0,
      0
    );
    let endObj = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      parsedEnd ? parsedEnd.hours24 : now.getHours(),
      parsedEnd ? parsedEnd.minutes : now.getMinutes(),
      0,
      0
    );
    if (endObj.getTime() <= startObj.getTime()) {
      endObj = new Date(endObj.getTime() + 24 * 60 * 60 * 1000);
    }

    const fromTimestamp = startObj.toISOString();
    const toTimestamp = endObj.toISOString();
    const durationMinutes = Math.round((endObj.getTime() - startObj.getTime()) / (60 * 1000));
    const timezoneOffset = now.getTimezoneOffset();

    setIsSubmitting(true);
    try {
      const finalReason = reason.trim() || 'Break';

      if (editingBreakId) {
        await handleUpdateBreak(editingBreakId, {
          fromTime: finalFrom,
          toTime: finalTo,
          fromTimestamp,
          toTimestamp,
          durationMinutes,
          timezoneOffset,
          reason: finalReason
        });
        setEditingBreakId(null);
      } else {
        await handleStartBreak({
          fromTime: finalFrom,
          toTime: finalTo,
          fromTimestamp,
          toTimestamp,
          durationMinutes,
          timezoneOffset,
          reason: finalReason
        });
      }
    } catch (err) {
      // Error handled in context
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculates exact remaining time respecting local timezone and user duration
  const formatRemaining = (toTimestamp: string | Date, fromTimeStr?: string, toTimeStr?: string) => {
    const now = new Date();
    let endMs = new Date(toTimestamp).getTime();

    // Guard against server UTC timezone offset drift if from/to strings exist
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
        // If discrepancy is greater than 1 hour (timezone offset difference), lock to localEnd
        if (Math.abs(endMs - localEnd.getTime()) > 60 * 60 * 1000) {
          endMs = localEnd.getTime();
        }
      }
    }

    const diff = Math.max(0, Math.floor((endMs - Date.now()) / 1000));
    if (diff <= 0) return 'Ending now';
    const hours = Math.floor(diff / 3600);
    const mins = Math.floor((diff % 3600) / 60);
    const secs = diff % 60;
    if (hours > 0) return `${hours}h ${mins}m ${secs < 10 ? '0' : ''}${secs}s`;
    return `${mins}m ${secs < 10 ? '0' : ''}${secs}s`;
  };

  const todayDisplayDate = new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  return (
    <div className="space-y-8 pb-16">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-[#14122d] via-[#1d1947] to-[#2c2060] rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 backdrop-blur-md text-xs font-semibold text-amber-300 mb-3 border border-amber-400/30">
              <Coffee className="w-3.5 h-3.5" />
              <span>Team Availability & Break Management</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
              <span>Break Time</span>
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-white/10 text-indigo-200 border border-white/10 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-amber-400" />
                <span>{todayDisplayDate}</span>
              </span>
            </h1>
            <p className="text-sm sm:text-base text-indigo-200 mt-2">
              Log or update your break schedule anytime. Your active break notice is broadcast in real-time to your team members and manager.
            </p>
          </div>
        </div>
      </div>

      {/* Main Grid: Form (Left) & Active Status / Team State (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Break Request / Modify Form */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                {editingBreakId ? (
                  <>
                    <Edit3 className="w-5 h-5 text-indigo-600" />
                    <span>Modify Your Active Break</span>
                  </>
                ) : (
                  <>
                    <Coffee className="w-5 h-5 text-amber-600" />
                    <span>Schedule / Start a Break</span>
                  </>
                )}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {editingBreakId
                  ? 'Update your break schedule. Changes will reflect instantly on your team and manager dashboards.'
                  : 'Enter your break schedule. Your name and scope are automatically synchronized.'}
              </p>
            </div>

            {editingBreakId && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 flex items-center gap-1 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                <span>Cancel</span>
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Member Identity & Team Scope (Auto Selected) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                  Member Name (Auto Selected)
                </label>
                <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-800">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 text-white font-bold flex items-center justify-center text-sm shrink-0">
                    {(currentUser?.name || 'U')[0]}
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-sm text-slate-900 truncate">
                      {currentUser?.name || 'Current User'}
                    </div>
                    <div className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Auto Selected
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                  Assigned Team Scope
                </label>
                <div className="flex items-center gap-2.5 p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-700">
                  <Users className="w-4 h-4 text-indigo-600 shrink-0" />
                  <div className="min-w-0">
                    <div className="font-semibold text-sm text-slate-800 truncate">
                      {teamName}
                    </div>
                    <div className="text-[11px] text-slate-500 truncate">
                      Department: {departmentName}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Time Slot Inputs: From & To with AM/PM Validation */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* FROM (START TIME) */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                    From (Start Time) <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setFromTime(formatTimeStr(new Date()))}
                    className="text-[11px] font-semibold text-amber-700 hover:text-amber-800 hover:underline cursor-pointer"
                  >
                    Set to Now
                  </button>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    value={fromTime}
                    onChange={e => setFromTime(e.target.value)}
                    placeholder="e.g. 11:34 AM"
                    required
                    className="w-full px-4 py-3 rounded-2xl bg-white border border-slate-300 text-slate-900 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <Clock className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5 pointer-events-none" />
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1 px-1">
                  <span>Format: 12-hour AM/PM</span>
                  {parsedStart && (
                    <span className="text-indigo-600 font-semibold">{parsedStart.displayStr}</span>
                  )}
                </div>
              </div>

              {/* TO (END TIME) */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                    To (End Time) <span className="text-red-500">*</span>
                  </label>
                  <span className="text-[11px] text-slate-400 font-medium">Customizable</span>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    value={toTime}
                    onChange={e => setToTime(e.target.value)}
                    placeholder="e.g. 12:04 PM"
                    required
                    className="w-full px-4 py-3 rounded-2xl bg-white border border-slate-300 text-slate-900 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <Clock className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5 pointer-events-none" />
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1 px-1">
                  <span>Format: 12-hour AM/PM</span>
                  {parsedEnd && (
                    <span className="text-indigo-600 font-semibold">{parsedEnd.displayStr}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Preset Buttons (+15m, +30m, +45m, +1h) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Quick Duration Helpers (Auto-sets End Time)
                </span>
                <span className="text-[10px] text-slate-400">Calculates exact AM/PM rollover</span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: '+15 mins', mins: 15 },
                  { label: '+30 mins', mins: 30 },
                  { label: '+45 mins', mins: 45 },
                  { label: '+1 hour', mins: 60 }
                ].map(p => (
                  <button
                    key={p.mins}
                    type="button"
                    onClick={() => applyPresetMinutes(p.mins)}
                    className="py-2 px-2.5 rounded-xl border border-slate-200 hover:border-amber-400 hover:bg-amber-50 text-slate-700 hover:text-amber-900 text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Timer className="w-3 h-3 text-amber-600" />
                    <span>{p.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Live Duration & AM/PM Difference Feedback Badge */}
            {durationInfo && !validationError && (
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between gap-3 animate-in fade-in duration-200">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    Calculated Break Duration: <strong>{durationInfo.text}</strong> ({durationInfo.decimalHours} hrs)
                  </span>
                </div>
                <span className="text-[11px] bg-emerald-100 text-emerald-900 px-2.5 py-0.5 rounded-full font-bold">
                  {parsedStart?.displayStr} → {parsedEnd?.displayStr}
                </span>
              </div>
            )}

            {/* Validation Error Banner with Instant Fix Suggestion */}
            {validationError && (
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 text-xs font-semibold flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 animate-in fade-in duration-200">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span>{validationError}</span>
                  </div>
                </div>
                {suggestedFix && (
                  <button
                    type="button"
                    onClick={() => setToTime(suggestedFix)}
                    className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs self-start sm:self-auto cursor-pointer transition shrink-0"
                  >
                    Switch to {suggestedFix}
                  </button>
                )}
              </div>
            )}

            {/* Break Reason / Description (Custom input with datalist) */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                Break Reason / Description <span className="text-slate-400 font-normal">(Customizable)</span>
              </label>
              <input
                type="text"
                list="break-reason-datalist"
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder="Enter break reason (e.g. Tea / Coffee Break, Lunch Break, Personal errand...)"
                className="w-full px-4 py-3 rounded-2xl bg-white border border-slate-300 text-slate-900 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <datalist id="break-reason-datalist">
                <option value="Tea / Coffee Break" />
                <option value="Lunch Break" />
                <option value="Personal Break" />
                <option value="Rest / Bio Break" />
                <option value="Doctor Appointment / Emergency" />
              </datalist>
              <p className="text-[11px] text-slate-400 mt-1.5">
                Type any custom reason or select from the drop-down list.
              </p>
            </div>

            {/* Submit / Update Button */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={isSubmitting || !!validationError}
                className={`flex-1 py-3.5 rounded-2xl text-white font-bold text-sm sm:text-base shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                  editingBreakId
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700'
                    : 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700'
                  }`}
              >
                {isSubmitting ? (
                  <span>Saving Notice...</span>
                ) : editingBreakId ? (
                  <>
                    <Save className="w-5 h-5" />
                    <span>Save & Update Break Notice</span>
                  </>
                ) : (
                  <>
                    <Coffee className="w-5 h-5" />
                    <span>Start / Submit Break Notice</span>
                  </>
                )}
              </button>

              {editingBreakId && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="px-5 py-3.5 rounded-2xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-sm cursor-pointer transition"
                >
                  Cancel
                </button>
              )}
            </div>

            <p className="text-[11px] text-slate-400 text-center font-medium">
              🔔 The break notification appears immediately on your team's and manager's dashboard and stays active until {toTime || 'the break ends'}.
            </p>
          </form>
        </div>

        {/* Right Column: Active Breaks & Live Status */}
        <div className="lg:col-span-5 space-y-6">
          {/* My Current Active Break Card */}
          {myActiveBreak ? (
            <div className="rounded-3xl p-6 bg-gradient-to-br from-amber-500 via-orange-500 to-amber-600 text-white shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 -mt-6 -mr-6 w-32 h-32 rounded-full bg-white/20 blur-xl pointer-events-none" />

              <div className="flex items-center justify-between mb-4 relative z-10">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-xs font-bold text-white border border-white/20">
                  <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                  You Are On Break
                </span>
                <span className="text-xs font-bold bg-white/20 px-2.5 py-1 rounded-xl">
                  {myActiveBreak.reason}
                </span>
              </div>

              <div className="space-y-1 mb-6 relative z-10">
                <div className="text-xs uppercase tracking-wider text-amber-100 font-semibold">
                  Scheduled Window
                </div>
                <div className="text-2xl font-black text-white">
                  {myActiveBreak.fromTime} - {myActiveBreak.toTime}
                </div>
                <div className="text-sm font-semibold text-amber-100 flex items-center gap-2 pt-1">
                  <Clock className="w-4 h-4 text-white" />
                  <span>Time Remaining:</span>
                  <strong className="text-white bg-black/20 px-2 py-0.5 rounded-md">
                    {formatRemaining(myActiveBreak.toTimestamp, myActiveBreak.fromTime, myActiveBreak.toTime)}
                  </strong>
                </div>
              </div>

              {/* Action Buttons: Modify, End Early, Delete */}
              <div className="flex items-center gap-2 relative z-10 flex-wrap">
                <button
                  type="button"
                  onClick={() => handleStartEdit(myActiveBreak)}
                  className="flex-1 py-2.5 px-3 rounded-2xl bg-white/90 hover:bg-white text-slate-800 font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-1 cursor-pointer"
                  title="Modify break time schedule"
                >
                  <Edit3 className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Modify</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleEndBreak(myActiveBreak.id || myActiveBreak.customId || '')}
                  className="flex-1 py-2.5 px-3 rounded-2xl bg-white text-amber-900 font-bold text-xs sm:text-sm shadow-md hover:bg-amber-50 transition-all flex items-center justify-center gap-1 cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>End Early</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDeleteBreak(myActiveBreak.id || myActiveBreak.customId || '')}
                  className="py-2.5 px-3.5 rounded-2xl bg-red-600/90 hover:bg-red-700 text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-1 cursor-pointer"
                  title="Delete this active break record"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-3xl p-6 bg-white border border-slate-200 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-800 text-base">You are Working</h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                You currently do not have an active break scheduled. Use the form to set your time and broadcast to your team and manager.
              </p>
            </div>
          )}

          {/* Team Members Currently on Break (Manager / Admin only) OR Personal Break Guidelines (Regular User) */}
          {currentUser?.role !== 'user' ? (
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-600" />
                  <span>Team Members on Break ({otherTeamBreaks.length})</span>
                </h3>
                <span className="text-[11px] font-semibold text-slate-400">Scoped to {teamName}</span>
              </div>

              {otherTeamBreaks.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400">
                  No other teammates are currently on break.
                </div>
              ) : (
                <div className="space-y-3">
                  {otherTeamBreaks.map((b: BreakTimeRecord) => (
                    <div
                      key={b.id || b.customId}
                      className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs shrink-0">
                          {(b.userName || 'M')[0]}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-xs text-slate-900 truncate">
                            {b.userName}
                          </div>
                          <div className="text-[11px] text-slate-500 truncate">
                            {b.reason} ({b.fromTime} - {b.toTime})
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="text-[11px] font-bold text-amber-700 flex items-center gap-1 justify-end">
                          <Clock className="w-3 h-3" />
                          {formatRemaining(b.toTimestamp, b.fromTime, b.toTime)}
                        </div>
                        <div className="text-[10px] text-slate-400">Active Notice</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-3.5">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Clock className="w-4 h-4 text-indigo-600" />
                  <span>Break Guidelines & Policy</span>
                </h3>
                <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Live Sync
                </span>
              </div>
              <div className="space-y-2.5 text-xs text-slate-600">
                <div className="p-3 rounded-2xl bg-slate-50/80 border border-slate-100 flex items-start gap-2.5">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1 shrink-0" />
                  <p>Short tea or coffee breaks are recommended for 10–15 minutes to stay refreshed.</p>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50/80 border border-slate-100 flex items-start gap-2.5">
                  <div className="w-2 h-2 rounded-full bg-indigo-500 mt-1 shrink-0" />
                  <p>Your break notice automatically notifies your manager in real-time when active.</p>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50/80 border border-slate-100 flex items-start gap-2.5">
                  <div className="w-2 h-2 rounded-full bg-amber-500 mt-1 shrink-0" />
                  <p>You can modify your time or end early at any moment using your active card above.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Today's Break Schedule / History Table (User-based for regular users, Team-based for managers) */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <History className="w-4 h-4 text-indigo-600" />
              <span>{currentUser?.role === 'user' ? 'My Break Log & Records' : "Today's Break Log & Records"}</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {currentUser?.role === 'user'
                ? 'History of all breaks logged by you today.'
                : `Complete log of all breaks taken today across ${teamName} and your department.`}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              refreshActiveBreaks();
              refreshTodayBreaks();
            }}
            className="px-3.5 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 self-start sm:self-auto cursor-pointer"
          >
            Refresh Log
          </button>
        </div>

        {(() => {
          const isUserRole = currentUser?.role === 'user';
          const displayedBreaks = isUserRole
            ? (todayTeamBreaks || []).filter(
                b =>
                  (currentUser?.id && (b.userId === currentUser.id || String(b.userId) === String(currentUser.id))) ||
                  (currentUser?.email && b.userEmail?.toLowerCase() === currentUser.email.toLowerCase())
              )
            : (todayTeamBreaks || []);

          if (displayedBreaks.length === 0) {
            return (
              <div className="py-10 text-center text-xs text-slate-400">
                {isUserRole ? 'No breaks logged by you today yet.' : 'No breaks logged today for this team yet.'}
              </div>
            );
          }

          return (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead>
                  <tr className="border-b border-slate-100 text-[11px] uppercase tracking-wider text-slate-400 font-bold">
                    <th className="py-3 px-3">Member</th>
                    <th className="py-3 px-3">Date</th>
                    <th className="py-3 px-3">From - To</th>
                    <th className="py-3 px-3">Reason / Description</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {displayedBreaks.map((b: BreakTimeRecord) => {
                    const isMe = currentUser?.id && (b.userId === currentUser.id || b.userEmail?.toLowerCase() === currentUser.email?.toLowerCase());
                    const isManagerOrAdmin = currentUser?.role === 'manager' || currentUser?.role === 'admin';
                    const isActive = b.status === 'active' && new Date(b.toTimestamp).getTime() > Date.now();
                    const canDelete = isMe || isManagerOrAdmin;

                    const formattedRowDate = b.date
                      ? new Date(b.date + 'T00:00:00').toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })
                      : todayDisplayDate;

                    return (
                      <tr key={b.id || b.customId} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3.5 px-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-xs shrink-0">
                              {(b.userName || 'U')[0]}
                            </div>
                            <div>
                              <span className="font-bold text-slate-800">
                                {b.userName}
                              </span>
                              {isMe && <span className="ml-1 text-[10px] text-indigo-600 font-semibold">(You)</span>}
                              {b.teamName && (
                                <div className="text-[10px] text-slate-400">{b.teamName}</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-3 font-medium text-slate-700">
                          <span className="inline-flex items-center gap-1 text-[11px] text-slate-600">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            {formattedRowDate}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 font-semibold text-slate-800">
                          {b.fromTime} - {b.toTime}
                        </td>
                        <td className="py-3.5 px-3 font-medium text-slate-700">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold text-[11px]">
                            {b.reason}
                          </span>
                        </td>
                        <td className="py-3.5 px-3">
                          {isActive ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                              Active ({formatRemaining(b.toTimestamp, b.fromTime, b.toTime)})
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3" />
                              Completed
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {isActive && isMe && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleStartEdit(b)}
                                  className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 cursor-pointer transition-all flex items-center gap-1"
                                  title="Modify Break Time"
                                >
                                  <Edit3 className="w-3 h-3" />
                                  Modify
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleEndBreak(b.id || b.customId || '')}
                                  className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-600 hover:bg-amber-700 text-white cursor-pointer transition-all"
                                >
                                  End Early
                                </button>
                              </>
                            )}
                            {canDelete && (
                              <button
                                type="button"
                                onClick={() => handleDeleteBreak(b.id || b.customId || '')}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 cursor-pointer transition-all"
                                title="Delete this break record"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          );
        })()}
      </div>
    </div>
  );
};
