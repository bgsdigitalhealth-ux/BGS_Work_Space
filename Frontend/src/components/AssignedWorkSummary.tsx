import React from 'react';
import { Layers, Calendar, Trash2, CheckCircle2, RotateCcw } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const AssignedWorkSummary: React.FC = () => {
  const {
    selectedTeam,
    assignments,
    members,
    handleDeleteAssignment,
    handleApproveWork,
    handleRequestRework,
    confirmAction,
    notify
  } = useApp();

  const handleReworkClick = async (itemId: string) => {
    const feedback = await confirmAction({
      title: 'Request Task Rework',
      message: 'Please provide clear feedback or instructions for the team member explaining what needs revision:',
      confirmText: 'Submit Feedback',
      variant: 'warning',
      isPrompt: true,
      promptPlaceholder: 'e.g. Please verify responsive styles and test on mobile screen...'
    });
    if (typeof feedback === 'string' && feedback.trim()) {
      await handleRequestRework(itemId, feedback.trim());
      notify('Rework feedback delivered to team member.', 'info', 'Feedback Sent');
    }
  };

  const handleApproveClick = async (itemId: string) => {
    const ok = await confirmAction({
      title: 'Approve Deliverable',
      message: 'Mark this assigned task as fully approved and completed?',
      confirmText: 'Approve Work',
      variant: 'primary'
    });
    if (ok) {
      await handleApproveWork(itemId, 'Approved by Admin');
      notify('Task marked as Completed.', 'success', 'Approved');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'In Progress':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-100 text-blue-700 whitespace-nowrap">
            In Progress
          </span>
        );
      case 'To Do':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-700 whitespace-nowrap">
            To Do
          </span>
        );
      case 'In Review':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-100 text-purple-700 whitespace-nowrap">
            In Review
          </span>
        );
      case 'Completed':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-700 whitespace-nowrap">
            Completed
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 whitespace-nowrap">
            {status}
          </span>
        );
    }
  };

  const getRoleBadge = (role: string) => {
    const rLower = (role || '').toLowerCase();
    if (rLower.includes('lead') || rLower.includes('head')) {
      return (
        <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100 whitespace-nowrap">
          {role}
        </span>
      );
    }
    if (rLower.includes('dev') || rLower.includes('engineer')) {
      return (
        <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-100 whitespace-nowrap">
          {role}
        </span>
      );
    }
    if (rLower.includes('test') || rLower.includes('qa')) {
      return (
        <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100 whitespace-nowrap">
          {role}
        </span>
      );
    }
    if (rLower.includes('design') || rLower.includes('art') || rLower.includes('video')) {
      return (
        <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-pink-50 text-pink-700 border border-pink-100 whitespace-nowrap">
          {role}
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200 whitespace-nowrap">
        {role || 'Member'}
      </span>
    );
  };

  const getAvatarColor = (name: string) => {
    const char = (name || 'A').charAt(0).toUpperCase();
    if (['R', 'V', 'H', 'S'].includes(char)) return 'bg-purple-100 text-purple-700 ring-purple-200';
    if (['P', 'K', 'G', 'M'].includes(char)) return 'bg-blue-100 text-blue-700 ring-blue-200';
    if (['A', 'T', 'D'].includes(char)) return 'bg-emerald-100 text-emerald-700 ring-emerald-200';
    return 'bg-pink-100 text-pink-700 ring-pink-200';
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/70 p-5 sm:p-6 shadow-xs flex-1 flex flex-col h-full min-h-[560px]">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-slate-900 text-base leading-snug">Assigned Work Summary</h3>
            <p className="text-xs text-slate-500 mt-0.5 truncate">
              Recently assigned work for {selectedTeam?.name || 'Selected Team'} ({members.length} members).
            </p>
          </div>
        </div>
        <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-700 shrink-0">
          {assignments.length} Tasks
        </span>
      </div>

      {/* Assignment Cards List */}
      <div className="space-y-3 overflow-y-auto flex-1 pr-1 min-h-0">
        {assignments.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs flex flex-col items-center justify-center flex-1">
            <Layers className="w-8 h-8 text-slate-300 mb-2" />
            <span>No work items assigned yet. Fill out the form to assign work!</span>
          </div>
        ) : (
          assignments.map((item) => {
            const member = members.find((m) => m.id === item.memberId) || {
              name: 'Team Member',
              avatar: 'M',
            };
            const assigneeName = item.assigneeName || member.name || 'Team Member';
            const displayRole = item.assigneeRole || item.role || (member as any)?.role || 'Developer';

            return (
              <div
                key={item.id}
                className="p-4 rounded-xl border border-slate-200/80 bg-white hover:border-indigo-200 hover:shadow-xs transition-all space-y-2.5 group"
              >
                {/* Row 1: Assignee info on left, Action buttons on right */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ring-1 ${getAvatarColor(
                        assigneeName
                      )}`}
                    >
                      {assigneeName.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-slate-900 text-xs truncate max-w-[130px] sm:max-w-[180px]">
                        {assigneeName}
                      </span>
                      <span className="shrink-0">{getRoleBadge(displayRole)}</span>
                    </div>
                  </div>

                  {/* Quick Review Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    {item.status !== 'Completed' && (
                      <>
                        <button
                          onClick={() => handleApproveClick(item.id)}
                          title="Approve as Completed"
                          className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition cursor-pointer"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleReworkClick(item.id)}
                          title="Request Rework"
                          className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-50 transition cursor-pointer"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                      </>
                    )}

                    <button
                      onClick={() => handleDeleteAssignment(item.id)}
                      title="Delete assignment"
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Row 2: Work Title & optional Description */}
                <div>
                  <h5 className="font-semibold text-slate-800 text-xs sm:text-sm line-clamp-2 leading-snug">
                    {item.workTitle}
                  </h5>
                  {item.workDescription && (
                    <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                      {item.workDescription}
                    </p>
                  )}
                </div>

                {/* Row 3: Due Date on left, Status Badge on right */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-500 font-medium">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{item.dueDate || 'No due date'}</span>
                  </div>
                  <div className="shrink-0">{getStatusBadge(item.status)}</div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
