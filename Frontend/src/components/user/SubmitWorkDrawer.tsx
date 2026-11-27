import React, { useState, useEffect } from 'react';
import {
  X,
  Upload,
  Send,
  FileText,
  AlertCircle,
  Building2,
  Users,
  Calendar,
  Clock
} from 'lucide-react';
import { useApp, isTaskAssignedToUser, formatTaskDueDate } from '../../context/AppContext';

export const SubmitWorkDrawer: React.FC = () => {
  const {
    isSubmitWorkDrawerOpen,
    setIsSubmitWorkDrawerOpen,
    drawerSelectedTask,
    openSubmitWorkDrawer,
    userWorkspace,
    selectedUserTask,
    handleSubmitWork,
    currentUser,
    members,
    notify
  } = useApp();

  const myMember = (members || []).find(m =>
    (currentUser?.id && (m.id === currentUser.id || (m as any).userId === currentUser.id)) ||
    (currentUser?.email && m.email && m.email.toLowerCase() === currentUser.email.toLowerCase())
  );

  const assignedTasks = (userWorkspace?.assignedWork || []).filter(t => isTaskAssignedToUser(t, currentUser, myMember));
  const [selectedTaskId, setSelectedTaskId] = useState<string>('');
  const [workStatus, setWorkStatus] = useState<'Completed' | 'Under Review' | 'In Progress'>('Completed');
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [files, setFiles] = useState<File[]>([]);

  // Synchronize selected task whenever the drawer opens or drawerSelectedTask changes
  useEffect(() => {
    if (isSubmitWorkDrawerOpen) {
      const task = drawerSelectedTask || selectedUserTask || (assignedTasks.length > 0 ? assignedTasks[0] : null);
      if (task) {
        setSelectedTaskId(task.id);
      }
      setWorkStatus('Completed');
      setComment('');
      setFiles([]);
    }
  }, [isSubmitWorkDrawerOpen, drawerSelectedTask, selectedUserTask]);

  if (!isSubmitWorkDrawerOpen) return null;

  const currentTask = assignedTasks.find(t => t.id === selectedTaskId) || drawerSelectedTask || selectedUserTask;

  const handleTaskChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const chosenId = e.target.value;
    setSelectedTaskId(chosenId);
    const chosen = assignedTasks.find(t => t.id === chosenId);
    if (chosen) {
      openSubmitWorkDrawer(chosen);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTaskId && !currentTask) {
      notify('Please select a task to submit work for.', 'error', 'Missing Task');
      return;
    }
    const finalTaskId = selectedTaskId || (currentTask && currentTask.id) || '';
    if (!comment.trim()) {
      notify('Please enter a brief summary of the work done.', 'error', 'Missing Summary');
      return;
    }

    try {
      setIsSubmitting(true);
      await handleSubmitWork({
        taskId: finalTaskId,
        workStatus,
        comment: comment.trim()
      });
      setIsSubmitWorkDrawerOpen(false);
      notify('Work submitted successfully! Task status updated and recorded for review.', 'success', 'Work Submitted');
    } catch (err: any) {
      console.error('Submit work error:', err);
      notify(err.message || 'Failed to submit work. Please try again.', 'error', 'Submission Failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={() => setIsSubmitWorkDrawerOpen(false)}
      />

      {/* Slide-over panel */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-0 sm:pl-10">
        <div className="w-screen max-w-full sm:max-w-lg bg-white shadow-2xl flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-300 border-l border-gray-100 pb-safe">
          {/* Header */}
          <div className="p-4 sm:p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-sm z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-[#5a36e6] flex items-center justify-center shadow-xs shrink-0">
                <Upload className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h2 className="text-base font-bold text-gray-900 leading-tight truncate">Submit Work Deliverables</h2>
                <p className="text-xs text-gray-500 font-medium truncate">Record deliverables, update task progress, and submit for review</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsSubmitWorkDrawerOpen(false)}
              className="touch-target p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition cursor-pointer shrink-0"
              aria-label="Close submit work drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form Content */}
          <form onSubmit={onSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-5 flex-1">
            {/* Task Selector (if multiple assigned tasks exist) */}
            {assignedTasks.length > 1 && (
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Select Work Assignment <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedTaskId}
                  onChange={handleTaskChange}
                  className="w-full bg-gray-50 border border-gray-200 text-xs font-semibold rounded-xl px-3.5 py-2.5 text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#5a36e6]"
                >
                  {assignedTasks.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.title} ({t.department} - {t.team}) [{t.status}]
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Selected Task Summary Card */}
            {currentTask ? (
              <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-50/70 to-indigo-50/40 border border-purple-100/80 space-y-2.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <div className="p-2 rounded-xl bg-white text-[#5a36e6] shadow-xs shrink-0 mt-0.5">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-gray-900 leading-snug">{currentTask.title}</h4>
                      <p className="text-[11px] text-gray-500 font-medium mt-0.5">
                        Task ID: <span className="font-mono font-semibold text-gray-700">{currentTask.taskId || currentTask.id}</span>
                      </p>
                    </div>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${currentTask.priority === 'High' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                    currentTask.priority === 'Medium' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                      'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}>
                    {currentTask.priority || 'Medium'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] text-gray-600 pt-1 border-t border-purple-100/60">
                  <div className="flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-gray-400" />
                    <span className="truncate">{currentTask.department}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-gray-400" />
                    <span className="truncate">{currentTask.team}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-gray-400" />
                    <span>Assigned: {currentTask.assignedOn || 'Today'}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-gray-400" />
                    <span>Due: {formatTaskDueDate(currentTask.dueDate) || 'Scheduled'}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2 font-medium">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>No active task assigned. You can still submit general work deliverables below.</span>
              </div>
            )}

            {/* Submission Status */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Work Status to Set <span className="text-red-500">*</span>
              </label>
              <select
                value={workStatus}
                onChange={(e) => setWorkStatus(e.target.value as any)}
                className="w-full bg-gray-50 border border-gray-200 text-xs font-semibold rounded-xl px-3.5 py-2.5 text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#5a36e6]"
              >
                <option value="Completed">Completed (100% finished - ready for final verification)</option>
                <option value="Under Review">Under Review (Deliverables submitted for Manager/Lead approval)</option>
                <option value="In Progress">In Progress (Intermediate progress report)</option>
              </select>
            </div>

            {/* Work Done Description */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Work Done Description & Summary <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={4}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Detail what was completed, deliverables produced, live links, or review notes..."
                required
                className="w-full bg-gray-50 border border-gray-200 text-xs rounded-xl p-3.5 text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#5a36e6] placeholder:text-gray-400 leading-relaxed"
              />
              <p className="text-[11px] text-gray-400 mt-1">
                This note will be logged in the permanent work history and displayed in the task's dynamic updates.
              </p>
            </div>

            {/* File Upload / Attachments */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Attachments (Optional)
              </label>
              <label className="border-2 border-dashed border-gray-200 rounded-2xl p-5 text-center bg-gray-50/50 hover:bg-purple-50/30 hover:border-[#5a36e6]/40 transition cursor-pointer flex flex-col items-center justify-center">
                <input
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="w-10 h-10 rounded-full bg-indigo-50 text-[#5a36e6] flex items-center justify-center mb-2">
                  <Upload className="w-5 h-5" />
                </div>
                <p className="text-xs text-gray-700 font-medium">
                  Click to <span className="text-[#5a36e6] font-bold underline">browse files</span> or drag and drop
                </p>
                <p className="text-[10px] text-gray-400 mt-0.5">Supported: PDF, JPG, PNG, DOCX, ZIP (Max 25 MB)</p>
              </label>

              {files.length > 0 && (
                <div className="mt-2.5 space-y-1.5">
                  {files.map((f, i) => (
                    <div key={i} className="flex items-center justify-between text-xs p-2 rounded-lg bg-gray-50 border border-gray-100">
                      <span className="font-medium text-gray-800 truncate">{f.name}</span>
                      <span className="text-[11px] text-gray-400 shrink-0">{(f.size / 1024).toFixed(0)} KB</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="pt-4 border-t border-gray-100 flex items-center gap-3 pb-safe">
              <button
                type="button"
                onClick={() => setIsSubmitWorkDrawerOpen(false)}
                className="w-1/2 min-h-[44px] py-2.5 rounded-xl border border-gray-200 text-gray-700 text-xs font-bold hover:bg-gray-50 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-1/2 min-h-[44px] py-2.5 rounded-xl bg-[#5a36e6] hover:bg-[#4828c4] disabled:opacity-50 text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-md shadow-indigo-600/30 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSubmitting ? 'Submitting...' : 'Submit Work'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
