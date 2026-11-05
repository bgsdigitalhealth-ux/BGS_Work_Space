import React, { useState, useEffect } from 'react';
import { Send, Shield, User, Mail, Phone, Calendar, AlertCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';

export const AssignWorkForm: React.FC = () => {
  const { selectedTeam, members, refreshAll } = useApp();

  const [memberId, setMemberId] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('Team Lead');
  const [workTitle, setWorkTitle] = useState('Oversee backend development');
  const [workDescription, setWorkDescription] = useState(
    'Review code, guide the team, and ensure timely delivery of backend features for the current sprint.'
  );
  const [priority, setPriority] = useState<'High' | 'Medium' | 'Low'>('High');
  const [dueDate, setDueDate] = useState('Jan 31, 2026');
  const [status, setStatus] = useState<'In Progress' | 'To Do' | 'In Review' | 'Completed'>('In Progress');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (members.length > 0 && !memberId) {
      setMemberId(members[0].id);
      setEmail(members[0].email);
      setPhone(members[0].phone || '+91 98765 43210');
      setRole(members[0].role || 'Team Lead');
    }
  }, [members]);

  const handleMemberChange = (mId: string) => {
    setMemberId(mId);
    const found = members.find((m) => m.id === mId);
    if (found) {
      setEmail(found.email);
      setPhone(found.phone || '+91 98765 43210');
      setRole(found.role || 'Developer');
    }
  };

  const handleQuickRole = (r: string) => {
    setRole(r);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeam || !memberId || !workTitle) return;

    try {
      setSubmitting(true);
      await api.createAssignment({
        memberId,
        teamId: selectedTeam.id,
        workTitle,
        workDescription,
        role,
        priority,
        dueDate,
        status,
      });

      // Also update member's assignedWork preview
      await api.updateMember(memberId, {
        assignedWork: workTitle,
        role,
      });

      await refreshAll();
      alert('Work successfully assigned!');
    } catch (err) {
      console.error(err);
      alert('Failed to assign work');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-sm flex-1 flex flex-col">
      <div className="flex items-center gap-2.5 mb-1">
        <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
          <Shield className="w-4 h-4" />
        </div>
        <h3 className="font-bold text-slate-900 text-base">Assign Work</h3>
      </div>
      <p className="text-xs text-slate-500 mb-5">
        Assign a new work item to a team member in the {selectedTeam?.name || 'Team'}.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4 text-xs font-medium text-slate-700">
        {/* Row 1: Member Name, Email, Phone */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              Member Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <select
                value={memberId}
                onChange={(e) => handleMemberChange(e.target.value)}
                className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              >
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              Member Email ID
            </label>
            <div className="relative">
              <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              Member Number
            </label>
            <div className="relative">
              <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              />
            </div>
          </div>
        </div>

        {/* Row 2: Assigned Role and Role Examples */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-center">
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              Assigned Role <span className="text-red-500">*</span>
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
            >
              <option value="Team Lead">Team Lead</option>
              <option value="Developer">Developer</option>
              <option value="Tester">Tester</option>
              <option value="Designer">Designer</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">
              Role Assignment (Examples)
            </label>
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { name: 'Team Lead', color: 'bg-purple-100 text-purple-700 hover:bg-purple-200' },
                { name: 'Developer', color: 'bg-blue-100 text-blue-700 hover:bg-blue-200' },
                { name: 'Tester', color: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' },
                { name: 'Designer', color: 'bg-pink-100 text-pink-700 hover:bg-pink-200' },
              ].map((r) => (
                <button
                  type="button"
                  key={r.name}
                  onClick={() => handleQuickRole(r.name)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${r.color} ${
                    role === r.name ? 'ring-2 ring-indigo-500' : ''
                  }`}
                >
                  {r.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Work Title */}
        <div>
          <label className="block text-[11px] font-bold text-slate-600 mb-1">
            Work Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={workTitle}
            onChange={(e) => setWorkTitle(e.target.value)}
            placeholder="e.g. Oversee backend development"
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
            required
          />
        </div>

        {/* Work Description */}
        <div>
          <label className="block text-[11px] font-bold text-slate-600 mb-1">
            Work Description <span className="text-red-500">*</span>
          </label>
          <textarea
            rows={3}
            value={workDescription}
            onChange={(e) => setWorkDescription(e.target.value)}
            placeholder="Review code, guide the team, and ensure timely delivery..."
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium resize-none"
            required
          />
        </div>

        {/* Priority, Due Date, Status */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              Priority <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <AlertCircle className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              >
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              Due Date <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                placeholder="Jan 31, 2026"
                className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              Status <span className="text-red-500">*</span>
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
            >
              <option value="In Progress">In Progress</option>
              <option value="To Do">To Do</option>
              <option value="In Review">In Review</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="w-full sm:w-auto px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{submitting ? 'Assigning...' : 'Assign'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

