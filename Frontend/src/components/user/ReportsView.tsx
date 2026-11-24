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
  X
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import { ReportItem } from '../../types';

export const ReportsView: React.FC = () => {
  const { teams, currentUser, isManagerOrAdmin, notify } = useApp();

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

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await api.getReports({
        period,
        date: selectedDate,
        teamId: selectedTeam
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

  // Open Edit Modal
  const onOpenEdit = (item: ReportItem) => {
    setEditingItem(item);
    setEditAttendanceHours((item.attendanceSeconds / 3600).toFixed(1));
    setEditActiveHours((item.activeWorkSeconds / 3600).toFixed(1));
    setEditPausedHours((item.pausedSeconds / 3600).toFixed(1));
    setEditNotes(item.managerNotes || '');
  };

  const onSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
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
    if (!window.confirm(`Are you sure you want to remove the report entry for ${item.userName}? Underlying tasks, attendance punches, and audit history will remain permanently safe.`)) {
      return;
    }

    try {
      await api.deleteReportEntry(item.id, currentUser?.role);
      await fetchReports();
      notify('Report entry deleted successfully.', 'success', 'Report Deleted');
    } catch (e: any) {
      notify(e.message || 'Failed to delete report entry', 'error', 'Delete Failed');
    }
  };

  // Aggregated totals
  const totalAttendanceSecs = reportItems.reduce((acc, curr) => acc + (curr.attendanceSeconds || 0), 0);
  const totalActiveSecs = reportItems.reduce((acc, curr) => acc + (curr.activeWorkSeconds || 0), 0);
  const totalPausedSecs = reportItems.reduce((acc, curr) => acc + (curr.pausedSeconds || 0), 0);
  const totalCompleted = reportItems.reduce((acc, curr) => acc + (curr.completedTasksCount || 0), 0);

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
                  Manager Work & Attendance Reports
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  {period.toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-gray-500 font-medium mt-0.5">
                Consolidated attendance present, active task time, pause durations, and completed deliverables.
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
        <div className="bg-emerald-50/60 border border-emerald-100 rounded-xl px-4 py-2.5 my-4 flex items-center gap-2.5 text-xs text-emerald-800">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            <strong className="font-bold">Manager Integrity Standard:</strong> Any report correction or deletion applies only to the reporting view. The underlying tasks, attendance punches, and change history remain permanently intact.
          </span>
        </div>

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

          {/* Team Dropdown */}
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
              <option value="All">All Teams</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* KPI Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-5">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-100 text-[#5a36e6] flex items-center justify-center font-bold">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-500">Total Attendance</p>
              <p className="text-base font-black text-slate-900">{formatHours(totalAttendanceSecs)}</p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-emerald-50/50 border border-emerald-100 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-emerald-600">Active Task Work</p>
              <p className="text-base font-black text-emerald-900">{formatHours(totalActiveSecs)}</p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-amber-50/50 border border-amber-100 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center font-bold">
              <PauseCircle className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-amber-600">Total Paused Time</p>
              <p className="text-base font-black text-amber-900">{formatHours(totalPausedSecs)}</p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-purple-50/50 border border-purple-100 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-purple-100 text-[#5a36e6] flex items-center justify-center font-bold">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-purple-600">Completed Work</p>
              <p className="text-base font-black text-purple-900">{totalCompleted} Tasks</p>
            </div>
          </div>
        </div>
      </div>

      {/* Member Breakdown Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-base font-bold text-gray-900">Member Performance & Activity Breakdown</h3>
          <span className="text-xs text-gray-500 font-medium">
            {reportItems.length} {reportItems.length === 1 ? 'Member' : 'Members'} Listed
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
                {isManagerOrAdmin && <th className="py-3 px-4 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium text-gray-700">
              {reportItems.length === 0 ? (
                <tr>
                  <td colSpan={isManagerOrAdmin ? 9 : 8} className="text-center py-12 text-gray-400 text-xs">
                    No member records found for the selected period and team.
                  </td>
                </tr>
              ) : (
                reportItems.map((item) => (
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
                    {isManagerOrAdmin && (
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => onOpenEdit(item)}
                            title="Edit Report Entry (Underlying records remain safe)"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-[#5a36e6] hover:bg-indigo-50 transition cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteReport(item)}
                            title="Delete Report Entry (Underlying records remain safe)"
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

      {/* Edit Report Entry Modal */}
      {editingItem && (
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
