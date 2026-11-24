import React, { useState, useEffect } from 'react';
import {
  FileText,
  Calendar,
  Users,
  Clock,
  CheckCircle2,
  PauseCircle,
  Edit2,
  Trash2,
  ShieldCheck,
  RefreshCw,
  X,
  Lock,
  Building2
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import { ReportItem } from '../../types';

export const ReportsView: React.FC = () => {
  const { teams, currentUser, members, notify, confirmAction } = useApp();

  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [selectedDate, setSelectedDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [selectedTeam, setSelectedTeam] = useState<string>('All');
  const [reportItems, setReportItems] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // Edit Report Modal state
  const [editingItem, setEditingItem] = useState<ReportItem | null>(null);
  const [editAttendanceHours, setEditAttendanceHours] = useState<string>('0');
  const [editActiveHours, setEditActiveHours] = useState<string>('0');
  const [editPausedHours, setEditPausedHours] = useState<string>('0');
  const [editNotes, setEditNotes] = useState<string>('');

  // Role Access Evaluation:
  // - Admin: can view all members, can change/edit/delete
  // - Manager: can view team members, can change/edit/delete
  // - User: can ONLY view own particular record, CANNOT change/edit/delete
  const isAdmin = currentUser?.role === 'admin';
  const isManager = currentUser?.role === 'manager' || Boolean(
    currentUser?.teamRole && (
      currentUser.teamRole.toLowerCase().includes('head') ||
      currentUser.teamRole.toLowerCase().includes('manager')
    )
  );
  const isRegularUser = !isAdmin && !isManager;
  const canChangeReport = isAdmin || isManager;

  const userEmail = (currentUser?.email || '').trim().toLowerCase();
  const userId = currentUser?.id || '';
  const myMember = (members || []).find(m =>
    (currentUser?.id && (m.id === currentUser.id || (m as any).userId === currentUser.id)) ||
    (userEmail && m.email && m.email.toLowerCase() === userEmail)
  );
  const myMemberId = myMember?.id || '';
  const myTeamName = currentUser?.team || myMember?.role || 'Assigned Division';

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await api.getReports({
        period,
        date: selectedDate,
        teamId: isRegularUser ? undefined : selectedTeam,
        userId: currentUser?.id,
        userRole: currentUser?.role,
        userEmail: currentUser?.email
      });
      setReportItems(res.items || []);
    } catch (e) {
      console.warn('Error fetching reports:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [period, selectedDate, selectedTeam]);

  const formatHours = (seconds: number) => {
    const hrs = (seconds / 3600).toFixed(1);
    return `${hrs}h`;
  };

  // Filter breakdown items strictly based on role:
  // 1. Regular User: ONLY particular user's own record (never expose other employees)
  // 2. Manager: their assigned team members / division
  // 3. Admin: all members across the organization
  const filteredForUser = reportItems.filter(item => {
    const itemEmail = (item.userEmail || '').trim().toLowerCase();
    const itemId = String(item.userId || '').trim();
    const itemName = (item.userName || '').trim().toLowerCase();
    const myName = (currentUser?.name || '').trim().toLowerCase();
    return (
      (userEmail && itemEmail === userEmail) ||
      (userId && itemId === userId) ||
      (myMemberId && itemId === myMemberId) ||
      (myName && itemName === myName)
    );
  });

  const displayedItems: ReportItem[] = isRegularUser
    ? (filteredForUser.length > 0
        ? filteredForUser
        : currentUser
        ? [{
            id: `rep-self-${userId || 'usr'}`,
            userId: userId || 'usr',
            userName: currentUser.name || 'Member',
            userEmail: currentUser.email || '',
            teamName: myTeamName,
            period,
            startDate: selectedDate,
            endDate: selectedDate,
            attendanceSeconds: 0,
            activeWorkSeconds: 0,
            pausedSeconds: 0,
            completedTasksCount: 0,
            inProgressTasksCount: 0,
            managerNotes: 'Active registered account'
          }]
        : [])
    : isManager && selectedTeam !== 'All'
    ? reportItems.filter(item => item.teamName === selectedTeam || (item as any).teamId === selectedTeam)
    : reportItems;

  // Aggregated totals strictly calculated for the displayed scope:
  // - For user: only their own attendance, active work, paused time, and completed tasks
  // - For admin: full organization totals
  const totalAttendanceSecs = displayedItems.reduce((acc, curr) => acc + (curr.attendanceSeconds || 0), 0);
  const totalActiveSecs = displayedItems.reduce((acc, curr) => acc + (curr.activeWorkSeconds || 0), 0);
  const totalPausedSecs = displayedItems.reduce((acc, curr) => acc + (curr.pausedSeconds || 0), 0);
  const totalCompleted = displayedItems.reduce((acc, curr) => acc + (curr.completedTasksCount || 0), 0);

  // Open Edit Modal (Strictly Admin and Manager)
  const onOpenEdit = (item: ReportItem) => {
    if (!canChangeReport) {
      notify('Access denied: Only Administrators and Managers have access to modify work reports.', 'error', 'Permission Denied');
      return;
    }
    setEditingItem(item);
    setEditAttendanceHours((item.attendanceSeconds / 3600).toFixed(1));
    setEditActiveHours((item.activeWorkSeconds / 3600).toFixed(1));
    setEditPausedHours((item.pausedSeconds / 3600).toFixed(1));
    setEditNotes(item.managerNotes || '');
  };

  const onSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canChangeReport) {
      notify('Access denied: Only Administrators and Managers have access to modify work reports.', 'error', 'Permission Denied');
      return;
    }
    if (!editingItem) return;

    try {
      await api.updateReportEntry(editingItem.id, {
        userId: editingItem.userId,
        userName: editingItem.userName,
        userEmail: editingItem.userEmail,
        period,
        date: selectedDate,
        attendanceSeconds: Math.round(parseFloat(editAttendanceHours || '0') * 3600),
        activeWorkSeconds: Math.round(parseFloat(editActiveHours || '0') * 3600),
        pausedSeconds: Math.round(parseFloat(editPausedHours || '0') * 3600),
        managerNotes: editNotes.trim(),
        userRole: currentUser?.role,
        operatorRole: currentUser?.role,
        operatorName: currentUser?.name
      });
      setEditingItem(null);
      await fetchReports();
      notify('Report entry updated successfully.', 'success', 'Report Updated');
    } catch (e: any) {
      notify(e.message || 'Failed to update report entry', 'error', 'Update Failed');
    }
  };

  const onDeleteReport = async (item: ReportItem) => {
    if (!canChangeReport) {
      notify('Access denied: Only Administrators and Managers have access to delete report records.', 'error', 'Permission Denied');
      return;
    }
    const ok = await confirmAction({
      title: 'Remove Report Entry',
      message: `Are you sure you want to remove the report entry for ${item.userName}? Underlying tasks, attendance punches, and audit history will remain permanently safe.`,
      confirmText: 'Remove Entry',
      variant: 'danger'
    });
    if (!ok) return;

    try {
      await api.deleteReportEntry(item.id, currentUser?.role);
      await fetchReports();
      notify('Report entry deleted successfully.', 'success', 'Report Deleted');
    } catch (e: any) {
      notify(e.message || 'Failed to delete report entry', 'error', 'Delete Failed');
    }
  };

  // Header Titles & Badge Labels
  const pageTitle = isAdmin
    ? 'Executive Work & Attendance Reports'
    : isManager
    ? 'Manager Work & Attendance Reports'
    : 'My Work & Attendance Report';

  const breakdownHeading = isAdmin
    ? 'Member Performance & Activity Breakdown'
    : isManager
    ? 'Team Member Performance & Activity Breakdown'
    : 'My Performance & Activity Breakdown';

  const memberCountBadge = isRegularUser
    ? `${displayedItems.length} Member Listed (Your Personal Record)`
    : `${displayedItems.length} ${displayedItems.length === 1 ? 'Member' : 'Members'} Listed`;

  return (
    <div className="space-y-6 pb-12">
      {/* Header Card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-[#5a36e6] flex items-center justify-center font-bold shadow-sm">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                  {pageTitle}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  {period.toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-gray-500 font-medium mt-0.5">
                {canChangeReport 
                  ? 'Consolidated attendance present, active task time, pause durations, and completed deliverables.' 
                  : 'Your individual attendance present, active task duration, and deliverable metrics.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fetchReports}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-bold transition border border-gray-200 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Protection Notice */}
        {canChangeReport ? (
          <div className="bg-emerald-50/60 border border-emerald-100 rounded-xl px-4 py-2.5 my-4 flex items-center gap-2.5 text-xs text-emerald-800">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              <strong className="font-bold">Manager & Admin Control:</strong> Only Admin and Manager have access to modify work hours, record adjustments, and save management notes. Underlying attendance punches and change history remain permanently intact.
            </span>
          </div>
        ) : (
          <div className="bg-purple-50/60 border border-purple-100 rounded-xl px-4 py-2.5 my-4 flex items-center gap-2.5 text-xs text-purple-900">
            <Lock className="w-4 h-4 text-[#5a36e6] shrink-0" />
            <span>
              <strong className="font-bold">Personal Performance Record:</strong> This report strictly displays your particular attendance present, active task duration, and deliverables. Records are read-only and visible only to you, your manager, and administrators.
            </span>
          </div>
        )}

        {/* Period, Date, Team Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          {/* Period Tabs */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">
              1. Reporting Period
            </label>
            <div className="flex items-center gap-1.5 bg-gray-50 p-1 rounded-xl border border-gray-200">
              {(['daily', 'weekly', 'monthly'] as const).map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPeriod(p)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition capitalize cursor-pointer ${
                    period === p
                      ? 'bg-white text-[#5a36e6] shadow-xs'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Date Picker */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#5a36e6]" />
              <span>2. Reference Date</span>
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-3.5 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5a36e6] font-bold text-gray-800 cursor-pointer"
            />
          </div>

          {/* Team Dropdown (Admin & Manager) vs Assigned Team Badge (User) */}
          {canChangeReport ? (
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-[#5a36e6]" />
                <span>3. Team Filter</span>
              </label>
              <select
                value={selectedTeam}
                onChange={(e) => setSelectedTeam(e.target.value)}
                className="w-full px-3.5 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5a36e6] font-bold text-gray-800 cursor-pointer"
              >
                <option value="All">All Teams ({reportItems.length} records)</option>
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-[#5a36e6]" />
                <span>3. Assigned Team</span>
              </label>
              <div className="w-full px-3.5 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-800 flex items-center justify-between">
                <span className="truncate">{myTeamName}</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-[#5a36e6] border border-purple-200 shrink-0">
                  Your Team
                </span>
              </div>
            </div>
          )}
        </div>

        {/* KPI Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-5">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-100 text-[#5a36e6] flex items-center justify-center font-bold">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-500">Total Attendance</p>
              <p className="text-base font-black text-slate-900 font-number">{formatHours(totalAttendanceSecs)}</p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-emerald-50/50 border border-emerald-100 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-emerald-600">Active Task Work</p>
              <p className="text-base font-black text-emerald-900 font-number">{formatHours(totalActiveSecs)}</p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-amber-50/50 border border-amber-100 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center font-bold">
              <PauseCircle className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-amber-600">Total Paused Time</p>
              <p className="text-base font-black text-amber-900 font-number">{formatHours(totalPausedSecs)}</p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-purple-50/50 border border-purple-100 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-purple-100 text-[#5a36e6] flex items-center justify-center font-bold">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-purple-600">Completed Work</p>
              <p className="text-base font-black text-purple-900 font-number">{totalCompleted} Tasks</p>
            </div>
          </div>
        </div>
      </div>

      {/* Member Breakdown Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-base font-bold text-gray-900">{breakdownHeading}</h3>
          <span className="text-xs text-gray-500 font-medium">
            {memberCountBadge}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-gray-100 text-gray-400 font-bold uppercase tracking-wider text-[11px] bg-gray-50/60">
                <th className="py-3 px-4">Member Name</th>
                <th className="py-3 px-4">Team</th>
                <th className="py-3 px-4">Attendance</th>
                <th className="py-3 px-4">Active Work</th>
                <th className="py-3 px-4">Paused Time</th>
                <th className="py-3 px-4">Completed</th>
                <th className="py-3 px-4">In Progress</th>
                <th className="py-3 px-4">Manager Notes</th>
                {canChangeReport && <th className="py-3 px-4 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium text-gray-700">
              {displayedItems.length === 0 ? (
                <tr>
                  <td colSpan={canChangeReport ? 9 : 8} className="text-center py-12 text-gray-400 text-xs">
                    {isRegularUser 
                      ? 'No recorded work metrics found for your profile on this reference date.' 
                      : 'No member records found for the selected period and team.'}
                  </td>
                </tr>
              ) : (
                displayedItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-gray-900">{item.userName}</div>
                      <div className="text-[11px] text-gray-400">{item.userEmail}</div>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-700">
                      {item.teamName}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-indigo-700">
                      {formatHours(item.attendanceSeconds)}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-emerald-700">
                      {formatHours(item.activeWorkSeconds)}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-semibold text-amber-700">
                      {formatHours(item.pausedSeconds)}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3" />
                        {item.completedTasksCount}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                        {item.inProgressTasksCount}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-gray-500 max-w-xs truncate">
                      {item.managerNotes || (
                        <span className="text-gray-300 italic">None</span>
                      )}
                      {item.isModified && (
                        <span className="block text-[10px] text-purple-600 font-semibold">
                          Edited by {item.modifiedBy}
                        </span>
                      )}
                    </td>
                    {canChangeReport && (
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => onOpenEdit(item)}
                            title="Edit Report Entry (Admin/Manager exclusive)"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-[#5a36e6] hover:bg-indigo-50 transition cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteReport(item)}
                            title="Delete Report Entry (Admin/Manager exclusive)"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Report Entry Modal (Strictly Admin and Manager) */}
      {canChangeReport && editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div 
            className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-gray-100 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-indigo-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#5a36e6] text-white flex items-center justify-center font-bold">
                  <Edit2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">Edit Member Report Entry</h3>
                  <p className="text-xs text-gray-500 font-medium">{editingItem.userName} • {period} report</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={onSaveEdit} className="p-6 space-y-4">
              <div className="grid grid-cols-3 gap-2 text-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div>
                  <label className="block text-[11px] font-bold text-gray-600 mb-1">Attendance (hrs)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={editAttendanceHours}
                    onChange={(e) => setEditAttendanceHours(e.target.value)}
                    className="w-full text-center py-1 text-xs bg-white border border-gray-200 rounded-lg font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-emerald-700 mb-1">Active Work (hrs)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={editActiveHours}
                    onChange={(e) => setEditActiveHours(e.target.value)}
                    className="w-full text-center py-1 text-xs bg-white border border-gray-200 rounded-lg font-bold text-emerald-700"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-amber-700 mb-1">Paused (hrs)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={editPausedHours}
                    onChange={(e) => setEditPausedHours(e.target.value)}
                    className="w-full text-center py-1 text-xs bg-white border border-gray-200 rounded-lg font-bold text-amber-700"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Manager Notes / Adjustment Reason</label>
                <textarea
                  rows={3}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="e.g. Corrected manual offline work duration..."
                  className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5a36e6]"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-xs font-bold bg-[#5a36e6] hover:bg-[#4828c4] text-white rounded-xl shadow-md transition"
                >
                  Save Report Override
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
