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
  ClipboardList,
  CheckCircle2,
  Building2,
  Users
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import { Assignment } from '../../types';

export const UserAssignWork: React.FC = () => {
  const { allUsers, currentUser, members, refreshAll, setUserToast } = useApp();

  const [assignMode, setAssignMode] = useState<'user_to_user' | 'user_to_admin'>('user_to_user');
  const [targetId, setTargetId] = useState('');
  const [targetName, setTargetName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('Developer');
  const [workTitle, setWorkTitle] = useState('');
  const [workDescription, setWorkDescription] = useState('');
  const [priority, setPriority] = useState<'High' | 'Medium' | 'Low'>('High');
  const [dueDate, setDueDate] = useState('Today');
  const [status, setStatus] = useState<'In Progress' | 'To Do' | 'In Review' | 'Completed'>('In Progress');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');
  const [delegatedWork, setDelegatedWork] = useState<Assignment[]>([]);
  const [loadingDelegated, setLoadingDelegated] = useState(false);

  // Current user's team and department context
  const myTeam = (currentUser?.team || '').trim().toLowerCase();
  const myDept = (currentUser?.department || '').trim().toLowerCase();
  const myEmail = (currentUser?.email || '').trim().toLowerCase();

  // Find member record for currentUser if exists
  const myMember = members.find(m => 
    (currentUser?.id && (m.id === currentUser.id || (m as any).userId === currentUser.id)) ||
    (myEmail && m.email && m.email.toLowerCase() === myEmail)
  );
  const myTeamId = myMember ? myMember.teamId : (currentUser as any)?.teamId;
  const myDeptId = myMember ? myMember.departmentId : (currentUser as any)?.departmentId;

  // Filter candidates who are regular users in the SAME team
  const teamMembers = allUsers.filter(u => {
    if (u.role !== 'user') return false;
    // Exclude myself
    if (u.id === currentUser?.id || (u.email && u.email.toLowerCase() === myEmail)) return false;

    // 1. Direct team name match (e.g. "Digital team")
    if (myTeam && u.team && u.team.toLowerCase() === myTeam) return true;

    // 2. Direct teamId match via members
    const uMember = members.find(m => 
      m.id === u.id || (m as any).userId === u.id || (u.email && m.email && m.email.toLowerCase() === u.email.toLowerCase())
    );
    if (myTeamId && uMember && uMember.teamId && uMember.teamId === myTeamId) return true;

    // 3. Fallback: If current user has department specified and teammate has department specified
    if (myDept && u.department && u.department.toLowerCase() === myDept) {
      if (!myTeam || !u.team || u.team.toLowerCase() === myTeam) return true;
    }

    // If currentUser has no team assigned yet, allow department teammates
    if (!myTeam && !myTeamId) {
      return true;
    }

    return false;
  });

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

  // Set default selection when mode changes or teamMembers update
  useEffect(() => {
    setSubmitError('');
    setSubmitSuccess('');

    if (assignMode === 'user_to_user') {
      if (teamMembers.length > 0) {
        const defaultUser = teamMembers[0];
        setTargetId(defaultUser.id);
        setTargetName(defaultUser.name);
        setEmail(defaultUser.email);
        setRole(defaultUser.teamRole || 'Team Member');
      } else {
        setTargetId('');
        setTargetName('');
        setEmail('');
        setRole('Team Member');
      }
    } else {
      // user_to_admin
      const defaultAdmin = adminUsers[0] || { id: 'usr-admin', name: 'Administrator', email: 'bgsmchhospitalnagarur@gmail.com' };
      setTargetId(defaultAdmin.id);
      setTargetName(defaultAdmin.name);
      setEmail(defaultAdmin.email);
      setRole('Administrator');
    }
  }, [assignMode, allUsers, members, currentUser]);

  const handleUserSelect = (userId: string) => {
    setTargetId(userId);
    const u = teamMembers.find(m => m.id === userId);
    if (u) {
      setTargetName(u.name);
      setEmail(u.email);
      setRole(u.teamRole || 'Team Member');
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
    setSubmitError('');
    setSubmitSuccess('');

    if (!workTitle.trim()) {
      setSubmitError('Please enter a work title for this assignment.');
      return;
    }

    if (!targetId) {
      setSubmitError(
        assignMode === 'user_to_user' 
          ? 'Please select a teammate in your team to assign work to.' 
          : 'Please select an administrator.'
      );
      return;
    }

    try {
      setSubmitting(true);
      const chosenDue = dueDate.trim() || 'Today';

      await api.createAssignment({
        workTitle: workTitle.trim(),
        workDescription: workDescription.trim(),
        role,
        priority,
        dueDate: chosenDue,
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
        assignmentType: assignMode,
        teamId: (currentUser as any)?.teamId || myTeamId || '',
        departmentId: (currentUser as any)?.departmentId || myDeptId || '',
        teamName: currentUser?.team || myMember?.role || '',
        departmentName: currentUser?.department || ''
      });

      await refreshAll();
      await loadDelegatedWork();
      setWorkTitle('');
      setWorkDescription('');
      setSubmitSuccess(`Work "${workTitle.trim()}" successfully assigned to ${targetName}!`);

      if (setUserToast) {
        setUserToast({
          id: Date.now().toString(),
          title: 'Work Assigned',
          message: `Work assignment sent to ${targetName} successfully.`,
          timestamp: new Date()
        });
      }
    } catch (err: any) {
      console.error(err);
      setSubmitError(err.message || 'Failed to assign work. Please try again.');
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
            {currentUser?.team && (
              <div className="mt-3 flex items-center gap-2 text-xs text-indigo-200">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/10 border border-white/15">
                  <Building2 className="w-3.5 h-3.5 text-indigo-300" />
                  <span>Dept: <strong className="text-white">{currentUser.department || 'Digital Health'}</strong></span>
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/10 border border-white/15">
                  <Users className="w-3.5 h-3.5 text-indigo-300" />
                  <span>Team: <strong className="text-white">{currentUser.team}</strong></span>
                </span>
              </div>
            )}
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
                    ? `Only showing teammates in your team (${currentUser?.team || 'Same Team'}).`
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

          {/* Validation & Feedback Banners */}
          {submitError && (
            <div className="mb-4 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{submitError}</span>
            </div>
          )}

          {submitSuccess && (
            <div className="mb-4 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{submitSuccess}</span>
            </div>
          )}

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
                      className="w-full pl-8 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium cursor-pointer"
                      required
                    >
                      {teamMembers.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name} ({m.teamRole || m.team || 'Teammate'})
                        </option>
                      ))}
                      {teamMembers.length === 0 && (
                        <option value="">No other teammates in your team ({currentUser?.team || 'General'})</option>
                      )}
                    </select>
                  ) : (
                    <select
                      value={targetId}
                      onChange={(e) => handleAdminSelect(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium cursor-pointer"
                      required
                    >
                      {adminUsers.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name} ({a.email})
                        </option>
                      ))}
                      {adminUsers.length === 0 && (
                        <option value="usr-admin">Admin (bgsmchhospitalnagarur@gmail.com)</option>
                      )}
                    </select>
                  )}
                </div>
                {assignMode === 'user_to_user' && teamMembers.length === 0 && (
                  <p className="text-[11px] text-amber-600 mt-1">
                    No other users are in your team yet. You can switch to <strong>User → Admin</strong> above.
                  </p>
                )}
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
                    placeholder="Recipient email will populate..."
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
                  <AlertCircle className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5 pointer-events-none" />
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full pl-8 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium cursor-pointer"
                  >
                    <option value="High">High Priority</option>
                    <option value="Medium">Medium Priority</option>
                    <option value="Low">Low Priority</option>
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
                  <Calendar className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5 pointer-events-none" />
                  <input
                    type="text"
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
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium cursor-pointer"
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
                  submitting
                    ? 'opacity-60 cursor-not-allowed bg-indigo-400'
                    : assignMode === 'user_to_user'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-amber-600 hover:bg-amber-700'
                }`}
              >
                <Send className="w-3.5 h-3.5" />
                <span>{submitting ? 'Assigning Work...' : 'Assign Work'}</span>
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
                No work delegated yet. Use the form on the left to assign tasks to teammates.
              </div>
            ) : (
              delegatedWork.map((item) => (
                <div key={item.id} className="p-3.5 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-gray-50 transition space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-gray-900 line-clamp-1">{item.workTitle}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700">
                      {item.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-gray-500">
                    <span>To: <strong className="text-gray-700">{item.assigneeName || item.role}</strong></span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {item.dueDate}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
