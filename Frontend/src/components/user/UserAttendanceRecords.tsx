import React, { useState, useEffect } from 'react';
import { 
  CalendarCheck, 
  Clock, 
  Search, 
  ChevronDown, 
  ChevronUp, 
  Calendar,
  Timer,
  TrendingUp,
  UserCheck
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { AttendancePunch } from '../../types';

export const UserAttendanceRecords: React.FC = () => {
  const { 
    todayAttendance, 
    attendanceRecords, 
    refreshAttendanceRecords, 
    currentUser 
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<'all' | 'week' | 'month'>('all');
  const [expandedDates, setExpandedDates] = useState<Record<string, boolean>>({});
  const [liveElapsed, setLiveElapsed] = useState<number>(0);

  const isPunchedIn = todayAttendance?.status === 'punched_in';
  const baseSeconds = todayAttendance?.totalSeconds || 0;

  // Live timer for today when punched in
  useEffect(() => {
    setLiveElapsed(baseSeconds);
    if (!isPunchedIn) return;

    const interval = setInterval(() => {
      setLiveElapsed(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isPunchedIn, baseSeconds]);

  // Refresh records on mount
  useEffect(() => {
    refreshAttendanceRecords();
  }, []);

  const formatHoursDetailed = (totalSecs: number) => {
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    return `${hrs}h ${mins.toString().padStart(2, '0')}m ${secs.toString().padStart(2, '0')}s`;
  };

  const formatTimeOnly = (dateVal?: string | Date | null) => {
    if (!dateVal || dateVal === 'Active') return 'Currently Active';
    if (String(dateVal).includes('11:59 PM')) return '11:59 PM';
    try {
      const d = new Date(dateVal);
      if (!isNaN(d.getTime())) {
        return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      }
    } catch {}
    return String(dateVal);
  };

  const formatDateDisplay = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      if (!isNaN(d.getTime())) {
        const dayName = d.toLocaleDateString('en-GB', { weekday: 'short' });
        const day = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
        return { formatted: day, weekday: dayName };
      }
    } catch {}
    return { formatted: dateStr, weekday: '' };
  };

  const todayStr = new Date().toISOString().split('T')[0];

  const toggleExpand = (date: string) => {
    setExpandedDates(prev => ({
      ...prev,
      [date]: !prev[date]
    }));
  };

  // Helper to compute seconds for any record (including auto midnight fallback for unclosed past days)
  const getCalculatedRecordSeconds = (rec: any) => {
    const isRecToday = rec.date === todayStr;
    if (isRecToday && isPunchedIn) return liveElapsed;
    if (rec.totalSeconds && rec.totalSeconds > 0) return rec.totalSeconds;
    const pArr = Array.isArray(rec.punches) ? rec.punches : [];
    if (pArr.length > 0) {
      return pArr.reduce((sum: number, p: any) => {
        if (p.durationSeconds && p.durationSeconds > 0) return sum + p.durationSeconds;
        const pIn = new Date(p.punchIn).getTime();
        if (isNaN(pIn)) return sum;
        const pOut = p.punchOut ? new Date(p.punchOut).getTime() : 0;
        if (pOut > pIn) return sum + Math.round((pOut - pIn) / 1000);
        // Fallback: duration up to 23:59:59 of punch in date
        const pInDate = new Date(p.punchIn);
        const endOfDay = new Date(pInDate);
        endOfDay.setHours(23, 59, 59, 0);
        return sum + Math.max(0, Math.round((endOfDay.getTime() - pIn) / 1000));
      }, 0);
    }
    return 0;
  };

  // Merge today's live record with attendanceRecords if present
  const allRecords = [...(attendanceRecords || [])];
  if (todayAttendance) {
    const idx = allRecords.findIndex(r => r.date === todayStr);
    if (idx >= 0) {
      allRecords[idx] = {
        ...allRecords[idx],
        ...todayAttendance,
        totalSeconds: isPunchedIn ? liveElapsed : todayAttendance.totalSeconds,
        status: todayAttendance.status
      };
    } else {
      allRecords.unshift({
        ...todayAttendance,
        totalSeconds: isPunchedIn ? liveElapsed : todayAttendance.totalSeconds
      });
    }
  }

  // Filter records
  const filteredRecords = allRecords.filter(record => {
    // Search query match
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchDate = record.date.toLowerCase().includes(q);
      const matchUser = (record.userName || '').toLowerCase().includes(q);
      if (!matchDate && !matchUser) return false;
    }

    // Date range filter
    if (dateFilter === 'week') {
      const recDate = new Date(record.date);
      const now = new Date();
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(now.getDate() - 7);
      if (recDate < oneWeekAgo) return false;
    } else if (dateFilter === 'month') {
      const recDate = new Date(record.date);
      const now = new Date();
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(now.getMonth() - 1);
      if (recDate < oneMonthAgo) return false;
    }

    return true;
  });

  // Calculate Cumulative Metrics
  const totalSecondsAll = filteredRecords.reduce((acc, r) => acc + getCalculatedRecordSeconds(r), 0);
  const totalDaysCount = filteredRecords.length;
  const avgSecondsPerDay = totalDaysCount > 0 ? Math.round(totalSecondsAll / totalDaysCount) : 0;

  return (
    <div className="space-y-6 pb-16 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#5a36e6] to-[#7b5cf0] text-white flex items-center justify-center font-bold shadow-lg shadow-indigo-600/20">
            <CalendarCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl font-black text-gray-900 tracking-tight">Attendance Record</h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-[#5a36e6] border border-indigo-200/60">
                Day by Day
              </span>
            </div>
            <p className="text-xs text-gray-500 font-medium mt-1">
              Store and review day-by-day punch in, punch out, and total hours logged.
            </p>
          </div>
        </div>

        {/* Refresh Action (Punch option is strictly scoped to Dashboard) */}
        <div className="flex items-center gap-2.5 self-start md:self-auto">
          <button
            type="button"
            onClick={() => refreshAttendanceRecords()}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-semibold transition cursor-pointer"
          >
            Refresh Records
          </button>
        </div>
      </div>

      {/* 4 Summary KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Today's Time Present */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Today's Time Present</span>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${isPunchedIn ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-black text-gray-900 font-mono tracking-tight">
              {formatHoursDetailed(liveElapsed)}
            </span>
          </div>
          <p className="text-[11px] font-semibold text-gray-400 mt-1">
            {isPunchedIn ? 'Live tracking active now' : 'Recorded today'} &bull; {(liveElapsed / 3600).toFixed(2)} hrs
          </p>
        </div>

        {/* Card 2: Current Attendance Status */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Workspace Status</span>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${isPunchedIn ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-black ${
              isPunchedIn
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-slate-100 text-slate-700 border border-slate-200'
            }`}>
              {isPunchedIn ? 'Present & Working' : 'Punched Out'}
            </span>
          </div>
          <p className="text-[11px] font-semibold text-gray-400 mt-2">
            {currentUser?.name || 'Member'} &bull; {currentUser?.team || 'Neural Network Team'}
          </p>
        </div>

        {/* Card 3: Total Recorded Days */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Days Recorded</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-[#5a36e6] flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <span className="text-2xl font-black text-gray-900 tracking-tight">
            {totalDaysCount} <span className="text-sm font-bold text-gray-500 font-sans">Days</span>
          </span>
          <p className="text-[11px] font-semibold text-gray-400 mt-1">
            Historical daily punch sheets
          </p>
        </div>

        {/* Card 4: Total Cumulative Work Hours */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Cumulative Hours</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-[#5a36e6] flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <span className="text-2xl font-black text-gray-900 tracking-tight">
            {(totalSecondsAll / 3600).toFixed(1)} <span className="text-sm font-bold text-gray-500 font-sans">Hours</span>
          </span>
          <p className="text-[11px] font-semibold text-gray-400 mt-1">
            Avg {formatHoursDetailed(avgSecondsPerDay)} / day
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Quick Range Filter Pills */}
        <div className="flex items-center gap-1.5 bg-gray-100/80 p-1 rounded-xl self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setDateFilter('all')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              dateFilter === 'all'
                ? 'bg-white text-gray-900 shadow-xs'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            All Dates ({allRecords.length})
          </button>
          <button
            type="button"
            onClick={() => setDateFilter('week')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              dateFilter === 'week'
                ? 'bg-white text-gray-900 shadow-xs'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            Past 7 Days
          </button>
          <button
            type="button"
            onClick={() => setDateFilter('month')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              dateFilter === 'month'
                ? 'bg-white text-gray-900 shadow-xs'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            Past 30 Days
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by date (e.g. 2026-11)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5a36e6] focus:bg-white text-gray-800 font-medium"
          />
        </div>
      </div>

      {/* Day-by-Day Records Table & Cards */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Timer className="w-4 h-4 text-[#5a36e6]" />
            <h3 className="text-sm font-bold text-gray-900">Daily Punch In & Punch Out Log</h3>
          </div>
          <span className="text-xs font-semibold text-gray-500">
            Showing {filteredRecords.length} day {filteredRecords.length === 1 ? 'record' : 'records'}
          </span>
        </div>

        {filteredRecords.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-[#5a36e6] flex items-center justify-center mx-auto mb-3">
              <CalendarCheck className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-gray-800 mb-1">No Attendance Records Found</h4>
            <p className="text-xs text-gray-500 max-w-sm mx-auto font-medium">
              You haven't recorded any punches for this filter range yet. Use the Punch In button on your Dashboard to begin tracking your workspace hours.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredRecords.map((record) => {
              const isToday = record.date === todayStr;
              const isPast = record.date < todayStr;
              const dateInfo = formatDateDisplay(record.date);
              const isExpanded = Boolean(expandedDates[record.date]);
              const punches = Array.isArray(record.punches) ? record.punches : [];

              // On past dates, a user is never currently punched in
              const isEffectivelyPunchedIn = isToday && isPunchedIn;
              const isAutoOut = Boolean(record.autoPunchedOut) || (isPast && record.status === 'punched_in');

              const firstIn = punches.length > 0 ? formatTimeOnly(punches[0].punchIn) : (record.firstPunchIn ? formatTimeOnly(record.firstPunchIn) : '—');

              let lastOut = '—';
              if (punches.length > 0) {
                const lp = punches[punches.length - 1];
                if (lp.punchOut) {
                  const formatted = formatTimeOnly(lp.punchOut);
                  lastOut = (lp.autoPunchedOut || formatted.includes('11:59')) ? '11:59 PM' : formatted;
                } else if (isEffectivelyPunchedIn) {
                  lastOut = 'Currently Active';
                } else {
                  // Past day without manual punch out: automatically 11:59 PM
                  lastOut = '11:59 PM (Auto)';
                }
              } else if (record.lastPunchOut) {
                const formatted = formatTimeOnly(record.lastPunchOut);
                lastOut = (record.autoPunchedOut || formatted.includes('11:59')) ? '11:59 PM' : formatted;
              } else if (isPast && record.firstPunchIn) {
                lastOut = '11:59 PM (Auto)';
              }

              const recordSeconds = getCalculatedRecordSeconds(record);
              const hoursDecimal = (recordSeconds / 3600).toFixed(2);

              return (
                <div key={record.date} className="p-5 hover:bg-gray-50/60 transition-colors">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Date Column */}
                    <div className="flex items-center gap-3.5">
                      <div className={`w-11 h-11 rounded-2xl flex flex-col items-center justify-center font-bold text-center shrink-0 border ${
                        isToday
                          ? 'bg-purple-50 text-[#5a36e6] border-purple-200'
                          : 'bg-gray-50 text-gray-700 border-gray-200'
                      }`}>
                        <span className="text-[10px] uppercase font-black leading-none">{dateInfo.weekday || 'Day'}</span>
                        <span className="text-xs font-black mt-0.5">{record.date.split('-')[2]}</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-gray-900">{dateInfo.formatted}</span>
                          {isToday && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-100 text-[#5a36e6]">
                              Today
                            </span>
                          )}
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isEffectivelyPunchedIn
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : isAutoOut
                                ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                : 'bg-slate-100 text-slate-600 border border-slate-200'
                          }`}>
                            {isEffectivelyPunchedIn
                              ? 'Present & Working'
                              : isAutoOut
                                ? 'Punched Out (11:59 PM Auto)'
                                : 'Punched Out'}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500 font-medium mt-0.5 block">
                          {punches.length} {punches.length === 1 ? 'Punch Session' : 'Punch Sessions'} Logged
                        </span>
                      </div>
                    </div>

                    {/* Punch In / Out Times & Total Hours */}
                    <div className="flex items-center gap-6 sm:gap-8 flex-wrap">
                      {/* First Punch In */}
                      <div>
                        <span className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                          First Punch In
                        </span>
                        <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md mt-0.5 inline-block border border-emerald-200/60 font-mono">
                          {firstIn}
                        </span>
                      </div>

                      {/* Last Punch Out */}
                      <div>
                        <span className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                          Last Punch Out
                        </span>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-md mt-0.5 inline-block font-mono border ${
                          lastOut === 'Currently Active'
                            ? 'bg-purple-50 text-[#5a36e6] border-purple-200'
                            : lastOut.includes('11:59')
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : 'bg-gray-100 text-gray-700 border-gray-200'
                        }`}>
                          {lastOut}
                        </span>
                      </div>

                      {/* Total Time Present in Hours */}
                      <div>
                        <span className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                          Total Time (Hours)
                        </span>
                        <div className="flex items-baseline gap-1 mt-0.5">
                          <span className="text-sm font-black text-gray-900 font-mono">
                            {formatHoursDetailed(recordSeconds)}
                          </span>
                          <span className="text-xs font-bold text-gray-500">
                            ({hoursDecimal} hrs)
                          </span>
                        </div>
                      </div>

                      {/* Toggle Sessions Detail Button */}
                      <button
                        type="button"
                        onClick={() => toggleExpand(record.date)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200/80 text-gray-700 text-xs font-bold transition cursor-pointer ml-auto"
                      >
                        <span>{isExpanded ? 'Hide Sessions' : 'View Sessions'}</span>
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Expandable Session Breakdown */}
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-gray-100 pl-4 sm:pl-14">
                      <h5 className="text-xs font-bold text-gray-800 mb-2 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-[#5a36e6]" />
                        <span>Daily Punch Sessions Breakdown</span>
                      </h5>
                      {punches.length === 0 ? (
                        <p className="text-xs text-gray-400">No session intervals recorded for this day.</p>
                      ) : (
                        <div className="space-y-2">
                          {punches.map((p: AttendancePunch, pIdx: number) => {
                            const isLastPunch = pIdx === punches.length - 1;
                            const pInStr = formatTimeOnly(p.punchIn);
                            let pOutStr = '—';
                            let sessionSecs = p.durationSeconds || 0;

                            if (p.punchOut) {
                              const formatted = formatTimeOnly(p.punchOut);
                              pOutStr = (p.autoPunchedOut || formatted.includes('11:59')) ? '11:59 PM (Auto Punch Out)' : formatted;
                              if (sessionSecs === 0) {
                                const pInTime = new Date(p.punchIn).getTime();
                                const pOutTime = new Date(p.punchOut).getTime();
                                if (pOutTime > pInTime) sessionSecs = Math.round((pOutTime - pInTime) / 1000);
                              }
                            } else if (isEffectivelyPunchedIn && isLastPunch) {
                              pOutStr = 'Currently In Progress';
                              sessionSecs = Math.max(0, Math.round((Date.now() - new Date(p.punchIn).getTime()) / 1000));
                            } else {
                              pOutStr = '11:59 PM (Auto Punch Out)';
                              const pInDate = new Date(p.punchIn);
                              const endOfDay = new Date(pInDate);
                              endOfDay.setHours(23, 59, 59, 0);
                              sessionSecs = Math.max(0, Math.round((endOfDay.getTime() - pInDate.getTime()) / 1000));
                            }

                            return (
                              <div
                                key={pIdx}
                                className="bg-gray-50 p-3 rounded-xl border border-gray-100 flex items-center justify-between text-xs flex-wrap gap-2"
                              >
                                <div className="flex items-center gap-2">
                                  <span className="w-5 h-5 rounded-md bg-purple-100 text-[#5a36e6] font-black text-[10px] flex items-center justify-center">
                                    {pIdx + 1}
                                  </span>
                                  <span className="font-semibold text-gray-800">
                                    Punch In: <span className="font-mono font-bold text-emerald-700">{pInStr}</span>
                                  </span>
                                  <span className="text-gray-400">&rarr;</span>
                                  <span className="font-semibold text-gray-800">
                                    Punch Out: <span className={`font-mono font-bold ${pOutStr === 'Currently In Progress' ? 'text-[#5a36e6]' : pOutStr.includes('11:59') ? 'text-amber-800 font-semibold' : 'text-gray-700'}`}>{pOutStr}</span>
                                  </span>
                                </div>
                                <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-gray-800">
                                  <span>{formatHoursDetailed(sessionSecs)}</span>
                                  <span className="text-gray-400 font-sans font-semibold">({(sessionSecs / 3600).toFixed(2)} hrs)</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
