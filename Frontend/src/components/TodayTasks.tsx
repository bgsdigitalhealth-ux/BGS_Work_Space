import React from 'react';
import { ClipboardList, Plus, Check } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const TodayTasks: React.FC = () => {
  const { selectedTeam, tasks, handleToggleTask, setIsAddTaskOpen } = useApp();

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'High':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-700">
            High
          </span>
        );
      case 'Medium':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
            Medium
          </span>
        );
      case 'Low':
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
            Low
          </span>
        );
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-sm flex-1 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <ClipboardList className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Today's Tasks</h3>
            <p className="text-[11px] text-slate-400">({selectedTeam?.name || 'Backend Team'})</p>
          </div>
        </div>

        <button
          onClick={() => setIsAddTaskOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Task</span>
        </button>
      </div>

      <div className="space-y-2.5 flex-1 overflow-y-auto max-h-56">
        {tasks.length === 0 ? (
          <div className="py-6 text-center text-slate-400 text-xs">
            No tasks scheduled for today. Add one above!
          </div>
        ) : (
          tasks.map((task) => (
            <div
              key={task.id}
              onClick={() => handleToggleTask(task.id)}
              className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50/70 transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                    task.completed
                      ? 'bg-indigo-600 border-indigo-600 text-white'
                      : 'border-slate-300 group-hover:border-indigo-400 bg-white'
                  }`}
                >
                  {task.completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>
                <span
                  className={`text-xs font-medium ${
                    task.completed ? 'line-through text-slate-400' : 'text-slate-800'
                  }`}
                >
                  {task.title}
                </span>
              </div>
              <div>{getPriorityBadge(task.priority)}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
