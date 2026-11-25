import React, { useState, useEffect } from 'react';
import {
  Coffee,
  Clock,
  CheckCircle2,
  Users,
  History,
  Edit3,
  X,
  Save
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { BreakTimeRecord } from '../../types';

export const BreakTimeView: React.FC = () => {
  const {
    currentUser,
    members,
    activeTeamBreaks,
    todayTeamBreaks,
    handleStartBreak,
    handleUpdateBreak,
    handleEndBreak,
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

  // Format current time as default (e.g. 12:30 PM)
  const formatTimeStr = (d: Date) => {
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const [fromTime, setFromTime] = useState('');
  const [toTime, setToTime] = useState('');
  const [reason, setReason] = useState('Tea / Coffee Break');
  const [editingBreakId, setEditingBreakId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [, setTick] = useState(0);

  // Initialize default times on mount
  useEffect(() => {
    const now = new Date();
    const end = new Date(now.getTime() + 30 * 60 * 1000);
    setFromTime(formatTimeStr(now));
    setToTime(formatTimeStr(end));
  }, []);

  // Live timer tick for countdown
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
    if (!fromTime.trim() || !toTime.trim()) {
      alert('Please specify both From and To time.');
      return;
    }

    setIsSubmitting(true);
    try {
      const finalReason = reason.trim() || 'Break';

      if (editingBreakId) {
        // User modifying their active break
        await handleUpdateBreak(editingBreakId, {
          fromTime: fromTime.trim(),
          toTime: toTime.trim(),
          reason: finalReason
        });
        setEditingBreakId(null);
      } else {
        // User submitting a new break
        await handleStartBreak({
          fromTime: fromTime.trim(),
          toTime: toTime.trim(),
          reason: finalReason
        });
      }
    } catch (err) {
      // Error handled in context
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatRemaining = (toTimestamp: string | Date) => {
    const diff = Math.max(0, Math.floor((new Date(toTimestamp).getTime() - Date.now()) / 1000));
    if (diff <= 0) return 'Ending now';
    const hours = Math.floor(diff / 3600);
    const mins = Math.floor((diff % 3600) / 60);
    const secs = diff % 60;
    if (hours > 0) return `${hours}h ${mins}m ${secs}s`;
    return `${mins}m ${secs < 10 ? '0' : ''}${secs}s`;
  };

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
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Break Time
            </h1>
            <p className="text-sm sm:text-base text-indigo-200 mt-2">
              Log or update your break schedule anytime. Your active break notice is broadcast to your team and manager until the scheduled end time.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start md:self-center">
            <div className="px-4 py-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 text-center">
              <div className="text-2xl font-black text-amber-300">{activeTeamBreaks.length}</div>
              <div className="text-xs text-indigo-200 font-medium">Team On Break</div>
            </div>
            <div className="px-4 py-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 text-center">
              <div className="text-2xl font-black text-emerald-300">{todayTeamBreaks.length}</div>
              <div className="text-xs text-indigo-200 font-medium">Today's Breaks</div>
            </div>
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
                  : 'Enter your break schedule. Your name is auto-selected based on your account.'}
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

            {/* Time Slot Inputs: From & To */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                    placeholder="e.g. 12:30 PM"
                    required
                    className="w-full px-4 py-3 rounded-2xl bg-white border border-slate-300 text-slate-900 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <Clock className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5 pointer-events-none" />
                </div>
              </div>

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
                    placeholder="e.g. 01:00 PM"
                    required
                    className="w-full px-4 py-3 rounded-2xl bg-white border border-slate-300 text-slate-900 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <Clock className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Break Reason / Description (Free custom input with quick suggestions) */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                Break Reason / Description <span className="text-slate-400 font-normal">(Customizable)</span>
              </label>
              <input
                type="text"
                list="break-reason-datalist"
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder="Enter break reason (e.g. Lunch, Tea / Coffee, Personal errand...)"
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
                disabled={isSubmitting}
                className={`flex-1 py-3.5 rounded-2xl text-white font-bold text-sm sm:text-base shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 ${
                  editingBreakId
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700'
                    : 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700'
                }`}
              >
                {isSubmitting ? (
                  <span>Saving Changes...</span>
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
                    {formatRemaining(myActiveBreak.toTimestamp)}
                  </strong>
                </div>
              </div>

              <div className="flex items-center gap-2.5 relative z-10">
                <button
                  type="button"
                  onClick={() => handleStartEdit(myActiveBreak)}
                  className="flex-1 py-3 rounded-2xl bg-white/90 hover:bg-white text-slate-800 font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  title="Modify break time or reason"
                >
                  <Edit3 className="w-4 h-4 text-indigo-600" />
                  <span>Modify Break</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleEndBreak(myActiveBreak.id || myActiveBreak.customId || '')}
                  className="flex-1 py-3 rounded-2xl bg-white text-amber-900 font-bold text-xs sm:text-sm shadow-md hover:bg-amber-50 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>End Break Early</span>
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
                You currently do not have an active break. Whenever you need one, use the form to set your time and notify your team.
              </p>
            </div>
          )}

          {/* Team Members Currently on Break */}
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
                        {formatRemaining(b.toTimestamp)}
                      </div>
                      <div className="text-[10px] text-slate-400">Active Notice</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Today's Team Break Schedule / History Table */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <History className="w-4 h-4 text-indigo-600" />
              <span>Today's Team Break Log</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              History of all breaks taken today across {teamName}.
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

        {todayTeamBreaks.length === 0 ? (
          <div className="py-10 text-center text-xs text-slate-400">
            No breaks logged today for this team yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] uppercase tracking-wider text-slate-400 font-bold">
                  <th className="py-3 px-3">Member</th>
                  <th className="py-3 px-3">Break Type</th>
                  <th className="py-3 px-3">From - To</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {todayTeamBreaks.map((b: BreakTimeRecord) => {
                  const isMe = currentUser?.id && (b.userId === currentUser.id || b.userEmail?.toLowerCase() === currentUser.email?.toLowerCase());
                  const isActive = b.status === 'active' && new Date(b.toTimestamp).getTime() > Date.now();

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
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-3 font-medium text-slate-700">
                        {b.reason}
                      </td>
                      <td className="py-3.5 px-3 font-semibold text-slate-800">
                        {b.fromTime} - {b.toTime}
                      </td>
                      <td className="py-3.5 px-3">
                        {isActive ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                            Active ({formatRemaining(b.toTimestamp)})
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" />
                            Completed
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-3 text-right">
                        {isActive && isMe ? (
                          <div className="flex items-center justify-end gap-1.5">
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
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
