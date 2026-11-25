import React, { useState, useEffect } from 'react';
import { LogIn, LogOut, Clock, CheckCircle2, CalendarCheck } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const AttendanceWidget: React.FC = () => {
  const { todayAttendance, handlePunchIn, handlePunchOut, setUserNav, setAdminNav, portalMode } = useApp();
  const [liveElapsed, setLiveElapsed] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const isPunchedIn = todayAttendance?.status === 'punched_in';
  const baseSeconds = todayAttendance?.totalSeconds || 0;

  // Running timer ticker when punched in
  useEffect(() => {
    setLiveElapsed(baseSeconds);
    if (!isPunchedIn) return;

    const interval = setInterval(() => {
      setLiveElapsed(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isPunchedIn, baseSeconds]);

  const formatHoursMins = (totalSecs: number) => {
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    return `${hrs}h ${mins.toString().padStart(2, '0')}m ${secs.toString().padStart(2, '0')}s`;
  };

  const onPunchIn = async () => {
    setIsProcessing(true);
    await handlePunchIn();
    setIsProcessing(false);
  };

  const onPunchOut = async () => {
    setIsProcessing(true);
    await handlePunchOut();
    setIsProcessing(false);
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      {/* Attendance Info */}
      <div className="flex items-center gap-3.5">
        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold shadow-xs transition-colors ${
          isPunchedIn
            ? 'bg-emerald-50 text-emerald-600 border border-emerald-200/60'
            : 'bg-slate-100 text-slate-500 border border-slate-200/60'
        }`}>
          {isPunchedIn ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <Clock className="w-5 h-5 text-slate-400" />}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase tracking-wider text-gray-500">
              Workspace Attendance
            </span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              isPunchedIn
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-slate-100 text-slate-600 border border-slate-200'
            }`}>
              {isPunchedIn ? 'Present & Punched In' : 'Punched Out'}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-700 mt-0.5 flex-wrap">
            <span>Today's Time Present:</span>
            <span className={`font-mono text-sm font-black ${isPunchedIn ? 'text-emerald-600' : 'text-gray-900'}`}>
              {formatHoursMins(liveElapsed)}
            </span>
            <span className="text-[11px] font-bold text-gray-500">
              ({(liveElapsed / 3600).toFixed(2)} hrs)
            </span>
            {isPunchedIn && (
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-ping ml-1" />
            )}
          </div>
        </div>
      </div>

      {/* Punch In / Out Actions & Record Nav */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          type="button"
          onClick={() => {
            if (portalMode === 'admin') {
              setAdminNav('record');
            } else {
              setUserNav('record');
            }
          }}
          className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-[#5a36e6] border border-purple-200 text-xs font-bold transition shadow-xs cursor-pointer"
          title="View Day-by-Day Attendance Record"
        >
          <CalendarCheck className="w-4 h-4 text-[#5a36e6]" />
          <span>Record</span>
        </button>

        {isPunchedIn ? (
          <button
            type="button"
            disabled={isProcessing}
            onClick={onPunchOut}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-50"
          >
            <LogOut className="w-4 h-4 text-rose-600" />
            <span>{isProcessing ? 'Recording...' : 'Punch Out'}</span>
          </button>
        ) : (
          <button
            type="button"
            disabled={isProcessing}
            onClick={onPunchIn}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-md shadow-emerald-600/20 cursor-pointer disabled:opacity-50"
          >
            <LogIn className="w-4 h-4" />
            <span>{isProcessing ? 'Recording...' : 'Punch In (Present)'}</span>
          </button>
        )}
      </div>
    </div>
  );
};
