import React, { useState } from 'react';
import {
  Kanban as KanbanIcon,
  Search,
  Calendar,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import { useApp, isUserManager, isTaskAssignedToUser, formatTaskDueDate } from '../../context/AppContext';
import { UserAssignedWork as UserAssignedWorkType } from '../../types';

interface KanbanBoardProps {
  tasks?: UserAssignedWorkType[];
  title?: string;
  showHeader?: boolean;
  onOpenTaskDetails?: (task: UserAssignedWorkType) => void;
}

type KanbanColumnId = 'To Do' | 'In Progress' | 'Under Review' | 'Completed';

interface ColumnConfig {
  id: KanbanColumnId;
  label: string;
  accentBg: string;
  badgeBg: string;
  badgeText: string;
  borderClass: string;
  dotColor: string;
}

const COLUMNS: ColumnConfig[] = [
  {
    id: 'To Do',
    label: 'To Do',
    accentBg: 'bg-blue-50/50',
    badgeBg: 'bg-blue-100',
    badgeText: 'text-blue-800',
    borderClass: 'border-blue-200/80',
    dotColor: 'bg-blue-500'
  },
  {
    id: 'In Progress',
    label: 'In Progress',
    accentBg: 'bg-indigo-50/50',
    badgeBg: 'bg-indigo-100',
    badgeText: 'text-[#5a36e6]',
    borderClass: 'border-indigo-200/80',
    dotColor: 'bg-[#5a36e6]'
  },
  {
    id: 'Under Review',
    label: 'Under Review',
    accentBg: 'bg-amber-50/50',
    badgeBg: 'bg-amber-100',
    badgeText: 'text-amber-800',
    borderClass: 'border-amber-200/80',
    dotColor: 'bg-amber-500'
  },
  {
    id: 'Completed',
    label: 'Completed',
    accentBg: 'bg-emerald-50/50',
    badgeBg: 'bg-emerald-100',
    badgeText: 'text-emerald-800',
    borderClass: 'border-emerald-200/80',
    dotColor: 'bg-emerald-500'
  }
];

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  tasks: propTasks,
  title = 'Work Kanban Board',
  showHeader = true,
  onOpenTaskDetails
}) => {
  const {
    currentUser,
    userWorkspace,
    members,
    handleEditAssignment,
    setSelectedUserTask,
    setUserNav,
    setManagerNav,
    isManagerOrAdmin,
    notify
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<'All' | 'High' | 'Medium' | 'Low'>('All');
  const [teamFilter, setTeamFilter] = useState<string>('All');
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<string | null>(null);
  const [managerScope, setManagerScope] = useState<'my' | 'team'>('my');

  const myEmail = (currentUser?.email || '').trim().toLowerCase();
  const myMember = (members || []).find(m =>
    (currentUser?.id && (m.id === currentUser.id || (m as any).userId === currentUser.id)) ||
    (myEmail && m.email && m.email.toLowerCase() === myEmail)
  );

  const isManager = Boolean(
    isManagerOrAdmin ||
    currentUser?.role === 'manager' ||
    currentUser?.role === 'admin' ||
    isUserManager(currentUser, myMember)
  );

  // Source tasks
  const rawAssigned = userWorkspace?.assignedWork || [];
  const myAssignedList = rawAssigned.filter(t => isTaskAssignedToUser(t, currentUser, myMember));
  const fallbackTasks = isManager
    ? (managerScope === 'team' ? rawAssigned : myAssignedList)
    : myAssignedList;

  const baseTasks = propTasks !== undefined ? propTasks : fallbackTasks;

  // Available teams for filtering
  const availableTeams = Array.from(new Set(baseTasks.map(t => t.team).filter(Boolean))) as string[];

  // Filter tasks by search query, priority, and team
  const filteredTasks = baseTasks.filter(t => {
    if (priorityFilter !== 'All' && t.priority !== priorityFilter) return false;
    if (teamFilter !== 'All' && t.team !== teamFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = (t.title || '').toLowerCase().includes(q);
      const matchDesc = (t.description || '').toLowerCase().includes(q);
      const matchAssignee = ((t as any).assigneeName || t.assignedTo || '').toLowerCase().includes(q);
      const matchTeam = (t.team || '').toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchAssignee && !matchTeam) return false;
    }
    return true;
  });

  // Helper to categorize task into column
  const getTaskColumn = (task: UserAssignedWorkType): KanbanColumnId => {
    const s = (task.status || '').toLowerCase();
    if (s === 'completed') return 'Completed';
    if (s.includes('review')) return 'Under Review';
    if (s === 'in progress' || s === 'in_progress') return 'In Progress';
    return 'To Do';
  };

  // Group tasks by column
  const columnsData: Record<KanbanColumnId, UserAssignedWorkType[]> = {
    'To Do': [],
    'In Progress': [],
    'Under Review': [],
    'Completed': []
  };

  filteredTasks.forEach(t => {
    const col = getTaskColumn(t);
    columnsData[col].push(t);
  });

  // Handle stage change
  const handleMoveStatus = async (taskId: string, targetColumn: KanbanColumnId) => {
    setIsUpdatingStatus(taskId);
    try {
      let newStatus: string = targetColumn;
      if (targetColumn === 'To Do') newStatus = 'To Do';
      else if (targetColumn === 'In Progress') newStatus = 'In Progress';
      else if (targetColumn === 'Under Review') newStatus = 'Under Review';
      else if (targetColumn === 'Completed') newStatus = 'Completed';

      await handleEditAssignment(taskId, { status: newStatus });
      notify(`Task moved to ${targetColumn}`, 'info', 'Kanban Board');
    } catch (e: any) {
      notify(e.message || 'Failed to update task status', 'error', 'Kanban Error');
    } finally {
      setIsUpdatingStatus(null);
    }
  };

  // Native Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('text/plain', taskId);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedTaskId(taskId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, targetColumn: KanbanColumnId) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain') || draggedTaskId;
    setDraggedTaskId(null);
    if (!taskId) return;
    await handleMoveStatus(taskId, targetColumn);
  };

  const handleCardClick = (task: UserAssignedWorkType) => {
    if (onOpenTaskDetails) {
      onOpenTaskDetails(task);
    } else {
      setSelectedUserTask(task);
      if (currentUser?.role === 'manager') {
        setManagerNav('my-work');
      } else {
        setUserNav('my-work');
      }
    }
  };

  const getPriorityBadge = (priority: string) => {
    if (priority === 'High') {
      return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-600 border border-rose-200">High</span>;
    }
    if (priority === 'Medium') {
      return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">Medium</span>;
    }
    return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">Low</span>;
  };

  const getNextColumn = (curr: KanbanColumnId): KanbanColumnId | null => {
    if (curr === 'To Do') return 'In Progress';
    if (curr === 'In Progress') return 'Under Review';
    if (curr === 'Under Review') return 'Completed';
    return null;
  };

  const getPrevColumn = (curr: KanbanColumnId): KanbanColumnId | null => {
    if (curr === 'Completed') return 'Under Review';
    if (curr === 'Under Review') return 'In Progress';
    if (curr === 'In Progress') return 'To Do';
    return null;
  };

  return (
    <div className="space-y-6 pb-10">
      {/* Optional Top Header Bar */}
      {showHeader && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#5a36e6] to-[#7952f5] text-white flex items-center justify-center shadow-md shadow-indigo-600/30">
                <KanbanIcon className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-black text-slate-900 tracking-tight">{title}</h2>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-[#5a36e6] border border-indigo-200">
                    {filteredTasks.length} {filteredTasks.length === 1 ? 'Task' : 'Tasks'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Drag and drop or use arrow actions to progress tasks across workflow stages.
                </p>
              </div>
            </div>

            {/* Manager Scope Switcher (My Work vs Full Team) */}
            {isManager && propTasks === undefined && (
              <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold self-start md:self-auto">
                <button
                  type="button"
                  onClick={() => setManagerScope('my')}
                  className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                    managerScope === 'my'
                      ? 'bg-white text-[#5a36e6] shadow-xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  My Work ({myAssignedList.length})
                </button>
                <button
                  type="button"
                  onClick={() => setManagerScope('team')}
                  className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                    managerScope === 'team'
                      ? 'bg-white text-[#5a36e6] shadow-xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Full Team ({rawAssigned.length})
                </button>
              </div>
            )}
          </div>

          {/* Filter Controls Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 mt-4 border-t border-slate-100">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="text"
                placeholder="Search tasks, descriptions or assignees..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#5a36e6] focus:bg-white transition"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Priority Filter */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
                {(['All', 'High', 'Medium', 'Low'] as const).map(p => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriorityFilter(p)}
                    className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                      priorityFilter === p
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>

              {/* Team Filter Dropdown */}
              {availableTeams.length > 0 && (
                <select
                  value={teamFilter}
                  onChange={(e) => setTeamFilter(e.target.value)}
                  className="px-3 py-2 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-[#5a36e6]"
                >
                  <option value="All">All Teams ({baseTasks.length})</option>
                  {availableTeams.map(team => (
                    <option key={team} value={team}>{team}</option>
                  ))}
                </select>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 4-Column Responsive Kanban Board Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
        {COLUMNS.map(col => {
          const colTasks = columnsData[col.id];

          return (
            <div
              key={col.id}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, col.id)}
              className={`rounded-2xl border ${col.borderClass} ${col.accentBg} p-3 sm:p-4 flex flex-col min-h-[580px] transition-colors`}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200/60">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${col.dotColor}`} />
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
                    {col.label}
                  </h3>
                </div>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-black ${col.badgeBg} ${col.badgeText}`}>
                  {colTasks.length}
                </span>
              </div>

              {/* Card List in Column */}
              <div className="space-y-3 flex-1 overflow-y-auto max-h-[750px] pr-0.5">
                {colTasks.length === 0 ? (
                  <div className="py-12 px-4 rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-400 bg-white/40 flex flex-col items-center justify-center space-y-1">
                    <p className="font-semibold">No tasks in {col.label}</p>
                    <p className="text-[10px] text-slate-400">Drag a task card here to move it</p>
                  </div>
                ) : (
                  colTasks.map(task => {
                    const nextCol = getNextColumn(col.id);
                    const prevCol = getPrevColumn(col.id);
                    const isBusy = isUpdatingStatus === task.id;

                    return (
                      <div
                        key={task.id}
                        draggable={true}
                        onDragStart={(e) => handleDragStart(e, task.id)}
                        onClick={() => handleCardClick(task)}
                        className={`bg-white rounded-xl p-3.5 border border-slate-100 shadow-xs hover:shadow-md transition-all cursor-grab active:cursor-grabbing space-y-3 group ${
                          isBusy ? 'opacity-50 pointer-events-none' : ''
                        }`}
                      >
                        {/* Priority & Due Date Header */}
                        <div className="flex items-center justify-between gap-2">
                          {getPriorityBadge(task.priority)}
                          {task.dueDate && (
                            <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-slate-400" />
                              <span>{formatTaskDueDate(task.dueDate)}</span>
                            </span>
                          )}
                        </div>

                        {/* Title & Preview */}
                        <div>
                          <h4 className="text-xs font-black text-slate-900 group-hover:text-[#5a36e6] transition leading-snug line-clamp-2">
                            {task.title}
                          </h4>
                          {task.description && (
                            <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                              {task.description}
                            </p>
                          )}
                        </div>

                        {/* Team & Department Tag */}
                        {task.team && (
                          <div className="flex items-center gap-1 text-[10px] font-semibold text-slate-500">
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 truncate max-w-[150px]">
                              {task.team}
                            </span>
                          </div>
                        )}

                        {/* Assignee & Actions Row */}
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-1.5 min-w-0">
                            <div className="w-6 h-6 rounded-full bg-indigo-100 text-[#5a36e6] font-black text-[10px] flex items-center justify-center shrink-0">
                              {(task.assignedTo || 'U').charAt(0).toUpperCase()}
                            </div>
                            <span className="text-[11px] font-bold text-slate-700 truncate max-w-[90px]">
                              {task.assignedTo || 'Unassigned'}
                            </span>
                          </div>

                          {/* Stage Transition Control Buttons */}
                          <div className="flex items-center gap-1">
                            {prevCol && (
                              <button
                                type="button"
                                title={`Move back to ${prevCol}`}
                                onClick={() => handleMoveStatus(task.id, prevCol)}
                                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition cursor-pointer"
                              >
                                <ChevronLeft className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {nextCol && (
                              <button
                                type="button"
                                title={`Move to ${nextCol}`}
                                onClick={() => handleMoveStatus(task.id, nextCol)}
                                className="px-2 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-[#5a36e6] text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
                              >
                                <span>{nextCol}</span>
                                <ChevronRight className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
