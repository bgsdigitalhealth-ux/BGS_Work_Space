import React, { useState } from 'react';
import {
  ClipboardCheck,
  CheckCircle2,
  RotateCcw,
  Search,
  Send,
  FileText,
  User
} from 'lucide-react';
import { useApp, formatTaskDueDate } from '../../context/AppContext';
import { UserAssignedWork } from '../../types';

export const ManagerReviewWork: React.FC = () => {
  const {
    userWorkspace,
    handleApproveWork,
    handleRequestRework,
    notify,
    refreshUserWorkspace
  } = useApp();

  const [activeTab, setActiveTab] = useState<'pending' | 'reviewed'>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTask, setSelectedTask] = useState<UserAssignedWork | null>(null);
  const [reviewComment, setReviewComment] = useState('');
  const [reworkFeedback, setReworkFeedback] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showReworkModal, setShowReworkModal] = useState(false);

  const allAssigned = userWorkspace?.assignedWork || [];
  const pendingSubmissions = allAssigned.filter(
    t => t.status === 'Under Review' || (t.status as any) === 'In Review'
  );
  const reviewedSubmissions = allAssigned.filter(
    t => t.status === 'Completed' || (t.status as any) === 'Rework Requested'
  );

  const currentList = activeTab === 'pending' ? pendingSubmissions : reviewedSubmissions;

  const filteredList = currentList.filter(t => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = (t.title || '').toLowerCase().includes(q);
      const matchAssignee = ((t as any).assigneeName || t.assignedTo || '').toLowerCase().includes(q);
      return matchTitle || matchAssignee;
    }
    return true;
  });

  const activeTask = selectedTask || (filteredList.length > 0 ? filteredList[0] : null);

  const onApprove = async () => {
    if (!activeTask) return;
    setIsProcessing(true);
    try {
      await handleApproveWork(activeTask.id, reviewComment.trim() || 'Approved by Manager');
      notify(`Task "${activeTask.title}" approved successfully as Completed!`, 'success');
      setReviewComment('');
      setSelectedTask(null);
      await refreshUserWorkspace();
    } catch (e: any) {
      notify(e.message || 'Failed to approve task.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const onRequestRework = async () => {
    if (!activeTask) return;
    if (!reworkFeedback.trim()) {
      notify('Please provide feedback comments describing the needed revisions.', 'error');
      return;
    }
    setIsProcessing(true);
    try {
      await handleRequestRework(activeTask.id, reworkFeedback.trim());
      notify(`Rework requested for "${activeTask.title}". Submitter notified!`, 'info');
      setReworkFeedback('');
      setShowReworkModal(false);
      setSelectedTask(null);
      await refreshUserWorkspace();
    } catch (e: any) {
      notify(e.message || 'Failed to request rework.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold shadow-xs">
            <ClipboardCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Review Submitted Work
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Inspect deliverable summaries, approve completed tasks, or request revision corrections with feedback.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Tabs */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setActiveTab('pending');
                setSelectedTask(null);
              }}
              className={`px-3.5 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-2 ${activeTab === 'pending' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                }`}
            >
              <span>Pending Review</span>
              {pendingSubmissions.length > 0 && (
                <span className="w-5 h-5 rounded-full bg-amber-500 text-white text-[10px] font-extrabold flex items-center justify-center">
                  {pendingSubmissions.length}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('reviewed');
                setSelectedTask(null);
              }}
              className={`px-3.5 py-1.5 rounded-lg transition cursor-pointer ${activeTab === 'reviewed' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                }`}
            >
              <span>Reviewed & Approved</span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              placeholder="Search submissions..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5a36e6] w-48"
            />
          </div>
        </div>
      </div>

      {/* Main Grid: Submissions List (Left 6 cols) & Detailed Review Inspector (Right 6 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left List */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-100 shadow-xs p-5 space-y-3">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider text-[11px] text-slate-400 pb-2 border-b border-slate-100">
            {activeTab === 'pending' ? `Pending Submissions (${filteredList.length})` : `Reviewed Tasks (${filteredList.length})`}
          </h2>

          {filteredList.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-slate-300" />
              <p className="text-sm font-bold text-slate-600">All caught up!</p>
              <p className="text-xs text-slate-400 mt-1">No tasks currently waiting for review.</p>
            </div>
          ) : (
            filteredList.map(task => {
              const isSelected = activeTask?.id === task.id;
              const assigneeName = (task as any).assigneeName || task.assignedTo || 'Team Member';

              return (
                <div
                  key={task.id}
                  onClick={() => setSelectedTask(task)}
                  className={`p-4 rounded-xl border transition cursor-pointer select-none space-y-2 ${isSelected
                    ? 'border-[#5a36e6] bg-indigo-50/40 shadow-xs'
                    : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50/60'
                    }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                      {task.department || 'General'}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">
                      Due: {formatTaskDueDate(task.dueDate)}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 line-clamp-1">{task.title}</h3>
                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {task.description || 'No description provided.'}
                  </p>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                    <div className="flex items-center gap-2 text-slate-600 font-semibold">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>{assigneeName}</span>
                    </div>

                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${task.status === 'Completed'
                      ? 'bg-emerald-50 text-emerald-700'
                      : (task.status === 'Under Review' ? 'bg-amber-50 text-amber-700 animate-pulse' : 'bg-slate-100 text-slate-700')
                      }`}>
                      {task.status}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Inspector */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-100 shadow-xs p-6 space-y-5">
          {activeTask ? (
            <>
              <div className="pb-4 border-b border-slate-100 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                    Status: {activeTask.status}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    Priority: <strong>{activeTask.priority}</strong>
                  </span>
                </div>
                <h2 className="text-xl font-black text-slate-900 leading-snug">{activeTask.title}</h2>
                <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
                  <span>Assignee: <strong>{(activeTask as any).assigneeName || activeTask.assignedTo}</strong></span>
                  <span>Team: <strong>{activeTask.team}</strong></span>
                  <span>Due: <strong>{formatTaskDueDate(activeTask.dueDate)}</strong></span>
                </div>
              </div>

              {/* Task Description */}
              <div className="space-y-1.5">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Work Instructions</h4>
                <p className="text-xs text-slate-700 bg-slate-50 p-3.5 rounded-xl border border-slate-100 leading-relaxed whitespace-pre-wrap">
                  {activeTask.description || 'No detailed instructions provided.'}
                </p>
              </div>

              {/* Submitter Deliverable Comments */}
              <div className="space-y-1.5">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Deliverable Submission Log</h4>
                {activeTask.comments && activeTask.comments.length > 0 ? (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {activeTask.comments.map(c => (
                      <div key={c.id} className="p-3 bg-purple-50/50 rounded-xl border border-purple-100 text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-purple-900">{c.author}</span>
                          <span className="text-[10px] text-slate-400">{c.date}</span>
                        </div>
                        <p className="text-slate-700">{c.text}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 p-3 bg-slate-50 rounded-xl border border-slate-100">
                    No submitter comments recorded for this deliverable.
                  </p>
                )}
              </div>

              {/* Approval or Rework Actions (Only for pending tasks) */}
              {activeTask.status === 'Under Review' || (activeTask as any).status === 'In Review' ? (
                <div className="pt-4 border-t border-slate-100 space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Manager Approval Note (Optional):</label>
                    <input
                      type="text"
                      placeholder="e.g. Excellent work, deliverable meets requirements."
                      value={reviewComment}
                      onChange={e => setReviewComment(e.target.value)}
                      className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="flex items-center gap-3 pt-1">
                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={onApprove}
                      className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{isProcessing ? 'Processing...' : 'Approve Work (Complete)'}</span>
                    </button>

                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={() => setShowReworkModal(true)}
                      className="px-4 py-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 font-bold text-xs transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>Request Rework</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-500 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>This task has already been reviewed and finalized as <strong>{activeTask.status}</strong>.</span>
                </div>
              )}
            </>
          ) : (
            <div className="py-20 text-center text-slate-400">
              <FileText className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p className="text-sm font-bold text-slate-600">No task selected</p>
              <p className="text-xs text-slate-400 mt-1">Select a submission from the list to review deliverables.</p>
            </div>
          )}
        </div>
      </div>

      {/* Rework Feedback Modal */}
      {showReworkModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center gap-3 text-amber-600">
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Request Work Revision</h3>
                <p className="text-xs text-slate-500">Provide actionable feedback to the submitter</p>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Specific Feedback & Required Corrections:</label>
              <textarea
                rows={4}
                placeholder="Explain clearly what changes or additions are required before approval..."
                value={reworkFeedback}
                onChange={e => setReworkFeedback(e.target.value)}
                className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowReworkModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isProcessing}
                onClick={onRequestRework}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isProcessing ? 'Sending...' : 'Send Revision Request'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
