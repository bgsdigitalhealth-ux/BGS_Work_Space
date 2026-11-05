import React, { useState } from 'react';
import { 
  History, 
  Search, 
  MessageSquare, 
  Send,
  ChevronRight
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const UserWorkHistory: React.FC = () => {
  const { 
    userWorkspace, 
    selectedHistoryItem, 
    setSelectedHistoryItem,
    handleAddUserComment
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [replyText, setReplyText] = useState('');

  const historyList = userWorkspace?.history || [];

  const filteredHistory = historyList.filter(item => {
    if (statusFilter !== 'All' && item.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchId = item.taskId.toLowerCase().includes(q);
      const matchDept = item.department.toLowerCase().includes(q);
      if (!matchTitle && !matchId && !matchDept) return false;
    }
    return true;
  });

  const activeItem = selectedHistoryItem || (historyList.length > 0 ? historyList[0] : null);

  const getStatusBadge = (status: string) => {
    if (status === 'Approved') {
      return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-600 border border-emerald-200">Approved</span>;
    }
    if (status === 'Under Review') {
      return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-600 border border-amber-200">Under Review</span>;
    }
    if (status === 'Completed') {
      return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-600 border border-blue-200">Completed</span>;
    }
    return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-600 border border-rose-200">Rework Requested</span>;
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeItem || !replyText.trim()) return;
    await handleAddUserComment(activeItem.taskId, replyText, 'Update');
    setReplyText('');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Search & Filter Header Bar */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-[#5a36e6] flex items-center justify-center font-bold">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-900">Submitted Work History</h2>
            <p className="text-xs text-gray-500 font-medium">Review approvals, revision comments, and submission logs</p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Status Filters */}
          <div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-xl">
            {['All', 'Under Review', 'Approved', 'Completed'].map(st => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  statusFilter === st ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search history..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5a36e6] w-48"
            />
          </div>
        </div>
      </div>

      {/* Main Two-Column Layout: History Table + Selected Submission Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: History Table (7 cols or 12 cols if no selection) */}
        <div className={`${activeItem ? 'lg:col-span-7' : 'lg:col-span-12'} bg-white rounded-2xl border border-gray-100 shadow-sm p-5`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-100 text-gray-400 font-bold uppercase tracking-wider text-[11px]">
                  <th className="pb-3 pl-2">#</th>
                  <th className="pb-3">Task ID & Title</th>
                  <th className="pb-3">Department / Team</th>
                  <th className="pb-3">Submitted Date</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right pr-2">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 font-medium text-gray-700">
                {filteredHistory.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-gray-400">
                      No matching work history items found.
                    </td>
                  </tr>
                ) : (
                  filteredHistory.map((item, idx) => {
                    const isSelected = activeItem?.id === item.id;

                    return (
                      <tr
                        key={item.id}
                        onClick={() => setSelectedHistoryItem(item)}
                        className={`hover:bg-purple-50/40 transition cursor-pointer ${
                          isSelected ? 'bg-purple-50/60 font-semibold' : ''
                        }`}
                      >
                        <td className="py-4 pl-2 font-bold text-gray-400">{idx + 1}</td>
                        <td className="py-4 pr-3">
                          <p className="font-bold text-gray-900 line-clamp-1">{item.title}</p>
                          <p className="text-[10px] text-gray-400 font-mono mt-0.5">{item.taskId}</p>
                        </td>
                        <td className="py-4 text-gray-500 whitespace-nowrap">
                          {item.department} / {item.team}
                        </td>
                        <td className="py-4 whitespace-nowrap text-gray-500">
                          {item.submittedDate}
                        </td>
                        <td className="py-4 whitespace-nowrap">
                          {getStatusBadge(item.status)}
                        </td>
                        <td className="py-4 text-right pr-2 whitespace-nowrap">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedHistoryItem(item);
                            }}
                            className={`p-1.5 rounded-lg transition ${
                              isSelected 
                                ? 'bg-[#5a36e6] text-white' 
                                : 'text-gray-400 hover:text-[#5a36e6] hover:bg-indigo-50'
                            }`}
                            title="View details"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Selected Submission Inspector (5 cols) */}
        {activeItem && (
          <div className="lg:col-span-5 bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5 sticky top-6">
            {/* Header */}
            <div className="flex items-start justify-between gap-3 pb-4 border-b border-gray-100">
              <div>
                <span className="text-[11px] font-mono font-bold text-[#5a36e6] bg-indigo-50 px-2 py-0.5 rounded-md">
                  {activeItem.taskId}
                </span>
                <h3 className="text-base font-bold text-gray-900 mt-2 leading-snug">
                  {activeItem.title}
                </h3>
                <p className="text-xs text-gray-500 font-medium mt-1">
                  Assigned by {activeItem.assignedBy} &bull; Due {activeItem.dueDate}
                </p>
              </div>
              <div>{getStatusBadge(activeItem.status)}</div>
            </div>

            {/* Submission Timeline */}
            <div>
              <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-3">
                Submission Progression
              </h4>
              <div className="flex items-center justify-between text-xs font-semibold relative">
                <div className="flex flex-col items-center">
                  <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px]">
                    ✓
                  </div>
                  <span className="text-[10px] text-gray-600 mt-1">Assigned</span>
                </div>
                <div className="h-0.5 flex-1 bg-emerald-500 mx-2" />
                <div className="flex flex-col items-center">
                  <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px]">
                    ✓
                  </div>
                  <span className="text-[10px] text-gray-600 mt-1">Submitted</span>
                </div>
                <div className="h-0.5 flex-1 bg-amber-400 mx-2" />
                <div className="flex flex-col items-center">
                  <div className="w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center text-[10px] animate-pulse">
                    ●
                  </div>
                  <span className="text-[10px] text-amber-700 mt-1">Review</span>
                </div>
              </div>
            </div>

            {/* Submission Notes */}
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                Your Submission Note:
              </p>
              <p className="text-xs text-gray-700 leading-relaxed font-medium">
                {activeItem.submittedComment || 'Work completed and submitted according to the sprint deliverables.'}
              </p>
            </div>

            {/* Reviewer Feedback Excerpt */}
            <div className="p-4 rounded-xl bg-purple-50/50 border border-purple-100">
              <div className="flex items-center gap-2 mb-1.5 text-[#5a36e6]">
                <MessageSquare className="w-4 h-4" />
                <p className="text-xs font-bold">Reviewer Feedback</p>
              </div>
              <p className="text-xs text-gray-800 font-semibold leading-relaxed">
                "{activeItem.reviewerFeedback}"
              </p>
            </div>

            {/* Reviewer Comments Thread */}
            {(activeItem.reviewerComments && activeItem.reviewerComments.length > 0) && (
              <div className="space-y-3 pt-2">
                <p className="text-xs font-bold text-gray-900">Review Thread:</p>
                {activeItem.reviewerComments.map((rc, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-gray-50 border border-gray-100 text-xs">
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="font-bold text-gray-800">{rc.author} ({rc.role})</span>
                      <span className="text-gray-400">{rc.date}</span>
                    </div>
                    <p className="text-gray-700 leading-snug">{rc.text}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Reply or Resubmit Action */}
            <form onSubmit={handleSendReply} className="pt-2 flex gap-2">
              <input
                type="text"
                placeholder="Post reply to reviewer..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                className="flex-1 bg-gray-50 border border-gray-200 text-xs rounded-xl px-3 py-2 focus:ring-2 focus:ring-[#5a36e6] focus:outline-none"
              />
              <button
                type="submit"
                className="px-3 py-2 bg-[#5a36e6] text-white rounded-xl text-xs font-bold hover:bg-[#4828c4] transition flex items-center gap-1 shrink-0"
              >
                <Send className="w-3.5 h-3.5" /> Reply
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
