import React, { useState } from 'react';
import {
  Users,
  Clock,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Send,
  Search,
  Briefcase,
  ShieldCheck,
  ChevronRight,
  ClipboardCheck,
  Check,
  X
} from 'lucide-react';
import { useApp, formatTaskDueDate } from '../../context/AppContext';
import { AttendanceWidget } from '../user/AttendanceWidget';
import { ActiveBreakBanner } from '../break/ActiveBreakBanner';
import { DashboardPunchLockGate } from '../user/DashboardPunchLockGate';

export const ManagerDashboard: React.FC = () => {
  const {
    currentUser,
    userWorkspace,
    members,
    setManagerNav,
    setSelectedUserTask,
    appointments,
    todayAttendance,
    isAttendanceLoading,
    workRequests,
    handleApproveWorkRequest,
    handleRejectWorkRequest
  } = useApp();

  const isPunchedIn = todayAttendance?.status === 'punched_in';

  const [taskFilter, setTaskFilter] = useState<'All' | 'In Progress' | 'Under Review' | 'Completed' | 'Not Started'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);

  // Identify manager's team and member context
  const myEmail = (currentUser?.email || '').trim().toLowerCase();
  const myMember = (members || []).find(m =>
    (currentUser?.id && (m.id === currentUser.id || (m as any).userId === currentUser.id)) ||
    (myEmail && m.email && m.email.toLowerCase() === myEmail)
  );

  const managerTeamId = myMember?.teamId || (currentUser as any)?.teamId;
  const managerTeamName = currentUser?.team || myMember?.role || 'Assigned Team';
  const managerDeptName = currentUser?.department || 'Operations';

  // Team members belonging to this Manager's team, or all workspace members if manager oversees workspace
  const myTeamMembers = (members || []).filter(m => {
    if (managerTeamId && m.teamId && m.teamId === managerTeamId) return true;
    if (currentUser?.team && (m as any).team && (m as any).team.toLowerCase() === currentUser.team.toLowerCase()) return true;
    if (currentUser?.department && (m.departmentId === currentUser.department || (m as any).department === currentUser.department)) return true;
    return false;
  });
  const displayTeamMembers = myTeamMembers.length > 0
    ? myTeamMembers
    : (members || []).filter(m => m.email?.toLowerCase() !== myEmail && m.role !== 'Administrator');

  const memberEmails = new Set(
    (displayTeamMembers.length > 0 ? displayTeamMembers : members).map(m => m.email.toLowerCase())
  );

  // Team tasks: tasks belonging to members of this team or assigned within this team
  const allAssigned = userWorkspace?.assignedWork || [];
  const teamTasks = allAssigned.filter(t => {
    if (managerTeamId && (t.teamId === managerTeamId || (t as any).team === managerTeamName)) return true;
    if (t.assigneeEmail && memberEmails.has(t.assigneeEmail.toLowerCase())) return true;
    if (t.department && currentUser?.department && t.department.toLowerCase() === currentUser.department.toLowerCase()) return true;
    return true; // Fallback to all tasks if single-team org
  });

  // KPI Calculations
  const inProgressTasks = teamTasks.filter(t => t.status === 'In Progress').length;
  const underReviewTasks = teamTasks.filter(t => t.status === 'Under Review' || (t.status as any) === 'In Review').length;
  const completedTasks = teamTasks.filter(t => t.status === 'Completed').length;
  const todoTasks = teamTasks.filter(t => t.status === 'Not Started' || (t.status as any) === 'To Do').length;

  // Upcoming meetings (next 7 days)
  const upcomingMeetings = (appointments || []).filter(a => a.status === 'Scheduled' || a.status === 'Upcoming').slice(0, 3);

  // Pending External Work Requests awaiting Manager Approval
  const pendingWorkRequests = (workRequests || []).filter(w => {
    if (w.status !== 'Pending Manager Approval') return false;
    if (memberEmails.size > 0 && w.receiverEmail && memberEmails.has(w.receiverEmail.toLowerCase())) return true;
    if (managerTeamId && w.teamId && w.teamId === managerTeamId) return true;
    if (w.managerId && currentUser?.id && w.managerId === currentUser.id) return true;
    if (w.managerEmail && currentUser?.email && w.managerEmail.toLowerCase() === currentUser.email.toLowerCase()) return true;
    return true; // Workspace supervisor fallback
  });

  // Filtered task list
  const filteredTasks = teamTasks.filter(t => {
    if (taskFilter !== 'All') {
      if (taskFilter === 'Under Review' && t.status !== 'Under Review' && (t.status as any) !== 'In Review') return false;
      if (taskFilter !== 'Under Review' && t.status !== taskFilter) return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = (t.title || '').toLowerCase().includes(q);
      const matchAssignee = ((t as any).assigneeName || t.assignedTo || '').toLowerCase().includes(q);
      return matchTitle || matchAssignee;
    }
    return true;
  });

  const getPriorityBadge = (priority: string) => {
    if (priority === 'High') {
      return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-50 text-red-600 border border-red-200">High</span>;
    }
    if (priority === 'Medium') {
      return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-600 border border-amber-200">Medium</span>;
    }
    return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-600 border border-emerald-200">Low</span>;
  };

  const getStatusBadge = (status: string) => {
    if (status === 'Completed') {
      return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">Completed</span>;
    }
    if (status === 'Under Review' || (status as any) === 'In Review') {
      return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-300 animate-pulse">Needs Review</span>;
    }
    if (status === 'In Progress') {
      return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">In Progress</span>;
    }
    return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">Not Started</span>;
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Workspace Attendance Widget (Punch In / Punch Out & Today's Time Present) */}
      <AttendanceWidget />

      {/* Mandatory Punch In Gate when Punched Out */}
      <DashboardPunchLockGate />

      {/* Active Team Break Banner (Notified to team & manager until break ends) */}
      {isPunchedIn && <ActiveBreakBanner />}

      {/* Manager Dashboard Workspace Content (Disabled & Locked until Punched In) */}
      <div className={`space-y-6 transition-all duration-300 ${(!isPunchedIn && !isAttendanceLoading) ? 'pointer-events-none select-none opacity-30 filter blur-[1.5px]' : ''}`}>
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-[#14122d] via-[#1f1b45] to-[#2d225a] rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold text-indigo-200 mb-3 border border-white/10">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Manager Supervision Hub</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Welcome back, {currentUser?.name || 'Manager'}
            </h1>
            <p className="text-sm text-indigo-200/90 mt-1 max-w-xl">
              Coordinating <strong>{managerTeamName}</strong> • {managerDeptName}. Monitor team progress, allocate tasks, and approve completed work.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <button
              type="button"
              onClick={() => setManagerNav('assign-work')}
              className="px-4 py-2.5 rounded-xl bg-[#5a36e6] hover:bg-[#4c2bd0] text-white font-bold text-xs shadow-lg shadow-indigo-950/40 transition flex items-center gap-2 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>Assign Work</span>
            </button>
            <button
              type="button"
              onClick={() => setManagerNav('review-work')}
              className="px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/20 text-white font-bold text-xs border border-white/20 transition flex items-center gap-2 cursor-pointer"
            >
              <ClipboardCheck className="w-4 h-4 text-amber-300" />
              <span>Review Submissions {underReviewTasks > 0 ? `(${underReviewTasks})` : ''}</span>
            </button>
          </div>
        </div>

        {/* Decorative background glow */}
        <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-[#704fe6]/20 blur-3xl pointer-events-none" />
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Team Members */}
        <div
          onClick={() => setManagerNav('team')}
          className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs flex items-center gap-4 hover:shadow-md transition cursor-pointer select-none"
        >
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-[#5a36e6] flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Team Members</p>
            <h3 className="text-2xl font-black text-slate-900 mt-0.5 font-number">{(displayTeamMembers.length > 0 ? displayTeamMembers.length : members.length) || 1}</h3>
          </div>
        </div>

        {/* Ongoing Tasks */}
        <div
          onClick={() => setTaskFilter('In Progress')}
          className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs flex items-center gap-4 hover:shadow-md transition cursor-pointer select-none"
        >
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">In Progress</p>
            <h3 className="text-2xl font-black text-slate-900 mt-0.5 font-number">{inProgressTasks}</h3>
          </div>
        </div>

        {/* Under Review */}
        <div
          onClick={() => setManagerNav('review-work')}
          className="bg-white rounded-2xl p-5 border border-amber-100 shadow-xs flex items-center gap-4 hover:shadow-md transition cursor-pointer select-none"
        >
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <ClipboardCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider">Needs Review</p>
            <h3 className="text-2xl font-black text-amber-900 mt-0.5 font-number">{underReviewTasks}</h3>
          </div>
        </div>

        {/* Pending To Do */}
        <div
          onClick={() => setTaskFilter('Not Started')}
          className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs flex items-center gap-4 hover:shadow-md transition cursor-pointer select-none"
        >
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Not Started</p>
            <h3 className="text-2xl font-black text-slate-900 mt-0.5 font-number">{todoTasks}</h3>
          </div>
        </div>

        {/* Completed */}
        <div
          onClick={() => setTaskFilter('Completed')}
          className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs flex items-center gap-4 hover:shadow-md transition cursor-pointer select-none"
        >
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Completed</p>
            <h3 className="text-2xl font-black text-slate-900 mt-0.5 font-number">{completedTasks}</h3>
          </div>
        </div>
      </div>

      {/* External Work Requests Awaiting Approval Section */}
      {pendingWorkRequests.length > 0 && (
        <div className="bg-gradient-to-r from-amber-500/10 via-indigo-500/5 to-purple-500/10 border-2 border-amber-300/80 rounded-3xl p-6 shadow-md space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-amber-200/60">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-sm">
                <AlertCircle className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-black text-slate-900 tracking-tight">
                    External Work Requests Awaiting Approval
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-500 text-white shadow-xs">
                    {pendingWorkRequests.length} Pending
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-0.5">
                  Outside clients or requesters have submitted work for your team members. Approve to automatically assign to their workspace.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingWorkRequests.map(req => (
              <div
                key={req.id}
                className="bg-white rounded-2xl p-5 border border-amber-200 shadow-xs flex flex-col justify-between hover:shadow-md transition space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-200 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-amber-700" />
                      Pending Approval
                    </span>
                    <span className="text-[11px] font-mono font-bold text-slate-400">
                      {req.referenceId}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-black text-slate-900 leading-snug">
                      {req.title}
                    </h3>
                    <p className="text-xs text-slate-600 mt-1 line-clamp-3 leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      {req.description || 'No additional instructions provided.'}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                    <div className="p-2 rounded-xl bg-indigo-50/50 border border-indigo-100/60">
                      <p className="text-[10px] uppercase font-bold text-indigo-500 tracking-wider">Outside Requester</p>
                      <p className="font-bold text-slate-800 truncate">{req.senderName}</p>
                      <p className="text-[10px] text-slate-500 truncate">{req.senderEmail}</p>
                    </div>

                    <div className="p-2 rounded-xl bg-emerald-50/50 border border-emerald-100/60">
                      <p className="text-[10px] uppercase font-bold text-emerald-600 tracking-wider">Target Assignee</p>
                      <p className="font-bold text-slate-800 truncate">{req.receiverName}</p>
                      <p className="text-[10px] text-slate-500 truncate">{req.receiverEmail}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500 text-[11px]">Priority:</span>
                      {getPriorityBadge(req.priority)}
                    </div>
                    {req.dueDate && (
                      <div className="flex items-center gap-1 text-[11px] text-slate-500">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>Due: {req.dueDate}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-2 flex items-center gap-2 border-t border-slate-100">
                  <button
                    type="button"
                    disabled={approvingId === req.id || rejectingId === req.id}
                    onClick={async () => {
                      setApprovingId(req.id);
                      try {
                        await handleApproveWorkRequest(req.id);
                      } finally {
                        setApprovingId(null);
                      }
                    }}
                    className="flex-1 py-2 px-3 rounded-xl bg-[#5a36e6] hover:bg-[#4828ce] text-white font-bold text-xs shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Check className="w-4 h-4" />
                    <span>{approvingId === req.id ? 'Approving & Assigning...' : 'Approve & Assign Work'}</span>
                  </button>

                  <button
                    type="button"
                    disabled={approvingId === req.id || rejectingId === req.id}
                    onClick={async () => {
                      const reason = window.prompt('Optional: Enter rejection reason for receiver:') || '';
                      setRejectingId(req.id);
                      try {
                        await handleRejectWorkRequest(req.id, reason);
                      } finally {
                        setRejectingId(null);
                      }
                    }}
                    className="py-2 px-3 rounded-xl bg-white hover:bg-red-50 text-red-600 border border-red-200 font-bold text-xs transition flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    <X className="w-4 h-4" />
                    <span>Reject</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Grid: Active Team Work (Left 8 cols) & Team Meetings / Quick Stats (Right 4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Team Tasks Table */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-100 shadow-xs p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-[#5a36e6]" />
                <span>Team Tasks & Deliverables</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">Real-time status of work assigned to your team members</p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Filter tabs */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
                {(['All', 'In Progress', 'Under Review', 'Completed'] as const).map(tab => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setTaskFilter(tab)}
                    className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${taskFilter === tab ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                      }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search tasks..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5a36e6] w-36 sm:w-44"
                />
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                  <th className="pb-3 pl-2">Task</th>
                  <th className="pb-3">Assignee</th>
                  <th className="pb-3">Priority</th>
                  <th className="pb-3">Due Date</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right pr-2">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 font-medium text-slate-700">
                {filteredTasks.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-10 text-slate-400">
                      No matching tasks found for this team.
                    </td>
                  </tr>
                ) : (
                  filteredTasks.map(task => {
                    const assigneeName = (task as any).assigneeName || task.assignedTo || 'Team Member';
                    const isUnderReview = task.status === 'Under Review' || (task as any).status === 'In Review';

                    return (
                      <tr key={task.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3.5 pl-2">
                          <p className="font-bold text-slate-900 line-clamp-1">{task.title}</p>
                          <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">{task.description || 'No description'}</p>
                        </td>
                        <td className="py-3.5 whitespace-nowrap">
                          <span className="font-semibold text-slate-800">{assigneeName}</span>
                        </td>
                        <td className="py-3.5 whitespace-nowrap">
                          {getPriorityBadge(task.priority)}
                        </td>
                        <td className="py-3.5 whitespace-nowrap text-slate-500 font-mono text-[11px]">
                          {formatTaskDueDate(task.dueDate)}
                        </td>
                        <td className="py-3.5 whitespace-nowrap">
                          {getStatusBadge(task.status)}
                        </td>
                        <td className="py-3.5 text-right pr-2 whitespace-nowrap">
                          {isUnderReview ? (
                            <button
                              type="button"
                              onClick={() => setManagerNav('review-work')}
                              className="px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs transition cursor-pointer shadow-xs"
                            >
                              Review Now
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedUserTask(task);
                                setManagerNav('my-work');
                              }}
                              className="px-2.5 py-1 rounded-lg text-[#5a36e6] hover:bg-indigo-50 font-bold text-xs transition cursor-pointer"
                            >
                              View Details
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Upcoming Meetings & Team Quick Overview */}
        <div className="lg:col-span-4 space-y-6">
          {/* Upcoming Meetings Card */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#5a36e6]" />
                <span>Upcoming Meetings</span>
              </h3>
              <button
                type="button"
                onClick={() => setManagerNav('appointments')}
                className="text-xs font-bold text-[#5a36e6] hover:underline cursor-pointer"
              >
                View Calendar
              </button>
            </div>

            {upcomingMeetings.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">No upcoming meetings scheduled.</p>
            ) : (
              <div className="space-y-3">
                {upcomingMeetings.map(meeting => (
                  <div key={meeting.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-900 line-clamp-1">{meeting.title}</h4>
                      <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">{meeting.time}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 font-medium">Date: {meeting.date}</p>
                    {meeting.joinUrl && (
                      <a
                        href={meeting.joinUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 hover:text-emerald-700 mt-1"
                      >
                        <span>Join Meeting</span>
                        <ChevronRight className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Team Roster Summary */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
                <Users className="w-4 h-4 text-[#5a36e6]" />
                <span>Team Roster</span>
              </h3>
              <button
                type="button"
                onClick={() => setManagerNav('team')}
                className="text-xs font-bold text-[#5a36e6] hover:underline cursor-pointer"
              >
                Manage Team
              </button>
            </div>

            <div className="space-y-2.5">
              {myTeamMembers.length === 0 ? (
                <p className="text-xs text-slate-400 py-3 text-center">No members assigned to this team yet.</p>
              ) : (
                myTeamMembers.slice(0, 4).map(m => (
                  <div key={m.id} className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 transition">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#5a36e6] text-white flex items-center justify-center font-bold text-xs shrink-0">
                        {m.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate">{m.name}</p>
                        <p className="text-[10px] text-slate-400 truncate">{m.role || 'Member'}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                      Active
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
};
