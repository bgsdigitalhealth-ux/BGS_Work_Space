import React from 'react';
import { CheckCircle2, Check, Trash2 } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const TodayWorkDone: React.FC = () => {
  const { selectedTeam, workDone, handleDeleteWorkDone } = useApp();

  return (
    <div id="todays-workdone-section" className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-xs flex-1 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Today's Work Done</h3>
            <p className="text-[11px] text-slate-400">({selectedTeam?.name || 'Selected Team'} · Auto-updated)</p>
          </div>
        </div>
      </div>

      <div className="space-y-2.5 flex-1 overflow-y-auto max-h-56">
        {workDone.length === 0 ? (
          <div className="py-6 text-center text-slate-400 text-xs">
            No work logs completed today yet. Automatically populated when team members finish and submit work.
          </div>
        ) : (
          workDone.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-3 rounded-xl border border-emerald-50 bg-emerald-50/20 hover:bg-emerald-50/40 transition-all group"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
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
              <button
                onClick={() => handleDeleteWorkDone(item.id)}
                title="Delete work log"
                className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-all cursor-pointer ml-2 shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
