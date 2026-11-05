import React, { useState, useEffect } from 'react';
import { Send, Shield, User, Mail, Phone, Calendar, AlertCircle, ArrowRight } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';

export const AssignWorkForm: React.FC = () => {
  const { selectedTeam, members, allUsers, currentUser, refreshAll } = useApp();

  const [assignMode, setAssignMode] = useState<'admin_to_user' | 'admin_to_admin'>('admin_to_user');
  const [targetId, setTargetId] = useState('');
  const [targetName, setTargetName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('Developer');
  const [workTitle, setWorkTitle] = useState('');
  const [workDescription, setWorkDescription] = useState('');
  const [priority, setPriority] = useState<'High' | 'Medium' | 'Low'>('High');
  const [dueDate, setDueDate] = useState('');
  const [status, setStatus] = useState<'In Progress' | 'To Do' | 'In Review' | 'Completed'>('In Progress');
  const [submitting, setSubmitting] = useState(false);

  const adminUsers = allUsers.filter(u => u.role === 'admin');

  useEffect(() => {
    if (assignMode === 'admin_to_user') {
      if (members.length > 0) {
        setTargetId(members[0].id);
        setTargetName(members[0].name);
        setEmail(members[0].email);
        setPhone(members[0].phone || '+91 98765 43210');
        setRole(members[0].role || 'Developer');
      } else {
        setTargetId('');
        setTargetName('');
        setEmail('');
        setPhone('');
        setRole('Developer');
      }
    } else {
      // admin_to_admin
      const otherAdmins = adminUsers.length > 0 ? adminUsers : [{ id: 'usr-admin', name: 'Admin', email: 'dynamicsajjan@gamil.com', role: 'admin' }];
      const defaultAdmin = otherAdmins.find(a => a.id !== currentUser?.id) || otherAdmins[0];
      if (defaultAdmin) {
        setTargetId(defaultAdmin.id);
        setTargetName(defaultAdmin.name);
        setEmail(defaultAdmin.email);
        setPhone('+91 98765 43210');
        setRole('Administrator');
      }
    }
  }, [assignMode, members, allUsers]);

  const handleMemberChange = (mId: string) => {
    setTargetId(mId);
    const found = members.find((m) => m.id === mId);
    if (found) {
      setTargetName(found.name);
      setEmail(found.email);
      setPhone(found.phone || '+91 98765 43210');
      setRole(found.role || 'Developer');
    }
  };

  const handleAdminChange = (adminId: string) => {
    setTargetId(adminId);
    const found = adminUsers.find(a => a.id === adminId);
    if (found) {
      setTargetName(found.name);
      setEmail(found.email);
      setPhone('+91 98765 43210');
      setRole('Administrator');
    }
  };

  const handleQuickRole = (r: string) => {
    setRole(r);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workTitle || !targetId) {
      alert('Please select a recipient and enter a work title.');
      return;
    }

    try {
      setSubmitting(true);
      await api.createAssignment({
        memberId: assignMode === 'admin_to_user' ? targetId : undefined,
        teamId: selectedTeam ? selectedTeam.id : 'general',
        departmentId: selectedTeam ? selectedTeam.departmentId : '',
        workTitle,
        workDescription,
        role,
        priority,
        dueDate: dueDate || new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        status,
        // Any-to-Any metadata:
        assignerId: currentUser?.id || 'usr-admin',
        assignerName: currentUser?.name || 'Admin',
        assignerRole: 'admin',
        assignerEmail: currentUser?.email || 'admin@company.com',
        assigneeId: targetId,
        assigneeName: targetName,
        assigneeRole: assignMode === 'admin_to_admin' ? 'admin' : 'user',
        assigneeEmail: email,
        assignmentType: assignMode
      });

      if (assignMode === 'admin_to_user') {
        await api.updateMember(targetId, {
          assignedWork: workTitle,
          role,
        });
      }

      await refreshAll();
      setWorkTitle('');
      setWorkDescription('');
      alert(`Work successfully assigned (${assignMode === 'admin_to_user' ? 'Admin → User' : 'Admin → Admin'})!`);
    } catch (err) {
      console.error(err);
      alert('Failed to assign work');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-sm flex-1 flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-base">Assign Work</h3>
            <p className="text-xs text-slate-500">
              {assignMode === 'admin_to_user'
                ? `Assign work to team member in ${selectedTeam?.name || 'Department'}.`
                : 'Delegate executive task to another Administrator.'}
            </p>
          </div>
        </div>

        {/* 2 Formats Selector for Admin */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
          <button
            type="button"
            onClick={() => setAssignMode('admin_to_user')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              assignMode === 'admin_to_user'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>Admin</span>
            <ArrowRight className="w-3 h-3" />
            <span>User</span>
          </button>
          <button
            type="button"
            onClick={() => setAssignMode('admin_to_admin')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              assignMode === 'admin_to_admin'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>Admin</span>
            <ArrowRight className="w-3 h-3" />
            <span>Admin</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 text-xs font-medium text-slate-700">
        {/* Row 1: Assignee Name, Email, Phone */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              {assignMode === 'admin_to_user' ? 'Team Member (User)' : 'Assignee Administrator'}{' '}
              <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              {assignMode === 'admin_to_user' ? (
                <select
                  value={targetId}
                  onChange={(e) => handleMemberChange(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                >
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.role || 'Member'})
                    </option>
                  ))}
                  {members.length === 0 && (
                    <option value="">No members in team yet</option>
                  )}
                </select>
              ) : (
                <select
                  value={targetId}
                  onChange={(e) => handleAdminChange(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                >
                  {adminUsers.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.email})
                    </option>
                  ))}
                  {adminUsers.length === 0 && (
                    <option value="usr-admin">Admin (dynamicsajjan@gamil.com)</option>
                  )}
                </select>
              )}
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              Recipient Email ID
            </label>
            <div className="relative">
              <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="email"
                value={email}
                readOnly
                className="w-full pl-8 pr-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-slate-600 font-medium cursor-not-allowed"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              Contact Number
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
            <input
              type="text"
              required
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="e.g. Team Lead, Developer, Administrator..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">
              Role Assignment (Quick Select)
            </label>
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { name: 'Team Lead', color: 'bg-purple-100 text-purple-700 hover:bg-purple-200' },
                { name: 'Developer', color: 'bg-blue-100 text-blue-700 hover:bg-blue-200' },
                { name: 'Administrator', color: 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200' },
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
            placeholder="Review requirements, execute deliverables, and ensure timely completion..."
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

        {/* Submit Button with Dynamic Badge */}
        <div className="pt-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Format:</span>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
              assignMode === 'admin_to_user'
                ? 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                : 'bg-purple-100 text-purple-700 border border-purple-200'
            }`}>
              {assignMode === 'admin_to_user' ? 'Admin → User' : 'Admin → Admin'}
            </span>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{submitting ? 'Assigning...' : 'Assign'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
