import React, { useState } from 'react';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  XCircle, 
  Search, 
  Filter, 
  Plus, 
  ChevronLeft, 
  ChevronRight, 
  Eye, 
  Edit2, 
  Trash2, 
  X
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Appointment } from '../../types';

export const AdminAppointments: React.FC = () => {
  const { 
    appointments, 
    appointmentStats, 
    selectedAppointmentDate, 
    setSelectedAppointmentDate,
    handleCreateAppointment,
    handleUpdateAppointment,
    handleDeleteAppointment
  } = useApp();

  const [activeTab, setActiveTab] = useState<'All' | 'Today' | 'Upcoming' | 'Completed' | 'Cancelled'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Appointment | null>(null);
  const [viewingItem, setViewingItem] = useState<Appointment | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    requestedBy: 'Rahul Sharma',
    department: 'Engineering',
    team: 'Backend',
    date: new Date().toISOString().split('T')[0],
    time: '11:00 AM',
    location: 'Online (Google Meet)',
    purpose: '',
    status: 'Scheduled' as 'Scheduled' | 'Upcoming' | 'Completed' | 'Cancelled'
  });

  const stats = appointmentStats?.admin || {
    total: 0,
    today: 0,
    completed: 0,
    upcoming: 0,
    cancelled: 0
  };

  // Filtered Appointments
  const filteredAppointments = appointments.filter(apt => {
    const todayStr = new Date().toISOString().split('T')[0];
    // Tab filter
    if (activeTab === 'Today' && !apt.isToday && apt.date !== todayStr) return false;
    if (activeTab === 'Upcoming' && apt.status !== 'Upcoming' && apt.status !== 'Scheduled') return false;
    if (activeTab === 'Completed' && apt.status !== 'Completed') return false;
    if (activeTab === 'Cancelled' && apt.status !== 'Cancelled') return false;

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = apt.title.toLowerCase().includes(q);
      const matchUser = apt.requestedBy.toLowerCase().includes(q);
      const matchDept = apt.department.toLowerCase().includes(q);
      const matchTeam = apt.team.toLowerCase().includes(q);
      if (!matchTitle && !matchUser && !matchDept && !matchTeam) return false;
    }

    return true;
  });

  const getStatusBadge = (status: string) => {
    if (status === 'Scheduled') {
      return <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-600 border border-blue-200">Scheduled</span>;
    }
    if (status === 'Upcoming') {
      return <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-600 border border-amber-200">Upcoming</span>;
    }
    if (status === 'Completed') {
      return <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-600 border border-emerald-200">Completed</span>;
    }
    return <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-600 border border-rose-200">Cancelled</span>;
  };

  const openCreateModal = () => {
    setEditingItem(null);
    setFormData({
      title: '',
      requestedBy: 'Rahul Sharma',
      department: 'Engineering',
      team: 'Backend',
      date: selectedAppointmentDate || new Date().toISOString().split('T')[0],
      time: '11:00 AM',
      location: 'Online (Google Meet)',
      purpose: '',
      status: 'Scheduled'
    });
    setIsModalOpen(true);
  };

  const openEditModal = (apt: Appointment) => {
    setEditingItem(apt);
    setFormData({
      title: apt.title,
      requestedBy: apt.requestedBy,
      department: apt.department,
      team: apt.team,
      date: apt.date,
      time: apt.time,
      location: apt.location || 'Online (Google Meet)',
      purpose: apt.purpose || '',
      status: apt.status
    });
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    if (editingItem) {
      await handleUpdateAppointment(editingItem.id, formData);
    } else {
      await handleCreateAppointment(formData);
    }
    setIsModalOpen(false);
  };

  // Calendar dates generator for Nov 2026 (Nov 1 is Sunday)
  const calendarDays = Array.from({ length: 30 }, (_, i) => i + 1);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header Card */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-[#5a36e6] text-white flex items-center justify-center shadow-lg shadow-indigo-600/30">
          <CalendarIcon className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">Appointment Management</h2>
          <p className="text-xs text-gray-500 font-medium">Schedule, manage and track appointments for all users and teams.</p>
        </div>
      </div>

      {/* Top 5 KPI Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Appointments */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center gap-4 hover:shadow-md transition">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-[#704fe6] flex items-center justify-center shrink-0">
            <CalendarIcon className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Appointments</p>
            <h3 className="text-2xl font-black text-gray-900 mt-0.5">{stats.total}</h3>
          </div>
        </div>

        {/* Today's Appointments */}
        <div 
          onClick={() => setActiveTab('Today')}
          className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center gap-4 hover:shadow-md transition cursor-pointer"
        >
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Today's Appointments</p>
            <h3 className="text-2xl font-black text-gray-900 mt-0.5">{stats.today}</h3>
          </div>
        </div>

        {/* Completed */}
        <div 
          onClick={() => setActiveTab('Completed')}
          className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center gap-4 hover:shadow-md transition cursor-pointer"
        >
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Completed</p>
            <h3 className="text-2xl font-black text-gray-900 mt-0.5">{stats.completed}</h3>
          </div>
        </div>

        {/* Upcoming */}
        <div 
          onClick={() => setActiveTab('Upcoming')}
          className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center gap-4 hover:shadow-md transition cursor-pointer"
        >
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Upcoming</p>
            <h3 className="text-2xl font-black text-gray-900 mt-0.5">{stats.upcoming}</h3>
          </div>
        </div>

        {/* Cancelled */}
        <div 
          onClick={() => setActiveTab('Cancelled')}
          className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center gap-4 hover:shadow-md transition cursor-pointer"
        >
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <XCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Cancelled</p>
            <h3 className="text-2xl font-black text-gray-900 mt-0.5">{stats.cancelled}</h3>
          </div>
        </div>
      </div>

      {/* Main Grid: Left Mini Calendar (Schedule Appointment) + Right Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Mini Calendar (4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <h3 className="text-sm font-bold text-gray-900">Schedule Appointment</h3>
          </div>

          {/* Calendar Month Header */}
          <div className="flex items-center justify-between px-2">
            <button className="p-1 rounded-lg hover:bg-gray-100 text-gray-600 transition">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold text-gray-900">November 2026</span>
            <button className="p-1 rounded-lg hover:bg-gray-100 text-gray-600 transition">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Days of week */}
          <div className="grid grid-cols-7 text-center text-[10px] font-bold text-gray-400">
            <span>Sun</span>
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7 gap-1 text-center text-xs">
            {calendarDays.map(day => {
              const dateStr = `2026-11-${String(day).padStart(2, '0')}`;
              const isSelected = selectedAppointmentDate === dateStr;
              const hasEvents = appointments.some(a => a.date === dateStr);

              return (
                <button
                  key={day}
                  onClick={() => setSelectedAppointmentDate(dateStr)}
                  className={`h-8 w-8 mx-auto rounded-full flex flex-col items-center justify-center font-semibold text-xs transition relative ${
                    isSelected
                      ? 'bg-[#5a36e6] text-white shadow-md shadow-indigo-600/30'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span>{day}</span>
                  {hasEvents && !isSelected && (
                    <span className="w-1 h-1 rounded-full bg-[#5a36e6] absolute bottom-1" />
                  )}
                </button>
              );
            })}
          </div>

          {/* New Appointment Button */}
          <button
            onClick={openCreateModal}
            className="w-full py-3 rounded-xl bg-[#5a36e6] hover:bg-[#4828c4] text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow-md shadow-indigo-600/30 mt-4"
          >
            <Plus className="w-4 h-4" />
            New Appointment
          </button>
        </div>

        {/* Right Column: Appointments Table (8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
          {/* Header Controls: Filter Tabs + Search Box */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-gray-100">
            {/* Filter Tabs */}
            <div className="flex items-center gap-1 overflow-x-auto text-xs font-bold text-gray-500">
              {(['All', 'Today', 'Upcoming', 'Completed', 'Cancelled'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1.5 rounded-xl transition ${
                    activeTab === tab
                      ? 'bg-purple-50 text-[#5a36e6] font-bold'
                      : 'hover:text-gray-800'
                  }`}
                >
                  {tab === 'All' ? 'All Appointments' : tab}
                </button>
              ))}
            </div>

            {/* Search Input & Filter Icon */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search by user, team or subject..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5a36e6] w-48 md:w-64"
                />
              </div>
              <button className="p-2 rounded-xl bg-gray-50 border border-gray-200 text-gray-500 hover:text-gray-800 transition">
                <Filter className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-100 text-gray-400 font-bold uppercase tracking-wider text-[11px]">
                  <th className="pb-3 pl-2">#</th>
                  <th className="pb-3">Appointment Title</th>
                  <th className="pb-3">Requested By</th>
                  <th className="pb-3">Department / Team</th>
                  <th className="pb-3">Date & Time</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right pr-2">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 font-medium text-gray-700">
                {filteredAppointments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-10 text-gray-400">
                      No appointments found matching this criteria.
                    </td>
                  </tr>
                ) : (
                  filteredAppointments.map((apt, idx) => (
                    <tr key={apt.id} className="hover:bg-purple-50/40 transition group">
                      <td className="py-4 pl-2 font-bold text-gray-400">{idx + 1}</td>
                      <td className="py-4 pr-3">
                        <span className="font-bold text-gray-900 group-hover:text-[#5a36e6] transition">
                          {apt.title}
                        </span>
                      </td>
                      <td className="py-4 whitespace-nowrap text-gray-800 font-semibold">
                        {apt.requestedBy}
                      </td>
                      <td className="py-4 whitespace-nowrap text-gray-500">
                        {apt.department} / {apt.team}
                      </td>
                      <td className="py-4 whitespace-nowrap text-gray-600">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-gray-400" />
                          <span>{apt.dateTimeDisplay || `${apt.date}, ${apt.time}`}</span>
                        </div>
                      </td>
                      <td className="py-4 whitespace-nowrap">
                        {getStatusBadge(apt.status)}
                      </td>
                      <td className="py-4 text-right pr-2 whitespace-nowrap">
                        <div className="inline-flex items-center gap-1 text-gray-400">
                          <button
                            onClick={() => setViewingItem(apt)}
                            className="p-1.5 rounded-lg hover:text-[#5a36e6] hover:bg-white transition"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openEditModal(apt)}
                            className="p-1.5 rounded-lg hover:text-blue-600 hover:bg-white transition"
                            title="Edit Appointment"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteAppointment(apt.id)}
                            className="p-1.5 rounded-lg hover:text-red-600 hover:bg-white transition"
                            title="Delete Appointment"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Appointment Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <h3 className="font-bold text-gray-900 text-base">
                {editingItem ? 'Edit Appointment' : 'New Appointment'}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Appointment Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Project Review Meeting"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 text-xs rounded-xl p-2.5 focus:ring-2 focus:ring-[#5a36e6] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Requested By *</label>
                  <input
                    type="text"
                    required
                    value={formData.requestedBy}
                    onChange={(e) => setFormData({ ...formData, requestedBy: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 text-xs rounded-xl p-2.5 focus:ring-2 focus:ring-[#5a36e6] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full bg-gray-50 border border-gray-200 text-xs rounded-xl p-2.5 focus:ring-2 focus:ring-[#5a36e6] focus:outline-none"
                  >
                    <option value="Scheduled">Scheduled</option>
                    <option value="Upcoming">Upcoming</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Department</label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 text-xs rounded-xl p-2.5 focus:ring-2 focus:ring-[#5a36e6] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Team</label>
                  <input
                    type="text"
                    value={formData.team}
                    onChange={(e) => setFormData({ ...formData, team: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 text-xs rounded-xl p-2.5 focus:ring-2 focus:ring-[#5a36e6] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 text-xs rounded-xl p-2.5 focus:ring-2 focus:ring-[#5a36e6] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Time</label>
                  <input
                    type="text"
                    placeholder="11:00 AM"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 text-xs rounded-xl p-2.5 focus:ring-2 focus:ring-[#5a36e6] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Location / Link</label>
                <input
                  type="text"
                  placeholder="Online (Google Meet) or Room 2"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 text-xs rounded-xl p-2.5 focus:ring-2 focus:ring-[#5a36e6] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Agenda / Purpose</label>
                <textarea
                  rows={2}
                  placeholder="Enter meeting agenda..."
                  value={formData.purpose}
                  onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 text-xs rounded-xl p-2.5 focus:ring-2 focus:ring-[#5a36e6] focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#5a36e6] hover:bg-[#4828c4] text-white text-xs font-bold transition shadow-sm"
                >
                  {editingItem ? 'Save Changes' : 'Schedule Appointment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Appointment Detail View Modal */}
      {viewingItem && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <span className="text-xs font-bold text-[#5a36e6] bg-indigo-50 px-2 py-0.5 rounded-md">
                Appointment Details
              </span>
              <button 
                onClick={() => setViewingItem(null)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <h3 className="text-base font-bold text-gray-900">{viewingItem.title}</h3>
                <p className="text-gray-500 font-medium mt-0.5">
                  Requested by <span className="font-semibold text-gray-800">{viewingItem.requestedBy}</span>
                </p>
              </div>

              <div className="flex items-center gap-2 pt-1">
                {getStatusBadge(viewingItem.status)}
              </div>

              <div className="divide-y divide-gray-100 pt-2">
                <div className="flex justify-between py-2">
                  <span className="text-gray-400">Department / Team</span>
                  <span className="font-semibold text-gray-800">{viewingItem.department} / {viewingItem.team}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-gray-400">Date & Time</span>
                  <span className="font-semibold text-gray-800">{viewingItem.dateTimeDisplay || `${viewingItem.date}, ${viewingItem.time}`}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-gray-400">Location</span>
                  <span className="font-semibold text-gray-800">{viewingItem.location || 'Online'}</span>
                </div>
                {viewingItem.purpose && (
                  <div className="py-2">
                    <span className="text-gray-400 block mb-1">Agenda / Purpose</span>
                    <p className="text-gray-700 bg-gray-50 p-2.5 rounded-xl border border-gray-100">{viewingItem.purpose}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                onClick={() => setViewingItem(null)}
                className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 font-bold text-xs hover:bg-gray-200 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
