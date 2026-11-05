import React, { useState, useEffect } from 'react';
import { 
  Send, 
  User as UserIcon, 
  Shield, 
  Mail, 
  AlertCircle, 
  Calendar, 
  Clock, 
  ArrowRight,
  ClipboardList
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import { Assignment } from '../../types';

export const UserAssignWork: React.FC = () => {
  const { allUsers, currentUser, refreshAll } = useApp();

  const [assignMode, setAssignMode] = useState<'user_to_user' | 'user_to_admin'>('user_to_user');
  const [targetId, setTargetId] = useState('');
  const [targetName, setTargetName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('Developer');
  const [workTitle, setWorkTitle] = useState('');
  const [workDescription, setWorkDescription] = useState('');
  const [priority, setPriority] = useState<'High' | 'Medium' | 'Low'>('High');
  const [dueDate, setDueDate] = useState('');
  const [status, setStatus] = useState<'In Progress' | 'To Do' | 'In Review' | 'Completed'>('In Progress');
  const [submitting, setSubmitting] = useState(false);
  const [delegatedWork, setDelegatedWork] = useState<Assignment[]>([]);
  const [loadingDelegated, setLoadingDelegated] = useState(false);

  const teamMembers = allUsers.filter(u => u.role === 'user');
  const adminUsers = allUsers.filter(u => u.role === 'admin');

  // Load delegated work
  const loadDelegatedWork = async () => {
    if (!currentUser) return;
    try {
      setLoadingDelegated(true);
      const list = await api.getAssignments({ assignerId: currentUser.id });
      setDelegatedWork(list || []);
    } catch (e) {
      console.error('Failed to load delegated assignments:', e);
    } finally {
      setLoadingDelegated(false);
    }
  };

  useEffect(() => {
    loadDelegatedWork();
  }, [currentUser]);

  // Set default selection when mode changes
  useEffect(() => {
    if (assignMode === 'user_to_user') {
      const candidates = teamMembers.filter(u => u.id !== currentUser?.id);
      const defaultUser = candidates.length > 0 ? candidates[0] : teamMembers[0];
      if (defaultUser) {
        setTargetId(defaultUser.id);
        setTargetName(defaultUser.name);
        setEmail(defaultUser.email);
        setRole(defaultUser.teamRole || 'Developer');
      } else {
        setTargetId('');
        setTargetName('');
        setEmail('');
        setRole('Developer');
      }
    } else {
      // user_to_admin
      const defaultAdmin = adminUsers[0] || { id: 'usr-admin', name: 'Admin', email: 'dynamicsajjan@gamil.com' };
      setTargetId(defaultAdmin.id);
      setTargetName(defaultAdmin.name);
      setEmail(defaultAdmin.email);
      setRole('Administrator');
    }
  }, [assignMode, allUsers]);

  const handleUserSelect = (userId: string) => {
    setTargetId(userId);
    const u = teamMembers.find(m => m.id === userId);
    if (u) {
      setTargetName(u.name);
      setEmail(u.email);
      setRole(u.teamRole || 'Developer');
    }
  };

  const handleAdminSelect = (adminId: string) => {
    setTargetId(adminId);
    const a = adminUsers.find(u => u.id === adminId);
    if (a) {
      setTargetName(a.name);
      setEmail(a.email);
      setRole('Administrator');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workTitle.trim() || !targetId) {
      alert('Please select a recipient and enter a work title.');
      return;
    }

    try {
      setSubmitting(true);
      await api.createAssignment({
        workTitle: workTitle.trim(),
        workDescription: workDescription.trim(),
        role,
        priority,
        dueDate: dueDate || new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        status,
        // Any-to-Any metadata:
        assignerId: currentUser?.id || 'usr-user',
        assignerName: currentUser?.name || 'Team Member',
        assignerRole: 'user',
        assignerEmail: currentUser?.email || '',
        assigneeId: targetId,
        assigneeName: targetName,
        assigneeRole: assignMode === 'user_to_admin' ? 'admin' : 'user',
        assigneeEmail: email,
        assignmentType: assignMode
      });

      await refreshAll();
      await loadDelegatedWork();
      setWorkTitle('');
      setWorkDescription('');
      alert(`Work successfully assigned (${assignMode === 'user_to_user' ? 'User → User' : 'User → Admin'})!`);
    } catch (err) {
      console.error(err);
      alert('Failed to assign work');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-[#201c4b] to-[#151336] rounded-2xl p-6 text-white border border-white/10 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Multi-Directional Work Delegation
              </span>
            </div>
            <h2 className="text-xl lg:text-2xl font-black tracking-tight">Assign & Delegate Work</h2>
            <p className="text-xs text-[#a2a0c4] mt-1 max-w-xl">
              Collaborate smoothly across roles: Assign work to your fellow team members (User &rarr; User) or submit work requests to Administrators (User &rarr; Admin).
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex items-center gap-2 p-1.5 bg-black/30 backdrop-blur-md rounded-2xl border border-white/10 shrink-0">
            <button
              type="button"
              onClick={() => setAssignMode('user_to_user')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                assignMode === 'user_to_user'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/40'
                  : 'text-[#a2a0c4] hover:text-white hover:bg-white/5'
              }`}
            >
              <UserIcon className="w-3.5 h-3.5" />
              <span>User</span>
              <ArrowRight className="w-3 h-3 opacity-60" />
              <span>User</span>
            </button>

            <button
              type="button"
              onClick={() => setAssignMode('user_to_admin')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                assignMode === 'user_to_admin'
                  ? 'bg-amber-600 text-white shadow-lg shadow-amber-900/40'
                  : 'text-[#a2a0c4] hover:text-white hover:bg-white/5'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>User</span>
              <ArrowRight className="w-3 h-3 opacity-60" />
              <span>Admin</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Form on Left, Delegated List on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Assignment Form (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
            <div className="flex items-center gap-2.5">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                assignMode === 'user_to_user' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
              }`}>
                {assignMode === 'user_to_user' ? <UserIcon className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-sm">
                  {assignMode === 'user_to_user' ? 'Assign to Teammate (User → User)' : 'Request from Admin (User → Admin)'}
                </h3>
                <p className="text-[11px] text-gray-500">
                  {assignMode === 'user_to_user'
                    ? 'Work will appear in their workspace and team tasks.'
                    : 'Work will be assigned to Administrator for action/review.'}
                </p>
              </div>
            </div>

            <span className={`px-2.5 py-1 rounded-full text-[11px] font-extrabold ${
              assignMode === 'user_to_user'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-amber-50 text-amber-700 border border-amber-200'
            }`}>
              {assignMode === 'user_to_user' ? 'User → User' : 'User → Admin'}
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs font-medium text-gray-700">
            {/* Recipient Selector */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">
                  {assignMode === 'user_to_user' ? 'Select Teammate' : 'Select Administrator'} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  {assignMode === 'user_to_user' ? (
                    <UserIcon className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
                  ) : (
                    <Shield className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
                  )}

                  {assignMode === 'user_to_user' ? (
                    <select
                      value={targetId}
                      onChange={(e) => handleUserSelect(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                      required
                    >
                      {teamMembers.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name} {m.id === currentUser?.id ? '(You)' : ''} ({m.teamRole || 'Member'})
                        </option>
                      ))}
                      {teamMembers.length === 0 && (
                        <option value="">No other members available</option>
                      )}
                    </select>
                  ) : (
                    <select
                      value={targetId}
                      onChange={(e) => handleAdminSelect(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                      required
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
                <label className="block text-[11px] font-bold text-gray-700 mb-1">
                  Recipient Email
                </label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    value={email}
                    readOnly
                    className="w-full pl-8 pr-3 py-2 bg-gray-100 border border-gray-200 rounded-xl text-gray-600 font-medium cursor-not-allowed"
                  />
                </div>
              </div>
            </div>

            {/* Role & Priority */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">
                  Role Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="e.g. Developer, QA Lead, Administrator..."
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">
                  Priority <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <AlertCircle className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full pl-8 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Work Title */}
            <div>
              <label className="block text-[11px] font-bold text-gray-700 mb-1">
                Work Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={workTitle}
                onChange={(e) => setWorkTitle(e.target.value)}
                placeholder="e.g. Prepare API endpoints / Review deployment credentials"
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-[11px] font-bold text-gray-700 mb-1">
                Work Description & Notes <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={3}
                required
                value={workDescription}
                onChange={(e) => setWorkDescription(e.target.value)}
                placeholder="Detailed instructions or specifications for this task..."
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium resize-none"
              />
            </div>

            {/* Due Date & Status */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">
                  Due Date <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Calendar className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    placeholder="e.g. Today / 10 Nov 2026"
                    className="w-full pl-8 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">
                  Initial Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                >
                  <option value="In Progress">In Progress</option>
                  <option value="To Do">To Do</option>
                  <option value="In Review">In Review</option>
                </select>
              </div>
            </div>

            {/* Submit button */}
            <div className="pt-2 flex items-center justify-between">
              <span className="text-xs text-gray-500">
                Assigned by: <strong className="text-gray-900">{currentUser?.name || 'You'}</strong>
              </span>

              <button
                type="submit"
                disabled={submitting}
                className={`px-6 py-2.5 rounded-xl text-white font-bold text-xs flex items-center gap-2 shadow-sm transition-all cursor-pointer ${
                  assignMode === 'user_to_user'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-amber-600 hover:bg-amber-700'
                }`}
              >
                <Send className="w-3.5 h-3.5" />
                <span>{submitting ? 'Assigning...' : 'Assign Work'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right: Delegated Work List (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-gray-100 p-6 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-indigo-600" />
              <h3 className="font-bold text-gray-900 text-sm">Work Delegated by You</h3>
            </div>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-600">
              {delegatedWork.length} Items
            </span>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto max-h-[460px] pr-1">
            {loadingDelegated ? (
              <div className="py-12 text-center text-xs text-gray-400">Loading your delegated tasks...</div>
            ) : delegatedWork.length === 0 ? (
              <div className="py-12 text-center text-xs text-gray-400">
                You haven't assigned any work yet. Use the form on the left to assign tasks to teammates or request work from Admins.
              </div>
            ) : (
              delegatedWork.map((item) => {
                const isToAdmin = item.assignmentType === 'user_to_admin';
                return (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-xl border border-gray-100 hover:border-gray-200 hover:bg-gray-50/60 transition group"
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <span className="font-bold text-gray-900 text-xs line-clamp-1">{item.workTitle}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                        isToAdmin
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}>
                        {isToAdmin ? 'User → Admin' : 'User → User'}
                      </span>
                    </div>

                    <p className="text-[11px] text-gray-500 line-clamp-2 mb-2">
                      {item.workDescription || 'No description provided.'}
                    </p>

                    <div className="flex items-center justify-between text-[10px] text-gray-400 pt-1 border-t border-gray-50">
                      <span>Assigned to: <strong className="text-gray-700">{item.assigneeName || 'Team Member'}</strong></span>
                      <span className="flex items-center gap-1 font-semibold text-gray-600">
                        <Clock className="w-3 h-3 text-gray-400" />
                        {item.dueDate || 'Today'}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
