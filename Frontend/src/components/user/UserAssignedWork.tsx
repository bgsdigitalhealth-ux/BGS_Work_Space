import React, { useState, useEffect } from 'react';
import {
  ClipboardList,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  Calendar,
  Send,
  ArrowLeft,
  ChevronRight,
  ChevronDown,
  Building2,
  Users,
  FileText,
  Image as ImageIcon,
  MessageSquare,
  Paperclip,
  Tag,
  LayoutGrid,
  Info,
  Settings,
  HelpCircle,
  CalendarPlus,
  Download,
  Plus,
  Share2,
  BarChart3
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { UserAssignedWork as UserAssignedWorkType } from '../../types';

interface UserAssignedWorkProps {
  initialView?: 'cards' | 'details';
}

export const UserAssignedWork: React.FC<UserAssignedWorkProps> = ({ initialView }) => {
  const {
    userWorkspace,
    selectedUserTask,
    setSelectedUserTask,
    userNav,
    setUserNav,
    openSubmitWorkDrawer,
    handleAddUserComment
  } = useApp();

  const assignedList = userWorkspace?.assignedWork || [];

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

  // Detail view state
  const [activeTab, setActiveTab] = useState<'overview' | 'updates' | 'attachments' | 'activity'>('overview');
  const [isAddingComment, setIsAddingComment] = useState(false);
  const [newCommentText, setNewCommentText] = useState('');
  const [newCommentBadge, setNewCommentBadge] = useState('Update');

  // Dynamic department list from actual assigned tasks
  const availableDepartments = Array.from(new Set(assignedList.map(t => t.department).filter(Boolean)));

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

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTask || !newCommentText.trim()) return;
    await handleAddUserComment(activeTask.id, newCommentText, newCommentBadge);
    setNewCommentText('');
    setIsAddingComment(false);
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

  const getCommentBadgeStyle = (badge?: string) => {
    if (badge === 'Work Started') return 'bg-blue-50 text-blue-600 border border-blue-200';
    if (badge === 'Update') return 'bg-purple-50 text-[#5a36e6] border border-purple-200';
    if (badge === 'Review Note') return 'bg-amber-50 text-amber-700 border border-amber-200';
    return 'bg-gray-100 text-gray-700';
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
                    My Assigned Work
                  </h2>
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
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                    statusFilter === st
                      ? 'bg-[#5a36e6] text-white shadow-sm shadow-indigo-600/30'
                      : 'bg-gray-50 text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <span>{st}</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                    statusFilter === st ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-700'
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
                            'bg-purple-50 text-purple-700 border border-purple-200'
                          }`}>
                            {task.assignmentType === 'admin_to_user' ? 'Admin → User' :
                             task.assignmentType === 'user_to_user' ? 'User → User' :
                             task.assignmentType === 'user_to_admin' ? 'User → Admin' : 'Admin → Admin'}
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
  // RENDER: FULL TASK DETAILS VIEW ("all the information")
  // ----------------------------------------------------
  if (!activeTask) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center max-w-lg mx-auto mt-12">
        <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-[#5a36e6] flex items-center justify-center mx-auto mb-4">
          <FileText className="w-8 h-8" />
        </div>
        <h3 className="text-base font-bold text-gray-900 mb-2">No Work Item Selected</h3>
        <p className="text-xs text-gray-500 mb-6 font-medium leading-relaxed">
          Please return to the cards view and click on a task card to view its full progression, timeline, and actions.
        </p>
        <button
          onClick={handleBackToCards}
          className="bg-[#5a36e6] hover:bg-[#4d2ec4] text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-md transition cursor-pointer"
        >
          ← Return to Assigned Work Cards
        </button>
      </div>
    );
  }

  const task = activeTask;
  const comments = task.comments || [];
  const attachments = task.attachments || [];
  const currentIndex = assignedList.findIndex(t => t.id === task.id);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Breadcrumb & Task Switcher Navigation Bar */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleBackToCards}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-purple-50 text-[#5a36e6] hover:bg-[#5a36e6] hover:text-white font-bold text-xs transition cursor-pointer shadow-2xs"
            title="Return to card view"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>← Back to Cards View</span>
          </button>

          <div className="h-4 w-px bg-gray-200 hidden sm:block" />

          <div className="text-xs text-gray-500 font-medium truncate max-w-xs sm:max-w-md">
            <span className="text-gray-400">Assigned Work</span>
            <span className="mx-1.5 text-gray-300">/</span>
            <span className="font-bold text-gray-900">{task.title}</span>
          </div>
        </div>

        {/* Task Switcher dropdown / Prev-Next buttons */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          {assignedList.length > 1 && (
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-gray-400">
                Card {currentIndex >= 0 ? currentIndex + 1 : 1} of {assignedList.length}
              </span>
              <button
                type="button"
                disabled={currentIndex <= 0}
                onClick={() => {
                  if (currentIndex > 0) {
                    setSelectedUserTask(assignedList[currentIndex - 1]);
                  }
                }}
                className={`p-1.5 rounded-lg border text-xs font-bold transition ${
                  currentIndex <= 0
                    ? 'border-gray-100 text-gray-300 cursor-not-allowed'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50 cursor-pointer'
                }`}
                title="Previous Task"
              >
                ◀
              </button>
              <button
                type="button"
                disabled={currentIndex < 0 || currentIndex >= assignedList.length - 1}
                onClick={() => {
                  if (currentIndex < assignedList.length - 1) {
                    setSelectedUserTask(assignedList[currentIndex + 1]);
                  }
                }}
                className={`p-1.5 rounded-lg border text-xs font-bold transition ${
                  currentIndex < 0 || currentIndex >= assignedList.length - 1
                    ? 'border-gray-100 text-gray-300 cursor-not-allowed'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50 cursor-pointer'
                }`}
                title="Next Task"
              >
                ▶
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={handleBackToCards}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 text-xs font-bold transition cursor-pointer"
          >
            <LayoutGrid className="w-3.5 h-3.5 text-[#5a36e6]" />
            <span>Card Type</span>
          </button>
        </div>
      </div>

      {/* Hero Task Banner */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-gray-100">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-[#5a36e6] flex items-center justify-center shrink-0 shadow-sm">
              <ImageIcon className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-xl lg:text-2xl font-black text-gray-900 tracking-tight">
                {task.title}
              </h2>
              <p className="text-xs text-gray-500 font-medium mt-1">
                Department: <span className="font-semibold text-gray-800">{task.department}</span> &nbsp;|&nbsp;
                Team: <span className="font-semibold text-gray-800">{task.team}</span> &nbsp;|&nbsp;
                Assigned by: <span className="font-semibold text-gray-800">{task.assignedBy || 'Admin (Admin)'}</span>
              </p>
            </div>
          </div>

          {/* Badges on Top Right */}
          <div className="flex items-center gap-2 self-start md:self-auto flex-wrap">
            {task.assignmentType && (
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                task.assignmentType === 'admin_to_user' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' :
                task.assignmentType === 'user_to_user' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                task.assignmentType === 'user_to_admin' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                'bg-purple-50 text-purple-700 border border-purple-200'
              }`}>
                {task.assignmentType === 'admin_to_user' ? 'Admin → User' :
                 task.assignmentType === 'user_to_user' ? 'User → User' :
                 task.assignmentType === 'user_to_admin' ? 'User → Admin' : 'Admin → Admin'}
              </span>
            )}
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-600 border border-amber-200">
              {task.priority} Priority
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-600 border border-blue-200">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              {task.status}
            </span>
          </div>
        </div>

        {/* Sub Navigation Tabs */}
        <div className="flex items-center gap-8 pt-4 overflow-x-auto text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`pb-3 relative transition cursor-pointer ${
              activeTab === 'overview'
                ? 'text-[#5a36e6] border-b-2 border-[#5a36e6]'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Work Overview
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('updates')}
            className={`pb-3 relative transition cursor-pointer ${
              activeTab === 'updates'
                ? 'text-[#5a36e6] border-b-2 border-[#5a36e6]'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Work Updates ({comments.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('attachments')}
            className={`pb-3 relative transition cursor-pointer ${
              activeTab === 'attachments'
                ? 'text-[#5a36e6] border-b-2 border-[#5a36e6]'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Attachments ({attachments.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('activity')}
            className={`pb-3 relative transition cursor-pointer ${
              activeTab === 'activity'
                ? 'text-[#5a36e6] border-b-2 border-[#5a36e6]'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Activity Log
          </button>
        </div>
      </div>

      {/* Main Grid: Left Details & Progress + Right Actions & Task Info */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Top Two Cards: Work Description & Timeline */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Work Description Card */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center gap-2 text-[#5a36e6] mb-3">
                <FileText className="w-4 h-4" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900">Work Description</h3>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed font-normal">
                {task.description || 'No detailed instructions added for this work assignment.'}
              </p>
            </div>

            {/* Timeline Card */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center gap-2 text-[#5a36e6] mb-3">
                <Calendar className="w-4 h-4" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900">Timeline</h3>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Assigned On</span>
                  <span className="font-semibold text-gray-900">{task.assignedOn || '12 Nov 2026'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Due Date</span>
                  <span className="font-semibold text-gray-900">{task.dueDate || 'Today'}</span>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-gray-500">Time Left</span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-50 text-[#5a36e6] border border-purple-200">
                    {task.status === 'Completed' ? 'Completed' : 'Active'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Work Updates / Comments (Dynamic) */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-6 pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-[#5a36e6]" />
                <h3 className="text-sm font-bold text-gray-900">Work Updates / Comments (Dynamic)</h3>
              </div>

              <button
                type="button"
                onClick={() => setIsAddingComment(!isAddingComment)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#5a36e6] text-[#5a36e6] hover:bg-purple-50 text-xs font-bold transition shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Comment / Update
              </button>
            </div>

            {/* Inline Comment Creation Form */}
            {isAddingComment && (
              <form onSubmit={handlePostComment} className="mb-6 p-4 rounded-xl bg-purple-50/50 border border-purple-100 space-y-3">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-xs font-bold text-gray-700">Badge Tag:</span>
                  {['Update', 'Work Started', 'Review Note'].map(b => (
                    <button
                      key={b}
                      type="button"
                      onClick={() => setNewCommentBadge(b)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                        newCommentBadge === b
                          ? 'bg-[#5a36e6] text-white'
                          : 'bg-white border border-gray-200 text-gray-600'
                      }`}
                    >
                      {b}
                    </button>
                  ))}
                </div>
                <textarea
                  rows={2}
                  placeholder="Post progress, notes, or response..."
                  value={newCommentText}
                  onChange={(e) => setNewCommentText(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-xl p-3 text-xs focus:ring-2 focus:ring-[#5a36e6] focus:outline-none"
                  required
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddingComment(false)}
                    className="px-3 py-1.5 text-xs text-gray-600 font-bold hover:bg-gray-100 rounded-lg transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 text-xs bg-[#5a36e6] hover:bg-[#4828c4] text-white font-bold rounded-lg transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <Send className="w-3 h-3" /> Post Update
                  </button>
                </div>
              </form>
            )}

            {/* Comments Thread */}
            <div className="space-y-5">
              {comments.length === 0 ? (
                <p className="text-gray-400 text-xs py-4 text-center font-medium">
                  No comments or work updates posted yet. Use "+ Add Comment / Update" above to communicate.
                </p>
              ) : (
                comments.map((c) => {
                  const isLead = (c.role || '').includes('Lead');
                  return (
                    <div key={c.id} className="flex items-start gap-3.5 group">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 shadow-sm ${
                        isLead ? 'bg-amber-100 text-amber-700' : 'bg-purple-100 text-[#5a36e6]'
                      }`}>
                        {(c.author || 'User').split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>

                      <div className="flex-1 bg-gray-50/70 group-hover:bg-gray-50 rounded-2xl p-4 border border-gray-100 transition">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-xs text-gray-900">{c.author}</span>
                            <span className="text-[11px] text-gray-400 font-medium">{c.date}</span>
                            {c.badge && (
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${getCommentBadgeStyle(c.badge)}`}>
                                {c.badge}
                              </span>
                            )}
                          </div>
                        </div>

                        <p className="text-xs text-gray-700 leading-relaxed font-normal">
                          {c.text}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Actions, Task Information, Attachments (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Actions Card */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
            <div className="flex items-center gap-2 text-gray-900 mb-2 font-bold text-xs uppercase tracking-wider">
              <Settings className="w-4 h-4 text-[#5a36e6]" />
              <span>Actions</span>
            </div>

            <button
              type="button"
              onClick={() => openSubmitWorkDrawer(task)}
              className="w-full py-3 rounded-xl bg-[#5a36e6] hover:bg-[#4828c4] text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow-md shadow-indigo-600/30 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              Submit Work (Mark as Completed)
            </button>

            <button
              type="button"
              onClick={() => alert('Extension request submitted to Team Lead for review.')}
              className="w-full py-2.5 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <CalendarPlus className="w-4 h-4 text-[#5a36e6]" />
              Request Extension
            </button>

            <button
              type="button"
              onClick={() => alert('Support query sent to Team Lead.')}
              className="w-full py-2.5 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <HelpCircle className="w-4 h-4 text-[#5a36e6]" />
              Raise a Query
            </button>
          </div>

          {/* Task Information Card */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
            <div className="flex items-center gap-2 text-gray-900 mb-2 font-bold text-xs uppercase tracking-wider">
              <Info className="w-4 h-4 text-[#5a36e6]" />
              <span>Task Information</span>
            </div>

            <div className="divide-y divide-gray-100 text-xs">
              <div className="flex justify-between py-2">
                <span className="text-gray-400 font-medium">Task ID</span>
                <span className="font-bold text-gray-900 font-mono">{task.taskId || task.id}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-400 font-medium">Priority</span>
                <span className="font-bold text-amber-600">{task.priority}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-400 font-medium">Status</span>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-600">
                  {task.status}
                </span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-400 font-medium">Assigned On</span>
                <span className="font-semibold text-gray-800">{task.assignedOn || '12 Nov 2026'}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-400 font-medium">Due Date</span>
                <span className="font-semibold text-gray-800">{task.dueDate || 'Today'}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-400 font-medium">Assigned By</span>
                <span className="font-semibold text-gray-800">{task.assignedBy || 'Admin (Admin)'}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-400 font-medium">Department</span>
                <span className="font-semibold text-gray-800">{task.department}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-400 font-medium">Team</span>
                <span className="font-semibold text-gray-800">{task.team}</span>
              </div>
            </div>
          </div>

          {/* Attachments Card */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
            <div className="flex items-center gap-2 text-gray-900 mb-2 font-bold text-xs uppercase tracking-wider">
              <Paperclip className="w-4 h-4 text-[#5a36e6]" />
              <span>Attachments ({attachments.length})</span>
            </div>

            <div className="space-y-2.5">
              {attachments.length === 0 ? (
                <p className="text-gray-400 text-xs py-3 text-center font-medium">No attachments uploaded</p>
              ) : (
                attachments.map((file, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-gray-50 transition">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-red-100 text-red-600 flex items-center justify-center font-bold text-[10px]">
                        {file.name.endsWith('.pdf') ? 'PDF' : 'ZIP'}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-gray-800 truncate">{file.name}</p>
                        <p className="text-[10px] text-gray-400">{file.size}</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => alert(`Downloading attachment: ${file.name}`)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-[#5a36e6] hover:bg-white transition cursor-pointer"
                      title="Download Attachment"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
