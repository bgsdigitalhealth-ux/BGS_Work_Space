import React, { useState } from 'react';
import { 
  Image as ImageIcon, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  FileText, 
  Send, 
  Plus, 
  Download, 
  MoreHorizontal, 
  Paperclip, 
  Settings, 
  Info, 
  HelpCircle, 
  CalendarPlus,
  MessageSquare
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const UserWorkDetails: React.FC = () => {
  const { 
    selectedUserTask, 
    openSubmitWorkDrawer, 
    handleAddUserComment 
  } = useApp();

  const [activeTab, setActiveTab] = useState<'overview' | 'updates' | 'attachments' | 'activity'>('overview');
  const [isAddingComment, setIsAddingComment] = useState(false);
  const [newCommentText, setNewCommentText] = useState('');
  const [newCommentBadge, setNewCommentBadge] = useState('Update');

  // Fallback default task if none selected
  const task = selectedUserTask || {
    id: 'user-task-2',
    taskId: 'TSK-2026-0487',
    title: 'Prepare event poster for CME',
    department: 'Events',
    team: 'Design',
    priority: 'Medium',
    dueDate: '06 Nov 2026',
    status: 'In Progress',
    assignedBy: 'Priya Verma',
    assignedOn: '03 Nov 2026, 10:30 AM',
    description: 'Design an event poster for the upcoming CME on "Anaesthesia Awareness Programme" with institutional branding, date, venue and resource faculty details.',
    progress: 60,
    comments: [
      {
        id: 'c-1',
        author: 'Rahul Sharma',
        role: 'Team Member',
        date: '04 Nov 2026, 11:10 AM',
        badge: 'Work Started',
        text: 'Started working on the poster. Concept and layout are under progress.'
      },
      {
        id: 'c-2',
        author: 'Rahul Sharma',
        role: 'Team Member',
        date: '05 Nov 2026, 04:20 PM',
        badge: 'Update',
        text: 'Draft version completed. Attached for review and feedback.'
      },
      {
        id: 'c-3',
        author: 'Priya Verma (Team Lead)',
        role: 'Team Lead',
        date: '05 Nov 2026, 05:00 PM',
        badge: 'Feedback',
        text: 'Looks good. Please add the venue and contact details, then submit the final version.'
      }
    ],
    attachments: [
      { name: 'CME_Brief.pdf', size: '1.2 MB', date: '03 Nov 2026' },
      { name: 'Branding_Assets.zip', size: '4.8 MB', date: '03 Nov 2026' }
    ]
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;
    await handleAddUserComment(task.id, newCommentText, newCommentBadge);
    setNewCommentText('');
    setIsAddingComment(false);
  };

  const comments = task.comments || [];
  const attachments = task.attachments || [
    { name: 'CME_Brief.pdf', size: '1.2 MB', date: '03 Nov 2026' },
    { name: 'Branding_Assets.zip', size: '4.8 MB', date: '03 Nov 2026' }
  ];

  const getCommentBadgeStyle = (badge?: string) => {
    if (badge === 'Work Started') return 'bg-blue-50 text-blue-600 border border-blue-200';
    if (badge === 'Update') return 'bg-purple-50 text-[#5a36e6] border border-purple-200';
    if (badge === 'Feedback') return 'bg-amber-50 text-amber-700 border border-amber-200';
    return 'bg-gray-100 text-gray-700';
  };

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
                Department: <span className="font-semibold text-gray-800">{task.department}</span> &nbsp;|&nbsp; 
                Team: <span className="font-semibold text-gray-800">{task.team}</span> &nbsp;|&nbsp; 
                Assigned by: <span className="font-semibold text-gray-800">{task.assignedBy || 'Priya Verma'}</span>
              </p>
            </div>
          </div>

          {/* Badges on Top Right */}
          <div className="flex items-center gap-2 self-start md:self-auto">
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
            onClick={() => setActiveTab('overview')}
            className={`pb-3 relative transition ${
              activeTab === 'overview'
                ? 'text-[#5a36e6] border-b-2 border-[#5a36e6]'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Work Overview
          </button>
          <button
            onClick={() => setActiveTab('updates')}
            className={`pb-3 relative transition ${
              activeTab === 'updates'
                ? 'text-[#5a36e6] border-b-2 border-[#5a36e6]'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Work Updates ({comments.length})
          </button>
          <button
            onClick={() => setActiveTab('attachments')}
            className={`pb-3 relative transition ${
              activeTab === 'attachments'
                ? 'text-[#5a36e6] border-b-2 border-[#5a36e6]'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Attachments ({attachments.length})
          </button>
          <button
            onClick={() => setActiveTab('activity')}
            className={`pb-3 relative transition ${
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
              <p className="text-xs text-gray-600 leading-relaxed">
                {task.description || 'Design an event poster for the upcoming CME on "Anaesthesia Awareness Programme" with institutional branding, date, venue and resource faculty details.'}
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
                  <span className="font-semibold text-gray-900">{task.assignedOn || '03 Nov 2026, 10:30 AM'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Due Date</span>
                  <span className="font-semibold text-gray-900">{task.dueDate || '06 Nov 2026'}</span>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-gray-500">Time Left</span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-50 text-[#5a36e6] border border-purple-200">
                    2 Days
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Work Progress Stepper */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center gap-2 text-[#5a36e6] mb-6">
              <Clock className="w-4 h-4" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900">Work Progress</h3>
            </div>

            {/* Stepper Graphic */}
            <div className="relative mb-8">
              {/* Connector Line */}
              <div className="absolute top-4 left-6 right-6 h-0.5 bg-gray-200 -z-0" />
              <div className="absolute top-4 left-6 w-[50%] h-0.5 bg-emerald-500 -z-0" />

              <div className="flex justify-between items-start relative z-10">
                {/* Step 1: Assigned */}
                <div className="flex flex-col items-center text-center">
                  <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-xs ring-4 ring-white shadow-sm">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-gray-900 mt-2">Assigned</span>
                  <span className="text-[10px] text-gray-400 mt-0.5">03 Nov, 10:30 AM</span>
                </div>

                {/* Step 2: Work Started */}
                <div className="flex flex-col items-center text-center">
                  <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-xs ring-4 ring-white shadow-sm">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-gray-900 mt-2">Work Started</span>
                  <span className="text-[10px] text-gray-400 mt-0.5">03 Nov, 11:10 AM</span>
                </div>

                {/* Step 3: In Progress (Current) */}
                <div className="flex flex-col items-center text-center">
                  <div className="w-8 h-8 rounded-full bg-[#5a36e6] text-white flex items-center justify-center font-bold text-xs ring-4 ring-purple-100 shadow-md animate-pulse">
                    <MoreHorizontal className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-[#5a36e6] mt-2">In Progress</span>
                  <span className="text-[10px] text-purple-600 font-semibold mt-0.5">(Current)</span>
                </div>

                {/* Step 4: Submitted */}
                <div className="flex flex-col items-center text-center">
                  <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center font-bold text-xs ring-4 ring-white">
                    4
                  </div>
                  <span className="text-xs font-semibold text-gray-400 mt-2">Submitted</span>
                </div>

                {/* Step 5: Completed */}
                <div className="flex flex-col items-center text-center">
                  <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center font-bold text-xs ring-4 ring-white">
                    5
                  </div>
                  <span className="text-xs font-semibold text-gray-400 mt-2">Completed</span>
                </div>
              </div>
            </div>

            {/* Bottom Progress Bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold text-gray-600">
                <span>Overall Completion</span>
                <span className="font-bold text-gray-900">{task.progress || 60}%</span>
              </div>
              <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-emerald-500 to-[#5a36e6] h-full rounded-full transition-all duration-500"
                  style={{ width: `${task.progress || 60}%` }}
                />
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
                onClick={() => setIsAddingComment(!isAddingComment)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#5a36e6] text-[#5a36e6] hover:bg-purple-50 text-xs font-bold transition shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Comment / Update
              </button>
            </div>

            {/* Inline Comment Creation Form */}
            {isAddingComment && (
              <form onSubmit={handlePostComment} className="mb-6 p-4 rounded-xl bg-purple-50/50 border border-purple-100 space-y-3">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-gray-700">Badge Tag:</span>
                  {['Update', 'Work Started', 'Review Note'].map(b => (
                    <button
                      key={b}
                      type="button"
                      onClick={() => setNewCommentBadge(b)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
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
                    className="px-3 py-1.5 text-xs text-gray-600 font-bold hover:bg-gray-100 rounded-lg transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 text-xs bg-[#5a36e6] hover:bg-[#4828c4] text-white font-bold rounded-lg transition flex items-center gap-1.5 shadow-sm"
                  >
                    <Send className="w-3 h-3" /> Post Update
                  </button>
                </div>
              </form>
            )}

            {/* Comments Thread */}
            <div className="space-y-5">
              {comments.map((c) => {
                const isLead = c.role.includes('Lead');
                return (
                  <div key={c.id} className="flex items-start gap-3.5 group">
                    {/* Avatar */}
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 shadow-sm ${
                      isLead 
                        ? 'bg-amber-100 text-amber-700' 
                        : 'bg-purple-100 text-[#5a36e6]'
                    }`}>
                      {c.author.split(' ').map(n => n[0]).join('').slice(0, 2)}
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
                        <button className="text-gray-400 hover:text-gray-600 p-1">
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </div>

                      <p className="text-xs text-gray-700 leading-relaxed font-normal">
                        {c.text}
                      </p>
                    </div>
                  </div>
                );
              })}
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
              onClick={() => openSubmitWorkDrawer(task)}
              className="w-full py-3 rounded-xl bg-[#5a36e6] hover:bg-[#4828c4] text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow-md shadow-indigo-600/30"
            >
              <Send className="w-4 h-4" />
              Submit Work (Mark as Completed)
            </button>

            <button
              onClick={() => alert('Extension request submitted to Team Lead for review.')}
              className="w-full py-2.5 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 font-bold text-xs flex items-center justify-center gap-2 transition"
            >
              <CalendarPlus className="w-4 h-4 text-[#5a36e6]" />
              Request Extension
            </button>

            <button
              onClick={() => alert('Support query sent to Team Lead.')}
              className="w-full py-2.5 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 font-bold text-xs flex items-center justify-center gap-2 transition"
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
                <span className="font-bold text-gray-900">{task.taskId || 'TSK-2026-0487'}</span>
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
                <span className="font-semibold text-gray-800">{task.assignedOn || '03 Nov 2026, 10:30 AM'}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-400 font-medium">Due Date</span>
                <span className="font-semibold text-gray-800">{task.dueDate}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-400 font-medium">Assigned By</span>
                <span className="font-semibold text-gray-800">{task.assignedBy || 'Priya Verma'}</span>
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
              {attachments.map((file, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-gray-50 transition">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-red-100 text-red-600 flex items-center justify-center font-bold text-[10px]">
                      {file.name.endsWith('.pdf') ? 'PDF' : 'ZIP'}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-900 line-clamp-1">{file.name}</p>
                      <p className="text-[10px] text-gray-400 font-medium">{file.size} | {file.date}</p>
                    </div>
                  </div>

                  <button 
                    onClick={() => alert(`Downloading attachment: ${file.name}`)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-[#5a36e6] hover:bg-white transition"
                    title="Download Attachment"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
