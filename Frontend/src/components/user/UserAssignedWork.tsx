import React, { useState, useEffect } from 'react';
import {
  ClipboardList,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  ChevronRight,
  ChevronDown,
  Building2,
  Users,
  FileText,
  Image as ImageIcon,
  Tag,
  Share2,
  BarChart3,
  Send,
  MessageSquare,
  Paperclip
} from 'lucide-react';
import { useApp, isUserManager, filterTasksForUser } from '../../context/AppContext';
import { UserAssignedWork as UserAssignedWorkType } from '../../types';
import { UserWorkDetails } from './UserWorkDetails';

interface UserAssignedWorkProps {
  initialView?: 'cards' | 'details';
}

export const UserAssignedWork: React.FC<UserAssignedWorkProps> = ({ initialView }) => {
  const {
    currentUser,
    userWorkspace,
    members,
    selectedUserTask,
    setSelectedUserTask,
    userNav,
    setUserNav,
  } = useApp();

  const rawAssignedList = userWorkspace?.assignedWork || [];
  const myEmail = (currentUser?.email || '').trim().toLowerCase();
  const myMember = (members || []).find(m => (m.email && m.email.toLowerCase() === myEmail) || (currentUser?.id && m.id === currentUser.id));
  const isManager = isUserManager(currentUser, myMember);

  // Dynamic Multi-Team Isolation:
  // - Managers see ALL teams member works.
  // - Regular team members ONLY see works belonging to their SAME team.
  const assignedList = filterTasksForUser(rawAssignedList, currentUser, myMember);

  // View mode: 'cards' or 'details'
  const [viewMode, setViewMode] = useState<'cards' | 'details'>(() => {
    if (initialView) return initialView;
    if (userNav === 'details') return 'details';
    return 'cards';
  });

  // Keep viewMode synchronized with userNav
  useEffect(() => {
    if (userNav === 'details') {
      setViewMode('details');
    } else if (userNav === 'assigned-work' || userNav === 'my-work') {
      setViewMode('cards');
    }
  }, [userNav]);

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'To Do' | 'In Progress' | 'Under Review' | 'Completed'>('All');
  const [priorityFilter, setPriorityFilter] = useState<'All' | 'High' | 'Medium' | 'Low'>('All');
  const [departmentFilter, setDepartmentFilter] = useState<string>('All');
  const [teamFilter, setTeamFilter] = useState<string>('All');

  // Dynamic department & team lists from actual assigned tasks
  const availableDepartments = Array.from(new Set(assignedList.map(t => t.department).filter(Boolean)));
  const availableTeams = Array.from(new Set(assignedList.map(t => t.team).filter(Boolean)));

  // KPI stats
  const totalCount = assignedList.length;
  const inProgressCount = assignedList.filter(t => t.status === 'In Progress').length;
  const todoCount = assignedList.filter(t => t.status === 'Not Started' || (t.status as any) === 'To Do' || !t.status).length;
  const underReviewCount = assignedList.filter(t => t.status === 'Under Review').length;
  const completedCount = assignedList.filter(t => t.status === 'Completed').length;
  const highPriorityCount = assignedList.filter(t => t.priority === 'High').length;

  // Filtered tasks for Card View
  const filteredTasks = assignedList.filter(task => {
    // Status filter
    if (statusFilter !== 'All') {
      if (statusFilter === 'To Do' && task.status !== 'Not Started' && (task.status as any) !== 'To Do') return false;
      if (statusFilter === 'In Progress' && task.status !== 'In Progress') return false;
      if (statusFilter === 'Under Review' && task.status !== 'Under Review') return false;
      if (statusFilter === 'Completed' && task.status !== 'Completed') return false;
    }

    // Priority filter
    if (priorityFilter !== 'All' && task.priority !== priorityFilter) return false;

    // Team filter for Managers
    if (isManager && teamFilter !== 'All' && task.team.toLowerCase() !== teamFilter.toLowerCase()) return false;

    // Department filter
    if (departmentFilter !== 'All' && task.department !== departmentFilter) return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = (task.title || '').toLowerCase().includes(q);
      const matchDesc = (task.description || '').toLowerCase().includes(q);
      const matchDept = (task.department || '').toLowerCase().includes(q);
      const matchTeam = (task.team || '').toLowerCase().includes(q);
      const matchId = (task.taskId || task.id || '').toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchDept && !matchTeam && !matchId) return false;
    }

    return true;
  });

  // Determine current active task for details view
  const activeTask = selectedUserTask || (assignedList.length > 0 ? assignedList[0] : null);

  const handleCardClick = (task: UserAssignedWorkType) => {
    setSelectedUserTask(task);
    setViewMode('details');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToCards = () => {
    setViewMode('cards');
    setUserNav('assigned-work');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getPriorityStyle = (priority: string) => {
    if (priority === 'High') {
      return {
        badge: 'bg-rose-50 text-rose-700 border-rose-200',
        dot: 'bg-rose-500',
        accent: 'from-rose-500 to-amber-500'
      };
    }
    if (priority === 'Medium') {
      return {
        badge: 'bg-amber-50 text-amber-700 border-amber-200',
        dot: 'bg-amber-500',
        accent: 'from-amber-500 to-yellow-400'
      };
    }
    return {
      badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      dot: 'bg-emerald-500',
      accent: 'from-emerald-500 to-teal-400'
    };
  };

  const getStatusBadge = (status: string) => {
    if (status === 'In Progress') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-50 text-[#5a36e6] border border-purple-200">
          <span className="w-1.5 h-1.5 rounded-full bg-[#5a36e6] animate-pulse" />
          In Progress
        </span>
      );
    }
    if (status === 'Completed') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          Completed
        </span>
      );
    }
    if (status === 'Under Review') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
          <Clock className="w-3 h-3 text-amber-600" />
          Under Review
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
        To Do
      </span>
    );
  };

  const getTaskIcon = (title: string = '') => {
    const t = title.toLowerCase();
    if (t.includes('poster') || t.includes('photo') || t.includes('image')) return ImageIcon;
    if (t.includes('social') || t.includes('post') || t.includes('media')) return Share2;
    if (t.includes('report') || t.includes('progress') || t.includes('stats')) return BarChart3;
    return FileText;
  };

  // ----------------------------------------------------
  // RENDER: CARD TYPE VIEW
  // ----------------------------------------------------
  if (viewMode === 'cards') {
    return (
      <div className="space-y-6 pb-12">
        {/* Top Header Card with Quick Stats */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-[#5a36e6] flex items-center justify-center font-bold shadow-sm">
                <ClipboardList className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                    {isManager ? 'All Teams Member Works' : (currentUser?.team ? `${currentUser.team} Work` : 'My Team Work')}
                  </h2>
                  {isManager && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-700">
                      Manager Access
                    </span>
                  )}
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-50 text-[#5a36e6] border border-purple-200">
                    {totalCount} {totalCount === 1 ? 'Task' : 'Tasks'}
                  </span>
                </div>
                <p className="text-xs text-gray-500 font-medium mt-0.5">
                  Click on any card to view complete work details, timeline, comments, and action deliverables.
                </p>
              </div>
            </div>

            {/* Quick Action Button */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setUserNav('assign-work')}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#5a36e6] hover:bg-[#4828c4] text-white font-bold text-xs transition shadow-md shadow-indigo-600/20 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>+ Assign Work</span>
              </button>
            </div>
          </div>

          {/* KPI Summary Chips */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-5">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-indigo-100 text-[#5a36e6] flex items-center justify-center font-bold">
                <ClipboardList className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[11px] font-medium text-slate-500">Total Work</p>
                <p className="text-base font-extrabold text-slate-900">{totalCount}</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-purple-50/50 border border-purple-100 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-purple-100 text-[#5a36e6] flex items-center justify-center font-bold">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[11px] font-medium text-purple-600">In Progress</p>
                <p className="text-base font-extrabold text-purple-900">{inProgressCount}</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-blue-50/50 border border-blue-100 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                <AlertCircle className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[11px] font-medium text-blue-600">To Do / Pending</p>
                <p className="text-base font-extrabold text-blue-900">{todoCount}</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-rose-50/50 border border-rose-100 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center font-bold">
                <Tag className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[11px] font-medium text-rose-600">High Priority</p>
                <p className="text-base font-extrabold text-rose-900">{highPriorityCount}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 no-scrollbar">
            {(['All', 'To Do', 'In Progress', 'Under Review', 'Completed'] as const).map(st => {
              const count = st === 'All' ? totalCount :
                st === 'To Do' ? todoCount :
                  st === 'In Progress' ? inProgressCount :
                    st === 'Under Review' ? underReviewCount : completedCount;

              return (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${statusFilter === st
                    ? 'bg-[#5a36e6] text-white shadow-sm shadow-indigo-600/30'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                >
                  <span>{st}</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${statusFilter === st ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-700'
                    }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search and Secondary Dropdowns */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Priority Filter */}
            <div className="relative">
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value as any)}
                className="appearance-none bg-gray-50 border border-gray-200 text-xs font-semibold text-gray-700 py-2 pl-3 pr-8 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5a36e6] cursor-pointer"
              >
                <option value="All">All Priorities</option>
                <option value="High">High Priority</option>
                <option value="Medium">Medium Priority</option>
                <option value="Low">Low Priority</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-3 pointer-events-none" />
            </div>

            {/* Team Filter for Managers */}
            {isManager && availableTeams.length > 0 && (
              <div className="relative">
                <select
                  value={teamFilter}
                  onChange={(e) => setTeamFilter(e.target.value)}
                  className="appearance-none bg-indigo-50 border border-indigo-200 text-xs font-bold text-indigo-700 py-2 pl-3 pr-8 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5a36e6] cursor-pointer"
                >
                  <option value="All">All Teams ({assignedList.length})</option>
                  {availableTeams.map(tm => (
                    <option key={tm} value={tm}>{tm}</option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-indigo-500 absolute right-2.5 top-3 pointer-events-none" />
              </div>
            )}

            {/* Department Filter (if available) */}
            {availableDepartments.length > 0 && (
              <div className="relative">
                <select
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                  className="appearance-none bg-gray-50 border border-gray-200 text-xs font-semibold text-gray-700 py-2 pl-3 pr-8 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5a36e6] cursor-pointer"
                >
                  <option value="All">All Departments</option>
                  {availableDepartments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-3 pointer-events-none" />
              </div>
            )}

            {/* Search Input */}
            <div className="relative flex-1 sm:flex-initial">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="text"
                placeholder="Search work..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:w-48 pl-9 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5a36e6]"
              />
            </div>
          </div>
        </div>

        {/* Card Grid Area */}
        {filteredTasks.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center max-w-md mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-[#5a36e6] flex items-center justify-center mx-auto mb-4 shadow-sm">
              <ClipboardList className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-gray-900 mb-1">No Assigned Work Found</h3>
            <p className="text-xs text-gray-500 mb-5 leading-relaxed font-medium">
              {searchQuery || statusFilter !== 'All' || priorityFilter !== 'All'
                ? 'No tasks match your current filter settings. Try clearing your filters or search term.'
                : 'No work items are currently assigned to your account. When tasks are assigned by administrators or team leads, they will appear here as interactive cards.'}
            </p>
            {(searchQuery || statusFilter !== 'All' || priorityFilter !== 'All' || departmentFilter !== 'All') && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('All');
                  setPriorityFilter('All');
                  setDepartmentFilter('All');
                }}
                className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold transition cursor-pointer"
              >
                Reset All Filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredTasks.map((task) => {
              const priorityStyle = getPriorityStyle(task.priority);
              const TaskIcon = getTaskIcon(task.title);
              const commentsCount = task.comments?.length || 0;
              const attachmentsCount = task.attachments?.length || 0;
              const isDueToday = task.dueDate?.toLowerCase().includes('today');

              return (
                <div
                  key={task.id}
                  onClick={() => handleCardClick(task)}
                  className="bg-white rounded-2xl border border-gray-200/90 shadow-xs hover:shadow-xl hover:border-[#5a36e6]/60 transition-all duration-300 p-5 sm:p-6 flex flex-col justify-between cursor-pointer group relative overflow-hidden"
                >
                  {/* Top Color Accent Line */}
                  <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${priorityStyle.accent}`} />

                  {/* Card Content Top */}
                  <div className="space-y-4">
                    {/* Header Badges Row */}
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {/* Task ID */}
                        <span className="font-mono text-[11px] font-bold px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-700 border border-slate-200/60">
                          {task.taskId || task.id}
                        </span>

                        {/* Assignment Flow Badge */}
                        {task.assignmentType && (
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
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

                      <div className="flex items-center gap-1.5">
                        {/* Priority Badge */}
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${priorityStyle.badge}`}>
                          {task.priority} Priority
                        </span>

                        {/* Status Badge */}
                        {getStatusBadge(task.status)}
                      </div>
                    </div>

                    {/* Task Title & Icon */}
                    <div className="flex items-start gap-3.5 pt-1">
                      <div className="w-11 h-11 rounded-2xl bg-indigo-50 text-[#5a36e6] flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 group-hover:bg-[#5a36e6] group-hover:text-white transition-all duration-200">
                        <TaskIcon className="w-5 h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-base font-bold text-gray-900 group-hover:text-[#5a36e6] transition-colors line-clamp-2 leading-snug">
                          {task.title}
                        </h3>
                        <p className="text-[11px] text-gray-500 font-medium mt-1">
                          Assigned by: <span className="font-semibold text-gray-700">{task.assignedBy || 'Admin'}</span>
                          {(task.assigneeName || (task as any).assignedTo) && (
                            <span className="text-gray-400 ml-2">• For: <span className="font-semibold text-indigo-700">{task.assigneeName || (task as any).assignedTo}</span></span>
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Department & Team Tags */}
                    <div className="flex items-center gap-2 flex-wrap text-[11px]">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gray-50 border border-gray-200/70 text-gray-600 font-medium">
                        <Building2 className="w-3 h-3 text-[#5a36e6]" />
                        <span className="font-semibold text-gray-800">{task.department || 'General'}</span>
                      </span>
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gray-50 border border-gray-200/70 text-gray-600 font-medium">
                        <Users className="w-3 h-3 text-[#5a36e6]" />
                        <span className="font-semibold text-gray-800">{task.team || 'Team'}</span>
                      </span>
                    </div>

                    {/* Description Snippet */}
                    <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-100">
                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                        {task.description || 'No detailed instructions added for this work assignment.'}
                      </p>
                    </div>

                    {/* Timeline Grid */}
                    <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                      <div className="flex flex-col">
                        <span className="text-gray-400 font-medium">Assigned On</span>
                        <span className="font-semibold text-gray-800">{task.assignedOn || '12 Nov 2026'}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-gray-400 font-medium">Due Date</span>
                        <span className={`font-bold ${isDueToday ? 'text-amber-600' : 'text-gray-800'}`}>
                          {task.dueDate || 'Pending'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card Bottom / Footer Actions */}
                  <div className="pt-4 mt-4 border-t border-gray-100 flex items-center justify-between gap-3">
                    {/* Meta Counters */}
                    <div className="flex items-center gap-3 text-xs text-gray-500 font-medium">
                      <span className="inline-flex items-center gap-1" title={`${commentsCount} comments / updates`}>
                        <MessageSquare className="w-3.5 h-3.5 text-gray-400" />
                        <span>{commentsCount}</span>
                      </span>
                      <span className="inline-flex items-center gap-1" title={`${attachmentsCount} attachments`}>
                        <Paperclip className="w-3.5 h-3.5 text-gray-400" />
                        <span>{attachmentsCount}</span>
                      </span>
                    </div>

                    {/* Open Card CTA */}
                    <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#5a36e6] group-hover:text-[#4323be] transition">
                      <span>View All Information</span>
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // ----------------------------------------------------
  // RENDER: FULL TASK DETAILS VIEW ("all the information") - Image 1
  // ----------------------------------------------------
  return <UserWorkDetails onBack={handleBackToCards} taskOverride={activeTask || undefined} />;
};
