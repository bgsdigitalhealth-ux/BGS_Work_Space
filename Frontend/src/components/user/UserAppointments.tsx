import React, { useState } from 'react';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  XCircle, 
  Plus, 
  ChevronLeft, 
  ChevronRight, 
  MapPin, 
  MoreVertical,
  CalendarCheck
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const UserAppointments: React.FC = () => {
  const { 
    appointments, 
    appointmentStats, 
    selectedAppointmentDate, 
    setSelectedAppointmentDate,
    handleCreateAppointment
  } = useApp();

  const [activeTab, setActiveTab] = useState<'All' | 'Today' | 'Upcoming' | 'Completed' | 'Cancelled'>('All');

  // Form State
  const [formTitle, setFormTitle] = useState('');
  const [formDate, setFormDate] = useState('2026-11-05');
  const [formTime, setFormTime] = useState('11:00 AM');
  const [formDeptTeam, setFormDeptTeam] = useState('Engineering / Backend');
  const [formPurpose, setFormPurpose] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const stats = appointmentStats?.user || {
    total: 12,
    today: 3,
    upcoming: 4,
    completed: 5,
    cancelled: 0
  };

  // User appointments (either requested by Rahul Sharma or in user workspace)
  const userAppointments = appointments.filter(apt => 
    apt.requestedBy === 'Rahul Sharma' || apt.userId === 'mem-1' || !apt.userId
  );

  const filteredAppointments = userAppointments.filter(apt => {
    if (activeTab === 'Today' && !apt.isToday && apt.date !== '2026-11-05') return false;
    if (activeTab === 'Upcoming' && apt.status !== 'Upcoming' && apt.status !== 'Scheduled') return false;
    if (activeTab === 'Completed' && apt.status !== 'Completed') return false;
    if (activeTab === 'Cancelled' && apt.status !== 'Cancelled') return false;
    return true;
  });

  const calendarDays = Array.from({ length: 30 }, (_, i) => i + 1);

  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    setIsSubmitting(true);
    const [dept, team] = formDeptTeam.includes('/') 
      ? formDeptTeam.split('/').map(s => s.trim()) 
      : [formDeptTeam, 'General'];

    await handleCreateAppointment({
      title: formTitle,
      requestedBy: 'Rahul Sharma',
      userId: 'mem-1',
      department: dept || 'Engineering',
      team: team || 'Backend',
      date: formDate,
      time: formTime,
      location: 'Online (Google Meet)',
      purpose: formPurpose,
      status: 'Scheduled',
      isToday: formDate === '2026-11-05'
    });

    setFormTitle('');
    setFormPurpose('');
    setIsSubmitting(false);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#5a36e6] text-white flex items-center justify-center shadow-lg shadow-indigo-600/30">
            <CalendarIcon className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-gray-900 tracking-tight">My Appointments</h2>
            <p className="text-xs text-gray-500 font-medium">View, schedule and manage your appointments.</p>
          </div>
        </div>

        <button
          onClick={() => {
            const el = document.getElementById('user-schedule-form');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#5a36e6] hover:bg-[#4828c4] text-white text-xs font-bold transition shadow-md shadow-indigo-600/30 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Schedule Appointment
        </button>
      </div>

      {/* Top 5 KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* My Appointments */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center gap-4 hover:shadow-md transition">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-[#704fe6] flex items-center justify-center shrink-0">
            <CalendarIcon className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">My Appointments</p>
            <h3 className="text-2xl font-black text-gray-900 mt-0.5">{stats.total}</h3>
          </div>
        </div>

        {/* Today */}
        <div 
          onClick={() => setActiveTab('Today')}
          className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center gap-4 hover:shadow-md transition cursor-pointer"
        >
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Today</p>
            <h3 className="text-2xl font-black text-gray-900 mt-0.5">{stats.today}</h3>
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

      {/* Main 3-Column Layout: My Schedule + Appointment Cards + Schedule Form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Column 1: My Schedule (Calendar) - 3 cols */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
          <h3 className="text-sm font-bold text-gray-900">My Schedule</h3>

          {/* Month Header */}
          <div className="flex items-center justify-between px-1">
            <button className="p-1 rounded-lg hover:bg-gray-100 text-gray-500 transition">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold text-gray-900">November 2026</span>
            <button className="p-1 rounded-lg hover:bg-gray-100 text-gray-500 transition">
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

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1 text-center text-xs">
            {calendarDays.map(day => {
              const dateStr = `2026-11-${String(day).padStart(2, '0')}`;
              const isSelected = selectedAppointmentDate === dateStr;
              const hasEvents = [5, 12, 19, 26].includes(day);

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
        </div>

        {/* Column 2: Appointment Cards List - 5 cols */}
        <div className="lg:col-span-5 space-y-4">
          {/* Sub-Tabs */}
          <div className="flex items-center gap-1 bg-white border border-gray-100 rounded-2xl p-1.5 shadow-sm overflow-x-auto text-xs font-bold text-gray-500">
            {[
              { id: 'All', label: 'All' },
              { id: 'Today', label: `Today (${stats.today})` },
              { id: 'Upcoming', label: `Upcoming (${stats.upcoming})` },
              { id: 'Completed', label: `Completed (${stats.completed})` },
              { id: 'Cancelled', label: `Cancelled (${stats.cancelled})` },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 py-1.5 rounded-xl transition whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-[#5a36e6] text-white shadow-sm'
                    : 'hover:text-gray-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Cards List */}
          <div className="space-y-3">
            {filteredAppointments.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-gray-400 text-xs">
                No appointments in this category.
              </div>
            ) : (
              filteredAppointments.map(apt => {
                const dateObj = new Date(apt.date);
                const dayStr = String(dateObj.getDate()).padStart(2, '0');
                const isToday = apt.isToday || apt.date === '2026-11-05';

                return (
                  <div 
                    key={apt.id} 
                    className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center justify-between gap-4 hover:shadow-md transition group"
                  >
                    <div className="flex items-center gap-3.5">
                      {/* Date Badge */}
                      <div className="w-12 h-12 rounded-xl bg-purple-50 text-[#5a36e6] flex flex-col items-center justify-center shrink-0 border border-purple-100">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400">Nov</span>
                        <span className="text-base font-black text-[#5a36e6] leading-none">{dayStr}</span>
                      </div>

                      {/* Info */}
                      <div>
                        <h4 className="text-xs font-bold text-gray-900 group-hover:text-[#5a36e6] transition line-clamp-1">
                          {apt.title}
                        </h4>
                        <div className="flex items-center gap-3 text-[11px] text-gray-500 font-medium mt-1 flex-wrap">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-gray-400" />
                            {apt.time} {apt.endTime ? `– ${apt.endTime}` : ''}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-gray-400" />
                            {apt.location || 'Online'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right Badge & Menu */}
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                        isToday 
                          ? 'bg-purple-50 text-[#5a36e6] border border-purple-200' 
                          : apt.status === 'Completed'
                          ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                          : 'bg-amber-50 text-amber-600 border border-amber-200'
                      }`}>
                        {isToday ? 'Today' : apt.status}
                      </span>
                      <button className="text-gray-400 hover:text-gray-700 p-1">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Column 3: Schedule Appointment Form Card - 4 cols */}
        <div id="user-schedule-form" className="lg:col-span-4 bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4 sticky top-6">
          <div className="flex items-center gap-2 text-[#5a36e6] pb-3 border-b border-gray-100">
            <CalendarCheck className="w-5 h-5" />
            <h3 className="text-sm font-bold text-gray-900">Schedule Appointment</h3>
          </div>

          <form onSubmit={handleScheduleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Appointment Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Enter title (e.g., Project Review)"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 text-xs rounded-xl p-2.5 focus:ring-2 focus:ring-[#5a36e6] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Date & Time <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  required
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 text-xs rounded-xl p-2 focus:ring-2 focus:ring-[#5a36e6] focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="Select time (e.g. 11:00 AM)"
                  value={formTime}
                  onChange={(e) => setFormTime(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 text-xs rounded-xl p-2 focus:ring-2 focus:ring-[#5a36e6] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Department / Team <span className="text-red-500">*</span>
              </label>
              <select
                value={formDeptTeam}
                onChange={(e) => setFormDeptTeam(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 text-xs rounded-xl p-2.5 focus:ring-2 focus:ring-[#5a36e6] focus:outline-none"
              >
                <option value="Engineering / Backend">Engineering / Backend</option>
                <option value="Engineering / Frontend">Engineering / Frontend</option>
                <option value="Design / UI-UX">Design / UI-UX</option>
                <option value="Marketing / Content">Marketing / Content</option>
                <option value="Operations / HR">Operations / HR</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Purpose / Agenda
              </label>
              <textarea
                rows={3}
                placeholder="Enter agenda or purpose..."
                value={formPurpose}
                onChange={(e) => setFormPurpose(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 text-xs rounded-xl p-2.5 focus:ring-2 focus:ring-[#5a36e6] focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-xl bg-[#5a36e6] hover:bg-[#4828c4] text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow-md shadow-indigo-600/30 mt-2"
            >
              <CalendarCheck className="w-4 h-4" />
              {isSubmitting ? 'Scheduling...' : 'Schedule Appointment'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
