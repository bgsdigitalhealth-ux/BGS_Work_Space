import React from 'react';
import { ClipboardList, Check, Trash2, Plus } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const TodayTasks: React.FC = () => {
  const { selectedTeam, tasks, handleDeleteTask, handleToggleTask, setIsAddTaskOpen } = useApp();

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
    <div id="todays-tasks-section" className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-xs flex-1 flex flex-col">
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
          type="button"
          onClick={() => setIsAddTaskOpen(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#5a36e6] hover:bg-[#4828c4] text-white text-xs font-bold transition shadow-xs cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Task</span>
        </button>
      </div>

      <div className="space-y-2.5 flex-1 overflow-y-auto max-h-56">
        {tasks.length === 0 ? (
          <div className="py-6 text-center text-slate-400 text-xs">
            No tasks assigned for today yet. Use "+ Add Task" to create one.
          </div>
        ) : (
          tasks.map((task) => (
            <div
              key={task.id}
              className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50/70 transition-all group"
            >
              <div
                onClick={() => handleToggleTask(task.id)}
                className="flex items-center gap-3 select-none flex-1 min-w-0 cursor-pointer"
                title="Click to toggle status"
              >
                <div
                  className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all shrink-0 ${task.completed
                    ? 'bg-emerald-600 border-emerald-600 text-white'
                    : 'border-slate-300 bg-white hover:border-indigo-500'
                    }`}
                >
                  {task.completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-xs font-semibold truncate ${task.completed ? 'line-through text-slate-400' : 'text-slate-800'
                        }`}
                    >
                      {task.title}
                    </span>
                    {task.assignmentType && (
                      <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold shrink-0 ${task.assignmentType === 'admin_to_user' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' :
                        task.assignmentType === 'admin_to_admin' ? 'bg-purple-50 text-purple-700 border border-purple-200' :
                          task.assignmentType === 'user_to_admin' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                            'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}>
                        {task.assignmentType === 'admin_to_user' ? 'Admin → User' :
                          task.assignmentType === 'admin_to_admin' ? 'Admin → Admin' :
                            task.assignmentType === 'user_to_admin' ? 'User → Admin' : 'User → User'}
                      </span>
                    )}
                  </div>
                  {task.memberName && (
                    <div className="flex items-center gap-2 text-[10px] text-slate-400">
                      <span>To: {task.memberName}</span>
                      {task.assignedBy && <span>· By: {task.assignedBy}</span>}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 ml-2">
                {getPriorityBadge(task.priority)}
                <button
                  type="button"
                  onClick={() => handleDeleteTask(task.id)}
                  title="Delete task"
                  className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-all cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
