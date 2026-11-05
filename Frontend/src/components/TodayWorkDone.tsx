import React from 'react';
import { CheckCircle2, Plus, Check } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const TodayWorkDone: React.FC = () => {
  const { selectedTeam, workDone, setIsAddWorkDoneOpen } = useApp();

  return (
    <div className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-sm flex-1 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Today's Work Done</h3>
            <p className="text-[11px] text-slate-400">({selectedTeam?.name || 'Backend Team'})</p>
          </div>
        </div>

        <button
          onClick={() => setIsAddWorkDoneOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Work Done</span>
        </button>
      </div>

      <div className="space-y-2.5 flex-1 overflow-y-auto max-h-56">
        {workDone.length === 0 ? (
          <div className="py-6 text-center text-slate-400 text-xs">
            No work logs completed today yet.
          </div>
        ) : (
          workDone.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-3 p-3 rounded-xl border border-emerald-50 bg-emerald-50/20 hover:bg-emerald-50/40 transition-all"
            >
              <div className="w-5 h-5 rounded-md bg-emerald-500 text-white flex items-center justify-center shrink-0">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-slate-800 truncate">
                  {item.title}
                </p>
                {item.details && (
                  <p className="text-[11px] text-slate-500 truncate mt-0.5">
                    {item.details}
                  </p>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
