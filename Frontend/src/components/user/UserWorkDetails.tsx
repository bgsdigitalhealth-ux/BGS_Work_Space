import React, { useState, useEffect } from 'react';
import {
  Image as ImageIcon,
  Calendar,
  FileText,
  Send,
  Plus,
  Download,
  MoreHorizontal,
  Paperclip,
  Info,
  MessageSquare,
  Check,
  ClipboardCheck,
  Edit3,
  CheckCircle2
} from 'lucide-react';
import { useApp, formatTaskDueDate } from '../../context/AppContext';
import { UserAssignedWork } from '../../types';
import { EditTaskModal } from './EditTaskModal';

interface UserWorkDetailsProps {
  onBack?: () => void;
  taskOverride?: UserAssignedWork;
}

export const UserWorkDetails: React.FC<UserWorkDetailsProps> = ({ onBack, taskOverride }) => {
  const {
    selectedUserTask,
    setUserNav,
    handleAddUserComment,
    handleEditAssignment
  } = useApp();

  const [activeTab, setActiveTab] = useState<'overview' | 'updates' | 'attachments' | 'activity'>('overview');
  const [isAddingComment, setIsAddingComment] = useState(false);
  const [newCommentText, setNewCommentText] = useState('');
  const [newCommentBadge, setNewCommentBadge] = useState('Update');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isUpdatingProgress, setIsUpdatingProgress] = useState(false);

  const task = taskOverride || selectedUserTask;

  const initialProgress = task?.progress !== undefined 
    ? Number(task.progress) 
    : (task?.status === 'Completed' || task?.status === 'Under Review' ? 100 : (task?.status === 'Not Started' || (task?.status as any) === 'To Do' ? 0 : 60));
  const [progressValue, setProgressValue] = useState<number>(initialProgress);

  useEffect(() => {
    if (task) {
      const val = task.progress !== undefined 
        ? Number(task.progress) 
        : (task.status === 'Completed' || task.status === 'Under Review' ? 100 : (task.status === 'Not Started' || (task.status as any) === 'To Do' ? 0 : 60));
      setProgressValue(val);
    }
  }, [task?.progress, task?.status]);

  const handleQuickProgressUpdate = async (newPct: number) => {
    if (!task) return;
    setIsUpdatingProgress(true);
    try {
      let newStatus: 'Not Started' | 'In Progress' | 'Under Review' | 'Completed' = task.status;
      if (newPct === 100) newStatus = 'Completed';
      else if (newPct === 0) newStatus = 'Not Started';
      else if (task.status === 'Completed' || task.status === 'Not Started' || (task.status as any) === 'To Do') {
        newStatus = 'In Progress';
      }
      await handleEditAssignment(task.id, {
        progress: newPct,
        status: newStatus
      });
    } catch (e) {
      console.error('Failed to update progress:', e);
    } finally {
      setIsUpdatingProgress(false);
    }
  };

  if (!task) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center max-w-lg mx-auto mt-12">
        <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-[#5a36e6] flex items-center justify-center mx-auto mb-4">
          <FileText className="w-8 h-8" />
        </div>
        <h3 className="text-base font-bold text-gray-900 mb-2">No Work Item Selected</h3>
        <p className="text-xs text-gray-500 mb-6 font-medium leading-relaxed">
          Please select a task from your dashboard or assigned work list to view its progression, submission history, and team feedback.
        </p>
        <button
          onClick={onBack || (() => setUserNav('dashboard'))}
          className="bg-[#5a36e6] hover:bg-[#4d2ec4] text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-md transition cursor-pointer"
        >
          Go Back
        </button>
      </div>
    );
  }

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;
    await handleAddUserComment(task.id, newCommentText, newCommentBadge);
    setNewCommentText('');
    setIsAddingComment(false);
  };

  const comments = task.comments && task.comments.length > 0 ? task.comments : [];

  const attachments = task.attachments && task.attachments.length > 0 ? task.attachments : [];

  const getCommentBadgeStyle = (badge?: string) => {
    if (badge === 'Work Started') return 'bg-blue-50 text-blue-600 border border-blue-200';
    if (badge === 'Update') return 'bg-purple-50 text-[#5a36e6] border border-purple-200';
    if (badge === 'Feedback') return 'bg-amber-50 text-amber-700 border border-amber-200';
    return 'bg-gray-100 text-gray-700 border border-gray-200';
  };

  const isCompleted = task.status === 'Completed';
  const isSubmitted = task.status === 'Under Review';
  const isToDo = task.status === 'Not Started' || (task.status as any) === 'To Do';
  const isInProgress = task.status === 'In Progress' || (!isCompleted && !isSubmitted && !isToDo);
  const progressPercent = isCompleted || isSubmitted ? 100 : (progressValue !== undefined ? progressValue : (task.progress !== undefined ? task.progress : (isInProgress ? 60 : 0)));

  // Dynamic real date tracking helpers
  const formatDateTime = (val?: string | Date) => {
    if (!val) return '';
    try {
      const d = new Date(val);
      if (!isNaN(d.getTime())) {
        const dateStr = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
        const timeStr = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        return `${dateStr}, ${timeStr}`;
      }
    } catch (_) {}
    return String(val);
  };

  const calculateDynamicTimeLeft = (dueDateStr?: string, status?: string) => {
    if (status === 'Completed') return 'Completed';
    if (!dueDateStr) return 'Scheduled';
    try {
      if (dueDateStr.toLowerCase() === 'today') return 'Due Today';
      if (dueDateStr.toLowerCase() === 'tomorrow') return '1 Day Left';
      let due: Date | null = null;
      if (dueDateStr.includes('-')) {
        const parts = dueDateStr.split('-');
        if (parts[0].length === 4) {
          due = new Date(dueDateStr);
        } else {
          due = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
        }
      } else {
        due = new Date(dueDateStr);
      }
      if (due && !isNaN(due.getTime())) {
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        due.setHours(0, 0, 0, 0);
        const diffMs = due.getTime() - now.getTime();
        const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
        if (diffDays < 0) return `Overdue by ${Math.abs(diffDays)} ${Math.abs(diffDays) === 1 ? 'Day' : 'Days'}`;
        if (diffDays === 0) return 'Due Today';
        if (diffDays === 1) return '1 Day Left';
        return `${diffDays} Days Left`;
      }
    } catch (_) {}
    return 'Scheduled';
  };

  const assignedDateLabel = (task as any).assignedTime && task.assignedOn
    ? `${task.assignedOn}, ${(task as any).assignedTime}`
    : (task.createdAt ? formatDateTime(task.createdAt) : (task.assignedOn ? formatTaskDueDate(task.assignedOn) : 'Assigned'));

  const getStartedTime = () => {
    if ((task as any).workStartedDate) return (task as any).workStartedDate;
    if ((task as any).workStartedTime && task.assignedOn) return `${formatTaskDueDate(task.assignedOn)}, ${(task as any).workStartedTime}`;
    if ((task as any).workStartedAt) return formatDateTime((task as any).workStartedAt);
    const act = ((task as any).activityLog || []).find((a: any) => a.type === 'started');
    if (act && act.timestamp) return formatDateTime(act.timestamp);
    if ((task as any).timerState?.activeSessionStart) return formatDateTime((task as any).timerState.activeSessionStart);
    if (isToDo) return 'Pending Start';
    return 'In Progress';
  };
  const startedDateLabel = getStartedTime();

  const getSubmittedTime = () => {
    if ((task as any).submittedDate) return (task as any).submittedDate;
    if ((task as any).submittedAt) return formatDateTime((task as any).submittedAt);
    const subComment = (task.comments || []).find(c => c.badge === 'Submission' || (c.text && c.text.toLowerCase().includes('submitted')));
    if (subComment && subComment.date) return subComment.date;
    const act = ((task as any).activityLog || []).find((a: any) => a.type === 'deliverable_submitted');
    if (act && act.timestamp) return formatDateTime(act.timestamp);
    if (isSubmitted || isCompleted) {
      if ((task as any).completedDate) return (task as any).completedDate;
      if ((task as any).completedAt) return formatDateTime((task as any).completedAt);
    }
    return isSubmitted ? 'Submitted' : '—';
  };
  const submittedDateLabel = getSubmittedTime();

  const getCompletedTime = () => {
    if ((task as any).completedDate) return (task as any).completedDate;
    if ((task as any).completedAt) return formatDateTime((task as any).completedAt);
    const act = ((task as any).activityLog || []).find((a: any) => a.type === 'finished' || a.type === 'completed');
    if (act && act.timestamp) return formatDateTime(act.timestamp);
    return isCompleted ? 'Completed' : '—';
  };
  const completedDateLabel = getCompletedTime();

  const timeLeftLabel = (task as any).timeLeft || calculateDynamicTimeLeft(task.dueDate, task.status);

  return (
    <div className="space-y-6 pb-12">
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
                Department: <span className="font-semibold text-gray-800">{task.department || 'Hospital Workspace'}</span> &nbsp;|&nbsp;
                Team: <span className="font-semibold text-gray-800">{task.team || 'General'}</span> &nbsp;|&nbsp;
                Assigned by: <span className="font-semibold text-gray-800">{task.assignedBy || 'Administrator'}</span>
              </p>
            </div>
          </div>

          {/* Badges on Top Right */}
          <div className="flex items-center gap-2 self-start md:self-auto flex-wrap">
            {task.assignmentType && (
              <span className={`px-3.5 py-1 rounded-full text-xs font-bold ${
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
            <span className="px-3.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-600 border border-amber-200">
              {task.priority || 'Medium'} Priority
            </span>
            <span className="flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-600 border border-blue-200">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              {task.status || 'In Progress'}
            </span>
            <button
              type="button"
              onClick={() => setIsEditModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold bg-[#5a36e6] hover:bg-[#4828c4] text-white transition shadow-sm cursor-pointer ml-auto"
              title="Edit Work (Full Editable)"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Work</span>
            </button>
          </div>
        </div>

        {/* Sub Navigation Tabs */}
        <div className="flex items-center gap-8 pt-4 overflow-x-auto text-xs font-bold no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`pb-3 relative transition cursor-pointer whitespace-nowrap ${activeTab === 'overview'
              ? 'text-[#5a36e6] border-b-2 border-[#5a36e6]'
              : 'text-gray-500 hover:text-gray-900'
              }`}
          >
            Work Overview
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('updates')}
            className={`pb-3 relative transition cursor-pointer whitespace-nowrap ${activeTab === 'updates'
              ? 'text-[#5a36e6] border-b-2 border-[#5a36e6]'
              : 'text-gray-500 hover:text-gray-900'
              }`}
          >
            Work Updates ({comments.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('attachments')}
            className={`pb-3 relative transition cursor-pointer whitespace-nowrap ${activeTab === 'attachments'
              ? 'text-[#5a36e6] border-b-2 border-[#5a36e6]'
              : 'text-gray-500 hover:text-gray-900'
              }`}
          >
            Attachments ({attachments.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('activity')}
            className={`pb-3 relative transition cursor-pointer whitespace-nowrap ${activeTab === 'activity'
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
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 relative group">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-[#5a36e6]">
                  <FileText className="w-4 h-4" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900">Work Description</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(true)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-[#5a36e6] hover:bg-purple-50 transition cursor-pointer"
                  title="Edit Description"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed font-normal">
                {task.description || 'No specific description provided for this work assignment.'}
              </p>
            </div>

            {/* Timeline Card */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 relative group">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-[#5a36e6]">
                  <Calendar className="w-4 h-4" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900">Timeline</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(true)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-[#5a36e6] hover:bg-purple-50 transition cursor-pointer"
                  title="Edit Due Date / Timeline"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Assigned On</span>
                  <span className="font-semibold text-gray-900">: {assignedDateLabel}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Due Date</span>
                  <span className="font-semibold text-gray-900">: {formatTaskDueDate(task.dueDate) || 'Scheduled'}</span>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-gray-500">Time Left</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                    timeLeftLabel.includes('Overdue') ? 'bg-rose-50 text-rose-600 border-rose-200' :
                    timeLeftLabel === 'Completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                    'bg-purple-50 text-[#5a36e6] border-purple-200'
                  }`}>
                    : {timeLeftLabel}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Work Progress Horizontal Stepper Card - Matching Image 1 */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-6">
              <ClipboardCheck className="w-4 h-4 text-[#5a36e6]" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900">Work Progress</h3>
            </div>

            {/* Stepper Milestones Row */}
            <div className="relative flex items-center justify-between mb-8 px-2 sm:px-6">
              {/* Step 1: Assigned */}
              <div className="flex flex-col items-center text-center relative z-10">
                <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold shadow-xs">
                  <Check className="w-4 h-4 stroke-[3]" />
                </div>
                <span className="text-xs font-bold text-gray-900 mt-2">Assigned</span>
                <span className="text-[11px] text-gray-500 font-medium">{assignedDateLabel}</span>
              </div>

              {/* Connector 1-2 */}
              <div className={`flex-1 h-0.5 mx-2 -mt-7 ${!isToDo ? 'bg-emerald-500' : 'bg-gray-200'}`} />

              {/* Step 2: Work Started */}
              <div className="flex flex-col items-center text-center relative z-10">
                {!isToDo ? (
                  <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold shadow-xs">
                    <Check className="w-4 h-4 stroke-[3]" />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-full border-2 border-gray-300 bg-white text-gray-300 flex items-center justify-center font-bold">
                    <span className="w-2 h-2 rounded-full bg-gray-200" />
                  </div>
                )}
                <span className="text-xs font-bold text-gray-900 mt-2">Work Started</span>
                <span className="text-[11px] text-gray-500 font-medium">{startedDateLabel}</span>
              </div>

              {/* Connector 2-3 */}
              <div className={`flex-1 h-0.5 mx-2 -mt-7 ${isSubmitted || isCompleted ? 'bg-emerald-500' : isInProgress ? 'bg-[#5a36e6]' : 'bg-gray-200'}`} />

              {/* Step 3: In Progress (Current) */}
              <div className="flex flex-col items-center text-center relative z-10">
                {isSubmitted || isCompleted ? (
                  <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold shadow-xs">
                    <Check className="w-4 h-4 stroke-[3]" />
                  </div>
                ) : isInProgress ? (
                  <div className="w-8 h-8 rounded-full bg-[#5a36e6] text-white flex items-center justify-center font-bold shadow-xs ring-4 ring-purple-100">
                    <span className="tracking-tighter font-black text-sm leading-none pb-1">•••</span>
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-full border-2 border-gray-300 bg-white text-gray-300 flex items-center justify-center font-bold">
                    <span className="w-2 h-2 rounded-full bg-gray-200" />
                  </div>
                )}
                <span className={`text-xs font-bold mt-2 ${isSubmitted || isCompleted ? 'text-gray-900' : isInProgress ? 'text-[#5a36e6]' : 'text-gray-400'}`}>
                  In Progress
                </span>
                <span className="text-[11px] text-gray-500 font-medium">
                  {isCompleted ? 'Done' : isSubmitted ? 'Under Review' : isInProgress ? '(Current)' : 'Upcoming'}
                </span>
              </div>

              {/* Connector 3-4 */}
              <div className={`flex-1 h-0.5 mx-2 -mt-7 ${isSubmitted || isCompleted ? 'bg-emerald-500' : 'bg-gray-200'}`} />

              {/* Step 4: Submitted */}
              <div className="flex flex-col items-center text-center relative z-10">
                {isSubmitted || isCompleted ? (
                  <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold shadow-xs">
                    <Check className="w-4 h-4 stroke-[3]" />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-full border-2 border-gray-300 bg-white text-gray-300 flex items-center justify-center font-bold">
                    <span className="w-2 h-2 rounded-full bg-gray-200" />
                  </div>
                )}
                <span className={`text-xs font-semibold mt-2 ${isSubmitted || isCompleted ? 'text-gray-900 font-bold' : 'text-gray-400'}`}>
                  Submitted
                </span>
                <span className="text-[11px] text-gray-500 font-medium">{submittedDateLabel}</span>
              </div>

              {/* Connector 4-5 */}
              <div className={`flex-1 h-0.5 mx-2 -mt-7 ${isCompleted ? 'bg-emerald-500' : 'bg-gray-200'}`} />

              {/* Step 5: Completed */}
              <div className="flex flex-col items-center text-center relative z-10">
                {isCompleted ? (
                  <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold shadow-xs">
                    <Check className="w-4 h-4 stroke-[3]" />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-full border-2 border-gray-300 bg-white text-gray-300 flex items-center justify-center font-bold">
                    <span className="w-2 h-2 rounded-full bg-gray-200" />
                  </div>
                )}
                <span className={`text-xs font-semibold mt-2 ${isCompleted ? 'text-emerald-600 font-bold' : 'text-gray-400'}`}>
                  Completed
                </span>
                <span className="text-[11px] text-gray-500 font-medium">{completedDateLabel}</span>
              </div>
            </div>

            {/* Progress Bar with Percentage Tag */}
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-gray-100 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <span className="text-xs font-black text-gray-900 shrink-0">{progressPercent}%</span>
            </div>

            {/* Quick Interactive Progress Controls (User Update Progress) */}
            <div className="mt-5 pt-4 border-t border-gray-100 space-y-3">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Update Work Progress</span>
                  {isUpdatingProgress && <span className="text-[11px] text-[#5a36e6] font-medium animate-pulse">(Saving...)</span>}
                </span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {[0, 25, 50, 75, 100].map(val => (
                    <button
                      key={val}
                      type="button"
                      disabled={isUpdatingProgress}
                      onClick={async () => {
                        setProgressValue(val);
                        await handleQuickProgressUpdate(val);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition cursor-pointer ${
                        progressValue === val
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      {val}% {val === 100 ? 'Done' : ''}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(true)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold text-[#5a36e6] bg-purple-50 hover:bg-purple-100 border border-purple-200 transition cursor-pointer"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>Full Edit</span>
                  </button>
                </div>
              </div>

              {/* Slider for smooth percentage adjustment */}
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={progressValue}
                  disabled={isUpdatingProgress}
                  onChange={(e) => setProgressValue(Number(e.target.value))}
                  onMouseUp={() => handleQuickProgressUpdate(progressValue)}
                  onTouchEnd={() => handleQuickProgressUpdate(progressValue)}
                  className="flex-1 accent-emerald-600 cursor-pointer h-2 bg-gray-200 rounded-lg"
                />
                <span className="text-xs font-black text-gray-800 w-10 text-right">{progressValue}%</span>
              </div>
            </div>
          </div>

          {/* Work Updates / Comments (Dynamic) - Matching Image 1 */}
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
                <span>+ Add Comment / Update</span>
              </button>
            </div>

            {/* Inline Comment Creation Form */}
            {isAddingComment && (
              <form onSubmit={handlePostComment} className="mb-6 p-4 rounded-xl bg-purple-50/50 border border-purple-100 space-y-3">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-xs font-bold text-gray-700">Badge Tag:</span>
                  {['Update', 'Work Started', 'Feedback'].map(b => (
                    <button
                      key={b}
                      type="button"
                      onClick={() => setNewCommentBadge(b)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${newCommentBadge === b
                        ? 'bg-[#5a36e6] text-white shadow-2xs'
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
                <div className="p-6 rounded-2xl bg-gray-50/70 border border-dashed border-gray-200 text-center text-xs text-gray-400">
                  No activity updates posted yet.
                </div>
              ) : (
                comments.map((c) => {
                const isLead = c.role && c.role.includes('Lead');
                return (
                  <div key={c.id} className="flex items-start gap-3.5 group">
                    {/* Avatar */}
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 shadow-sm ${isLead
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-purple-100 text-[#5a36e6]'
                      }`}>
                      {c.author.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                    </div>

                    {/* Content */}
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
                        <button className="text-gray-400 hover:text-gray-600 p-1 cursor-pointer">
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </div>

                      <p className="text-xs text-gray-700 leading-relaxed font-normal">
                        {c.text}
                      </p>
                    </div>
                  </div>
                );
              }))}
            </div>
          </div>
        </div>

        {/* Right Column: Task Information & Attachments (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Task Information Card */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
            <div className="flex items-center gap-2 text-gray-900 mb-2 font-bold text-xs uppercase tracking-wider">
              <Info className="w-4 h-4 text-[#5a36e6]" />
              <span>Task Information</span>
            </div>

            <div className="divide-y divide-gray-100 text-xs">
              <div className="flex justify-between py-2">
                <span className="text-gray-400 font-medium">Task ID</span>
                <span className="font-bold text-gray-900 font-mono">: {task.taskId || task.id}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-400 font-medium">Priority</span>
                <span className="font-bold text-amber-600">: {task.priority || 'Medium'}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-400 font-medium">Status</span>
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                  task.status === 'Completed' ? 'bg-emerald-50 text-emerald-700' :
                  task.status === 'Under Review' ? 'bg-amber-50 text-amber-700' :
                  'bg-blue-50 text-blue-600'
                }`}>
                  : ● {task.status || 'In Progress'}
                </span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-400 font-medium">Assigned On</span>
                <span className="font-semibold text-gray-800">: {assignedDateLabel}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-400 font-medium">Due Date</span>
                <span className="font-semibold text-gray-800">: {formatTaskDueDate(task.dueDate) || 'Scheduled'}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-400 font-medium">Assigned By</span>
                <span className="font-semibold text-gray-800">: {task.assignedBy || 'Manager'}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-400 font-medium">Department</span>
                <span className="font-semibold text-gray-800">: {task.department || 'Hospital Workspace'}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-400 font-medium">Team</span>
                <span className="font-semibold text-gray-800">: {task.team || 'General'}</span>
              </div>
            </div>
          </div>

          {/* Attachments Card - Image 1 */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
            <div className="flex items-center gap-2 text-gray-900 mb-2 font-bold text-xs uppercase tracking-wider">
              <Paperclip className="w-4 h-4 text-[#5a36e6]" />
              <span>Attachments ({attachments.length})</span>
            </div>

            <div className="space-y-2.5">
              {attachments.length === 0 ? (
                <div className="p-4 rounded-xl bg-gray-50/70 border border-dashed border-gray-200 text-center text-xs text-gray-400">
                  No files attached to this task.
                </div>
              ) : (
                attachments.map((file, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-gray-50 transition">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                      file.name.endsWith('.pdf') ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-purple-50 text-[#5a36e6] border border-purple-200'
                    }`}>
                      {file.name.endsWith('.pdf') ? <FileText className="w-4 h-4" /> : <ImageIcon className="w-4 h-4" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-gray-800 truncate">{file.name}</p>
                      <p className="text-[11px] text-gray-400">{file.size || `Attachment | ${assignedDateLabel}`}</p>
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
              )))}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Task Modal (Full Editable) */}
      <EditTaskModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        task={task}
      />
    </div>
  );
};
