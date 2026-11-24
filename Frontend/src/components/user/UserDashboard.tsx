import React, { useState } from 'react';
import { 
  ClipboardList, 
  Clock, 
  Calendar, 
  CheckCircle2, 
  Search, 
  Upload, 
  Play, 
  FileText, 
  Image as ImageIcon, 
  Share2, 
  BarChart3, 
  Send,
  ChevronDown
} from 'lucide-react';
import { useApp, isUserManager, isTaskAssignedToUser, formatTaskDueDate } from '../../context/AppContext';
import { UserAssignedWork } from '../../types';

export const UserDashboard: React.FC = () => {
  const { 
    currentUser,
    userWorkspace, 
    members,
    setUserNav, 
    setSelectedUserTask,
    openSubmitWorkDrawer,
    userFilterTab,
    setUserFilterTab,
    userSearchQuery,
    setUserSearchQuery,
    handleStartUserWork
  } = useApp();

  const [departmentFilter, setDepartmentFilter] = useState('All Work');
  const [teamFilter, setTeamFilter] = useState('All Teams');
  const [managerScope, setManagerScope] = useState<'my' | 'team'>('my');

  const rawAssigned = userWorkspace?.assignedWork || [];
  const myEmail = (currentUser?.email || '').trim().toLowerCase();
  const myMember = (members || []).find(m => (m.email && m.email.toLowerCase() === myEmail) || (currentUser?.id && m.id === currentUser.id));
  const isManager = isUserManager(currentUser, myMember);

  // Strict User Isolation:
  // - A user's personal dashboard ONLY displays their own assigned work.
  // - Managers can toggle between "My Work" and "Team Work" (defaults to "My Work").
  const myAssignedList = rawAssigned.filter(t => isTaskAssignedToUser(t, currentUser, myMember));
  const isViewingTeam = isManager && managerScope === 'team';
  const assignedList = isViewingTeam ? rawAssigned : myAssignedList;
  const availableTeams = Array.from(new Set(assignedList.map(t => t.team).filter(Boolean)));

  const historyList = userWorkspace?.history || [];

  const stats = {
    totalAssigned: assignedList.length,
    inProgress: assignedList.filter(t => t.status === 'In Progress').length,
    upcomingWork: assignedList.filter(t => t.status === 'Not Started' || (t.status as any) === 'To Do').length,
    completedWork: assignedList.filter(t => t.status === 'Completed').length,
    completionPercentage: assignedList.length > 0 
      ? Math.round((assignedList.filter(t => t.status === 'Completed').length / assignedList.length) * 100)
      : 0,
    completedFractionText: `${assignedList.filter(t => t.status === 'Completed').length} of ${assignedList.length} Tasks`
  };
  const totalTasks = stats.totalAssigned + historyList.length;
  const inProgressPct = totalTasks > 0 ? Math.round((stats.inProgress / totalTasks) * 100) : 0;
  const upcomingPct = totalTasks > 0 ? Math.round((stats.upcomingWork / totalTasks) * 100) : 0;
  const completedPct = totalTasks > 0 ? Math.round((stats.completedWork / totalTasks) * 100) : 0;

  // Filter tasks based on filter tab, search query, and dropdown
  const filteredTasks = assignedList.filter(task => {
    // Tab filter
    if ((userFilterTab === 'In Progress' || userFilterTab === 'Recent Work') && task.status !== 'In Progress') return false;
    if (userFilterTab === 'Upcoming Work' && task.status !== 'Not Started') return false;
    if (userFilterTab === 'Completed Work' && task.status !== 'Completed') return false;

    // Dropdown filter
    if (departmentFilter !== 'All Work') {
      if (departmentFilter === 'High' && task.priority !== 'High') return false;
      if (departmentFilter === 'Medium' && task.priority !== 'Medium') return false;
      if (departmentFilter === 'Low' && task.priority !== 'Low') return false;
    }

    // Team filter for Managers
    if (isManager && teamFilter !== 'All Teams' && task.team.toLowerCase() !== teamFilter.toLowerCase()) {
      return false;
    }

    // Search query
    if (userSearchQuery.trim()) {
      const q = userSearchQuery.toLowerCase();
      const matchTitle = task.title.toLowerCase().includes(q);
      const matchDept = task.department.toLowerCase().includes(q);
      const matchTeam = task.team.toLowerCase().includes(q);
      if (!matchTitle && !matchDept && !matchTeam) return false;
    }

    return true;
  });

  const getTaskIcon = (title: string) => {
    const t = title.toLowerCase();
    if (t.includes('poster') || t.includes('photo') || t.includes('image')) return ImageIcon;
    if (t.includes('social') || t.includes('post') || t.includes('wishes')) return Share2;
    if (t.includes('report') || t.includes('progress') || t.includes('velocity')) return BarChart3;
    return FileText;
  };

  const getPriorityBadge = (priority: string) => {
    if (priority === 'High') {
      return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-600 border border-red-200">High</span>;
    }
    if (priority === 'Medium') {
      return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-600 border border-amber-200">Medium</span>;
    }
    return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-600 border border-emerald-200">Low</span>;
  };

  const handleRowClick = (task: UserAssignedWork) => {
    setSelectedUserTask(task);
    setUserNav('details');
  };

  return (
    <div className="space-y-6 relative pb-10">
      {/* Top 5 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Assigned */}
        <div 
          onClick={() => setUserFilterTab('All')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setUserFilterTab('All'); } }}
          title="Click to view all assigned tasks"
          className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center gap-4 hover:shadow-md transition cursor-pointer select-none"
        >
          <div className="w-12 h-12 rounded-xl bg-[#f5f3ff] text-[#7c3aed] flex items-center justify-center shrink-0">
            <ClipboardList className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Assigned</p>
            <h3 className="text-2xl font-black text-gray-900 mt-0.5">{stats.totalAssigned}</h3>
          </div>
        </div>

        {/* Recent Work */}
        <div 
          onClick={() => setUserFilterTab('In Progress')}
          className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center gap-4 hover:shadow-md transition cursor-pointer"
        >
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Recent Work</p>
            <h3 className="text-2xl font-black text-gray-900 mt-0.5">{stats.inProgress}</h3>
          </div>
        </div>

        {/* Upcoming Work */}
        <div 
          onClick={() => setUserFilterTab('Upcoming Work')}
          className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center gap-4 hover:shadow-md transition cursor-pointer"
        >
          <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Upcoming Work</p>
            <h3 className="text-2xl font-black text-gray-900 mt-0.5">{stats.upcomingWork}</h3>
          </div>
        </div>

        {/* Completed Work */}
        <div 
          onClick={() => setUserFilterTab('Completed Work')}
          className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center gap-4 hover:shadow-md transition cursor-pointer"
        >
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Completed Work</p>
            <h3 className="text-2xl font-black text-gray-900 mt-0.5">{stats.completedWork}</h3>
          </div>
        </div>

        {/* My Work Completion (Donut) */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex items-center gap-3.5 hover:shadow-md transition">
          {/* Radial Donut SVG */}
          <div className="relative w-14 h-14 shrink-0 flex items-center justify-center">
            <svg className="w-14 h-14 -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-gray-100"
                strokeWidth="4"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="text-emerald-500"
                strokeDasharray={`${stats.completionPercentage}, 100`}
                strokeWidth="4"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <span className="absolute text-xs font-bold text-gray-900">{stats.completionPercentage}%</span>
          </div>
          <div>
            <p className="text-xs font-bold text-gray-900">My Work Completion</p>
            <p className="text-[11px] text-gray-500 font-medium mt-0.5">{stats.completedFractionText}</p>
          </div>
        </div>
      </div>

      {/* Main Grid: My Assigned Work Table */}
      <div className="w-full">
        {/* Table Area (spans full width) */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 transition-all duration-300">
          {/* Table Header Controls */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-lg font-bold text-gray-900 tracking-tight flex items-center gap-2">
                {isViewingTeam
                  ? 'All Teams Member Works'
                  : currentUser?.name
                    ? `${currentUser.name}'s Assigned Work`
                    : 'My Assigned Work'}
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-50 text-[#5a36e6] border border-purple-200">
                  {stats.totalAssigned} {stats.totalAssigned === 1 ? 'Task' : 'Tasks'}
                </span>
                {isViewingTeam && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700">
                    Team View
                  </span>
                )}
              </h2>

              {/* Manager Scope Toggle: My Work vs Team Work */}
              {isManager && (
                <div className="flex items-center bg-gray-100 p-1 rounded-xl border border-gray-200/70">
                  <button
                    type="button"
                    onClick={() => setManagerScope('my')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      managerScope === 'my'
                        ? 'bg-white text-[#5a36e6] shadow-xs'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    My Work ({myAssignedList.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setManagerScope('team')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      managerScope === 'team'
                        ? 'bg-white text-[#5a36e6] shadow-xs'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Team Work ({rawAssigned.length})
                  </button>
                </div>
              )}

              <button
                onClick={() => setUserNav('assign-work')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#5a36e6] hover:bg-[#4828c4] text-white font-bold text-xs transition shadow-sm cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>+ Assign Work</span>
              </button>
            </div>

            <div className="flex items-center gap-3">
              {/* Dynamic Team Selector for Manager */}
              {isManager && availableTeams.length > 0 && (
                <div className="relative">
                  <select
                    value={teamFilter}
                    onChange={(e) => setTeamFilter(e.target.value)}
                    className="appearance-none bg-indigo-50 border border-indigo-200 text-xs font-bold text-indigo-700 py-2 pl-3 pr-8 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5a36e6]"
                  >
                    <option value="All Teams">All Teams ({assignedList.length})</option>
                    {availableTeams.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-indigo-500 absolute right-2.5 top-3 pointer-events-none" />
                </div>
              )}

              {/* Priority Filter */}
              <div className="relative">
                <select
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                  className="appearance-none bg-gray-50 border border-gray-200 text-xs font-semibold text-gray-700 py-2 pl-3 pr-8 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5a36e6]"
                >
                  <option value="All Work">All Priorities</option>
                  <option value="High">High Priority</option>
                  <option value="Medium">Medium Priority</option>
                  <option value="Low">Low Priority</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-3 pointer-events-none" />
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search work..."
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  className="pl-9 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5a36e6] w-40 md:w-52"
                />
              </div>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-2 mb-5 border-b border-gray-100 pb-4 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setUserFilterTab('In Progress')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm cursor-pointer ${
                userFilterTab === 'In Progress' || (userFilterTab as any) === 'Recent Work'
                  ? 'bg-[#5a36e6] text-white shadow-indigo-600/20'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              Recent Work ({stats.inProgress})
            </button>

            <button
              onClick={() => setUserFilterTab('Upcoming Work')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm ${
                userFilterTab === 'Upcoming Work'
                  ? 'bg-[#5a36e6] text-white shadow-indigo-600/20'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              Upcoming Work ({stats.upcomingWork})
            </button>

            <button
              onClick={() => setUserFilterTab('Completed Work')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm ${
                userFilterTab === 'Completed Work'
                  ? 'bg-[#5a36e6] text-white shadow-indigo-600/20'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Completed Work ({stats.completedWork})
            </button>
          </div>

          {/* Assigned Work Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-100 text-gray-400 font-bold uppercase tracking-wider text-[11px]">
                  <th className="pb-3 pl-2">#</th>
                  <th className="pb-3">Assigned Work</th>
                  <th className="pb-3">Department / Team</th>
                  <th className="pb-3">Priority</th>
                  <th className="pb-3">Due Date</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right pr-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 font-medium text-gray-700">
                {filteredTasks.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-10 text-gray-400 text-xs">
                      No assigned work found in this view.
                    </td>
                  </tr>
                ) : (
                  filteredTasks.map((task, index) => {
                    const IconComponent = getTaskIcon(task.title);

                    return (
                      <tr 
                        key={task.id}
                        className="hover:bg-purple-50/40 transition group cursor-pointer"
                        onClick={() => handleRowClick(task)}
                      >
                        <td className="py-4 pl-2 font-bold text-gray-400">{index + 1}</td>
                        <td className="py-4 pr-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-[#5a36e6] flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition">
                              <IconComponent className="w-4 h-4" />
                            </div>
                            <div className="flex flex-col min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-gray-900 group-hover:text-[#5a36e6] transition line-clamp-1">
                                  {task.title}
                                </span>
                                {task.assignmentType && (
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                                    task.assignmentType === 'admin_to_user' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' :
                                    task.assignmentType === 'user_to_user' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                                    task.assignmentType === 'user_to_admin' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                                    task.assignmentType === 'user_to_self' ? 'bg-purple-50 text-purple-700 border border-purple-200' :
                                    'bg-gray-50 text-gray-700 border border-gray-200'
                                  }`}>
                                    {task.assignmentType === 'admin_to_user' ? 'Admin → User' :
                                     task.assignmentType === 'user_to_user' ? 'User → User' :
                                     task.assignmentType === 'user_to_admin' ? 'User → Admin' :
                                     task.assignmentType === 'user_to_self' ? 'Self Assign' : 'Admin → Admin'}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                {task.assignedBy && (
                                  <span className="text-[10px] text-gray-400 font-medium">
                                    By: {task.assignedBy}
                                  </span>
                                )}
                                {(task.assigneeName || (task as any).assignedTo) && (
                                  <span className="text-[10px] text-indigo-600 font-semibold bg-indigo-50/80 px-1.5 py-0.5 rounded">
                                    Assignee: {task.assigneeName || (task as any).assignedTo}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 text-gray-500 whitespace-nowrap">
                          {task.department} / {task.team}
                        </td>
                        <td className="py-4 whitespace-nowrap">
                          {getPriorityBadge(task.priority)}
                        </td>
                        <td className="py-4 whitespace-nowrap text-gray-600">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-gray-400" />
                            <span>{formatTaskDueDate(task.dueDate)}</span>
                          </div>
                        </td>
                        <td className="py-4 whitespace-nowrap">
                          {task.status === 'In Progress' ? (
                            <span className="flex items-center gap-1.5 text-blue-600 font-semibold">
                              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                              In Progress
                            </span>
                          ) : task.status === 'Completed' ? (
                            <span className="flex items-center gap-1.5 text-emerald-600 font-semibold">
                              <span className="w-2 h-2 rounded-full bg-emerald-500" />
                              Completed
                            </span>
                          ) : (
                            <span className="flex items-center gap-1.5 text-gray-400 font-semibold">
                              <span className="w-2 h-2 rounded-full bg-gray-300" />
                              Not Started
                            </span>
                          )}
                        </td>
                        <td className="py-4 text-right pr-3 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          {task.status === 'In Progress' ? (
                            <button
                              onClick={() => openSubmitWorkDrawer(task)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#5a36e6] hover:bg-[#4828c4] text-white font-semibold text-xs transition shadow-sm shadow-indigo-600/20"
                            >
                              <Upload className="w-3.5 h-3.5" />
                              Submit Work
                            </button>
                          ) : task.status === 'Not Started' ? (
                            <button
                              onClick={() => handleStartUserWork(task.id)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#5a36e6] text-[#5a36e6] hover:bg-indigo-50 font-semibold text-xs transition"
                            >
                              <Play className="w-3.5 h-3.5" />
                              Start Work
                            </button>
                          ) : (
                            <button
                              onClick={() => handleRowClick(task)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 font-semibold text-xs transition"
                            >
                              View
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
      </div>

      {/* Bottom Row: My Work Overview (Donut) + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* My Work Overview (Donut Chart) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-base font-bold text-gray-900 mb-5">My Work Overview</h3>

          <div className="flex flex-col sm:flex-row items-center justify-around gap-6">
            {/* Donut graphic */}
            <div className="relative w-40 h-40 flex items-center justify-center">
              <svg className="w-40 h-40 -rotate-90" viewBox="0 0 100 100">
                {/* Background Ring */}
                <circle cx="50" cy="50" r="38" fill="none" stroke="#f3f4f6" strokeWidth="12" />
                {/* Segment 1: In Progress (purple 23%) */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="none"
                  stroke="#6366f1"
                  strokeWidth="12"
                  strokeDasharray="55 240"
                  strokeDashoffset="0"
                />
                {/* Segment 2: Upcoming (light blue 18%) */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="12"
                  strokeDasharray="43 240"
                  strokeDashoffset="-55"
                />
                {/* Segment 3: Completed (emerald green 82%) */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="12"
                  strokeDasharray="142 240"
                  strokeDashoffset="-98"
                />
              </svg>
              <div className="absolute text-center">
                <span className="text-2xl font-black text-gray-900">{totalTasks}</span>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Total Work</p>
              </div>
            </div>

            {/* Legend list */}
            <div className="space-y-3 text-xs font-semibold text-gray-700">
              <div className="flex items-center gap-2.5">
                <span className="w-3 h-3 rounded-full bg-[#6366f1]" />
                <span className="w-28 text-gray-600">Recent Work</span>
                <span className="font-bold text-gray-900">{stats.inProgress} ({inProgressPct}%)</span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="w-3 h-3 rounded-full bg-[#38bdf8]" />
                <span className="w-28 text-gray-600">Upcoming Work</span>
                <span className="font-bold text-gray-900">{stats.upcomingWork} ({upcomingPct}%)</span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="w-3 h-3 rounded-full bg-[#10b981]" />
                <span className="w-28 text-gray-600">Completed Work</span>
                <span className="font-bold text-gray-900">{stats.completedWork} ({completedPct}%)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-base font-bold text-gray-900">Recent Activity</h3>
            <button 
              onClick={() => setUserNav('work-history')}
              className="text-xs font-bold text-[#5a36e6] hover:underline"
            >
              View All
            </button>
          </div>

          <div className="space-y-4">
            {(!userWorkspace?.recentActivities || userWorkspace.recentActivities.length === 0) ? (
              <div className="py-8 text-center text-gray-400 text-xs font-medium">
                No recent activity yet. When work is assigned or submitted, activities will appear here.
              </div>
            ) : (
              userWorkspace.recentActivities.map((act) => (
                <div key={act.id} className="flex items-start gap-3.5 p-2 rounded-xl hover:bg-gray-50/70 transition">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                    act.type === 'submitted'
                      ? 'bg-emerald-100 text-emerald-600'
                      : act.type === 'started'
                      ? 'bg-blue-100 text-blue-600'
                      : 'bg-purple-100 text-[#5a36e6]'
                  }`}>
                    {act.type === 'submitted' ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : act.type === 'started' ? (
                      <Clock className="w-4 h-4" />
                    ) : (
                      <ImageIcon className="w-4 h-4" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-gray-900 leading-snug line-clamp-1">{act.title}</p>
                    <p className="text-[11px] text-gray-400 font-medium mt-0.5">{(act as any).time || act.date}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
