import React, { useState, useEffect } from 'react';
import {
  Clock,
  Calendar,
  Users,
  User,
  CheckCircle2,
  PauseCircle,
  PlayCircle,
  MessageSquare,
  Tag,
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import { TimelineEvent } from '../../types';

export const ManagerTimelineView: React.FC = () => {
  const { teams, members } = useApp();

  const [selectedDate, setSelectedDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [selectedTeam, setSelectedTeam] = useState<string>('All');
  const [selectedMember, setSelectedMember] = useState<string>('All');
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const filteredMembers = selectedTeam !== 'All'
    ? members.filter(m => m.teamId === selectedTeam || (m as any).team === selectedTeam)
    : members;

  const fetchTimeline = async () => {
    setLoading(true);
    try {
      const res = await api.getManagerTimeline({
        date: selectedDate,
        teamId: selectedTeam,
        memberId: selectedMember
      });
      setEvents(res.events || []);
    } catch (e) {
      console.warn('Error fetching timeline:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimeline();
  }, [selectedDate, selectedTeam, selectedMember]);

  const formatEventTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    } catch {
      return '';
    }
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'punch_in':
        return { icon: PlayCircle, bg: 'bg-emerald-50 text-emerald-600 border-emerald-200' };
      case 'punch_out':
        return { icon: Clock, bg: 'bg-rose-50 text-rose-600 border-rose-200' };
      case 'started':
        return { icon: PlayCircle, bg: 'bg-indigo-50 text-[#5a36e6] border-indigo-200' };
      case 'paused':
        return { icon: PauseCircle, bg: 'bg-amber-50 text-amber-600 border-amber-200' };
      case 'resumed':
        return { icon: PlayCircle, bg: 'bg-blue-50 text-blue-600 border-blue-200' };
      case 'finished':
      case 'completed':
        return { icon: CheckCircle2, bg: 'bg-emerald-50 text-emerald-600 border-emerald-200' };
      case 'deadline_change':
        return { icon: Calendar, bg: 'bg-purple-50 text-purple-600 border-purple-200' };
      case 'assignee_change':
        return { icon: User, bg: 'bg-sky-50 text-sky-600 border-sky-200' };
      case 'comment':
        return { icon: MessageSquare, bg: 'bg-blue-50 text-blue-600 border-blue-200' };
      default:
        return { icon: Tag, bg: 'bg-gray-50 text-gray-600 border-gray-200' };
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-[#5a36e6] flex items-center justify-center font-bold shadow-sm">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                  Manager's Daily Activity Timeline
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  Live Action Log
                </span>
              </div>
              <p className="text-xs text-gray-500 font-medium mt-0.5">
                Audit trail of attendance punches, task starts, pause reasons and durations, comments, deadline changes, and completions.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={fetchTimeline}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-bold transition border border-gray-200 self-start sm:self-auto cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Log</span>
          </button>
        </div>

        {/* 3-Step Filter Cascade: Date -> Team -> Member */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-5">
          {/* 1. Date Picker */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#5a36e6]" />
              <span>1. Select Date</span>
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-3.5 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5a36e6] font-bold text-gray-800 cursor-pointer"
            />
          </div>

          {/* 2. Team Selector */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-[#5a36e6]" />
              <span>2. Select Team</span>
            </label>
            <select
              value={selectedTeam}
              onChange={(e) => {
                setSelectedTeam(e.target.value);
                setSelectedMember('All');
              }}
              className="w-full px-3.5 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5a36e6] font-bold text-gray-800 cursor-pointer"
            >
              <option value="All">All Teams</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          {/* 3. Member Selector */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-emerald-600" />
              <span>3. Select Member</span>
            </label>
            <select
              value={selectedMember}
              onChange={(e) => setSelectedMember(e.target.value)}
              className="w-full px-3.5 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5a36e6] font-bold text-gray-800 cursor-pointer"
            >
              <option value="All">All Members</option>
              {filteredMembers.map((m) => (
                <option key={m.id} value={m.id}>{m.name} ({m.role || 'Member'})</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Timeline Stream */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8">
        <div className="flex items-center justify-between pb-6 mb-6 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-gray-900">Recorded Action Log</h3>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
              {events.length} {events.length === 1 ? 'Action' : 'Actions'}
            </span>
          </div>
          <span className="text-xs text-gray-500 font-medium">
            Chronological order (earliest to latest)
          </span>
        </div>

        {events.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-14 h-14 rounded-2xl bg-gray-50 text-gray-400 flex items-center justify-center mx-auto mb-3">
              <Clock className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-gray-800">No Recorded Actions</h4>
            <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1">
              No activity logs, punches, or task events recorded for the selected date and filters.
            </p>
          </div>
        ) : (
          <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-3 sm:before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-200">
            {events.map((evt, idx) => {
              const { icon: EventIcon, bg: iconBg } = getEventIcon(evt.type);
              const eventTime = formatEventTime(evt.timestamp);

              return (
                <div key={evt.id || idx} className="relative group">
                  {/* Timeline Dot Icon */}
                  <div className={`absolute -left-6 sm:-left-8 top-1 w-6 h-6 sm:w-7 sm:h-7 rounded-xl border flex items-center justify-center shadow-xs transition-transform group-hover:scale-110 ${iconBg}`}>
                    <EventIcon className="w-3.5 h-3.5" />
                  </div>

                  {/* Event Card */}
                  <div className="bg-slate-50/70 hover:bg-slate-100/70 transition-colors p-4 rounded-2xl border border-slate-100 space-y-2">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Time */}
                        <span className="font-mono text-xs font-black text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                          {eventTime}
                        </span>

                        {/* Actor Name & Role */}
                        <span className="text-xs font-bold text-gray-900">
                          {evt.actorName}
                        </span>
                        <span className="text-[10px] font-semibold text-gray-500 bg-gray-200/70 px-2 py-0.2 rounded-md">
                          {evt.actorRole}
                        </span>

                        {/* Team */}
                        {evt.team && (
                          <span className="text-[10px] font-medium text-slate-500">
                            • {evt.team}
                          </span>
                        )}
                      </div>

                      {/* Action Type Badge */}
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border ${iconBg}`}>
                        {evt.type.replace('_', ' ')}
                      </span>
                    </div>

                    {/* Task Title if associated */}
                    {evt.taskTitle && (
                      <div className="text-xs font-bold text-[#5a36e6]">
                        Task: {evt.taskTitle}
                      </div>
                    )}

                    {/* Action Title / Description */}
                    <div className="text-xs font-medium text-gray-700 leading-relaxed">
                      {evt.description}
                    </div>

                    {/* Deadline Change Details Card */}
                    {evt.type === 'deadline_change' && evt.details && (
                      <div className="flex items-center gap-2 p-2 rounded-xl bg-purple-50 border border-purple-100 text-xs text-purple-900 mt-2">
                        <Calendar className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                        <span>Old Date: <span className="font-semibold line-through">{evt.details.oldDate || 'None'}</span></span>
                        <ArrowRight className="w-3 h-3 text-purple-400" />
                        <span>New Date: <span className="font-bold text-purple-700">{evt.details.newDate}</span></span>
                        <span className="text-purple-600 text-[10px] ml-auto">Updated by {evt.actorName}</span>
                      </div>
                    )}

                    {/* Pause Reason & Duration */}
                    {evt.type === 'paused' && evt.details && (
                      <div className="p-2 rounded-xl bg-amber-50 border border-amber-100 text-xs text-amber-900 mt-2 flex items-center gap-2">
                        <PauseCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span>Reason: <span className="font-bold">{evt.details.reason}</span></span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
