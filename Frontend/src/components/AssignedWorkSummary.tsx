import React from 'react';
import { Layers, Calendar, Trash2, CheckCircle2, RotateCcw } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const AssignedWorkSummary: React.FC = () => {
  const { selectedTeam, assignments, members, handleDeleteAssignment, handleApproveWork, handleRequestRework } = useApp();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'In Progress':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-100 text-blue-700">
            In Progress
          </span>
        );
      case 'To Do':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-700">
            To Do
          </span>
        );
      case 'In Review':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-100 text-purple-700">
            In Review
          </span>
        );
      case 'Completed':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-700">
            Completed
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700">
            {status}
          </span>
        );
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role.toLowerCase()) {
      case 'team lead':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-100 text-indigo-700">
            Team Lead
          </span>
        );
      case 'developer':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 text-blue-700">
            Developer
          </span>
        );
      case 'tester':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-700">
            Tester
          </span>
        );
      case 'designer':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-pink-100 text-pink-700">
            Designer
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700">
            {role}
          </span>
        );
    }
  };

  const getAvatarColor = (name: string) => {
    const char = (name || 'A').charAt(0).toUpperCase();
    if (['R', 'V', 'H'].includes(char)) return 'bg-purple-100 text-purple-700 ring-purple-200';
    if (['P', 'K', 'G'].includes(char)) return 'bg-blue-100 text-blue-700 ring-blue-200';
    if (['A', 'T'].includes(char)) return 'bg-emerald-100 text-emerald-700 ring-emerald-200';
    return 'bg-pink-100 text-pink-700 ring-pink-200';
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-xs flex-1 flex flex-col">
      <div className="flex items-center gap-2.5 mb-1">
        <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
          <Layers className="w-4 h-4" />
        </div>
        <h3 className="font-bold text-slate-900 text-base">Assigned Work Summary</h3>
      </div>
      <p className="text-xs text-slate-500 mb-4">
        Recently assigned work for {selectedTeam?.name || 'Selected Team'} ({members.length} members).
      </p>

      <div className="space-y-3 overflow-y-auto flex-1 max-h-[380px] pr-1">
        {assignments.length === 0 ? (
          <div className="p-6 text-center text-slate-400 text-xs">
            No work items assigned yet. Fill out the form to assign work!
          </div>
        ) : (
          assignments.map((item) => {
            const member = members.find((m) => m.id === item.memberId) || {
              name: 'Team Member',
              avatar: 'M',
            };

            return (
              <div
                key={item.id}
                className="p-3.5 rounded-xl border border-slate-100 hover:border-indigo-100 hover:bg-slate-50/50 transition-all flex items-center justify-between gap-3 group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ring-1 ${getAvatarColor(
                      member.name
                    )}`}
                  >
                    {member.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-slate-900 text-xs truncate">{member.name}</h4>
                      {getRoleBadge(item.role || 'Developer')}
                    </div>
                    <p className="text-xs text-slate-600 truncate mt-0.5">
                      {item.workTitle}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{item.dueDate || 'Jan 31, 2026'}</span>
                  </div>
                  <div>{getStatusBadge(item.status)}</div>

                  {/* Admin Quick Review Actions */}
                  {item.status !== 'Completed' && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleApproveWork(item.id, 'Approved by Admin')}
                        title="Approve as Completed"
                        className="p-1 rounded-md text-emerald-600 hover:bg-emerald-50 transition"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          const fb = prompt('Enter rework feedback for team member:');
                          if (fb) handleRequestRework(item.id, fb);
                        }}
                        title="Request Rework"
                        className="p-1 rounded-md text-amber-600 hover:bg-amber-50 transition"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  <button
                    onClick={() => handleDeleteAssignment(item.id)}
                    title="Delete assignment"
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-all cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
