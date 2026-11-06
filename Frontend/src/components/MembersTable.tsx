import React from 'react';
import {
  Users,
  Edit3,
  Trash2,
  Plus,
  Phone,
  Mail,
  Send,
  CheckSquare,
  CheckCircle2,
  Check
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Member } from '../types';
import { AssignWorkForm } from './AssignWorkForm';
import { AssignedWorkSummary } from './AssignedWorkSummary';

export const MembersTable: React.FC = () => {
  const {
    selectedTeam,
    members,
    tasks,
    workDone,
    teamSubTab,
    setTeamSubTab,
    setIsAddMemberOpen,
    openEditTeam,
    openEditMember,
    handleDeleteMember,
    handleDeleteTeam,
    handleDeleteTask,
    handleDeleteWorkDone
  } = useApp();

  if (!selectedTeam) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/60 p-8 text-center text-slate-500 shadow-sm flex-1">
        Please select a team to view details and members.
      </div>
    );
  }

  const getRoleBadge = (role: string) => {
    const r = (role || 'Developer').toLowerCase();
    if (r.includes('lead') || r.includes('manager')) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700">
          {role}
        </span>
      );
    }
    if (r.includes('dev') || r.includes('engineer')) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
          {role}
        </span>
      );
    }
    if (r.includes('test') || r.includes('qa')) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
          {role}
        </span>
      );
    }
    if (r.includes('design') || r.includes('ui') || r.includes('ux')) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-700">
          {role}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
        {role}
      </span>
    );
  };

  const getAvatarColor = (name: string) => {
    const char = (name || 'A').charAt(0).toUpperCase();
    if (['R', 'V', 'H'].includes(char)) return 'bg-purple-100 text-purple-700 ring-purple-200';
    if (['P', 'K', 'G'].includes(char)) return 'bg-blue-100 text-blue-700 ring-blue-200';
    if (['A', 'T'].includes(char)) return 'bg-emerald-100 text-emerald-700 ring-emerald-200';
    return 'bg-pink-100 text-pink-700 ring-pink-200';
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'High':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-700">High</span>;
      case 'Medium':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">Medium</span>;
      case 'Low':
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">Low</span>;
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-xs flex-1 flex flex-col min-w-0">
      {/* Team Info Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-lg leading-tight">
              {selectedTeam.name}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {selectedTeam.description || 'Develops and maintains services.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => openEditTeam(selectedTeam)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5 text-slate-500" />
            <span>Edit Team</span>
          </button>
          <button
            onClick={() => handleDeleteTeam(selectedTeam.id)}
            title="Delete Team"
            className="p-2 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 transition-colors shadow-2xs cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Sub-tabs with active indicators */}
      <div className="flex items-center gap-6 mt-4 border-b border-slate-100 text-xs font-bold text-slate-500 overflow-x-auto">
        <button
          onClick={() => setTeamSubTab('Members')}
          className={`pb-2.5 flex items-center gap-1.5 transition-colors relative cursor-pointer whitespace-nowrap ${teamSubTab === 'Members' ? 'text-indigo-600' : 'hover:text-slate-800'
            }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Members ({members.length})</span>
          {teamSubTab === 'Members' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-full" />
          )}
        </button>

        <button
          onClick={() => setTeamSubTab('Roles')}
          className={`pb-2.5 flex items-center gap-1.5 transition-colors relative cursor-pointer whitespace-nowrap ${teamSubTab === 'Roles' ? 'text-indigo-600' : 'hover:text-slate-800'
            }`}
        >
          <Send className="w-3.5 h-3.5" />
          <span>+ Roles & Work</span>
          {teamSubTab === 'Roles' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-full" />
          )}
        </button>

        <button
          onClick={() => setTeamSubTab('Tasks')}
          className={`pb-2.5 flex items-center gap-1.5 transition-colors relative cursor-pointer whitespace-nowrap ${teamSubTab === 'Tasks' ? 'text-indigo-600' : 'hover:text-slate-800'
            }`}
        >
          <CheckSquare className="w-3.5 h-3.5" />
          <span>Today's Tasks ({tasks.length})</span>
          {teamSubTab === 'Tasks' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-full" />
          )}
        </button>

        <button
          onClick={() => setTeamSubTab('WorkDone')}
          className={`pb-2.5 flex items-center gap-1.5 transition-colors relative cursor-pointer whitespace-nowrap ${teamSubTab === 'WorkDone' ? 'text-indigo-600' : 'hover:text-slate-800'
            }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Today's Work Done ({workDone.length})</span>
          {teamSubTab === 'WorkDone' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-full" />
          )}
        </button>
      </div>

      {/* --- CONTENT BASED ON ACTIVE SUB-TAB --- */}

      {/* 1. Members Sub-Tab */}
      {teamSubTab === 'Members' && (
        <div className="flex-1 flex flex-col mt-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-bold text-slate-800 text-sm">
              Team Members ({members.length})
            </h4>
            <button
              onClick={() => setIsAddMemberOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Member</span>
            </button>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="py-2.5 px-3 w-8">#</th>
                  <th className="py-2.5 px-3">Member Name</th>
                  <th className="py-2.5 px-3">Email ID</th>
                  <th className="py-2.5 px-3">Number</th>
                  <th className="py-2.5 px-3">Role</th>
                  <th className="py-2.5 px-3">Assigned Work</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/80 text-slate-700 font-medium">
                {members.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-6 text-center text-slate-400">
                      No members added to this team yet. Click "+ Add Member" to add one!
                    </td>
                  </tr>
                ) : (
                  members.map((member: Member, idx: number) => (
                    <tr key={member.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-3 text-slate-400 font-semibold">{idx + 1}</td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ring-1 ${getAvatarColor(member.name)}`}>
                            {member.avatar || member.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-semibold text-slate-900">{member.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <Mail className="w-3 h-3 text-slate-400" />
                          <span>{member.email}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{member.phone || '+91 98765 43210'}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        {getRoleBadge(member.role)}
                      </td>
                      <td className="py-3 px-3 text-slate-600 max-w-xs truncate">
                        {member.assignedWork || 'General team responsibilities'}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEditMember(member)}
                            title="Edit member"
                            className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteMember(member.id)}
                            title="Delete member"
                            className="p-1 rounded text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. Roles & Work Sub-Tab */}
      {teamSubTab === 'Roles' && (
        <div className="mt-4 flex flex-col xl:flex-row gap-5 items-stretch flex-1">
          <AssignWorkForm />
          <AssignedWorkSummary />
        </div>
      )}

      {/* 3. Today's Tasks Sub-Tab */}
      {teamSubTab === 'Tasks' && (
        <div className="mt-4 flex-1 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h4 className="font-bold text-slate-800 text-sm">
                Today's Tasks ({tasks.length})
              </h4>
              <p className="text-[11px] text-slate-400">
                Daily deliverables and priorities for {selectedTeam.name}. (Auto-updated from Assigned Work)
              </p>
            </div>
          </div>

          <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[360px] pr-1">
            {tasks.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                No tasks assigned for today yet. Use the "Roles & Work" tab to assign work!
              </div>
            ) : (
              tasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50/70 transition-all group"
                >
                  <div
                    className="flex items-center gap-3 flex-1 min-w-0 select-none cursor-default"
                    title={task.completed ? "Status: Completed by Team Member" : "Status: In Progress (Awaiting user update/completion)"}
                  >
                    <div
                      className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all shrink-0 ${task.completed
                        ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                        : 'border-slate-300 bg-slate-50 text-slate-400'
                        }`}
                      title={task.completed ? "Completed by Team Member" : "Read-only: Auto-checks when member updates work"}
                    >
                      {task.completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span
                        className={`text-xs font-semibold truncate ${task.completed ? 'line-through text-slate-400' : 'text-slate-800'
                          }`}
                      >
                        {task.title}
                      </span>
                      {task.completed ? (
                        <span className="text-[10px] text-emerald-600 font-bold">
                          ✓ Done (Completed by Member)
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-medium">
                          In Progress · Auto-checks when member updates work
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    {getPriorityBadge(task.priority)}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteTask(task.id);
                      }}
                      title="Delete task"
                      className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-all cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 4. Today's Work Done Sub-Tab */}
      {teamSubTab === 'WorkDone' && (
        <div className="mt-4 flex-1 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h4 className="font-bold text-slate-800 text-sm">
                Today's Work Done ({workDone.length})
              </h4>
              <p className="text-[11px] text-slate-400">
                Completed accomplishments and shipped items for {selectedTeam.name}. (Auto-populated from User submissions)
              </p>
            </div>
          </div>

          <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[360px] pr-1">
            {workDone.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                No work logs completed today yet. Automatically populated when team members finish and submit work.
              </div>
            ) : (
              workDone.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3.5 rounded-xl border border-emerald-50 bg-emerald-50/20 hover:bg-emerald-50/40 transition-all group"
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
      )}
    </div>
  );
};
