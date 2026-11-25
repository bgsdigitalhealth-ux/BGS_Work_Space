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
  Paperclip,
  LayoutGrid,
  List,
  Play,
  Pause,
  RotateCcw,
  Edit3,
  CheckSquare,
  Trash2
} from 'lucide-react';
import { useApp, isTaskAssignedToUser, formatTaskDueDate, isUserManager } from '../../context/AppContext';
import { UserAssignedWork as UserAssignedWorkType } from '../../types';
import { UserWorkDetails } from './UserWorkDetails';
import { PauseReasonModal } from './PauseReasonModal';
import { EditTaskModal } from './EditTaskModal';

interface UserAssignedWorkProps {
  initialView?: 'cards' | 'list' | 'details';
  title?: string;
}

export const UserAssignedWork: React.FC<UserAssignedWorkProps> = ({ initialView, title = 'Team Work' }) => {
  const {
    currentUser,
    userWorkspace,
    selectedUserTask,
    setSelectedUserTask,
    userNav,
    setUserNav,
    isManagerOrAdmin,
    handleStartTimer,
    handlePauseTimer,
    handleResumeTimer,
    handleFinishTimer,
    handleDeleteAssignment,
    members,
    workRequests
  } = useApp();

  const myMember = (members || []).find(m =>
    (currentUser?.id && (m.id === currentUser.id || (m as any).userId === currentUser.id)) ||
    (currentUser?.email && m.email && m.email.toLowerCase() === currentUser.email.toLowerCase())
  );

  const isManager = Boolean(
    isManagerOrAdmin ||
    currentUser?.role === 'manager' ||
    currentUser?.role === 'admin' ||
    isUserManager(currentUser, myMember)
  );

  const rawAssignedList = userWorkspace?.assignedWork || [];

  // Strict User Isolation for regular users; managers view full team tasks
  const assignedList = !isManager
    ? rawAssignedList.filter(t => isTaskAssignedToUser(t, currentUser, myMember))
    : rawAssignedList;

  const myEmail = (currentUser?.email || '').trim().toLowerCase();
  const pendingIncomingRequests = (workRequests || []).filter(w =>
    w.status === 'Pending Manager Approval' &&
    ((currentUser?.id && w.receiverId === currentUser.id) ||
     (myEmail && w.receiverEmail && w.receiverEmail.toLowerCase() === myEmail))
  );

  const displayTitle = !isManager
    ? (currentUser?.name ? `${currentUser.name}'s Work` : 'My Assigned Work')
    : title;

  // View modes: 'cards' | 'list' | 'details'
  const [viewMode, setViewMode] = useState<'cards' | 'list' | 'details'>(() => {
    if (initialView && (initialView === 'cards' || initialView === 'list' || initialView === 'details')) return initialView;
    if (userNav === 'details') return 'details';
    return 'cards';
  });

  const [previousViewMode, setPreviousViewMode] = useState<'cards' | 'list'>('cards');

  // Keep viewMode synchronized with userNav and selectedUserTask
  useEffect(() => {
    if (userNav === 'details' || selectedUserTask) {
      setViewMode('details');
    } else if (userNav === 'assigned-work' || userNav === 'my-work') {
      if (viewMode === 'details') {
        setViewMode(previousViewMode);
      }
    }
  }, [userNav, selectedUserTask]);

  // Filters state - ONE SHARED TEAM DROPDOWN FOR ALL 3 VIEWS
  const [teamFilter, setTeamFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'To Do' | 'In Progress' | 'Under Review' | 'Completed'>('All');
  const [priorityFilter, setPriorityFilter] = useState<'All' | 'High' | 'Medium' | 'Low'>('All');
  const [departmentFilter, setDepartmentFilter] = useState<string>('All');

  // Modals state
  const [pauseModalTask, setPauseModalTask] = useState<UserAssignedWorkType | null>(null);
  const [editModalTask, setEditModalTask] = useState<UserAssignedWorkType | null>(null);

  // Dynamic filter options
  const availableTeams = Array.from(new Set(assignedList.map(t => t.team).filter(Boolean))) as string[];
  const availableDepartments = Array.from(new Set(assignedList.map(t => t.department).filter(Boolean))) as string[];

  // 1. Unified Team Filtered List - Source of truth for all views and dashboard counts
  const teamFilteredTasks = assignedList.filter(task => {
    if (teamFilter !== 'All' && task.team !== teamFilter) return false;
    return true;
  });

  // KPI stats computed strictly from teamFilteredTasks (Dashboard counts follow the same filter)
  const totalCount = teamFilteredTasks.length;
  const inProgressCount = teamFilteredTasks.filter(t => t.status === 'In Progress').length;
  const todoCount = teamFilteredTasks.filter(t => t.status === 'Not Started' || (t.status as any) === 'To Do' || !t.status).length;
  const underReviewCount = teamFilteredTasks.filter(t => t.status === 'Under Review').length;
  const completedCount = teamFilteredTasks.filter(t => t.status === 'Completed').length;
  const highPriorityCount = teamFilteredTasks.filter(t => t.priority === 'High').length;

  // Filtered tasks for Card and List View
  const filteredTasks = teamFilteredTasks.filter(task => {
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
      const matchAssignee = (task.assigneeName || '').toLowerCase().includes(q);
      const matchId = (task.taskId || task.id || '').toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchDept && !matchTeam && !matchAssignee && !matchId) return false;
    }

    return true;
  });

  // Active filters helpers for KPI cards
  const isTotalActive = statusFilter === 'All' && priorityFilter === 'All' && departmentFilter === 'All' && !searchQuery.trim();
  const isInProgressActive = statusFilter === 'In Progress';
  const isTodoActive = statusFilter === 'To Do';
  const isHighPriorityActive = priorityFilter === 'High';

  const handleTotalWorkClick = () => {
    setStatusFilter('All');
    setPriorityFilter('All');
    setDepartmentFilter('All');
    setSearchQuery('');
  };

  const handleInProgressClick = () => {
    if (statusFilter === 'In Progress') {
      setStatusFilter('All');
    } else {
      setStatusFilter('In Progress');
      setPriorityFilter('All');
    }
  };

  const handleTodoClick = () => {
    if (statusFilter === 'To Do') {
      setStatusFilter('All');
    } else {
      setStatusFilter('To Do');
      setPriorityFilter('All');
    }
  };

  const handleHighPriorityClick = () => {
    if (priorityFilter === 'High') {
      setPriorityFilter('All');
    } else {
      setPriorityFilter('High');
      setStatusFilter('All');
    }
  };

  // Determine current active task for details view
  const activeTask = selectedUserTask || (assignedList.length > 0 ? assignedList[0] : null);

  const handleCardClick = (task: UserAssignedWorkType) => {
    setSelectedUserTask(task);
    setPreviousViewMode(viewMode === 'details' ? 'cards' : viewMode);
    setViewMode('details');
    setUserNav('details');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToViews = () => {
    setSelectedUserTask(null);
    setViewMode(previousViewMode);
    setUserNav('assigned-work');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const formatSeconds = (sec: number = 0) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    if (h > 0) return `${h}h ${m}m ${s}s`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
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
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-50 text-[#5a36e6] border border-purple-200">
          <span className="w-1.5 h-1.5 rounded-full bg-[#5a36e6] animate-pulse" />
          In Progress
        </span>
      );
    }
    if (status === 'Completed') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          Completed
        </span>
      );
    }
    if (status === 'Under Review') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
          <Clock className="w-3 h-3 text-amber-600" />
          Under Review
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
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

  // Timer controls renderer
  const renderTimerControls = (task: UserAssignedWorkType) => {
    const timer = task.timerState;
    const isRunning = timer?.status === 'running';
    const isPaused = timer?.status === 'paused';
    const isFinished = timer?.status === 'finished';
    const taskId = task.taskId || task.id;

    // Managers have see-only access: do NOT show Start, Pause, Resume, or Finish buttons
    // Regular users can only control timers on their own assigned tasks
    const isAssignedToMe = isTaskAssignedToUser(task, currentUser, myMember);
    const canControlTimer = !isManager && isAssignedToMe;

    const hasStatusIndicator = Boolean((timer && (isRunning || isPaused)) || isFinished);
    if (!hasStatusIndicator && !canControlTimer) {
      return null;
    }

    return (
      <div className="flex items-center gap-2 flex-wrap" onClick={(e) => e.stopPropagation()}>
        {/* Status indicator: only when timer is running or paused */}
        {timer && (isRunning || isPaused) && (
          <div className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 flex items-center gap-1.5">
            <Clock className={`w-3 h-3 ${isRunning ? 'text-[#5a36e6] animate-pulse' : 'text-amber-500'}`} />
            <span>{formatSeconds(timer.activeSeconds)}</span>
            {timer.pausedSeconds > 0 && (
              <span className="text-amber-600 font-semibold">| Paused: {formatSeconds(timer.pausedSeconds)}</span>
            )}
          </div>
        )}

        {/* Buttons - only shown for assignees who can control the timer */}
        {canControlTimer && !isRunning && !isPaused && !isFinished && task.status !== 'Completed' && (task.progress === undefined || task.progress < 100) && (
          <button
            type="button"
            onClick={() => handleStartTimer(taskId)}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition shadow-xs cursor-pointer"
            title="Start timer for this task"
          >
            <Play className="w-3 h-3 fill-current" />
            <span>Start</span>
          </button>
        )}

        {canControlTimer && isRunning && (
          <>
            <button
              type="button"
              onClick={() => setPauseModalTask(task)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs transition shadow-xs cursor-pointer"
              title="Pause timer (requires reason)"
            >
              <Pause className="w-3 h-3 fill-current" />
              <span>Pause</span>
            </button>
            <button
              type="button"
              onClick={() => handleFinishTimer(taskId)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition shadow-xs cursor-pointer"
              title="Finish work on this task"
            >
              <CheckSquare className="w-3 h-3" />
              <span>Finish</span>
            </button>
          </>
        )}

        {canControlTimer && isPaused && (
          <button
            type="button"
            onClick={() => handleResumeTimer(taskId)}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition shadow-xs cursor-pointer"
            title={`Resume task (Paused: ${timer?.pauseReason || 'Break'})`}
          >
            <RotateCcw className="w-3 h-3" />
            <span>Resume</span>
          </button>
        )}

        {isFinished && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-semibold text-[11px] border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>Finished</span>
          </span>
        )}
      </div>
    );
  };

  // ----------------------------------------------------
  // RENDER: FULL TASK DETAILS VIEW
  // ----------------------------------------------------
  if (viewMode === 'details') {
    return <UserWorkDetails onBack={handleBackToViews} taskOverride={activeTask || undefined} />;
  }

  // ----------------------------------------------------
  // RENDER: MAIN WORKSPACE (Cards / List)
  // ----------------------------------------------------
  return (
    <div className="space-y-6 pb-12">
      {/* Top Header Card with Quick Stats & Layout Switcher */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-[#5a36e6] flex items-center justify-center font-bold shadow-sm">
              <ClipboardList className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                  {displayTitle}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-50 text-[#5a36e6] border border-purple-200">
                  {totalCount} {totalCount === 1 ? 'Task' : 'Tasks'}
                </span>
                {teamFilter !== 'All' && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-[#5a36e6] border border-indigo-200">
                    Team: {teamFilter}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 font-medium mt-0.5">
                Switch seamlessly between Card and List views. Dashboard metrics reflect selected team filters in real time.
              </p>
            </div>
          </div>

          {/* View Mode Switcher + Action Button */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* View Switcher: Card | List */}
            <div className="flex items-center bg-gray-100 p-1 rounded-xl border border-gray-200/70">
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'cards'
                    ? 'bg-white text-[#5a36e6] shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                title="Card View"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Cards</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'list'
                    ? 'bg-white text-[#5a36e6] shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                title="List View"
              >
                <List className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">List</span>
              </button>
            </div>

            {/* Quick Action Button */}
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

        {/* Interactive KPI Summary Cards (Following Team Filter) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-5">
          {/* Total Work */}
          <div
            role="button"
            tabIndex={0}
            onClick={handleTotalWorkClick}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleTotalWorkClick(); } }}
            title="Click to view all tasks"
            className={`p-3 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-all duration-200 select-none group hover:shadow-md hover:scale-[1.02] active:scale-[0.98] ${
              isTotalActive
                ? 'bg-indigo-50/80 border-[#5a36e6] ring-2 ring-[#5a36e6]/25 shadow-sm'
                : 'bg-slate-50 border-slate-100 hover:bg-slate-100/70 hover:border-slate-200'
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold transition-all ${
                isTotalActive ? 'bg-[#5a36e6] text-white shadow-sm' : 'bg-indigo-100 text-[#5a36e6] group-hover:bg-[#5a36e6] group-hover:text-white'
              }`}>
                <ClipboardList className="w-4 h-4" />
              </div>
              <div>
                <p className={`text-[11px] font-bold ${isTotalActive ? 'text-[#5a36e6]' : 'text-slate-500'}`}>Total Work</p>
                <p className="text-base font-extrabold text-slate-900">{totalCount}</p>
              </div>
            </div>
            <ChevronRight className={`w-4 h-4 transition-transform group-hover:translate-x-0.5 ${
              isTotalActive ? 'text-[#5a36e6]' : 'text-slate-300'
            }`} />
          </div>

          {/* In Progress */}
          <div
            role="button"
            tabIndex={0}
            onClick={handleInProgressClick}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleInProgressClick(); } }}
            title="Click to filter by In Progress work"
            className={`p-3 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-all duration-200 select-none group hover:shadow-md hover:scale-[1.02] active:scale-[0.98] ${
              isInProgressActive
                ? 'bg-purple-100/90 border-[#5a36e6] ring-2 ring-[#5a36e6]/25 shadow-sm'
                : 'bg-purple-50/50 border-purple-100 hover:bg-purple-100/60 hover:border-purple-200'
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold transition-all ${
                isInProgressActive ? 'bg-[#5a36e6] text-white shadow-sm' : 'bg-purple-100 text-[#5a36e6] group-hover:bg-[#5a36e6] group-hover:text-white'
              }`}>
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <p className={`text-[11px] font-bold ${isInProgressActive ? 'text-[#5a36e6]' : 'text-purple-600'}`}>In Progress</p>
                <p className="text-base font-extrabold text-purple-900">{inProgressCount}</p>
              </div>
            </div>
            <ChevronRight className={`w-4 h-4 transition-transform group-hover:translate-x-0.5 ${
              isInProgressActive ? 'text-[#5a36e6]' : 'text-purple-300'
            }`} />
          </div>

          {/* To Do / Pending */}
          <div
            role="button"
            tabIndex={0}
            onClick={handleTodoClick}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleTodoClick(); } }}
            title="Click to filter by To Do / Pending work"
            className={`p-3 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-all duration-200 select-none group hover:shadow-md hover:scale-[1.02] active:scale-[0.98] ${
              isTodoActive
                ? 'bg-blue-100/90 border-blue-600 ring-2 ring-blue-500/25 shadow-sm'
                : 'bg-blue-50/50 border-blue-100 hover:bg-blue-100/60 hover:border-blue-200'
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold transition-all ${
                isTodoActive ? 'bg-blue-600 text-white shadow-sm' : 'bg-blue-100 text-blue-600 group-hover:bg-blue-600 group-hover:text-white'
              }`}>
                <AlertCircle className="w-4 h-4" />
              </div>
              <div>
                <p className={`text-[11px] font-bold ${isTodoActive ? 'text-blue-700' : 'text-blue-600'}`}>To Do / Pending</p>
                <p className="text-base font-extrabold text-blue-900">{todoCount}</p>
              </div>
            </div>
            <ChevronRight className={`w-4 h-4 transition-transform group-hover:translate-x-0.5 ${
              isTodoActive ? 'text-blue-600' : 'text-blue-300'
            }`} />
          </div>

          {/* High Priority */}
          <div
            role="button"
            tabIndex={0}
            onClick={handleHighPriorityClick}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleHighPriorityClick(); } }}
            title="Click to filter by High Priority work"
            className={`p-3 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-all duration-200 select-none group hover:shadow-md hover:scale-[1.02] active:scale-[0.98] ${
              isHighPriorityActive
                ? 'bg-rose-100/90 border-rose-600 ring-2 ring-rose-500/25 shadow-sm'
                : 'bg-rose-50/50 border-rose-100 hover:bg-rose-100/60 hover:border-rose-200'
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold transition-all ${
                isHighPriorityActive ? 'bg-rose-600 text-white shadow-sm' : 'bg-rose-100 text-rose-600 group-hover:bg-rose-600 group-hover:text-white'
              }`}>
                <Tag className="w-4 h-4" />
              </div>
              <div>
                <p className={`text-[11px] font-bold ${isHighPriorityActive ? 'text-rose-700' : 'text-rose-600'}`}>High Priority</p>
                <p className="text-base font-extrabold text-rose-900">{highPriorityCount}</p>
              </div>
            </div>
            <ChevronRight className={`w-4 h-4 transition-transform group-hover:translate-x-0.5 ${
              isHighPriorityActive ? 'text-rose-600' : 'text-rose-300'
            }`} />
          </div>
        </div>
      </div>

      {/* Incoming Work Requests (Pending Manager Approval) */}
      {pendingIncomingRequests.length > 0 && (
        <div className="bg-gradient-to-r from-amber-500/10 via-indigo-500/5 to-purple-500/10 border-2 border-amber-300/80 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Incoming Extra Work Requests ({pendingIncomingRequests.length})
              </h3>
              <p className="text-[11px] text-slate-600">
                Awaiting your manager's approval. Once approved, tasks will automatically appear below.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            {pendingIncomingRequests.map(req => (
              <div key={req.id} className="bg-white p-3.5 rounded-xl border border-amber-200 shadow-2xs space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                    ⏳ Pending Manager Approval
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">{req.referenceId}</span>
                </div>
                <h4 className="text-xs font-bold text-slate-900">{req.title}</h4>
                <p className="text-[11px] text-slate-600 line-clamp-2 bg-slate-50 p-2 rounded-lg">{req.description}</p>
                <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
                  <span>From: <strong>{req.senderName}</strong></span>
                  {req.dueDate && <span>Due: {req.dueDate}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter & Search Bar - Shared across all three views */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Status Tabs (shown for Card & List views) */}
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

        {/* Filter Controls Row */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Unified Team Dropdown */}
          <div className="relative">
            <select
              value={teamFilter}
              onChange={(e) => setTeamFilter(e.target.value)}
              className="appearance-none bg-indigo-50/70 border border-indigo-200 text-xs font-bold text-[#5a36e6] py-2 pl-3 pr-8 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5a36e6] cursor-pointer"
            >
              <option value="All">All Teams</option>
              {availableTeams.map(tm => (
                <option key={tm} value={tm}>Team: {tm}</option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-[#5a36e6] absolute right-2.5 top-3 pointer-events-none" />
          </div>

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

      {/* ---------------------------------------------------- */}
      {/* 1. CARD VIEW                                         */}
      {/* ---------------------------------------------------- */}
      {viewMode === 'cards' && (
        filteredTasks.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center max-w-md mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-[#5a36e6] flex items-center justify-center mx-auto mb-4 shadow-sm">
              <ClipboardList className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-gray-900 mb-1">No Assigned Work Found</h3>
            <p className="text-xs text-gray-500 mb-5 leading-relaxed font-medium">
              No tasks match your current filters. Try clearing your filters or changing the team dropdown.
            </p>
            <button
              type="button"
              onClick={() => {
                setTeamFilter('All');
                setSearchQuery('');
                setStatusFilter('All');
                setPriorityFilter('All');
                setDepartmentFilter('All');
              }}
              className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold transition cursor-pointer"
            >
              Reset All Filters
            </button>
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
                  role="button"
                  tabIndex={0}
                  onClick={() => handleCardClick(task)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleCardClick(task);
                    }
                  }}
                  title={`Click to view full work details for ${task.title}`}
                  className="bg-white rounded-2xl border border-gray-200/90 shadow-xs hover:shadow-xl hover:border-[#5a36e6]/60 hover:-translate-y-0.5 transition-all duration-300 p-5 sm:p-6 flex flex-col justify-between cursor-pointer group relative overflow-hidden select-none focus:outline-none focus:ring-2 focus:ring-[#5a36e6]/40"
                >
                  {/* Top Color Accent Line */}
                  <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${priorityStyle.accent}`} />

                  {/* Card Content Top */}
                  <div className="space-y-4">
                    {/* Header Badges Row */}
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-mono text-[11px] font-bold px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-700 border border-slate-200/60">
                          {task.taskId || task.id}
                        </span>
                        {task.assignmentType && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                            {task.assignmentType === 'admin_to_user' ? 'Admin → User' :
                              task.assignmentType === 'user_to_user' ? 'User → User' :
                              task.assignmentType === 'user_to_admin' ? 'User → Admin' : 'Assigned Work'}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${priorityStyle.badge}`}>
                          {task.priority} Priority
                        </span>
                        {getStatusBadge(task.status)}
                        {/* Edit task button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditModalTask(task);
                          }}
                          className="p-1.5 rounded-lg bg-gray-100 hover:bg-[#5a36e6] hover:text-white text-gray-600 transition cursor-pointer"
                          title="Edit Task Assignment"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        {/* Delete task button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteAssignment(task.id);
                          }}
                          className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-600 hover:text-white text-rose-600 transition cursor-pointer"
                          title="Delete this assigned work"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
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
                          Assignee: <span className="font-semibold text-gray-800">{task.assigneeName || 'Assigned Member'}</span> • By: <span className="font-semibold text-gray-700">{task.assignedBy || 'Admin'}</span>
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

                    {/* Due Date & Assignment Date */}
                    <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                      <div className="flex flex-col">
                        <span className="text-gray-400 font-medium">Assigned On</span>
                        <span className="font-semibold text-gray-800">{task.assignedOn || 'Recently'}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-gray-400 font-medium">Deadline / Due</span>
                        <span className={`font-bold ${isDueToday ? 'text-amber-600' : 'text-gray-800'}`}>
                          {formatTaskDueDate(task.dueDate) || 'Pending'}
                        </span>
                      </div>
                    </div>

                    {/* Interactive Task Timer Controls */}
                    {renderTimerControls(task) && (
                      <div className="pt-2 border-t border-gray-100">
                        {renderTimerControls(task)}
                      </div>
                    )}
                  </div>

                  {/* Card Bottom / Footer Actions */}
                  <div className="pt-4 mt-4 border-t border-gray-100 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 text-xs text-gray-500 font-medium">
                      <span className="inline-flex items-center gap-1" title={`${commentsCount} comments`}>
                        <MessageSquare className="w-3.5 h-3.5 text-gray-400" />
                        <span>{commentsCount}</span>
                      </span>
                      <span className="inline-flex items-center gap-1" title={`${attachmentsCount} attachments`}>
                        <Paperclip className="w-3.5 h-3.5 text-gray-400" />
                        <span>{attachmentsCount}</span>
                      </span>
                    </div>

                    <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#5a36e6] group-hover:text-[#4323be] transition">
                      <span>View All Information</span>
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* ---------------------------------------------------- */}
      {/* 2. LIST VIEW (Table format)                          */}
      {/* ---------------------------------------------------- */}
      {viewMode === 'list' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-gray-100 text-[11px] font-black uppercase tracking-wider text-gray-500">
                  <th className="py-3 px-4">Task ID & Title</th>
                  <th className="py-3 px-4">Team & Department</th>
                  <th className="py-3 px-4">Assignee</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Deadline</th>
                  <th className="py-3 px-4">Task Timer</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs">
                {filteredTasks.map(task => (
                  <tr
                    key={task.id}
                    onClick={() => handleCardClick(task)}
                    className="hover:bg-indigo-50/30 transition-colors cursor-pointer group"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 shrink-0">
                          {task.taskId || task.id}
                        </span>
                        <div className="min-w-0">
                          <p className="font-bold text-gray-900 group-hover:text-[#5a36e6] transition-colors truncate max-w-xs">
                            {task.title}
                          </p>
                          <p className="text-[11px] text-gray-400 truncate max-w-xs">{task.description}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-col">
                        <span className="font-semibold text-gray-800">{task.team || 'Team'}</span>
                        <span className="text-[11px] text-gray-500">{task.department || 'General'}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-medium text-gray-800">{task.assigneeName || 'Assigned Member'}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${getPriorityStyle(task.priority).badge}`}>
                        {task.priority}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {getStatusBadge(task.status)}
                    </td>
                    <td className="py-3 px-4 font-medium text-gray-700">
                      {formatTaskDueDate(task.dueDate) || 'Pending'}
                    </td>
                    <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                      {renderTimerControls(task)}
                    </td>
                    <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setEditModalTask(task)}
                          className="p-1.5 rounded-lg bg-gray-100 hover:bg-[#5a36e6] hover:text-white text-gray-600 transition cursor-pointer"
                          title="Edit Assignment"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteAssignment(task.id)}
                          className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-600 hover:text-white text-rose-600 transition cursor-pointer"
                          title="Delete Assignment"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCardClick(task)}
                          className="p-1.5 rounded-lg bg-indigo-50 hover:bg-[#5a36e6] hover:text-white text-[#5a36e6] transition cursor-pointer"
                          title="Open Details"
                        >
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredTasks.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-xs text-gray-400 font-medium">
                      No tasks found matching your filter selection.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pause Reason Modal (Mandatory reason prompt) */}
      {pauseModalTask && (
        <PauseReasonModal
          isOpen={Boolean(pauseModalTask)}
          onClose={() => setPauseModalTask(null)}
          onConfirm={async (reason) => {
            const taskId = pauseModalTask.taskId || pauseModalTask.id;
            await handlePauseTimer(taskId, reason);
            setPauseModalTask(null);
          }}
          taskTitle={pauseModalTask.title}
        />
      )}

      {/* Edit Task Modal for Admin/Manager */}
      {editModalTask && (
        <EditTaskModal
          isOpen={Boolean(editModalTask)}
          onClose={() => setEditModalTask(null)}
          task={editModalTask}
        />
      )}
    </div>
  );
};
