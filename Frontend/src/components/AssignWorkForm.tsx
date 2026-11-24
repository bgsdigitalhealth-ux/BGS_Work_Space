import React, { useState, useEffect } from 'react';
import { Send, Shield, User, Mail, Phone, AlertCircle, ArrowRight } from 'lucide-react';
import { useApp, formatTaskDueDate } from '../context/AppContext';
import { api } from '../services/api';

export const AssignWorkForm: React.FC = () => {
  const { selectedTeam, members, allUsers, currentUser, refreshAll, notify } = useApp();

  const [assignMode, setAssignMode] = useState<'admin_to_user' | 'admin_to_manager' | 'admin_to_admin'>('admin_to_user');
  const [targetId, setTargetId] = useState('');
  const [targetName, setTargetName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('Developer');
  const [workTitle, setWorkTitle] = useState('');
  const [workDescription, setWorkDescription] = useState('');
  const [priority, setPriority] = useState<'High' | 'Medium' | 'Low'>('High');
  const [dueDate, setDueDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [status, setStatus] = useState<'In Progress' | 'To Do' | 'In Review' | 'Completed'>('In Progress');
  const [submitting, setSubmitting] = useState(false);

  const adminUsers = allUsers.filter(u => u.role === 'admin');
  const managerUsers = allUsers.filter(u => u.role === 'manager');
  const regularMembers = members.filter(m => m.role !== 'Administrator' && m.role !== 'Team Head');

  useEffect(() => {
    if (assignMode === 'admin_to_user') {
      const candidates = regularMembers.length > 0 ? regularMembers : members;
      if (candidates.length > 0) {
        setTargetId(candidates[0].id);
        setTargetName(candidates[0].name);
        setEmail(candidates[0].email);
        setPhone(candidates[0].phone || '+91 98765 43210');
        setRole(candidates[0].role || 'Developer');
      } else {
        setTargetId('');
        setTargetName('');
        setEmail('');
        setPhone('');
        setRole('Developer');
      }
    } else if (assignMode === 'admin_to_manager') {
      const defaultMgr = managerUsers.length > 0
        ? managerUsers[0]
        : members.find(m => m.role?.toLowerCase().includes('head') || m.role?.toLowerCase().includes('manager'));
      if (defaultMgr) {
        setTargetId(defaultMgr.id);
        setTargetName(defaultMgr.name);
        setEmail(defaultMgr.email);
        setPhone((defaultMgr as any).phone || '+91 98449 90059');
        setRole((defaultMgr as any).teamRole || (defaultMgr as any).title || (defaultMgr as any).role || 'Team Head');
      }
    } else {
      // admin_to_admin
      const otherAdmins = adminUsers.length > 0 ? adminUsers : [{ id: 'usr-bgsmch-admin', name: 'BGS MCH', email: 'bgsmchhospitalnagarur@gmail.com', role: 'admin' }];
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
    const found = members.find((m) => m.id === mId) || allUsers.find(u => u.id === mId);
    if (found) {
      setTargetName(found.name);
      setEmail(found.email);
      setPhone((found as any).phone || '+91 98765 43210');
      setRole((found as any).role || (found as any).teamRole || 'Developer');
    }
  };

  const handleManagerChange = (mgrId: string) => {
    setTargetId(mgrId);
    const found = managerUsers.find(m => m.id === mgrId) || members.find(m => m.id === mgrId);
    if (found) {
      setTargetName(found.name);
      setEmail(found.email);
      setPhone((found as any).phone || '+91 98449 90059');
      setRole((found as any).teamRole || (found as any).title || (found as any).role || 'Team Head');
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
      notify('Please select a recipient and enter a work title.', 'error', 'Missing Information');
      return;
    }

    try {
      setSubmitting(true);
      const targetRole = assignMode === 'admin_to_admin' ? 'admin' : assignMode === 'admin_to_manager' ? 'manager' : 'user';
      await api.createAssignment({
        memberId: (assignMode === 'admin_to_user' || assignMode === 'admin_to_manager') ? targetId : undefined,
        teamId: selectedTeam ? selectedTeam.id : 'general',
        departmentId: selectedTeam ? selectedTeam.departmentId : '',
        workTitle,
        workDescription,
        role,
        priority,
        dueDate: formatTaskDueDate(dueDate) || new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        status,
        // Any-to-Any metadata:
        assignerId: currentUser?.id || 'usr-bgsmch-admin',
        assignerName: currentUser?.name || 'BGS MCH',
        assignerRole: 'admin',
        assignerEmail: currentUser?.email || 'bgsmchhospitalnagarur@gmail.com',
        assigneeId: targetId,
        assigneeName: targetName,
        assigneeRole: targetRole,
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
      const formatLabel = assignMode === 'admin_to_user' ? 'Admin → User' : assignMode === 'admin_to_manager' ? 'Admin → Manager' : 'Admin → Admin';
      notify(`Work successfully assigned (${formatLabel})!`, 'success', 'Assignment Created');
    } catch (err: any) {
      console.error(err);
      notify(err?.message || 'Failed to assign work', 'error', 'Assignment Failed');
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
                : assignMode === 'admin_to_manager'
                ? 'Assign operational initiative to Team Manager.'
                : 'Delegate executive task to another Administrator.'}
            </p>
          </div>
        </div>

        {/* Aligned Segmented Control for Assignment Mode */}
        <div className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200/60 self-start sm:self-center" role="radiogroup" aria-label="Assignment mode">
          <button
            type="button"
            role="radio"
            aria-checked={assignMode === 'admin_to_user'}
            onClick={() => setAssignMode('admin_to_user')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${assignMode === 'admin_to_user'
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
            role="radio"
            aria-checked={assignMode === 'admin_to_manager'}
            onClick={() => setAssignMode('admin_to_manager')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${assignMode === 'admin_to_manager'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
              }`}
          >
            <span>Admin</span>
            <ArrowRight className="w-3 h-3" />
            <span>Manager</span>
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={assignMode === 'admin_to_admin'}
            onClick={() => setAssignMode('admin_to_admin')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${assignMode === 'admin_to_admin'
              ? 'bg-indigo-600 text-white shadow-xs'
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
              {assignMode === 'admin_to_user' ? 'Team Member (User)' : assignMode === 'admin_to_manager' ? 'Team Manager' : 'Assignee Administrator'}{' '}
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
                  {(regularMembers.length > 0 ? regularMembers : members).map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.role || 'Member'})
                    </option>
                  ))}
                  {members.length === 0 && (
                    <option value="">No members in team yet</option>
                  )}
                </select>
              ) : assignMode === 'admin_to_manager' ? (
                <select
                  value={targetId}
                  onChange={(e) => handleManagerChange(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                >
                  {managerUsers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.teamRole || m.title || 'Team Head'}) - {m.email}
                    </option>
                  ))}
                  {managerUsers.length === 0 && members.filter(m => m.role?.toLowerCase().includes('head')).map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.role}) - {m.email}
                    </option>
                  ))}
                  {managerUsers.length === 0 && (
                    <option value="usr-1795150363087-258">DR. Sajjan (dynamicsajjan@gmail.com)</option>
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
                    <option value="usr-bgsmch-admin">BGS MCH (bgsmchhospitalnagarur@gmail.com)</option>
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
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              Role Assignment (Quick Select)
            </label>
            <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Quick select roles">
              {['Team Lead', 'Developer', 'Administrator', 'Tester', 'Designer'].map((rName) => {
                const isSelected = role === rName;
                return (
                  <button
                    type="button"
                    key={rName}
                    aria-pressed={isSelected}
                    onClick={() => handleQuickRole(rName)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer shadow-2xs ${isSelected
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-bold ring-1 ring-indigo-600'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300'
                      }`}
                  >
                    + {rName}
                  </button>
                );
              })}
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
              <input
                type="date"
                value={dueDate}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-800 text-xs cursor-pointer"
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
            <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
              {assignMode === 'admin_to_user' ? 'Admin → User' : assignMode === 'admin_to_manager' ? 'Admin → Manager' : 'Admin → Admin'}
            </span>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{submitting ? 'Assigning...' : 'Assign'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
