import React, { useState, useEffect } from 'react';
import { 
  Send, 
  User as UserIcon, 
  Shield, 
  Mail, 
  AlertCircle, 
  Clock, 
  ArrowRight,
  ClipboardList,
  CheckCircle2,
  Building2,
  Users,
  UserCheck,
  Lock,
  ChevronRight
} from 'lucide-react';
import { useApp, isUserManager, formatTaskDueDate, isBannedEmail, isTaskAssignedToUser } from '../../context/AppContext';
import { api } from '../../services/api';
import { Assignment, UserAssignedWork } from '../../types';

export const UserAssignWork: React.FC = () => {
  const { 
    allUsers, 
    currentUser, 
    members, 
    refreshAll, 
    setUserToast,
    userWorkspace,
    setSelectedUserTask,
    setUserNav,
    setDetailsOriginNav
  } = useApp();

  const [assignMode, setAssignMode] = useState<'user_to_user' | 'user_to_admin' | 'user_to_self'>('user_to_user');
  const [targetId, setTargetId] = useState('');
  const [targetName, setTargetName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('Developer');
  const [workTitle, setWorkTitle] = useState('');
  const [workDescription, setWorkDescription] = useState('');
  const [priority, setPriority] = useState<'High' | 'Medium' | 'Low'>('High');
  const [dueDate, setDueDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [status, setStatus] = useState<'In Progress' | 'To Do' | 'In Review' | 'Completed'>('In Progress');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');
  const [delegatedWork, setDelegatedWork] = useState<Assignment[]>([]);
  const [loadingDelegated, setLoadingDelegated] = useState(false);
  const [workListTab, setWorkListTab] = useState<'all' | 'assigned_to_me' | 'delegated_by_me'>('all');

  // Current user's team and department context
  const myTeam = (currentUser?.team || '').trim().toLowerCase();
  const myDept = (currentUser?.department || '').trim().toLowerCase();
  const myEmail = (currentUser?.email || '').trim().toLowerCase();
  const myName = (currentUser?.name || '').trim();

  const normalizePersonName = (n?: string): string => {
    if (!n) return '';
    return n.toLowerCase().replace(/[^a-z]/g, '').replace(/bh/g, 'b').replace(/sh/g, 's');
  };

  const isSamePerson = (name1?: string, name2?: string): boolean => {
    if (!name1 || !name2) return false;
    const n1 = normalizePersonName(name1);
    const n2 = normalizePersonName(name2);
    return n1.length >= 3 && n1 === n2;
  };

  // Find member record for currentUser if exists (match by id, email, or normalized name)
  const myMember = members.find(m => 
    (currentUser?.id && (m.id === currentUser.id || (m as any).userId === currentUser.id)) ||
    (myEmail && m.email && m.email.toLowerCase() === myEmail) ||
    isSamePerson(m.name, myName)
  );
  const myTeamId = myMember ? myMember.teamId : (currentUser as any)?.teamId;
  const myDeptId = myMember ? myMember.departmentId : (currentUser as any)?.departmentId;
  const isManager = isUserManager(currentUser, myMember);

  // Filter candidates who are regular users in the SAME team (or all users if Manager)
  const teamMembers = allUsers.filter(u => {
    if (u.role !== 'user') return false;
    if (isBannedEmail(u.email)) return false;

    // Exclude myself (by id, email, memberId, and normalized full name)
    const isMyself = 
      (currentUser?.id && (u.id === currentUser.id || (u as any).userId === currentUser.id)) ||
      (myEmail && u.email && u.email.trim().toLowerCase() === myEmail) ||
      (myMember && (u.id === myMember.id || (u as any).userId === myMember.id || (u.email && myMember.email && u.email.trim().toLowerCase() === myMember.email.trim().toLowerCase()))) ||
      isSamePerson(u.name, myName) ||
      isSamePerson(u.name, myMember?.name);
    if (isMyself) return false;

    // Managers can assign to ANY team member across ALL teams!
    if (isManager) return true;

    // Regular members can ONLY assign to candidates in the SAME team:
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

  // 1. Tasks assigned to current user (incoming tasks + self assigned)
  const myAssignedTasks = (userWorkspace?.assignedWork || []).filter(t =>
    isTaskAssignedToUser(t, currentUser, myMember)
  );

  // 2. Combined unified list with deduplication
  const unifiedTasks = React.useMemo(() => {
    const map = new Map<string, any>();

    // Add my assigned tasks (incoming & self-assigned)
    myAssignedTasks.forEach(t => {
      const key = t.id || t.taskId || t.title;
      map.set(key, {
        id: t.id,
        taskId: t.taskId || `TSK-${String(t.id).replace(/\D/g, '').slice(-4) || '9521'}`,
        title: t.title,
        workTitle: t.title,
        description: t.description || '',
        workDescription: t.description || '',
        priority: t.priority || 'High',
        dueDate: t.dueDate || 'Today',
        status: t.status || 'In Progress',
        assignmentType: t.assignmentType || 'user_to_user',
        assignedBy: t.assignedBy || 'Colleague',
        assignerName: t.assignedBy || 'Colleague',
        assigneeName: t.assigneeName || currentUser?.name || 'You',
        role: (t as any).role || 'Team Member',
        progress: t.progress,
        isAssignedToMe: true,
        isDelegatedByMe: t.assignmentType === 'user_to_self' || (t as any).assignerId === currentUser?.id,
        rawTask: t
      });
    });

    // Add delegated tasks (tasks assigned by current user)
    delegatedWork.forEach(d => {
      const key = d.id || (d as any).taskId || d.workTitle;
      const existing = map.get(key) || Array.from(map.values()).find(x => x.title === d.workTitle || x.workTitle === d.workTitle);
      if (existing) {
        existing.isDelegatedByMe = true;
        if (!existing.rawAssignment) existing.rawAssignment = d;
      } else {
        map.set(key, {
          id: d.id,
          taskId: (d as any).taskId || `TSK-${String(d.id).replace(/\D/g, '').slice(-4) || '9521'}`,
          title: d.workTitle,
          workTitle: d.workTitle,
          description: d.workDescription || '',
          workDescription: d.workDescription || '',
          priority: d.priority || 'High',
          dueDate: d.dueDate || 'Today',
          status: d.status || 'In Progress',
          assignmentType: d.assignmentType || 'user_to_user',
          assignedBy: d.assignmentType === 'user_to_self' ? `Self (${currentUser?.name || 'You'})` : `Self (${d.assignerName || currentUser?.name || 'You'})`,
          assignerName: d.assignerName || currentUser?.name || 'You',
          assigneeName: d.assignmentType === 'user_to_self' ? `${currentUser?.name} (Self)` : (d.assigneeName || d.role),
          role: d.role || 'Team Member',
          progress: d.status === 'Completed' ? 100 : d.status === 'In Review' ? 85 : 60,
          isAssignedToMe: d.assignmentType === 'user_to_self' || d.assigneeId === currentUser?.id || (d.assigneeEmail && d.assigneeEmail.toLowerCase() === (currentUser?.email || '').toLowerCase()),
          isDelegatedByMe: true,
          rawAssignment: d
        });
      }
    });

    return Array.from(map.values());
  }, [myAssignedTasks, delegatedWork, currentUser]);

  // Filter based on selected tab
  const displayedTasks = React.useMemo(() => {
    if (workListTab === 'assigned_to_me') {
      return unifiedTasks.filter(t => t.isAssignedToMe || t.assignmentType === 'user_to_self');
    }
    if (workListTab === 'delegated_by_me') {
      return unifiedTasks.filter(t => t.isDelegatedByMe);
    }
    return unifiedTasks;
  }, [unifiedTasks, workListTab]);

  const handleOpenTaskDetails = (taskItem: any) => {
    // 1. Look for full task object in userWorkspace.assignedWork
    const fromWorkspace = (userWorkspace?.assignedWork || []).find(w =>
      w.id === taskItem.id ||
      w.taskId === taskItem.taskId ||
      (w.title && (w.title === taskItem.workTitle || w.title === taskItem.title))
    );

    const fullTask: UserAssignedWork = fromWorkspace || {
      id: taskItem.id || `task-${Date.now()}`,
      taskId: taskItem.taskId || `TSK-${String(taskItem.id).replace(/\D/g, '').slice(-4) || '9521'}`,
      title: taskItem.title || taskItem.workTitle || 'Assigned Work',
      department: taskItem.department || taskItem.departmentName || currentUser?.department || 'General',
      team: taskItem.team || taskItem.teamName || currentUser?.team || 'Team',
      priority: taskItem.priority || 'High',
      dueDate: taskItem.dueDate || 'Today',
      status: (taskItem.status as any) || 'In Progress',
      assignedBy: taskItem.assignedBy || (taskItem.assignmentType === 'user_to_self' ? `Self (${taskItem.assignerName || currentUser?.name || 'You'})` : `Team Member (${taskItem.assignerName || 'Colleague'})`),
      assignerRole: taskItem.assignerRole || 'user',
      assignmentType: taskItem.assignmentType || 'user_to_user',
      assignedOn: taskItem.assignedOn || (taskItem.createdAt ? new Date(taskItem.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Today'),
      description: taskItem.description || taskItem.workDescription || '',
      progress: taskItem.progress !== undefined ? Number(taskItem.progress) : (taskItem.status === 'Completed' ? 100 : taskItem.status === 'Under Review' ? 85 : 60),
      comments: taskItem.comments || [],
      attachments: taskItem.attachments || [],
      userId: taskItem.assigneeId || currentUser?.id,
      assigneeId: taskItem.assigneeId || currentUser?.id,
      assigneeName: taskItem.assigneeName || currentUser?.name,
      assigneeEmail: taskItem.assigneeEmail || currentUser?.email,
      assignedTo: taskItem.assigneeName || currentUser?.name
    };

    setDetailsOriginNav('assign-work');
    setSelectedUserTask(fullTask);
    setUserNav('details');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Set default selection when mode changes or teamMembers update
  useEffect(() => {
    setSubmitError('');
    setSubmitSuccess('');

    if (assignMode === 'user_to_user') {
      if (teamMembers.length > 0) {
        const defaultUser = teamMembers[0];
        setTargetId(defaultUser.id);
        setTargetName(defaultUser.name);
        setEmail(defaultUser.email || '');
        setRole(defaultUser.teamRole || 'Team Member');
      } else {
        setTargetId('');
        setTargetName('');
        setEmail('');
        setRole('Team Member');
      }
    } else if (assignMode === 'user_to_admin') {
      // user_to_admin
      const defaultAdmin = adminUsers[0] || { id: 'usr-admin', name: 'Administrator', email: 'bgsmchhospitalnagarur@gmail.com' };
      setTargetId(defaultAdmin.id);
      setTargetName(defaultAdmin.name);
      setEmail(defaultAdmin.email || '');
      setRole('Administrator');
    } else {
      // user_to_self
      setTargetId(currentUser?.id || 'usr-user');
      setTargetName(currentUser?.name || 'Self');
      setEmail(currentUser?.email || '');
      setRole(currentUser?.teamRole || (currentUser as any)?.roleTitle || 'Team Member');
    }
  }, [assignMode, allUsers, members, currentUser]);

  const handleUserSelect = (val: string) => {
    setTargetId(val);
    const u = teamMembers.find(m => m.id === val);
    if (u) {
      setTargetName(u.name);
      setEmail(u.email || '');
      setRole(u.teamRole || u.team || 'Team Member');
    }
  };

  const handleAdminSelect = (adminId: string) => {
    setTargetId(adminId);
    const a = adminUsers.find(u => u.id === adminId);
    if (a) {
      setTargetName(a.name);
      setEmail(a.email || '');
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

    if (assignMode === 'user_to_user' && !targetId) {
      setSubmitError('Please select a teammate in your team to assign work to.');
      return;
    }
    if (assignMode === 'user_to_admin' && !targetId) {
      setSubmitError('Please select an administrator.');
      return;
    }

    try {
      setSubmitting(true);
      const chosenDue = formatTaskDueDate(dueDate) || new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
      const finalTargetId = assignMode === 'user_to_self' ? (currentUser?.id || 'usr-user') : targetId;
      const finalTargetName = assignMode === 'user_to_self' ? (currentUser?.name || 'Self') : targetName;
      const finalEmail = assignMode === 'user_to_self' ? (currentUser?.email || '') : (email || '');

      await api.createAssignment({
        workTitle: workTitle.trim(),
        workDescription: workDescription.trim(),
        role: assignMode === 'user_to_self' ? (role || currentUser?.teamRole || 'Team Member') : role,
        priority,
        dueDate: chosenDue,
        status,
        // Any-to-Any metadata:
        assignerId: currentUser?.id || 'usr-user',
        assignerName: currentUser?.name || 'Team Member',
        assignerRole: 'user',
        assignerEmail: currentUser?.email || '',
        assigneeId: finalTargetId,
        assigneeName: finalTargetName,
        assigneeRole: assignMode === 'user_to_admin' ? 'admin' : 'user',
        assigneeEmail: finalEmail,
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
      setSubmitSuccess(
        assignMode === 'user_to_self'
          ? `Work "${workTitle.trim()}" successfully self-assigned to your workspace!`
          : `Work "${workTitle.trim()}" successfully assigned to ${targetName}!`
      );

      if (setUserToast) {
        setUserToast({
          id: Date.now().toString(),
          title: assignMode === 'user_to_self' ? 'Self Assigned Work' : 'Work Assigned',
          message: assignMode === 'user_to_self'
            ? `Work assignment "${workTitle.trim()}" added to your workspace.`
            : `Work assignment sent to ${targetName} successfully.`,
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
              Collaborate smoothly across roles: Assign work to your fellow team members (User &rarr; User), submit work requests to Administrators (User &rarr; Admin), or assign tasks directly to your personal workspace (Self Assign Work).
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
          <div className="flex items-center gap-1.5 p-1.5 bg-black/30 backdrop-blur-md rounded-2xl border border-white/10 shrink-0 flex-wrap">
            <button
              type="button"
              onClick={() => setAssignMode('user_to_user')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
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
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
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

            <button
              type="button"
              onClick={() => setAssignMode('user_to_self')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                assignMode === 'user_to_self'
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/40'
                  : 'text-[#a2a0c4] hover:text-white hover:bg-white/5'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Self Assign Work</span>
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
                assignMode === 'user_to_user' ? 'bg-emerald-50 text-emerald-600' :
                assignMode === 'user_to_admin' ? 'bg-amber-50 text-amber-600' :
                'bg-purple-50 text-purple-600'
              }`}>
                {assignMode === 'user_to_user' ? <UserIcon className="w-4 h-4" /> :
                 assignMode === 'user_to_admin' ? <Shield className="w-4 h-4" /> :
                 <UserCheck className="w-4 h-4" />}
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-sm">
                  {assignMode === 'user_to_user' ? 'Assign to Teammate (User → User)' :
                   assignMode === 'user_to_admin' ? 'Request from Admin (User → Admin)' :
                   'Self Assign Work (User → Self)'}
                </h3>
                <p className="text-[11px] text-gray-500">
                  {assignMode === 'user_to_user'
                    ? `Only showing teammates in your team (${currentUser?.team || 'Same Team'}).`
                    : assignMode === 'user_to_admin'
                    ? 'Work will be assigned to Administrator for action/review.'
                    : 'Create and assign a task directly to your personal workspace & schedule.'}
                </p>
              </div>
            </div>

            <span className={`px-2.5 py-1 rounded-full text-[11px] font-extrabold ${
              assignMode === 'user_to_user'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : assignMode === 'user_to_admin'
                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                : 'bg-purple-50 text-purple-700 border border-purple-200'
            }`}>
              {assignMode === 'user_to_user' ? 'User → User' :
               assignMode === 'user_to_admin' ? 'User → Admin' :
               'Self Assign'}
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
                  {assignMode === 'user_to_user' 
                    ? 'Select Teammate' 
                    : assignMode === 'user_to_admin' 
                    ? 'Select Administrator' 
                    : 'Assignee (Self)'} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  {assignMode === 'user_to_user' ? (
                    <UserIcon className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
                  ) : assignMode === 'user_to_admin' ? (
                    <Shield className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
                  ) : (
                    <UserCheck className="w-3.5 h-3.5 text-purple-600 absolute left-3 top-2.5" />
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
                  ) : assignMode === 'user_to_admin' ? (
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
                  ) : (
                    <input
                      type="text"
                      readOnly
                      value={`${currentUser?.name || 'You'} (Your Workspace)`}
                      className="w-full pl-8 pr-3 py-2 bg-purple-50/70 border border-purple-200 rounded-xl text-purple-900 font-semibold cursor-not-allowed"
                    />
                  )}
                </div>
                {assignMode === 'user_to_user' && teamMembers.length === 0 && (
                  <p className="text-[11px] text-amber-600 mt-1">
                    No other users are currently in your team. You can switch to <strong>User → Admin</strong> or <strong>Self Assign Work</strong>.
                  </p>
                )}
                {assignMode === 'user_to_self' && (
                  <p className="text-[11px] text-purple-600 mt-1 font-medium">
                    This task will be automatically assigned to you and appear in your personal dashboard.
                  </p>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold text-gray-700">
                    {assignMode === 'user_to_self' ? 'Your Email' : 'Recipient Email'}
                  </label>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200 select-none">
                    <Lock className="w-2.5 h-2.5 text-slate-400" /> Non-editable
                  </span>
                </div>
                <div className="relative flex items-center">
                  <Mail className="w-3.5 h-3.5 text-gray-400 absolute left-3 pointer-events-none" />
                  <div 
                    tabIndex={-1}
                    aria-readonly="true"
                    className="w-full pl-8 pr-8 py-2 bg-slate-100/90 border border-slate-200 rounded-xl text-slate-700 font-medium text-xs select-none cursor-not-allowed truncate min-h-[34px] flex items-center"
                  >
                    {assignMode === 'user_to_self' 
                      ? (currentUser?.email || 'Your account email') 
                      : (email || <span className="text-gray-400 font-normal">Select a teammate above to auto-link email</span>)
                    }
                  </div>
                  <Lock className="w-3.5 h-3.5 text-slate-400 absolute right-3 pointer-events-none" />
                </div>
                <p className="text-[10px] text-gray-500 mt-1">
                  {assignMode === 'user_to_self'
                    ? 'Automatically synced with your authenticated account email.'
                    : 'Auto-populated and permanently locked to the selected recipient’s registered email.'}
                </p>
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
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold text-gray-700">
                    Due Date <span className="text-red-500">*</span>
                  </label>
                  <span className="text-[10px] font-bold text-[#5a36e6] bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
                    {formatTaskDueDate(dueDate) || 'Select Date'}
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="date"
                    required
                    value={dueDate}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-gray-800 text-xs cursor-pointer"
                  />
                </div>
                <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setDueDate(new Date().toISOString().split('T')[0])}
                    className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-gray-100 hover:bg-indigo-50 hover:text-indigo-600 text-gray-600 transition cursor-pointer"
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const d = new Date();
                      d.setDate(d.getDate() + 1);
                      setDueDate(d.toISOString().split('T')[0]);
                    }}
                    className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-gray-100 hover:bg-indigo-50 hover:text-indigo-600 text-gray-600 transition cursor-pointer"
                  >
                    Tomorrow
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const d = new Date();
                      d.setDate(d.getDate() + 3);
                      setDueDate(d.toISOString().split('T')[0]);
                    }}
                    className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-gray-100 hover:bg-indigo-50 hover:text-indigo-600 text-gray-600 transition cursor-pointer"
                  >
                    +3 Days
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const d = new Date();
                      d.setDate(d.getDate() + 7);
                      setDueDate(d.toISOString().split('T')[0]);
                    }}
                    className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-gray-100 hover:bg-indigo-50 hover:text-indigo-600 text-gray-600 transition cursor-pointer"
                  >
                    +1 Week
                  </button>
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
                    ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-700/20 shadow-md'
                    : assignMode === 'user_to_admin'
                    ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-700/20 shadow-md'
                    : 'bg-purple-600 hover:bg-purple-700 shadow-purple-700/20 shadow-md'
                }`}
              >
                {assignMode === 'user_to_self' ? <UserCheck className="w-3.5 h-3.5" /> : <Send className="w-3.5 h-3.5" />}
                <span>
                  {submitting 
                    ? (assignMode === 'user_to_self' ? 'Self Assigning Work...' : 'Assigning Work...') 
                    : (assignMode === 'user_to_self' ? 'Self Assign Work' : 'Assign Work')}
                </span>
              </button>
            </div>
          </form>
        </div>

        {/* Right: Work Overview & Clickable Cards List (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-indigo-600" />
              <h3 className="font-bold text-gray-900 text-sm">Work Overview</h3>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-600 border border-indigo-100">
              {displayedTasks.length} {displayedTasks.length === 1 ? 'Task' : 'Tasks'}
            </span>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-gray-100/80 rounded-xl mb-4 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setWorkListTab('all')}
              className={`flex-1 py-1.5 px-2 rounded-lg transition text-center cursor-pointer ${
                workListTab === 'all'
                  ? 'bg-white text-indigo-700 shadow-xs font-bold'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              All ({unifiedTasks.length})
            </button>
            <button
              type="button"
              onClick={() => setWorkListTab('assigned_to_me')}
              className={`flex-1 py-1.5 px-2 rounded-lg transition text-center cursor-pointer ${
                workListTab === 'assigned_to_me'
                  ? 'bg-white text-indigo-700 shadow-xs font-bold'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Assigned to Me ({unifiedTasks.filter(t => t.isAssignedToMe || t.assignmentType === 'user_to_self').length})
            </button>
            <button
              type="button"
              onClick={() => setWorkListTab('delegated_by_me')}
              className={`flex-1 py-1.5 px-2 rounded-lg transition text-center cursor-pointer ${
                workListTab === 'delegated_by_me'
                  ? 'bg-white text-indigo-700 shadow-xs font-bold'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Delegated ({unifiedTasks.filter(t => t.isDelegatedByMe).length})
            </button>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto max-h-[500px] pr-1">
            {loadingDelegated ? (
              <div className="py-12 text-center text-xs text-gray-400">Loading work cards...</div>
            ) : displayedTasks.length === 0 ? (
              <div className="py-12 text-center text-xs text-gray-400">
                No work found in this view. Use the form on the left to assign or self-assign tasks.
              </div>
            ) : (
              displayedTasks.map((item) => {
                const priorityColor =
                  item.priority === 'High' ? 'bg-amber-500' :
                  item.priority === 'Low' ? 'bg-emerald-500' :
                  'bg-blue-500';

                const isSelf = item.assignmentType === 'user_to_self';
                const isIncoming = (item.isAssignedToMe && !isSelf);

                return (
                  <div
                    key={item.id}
                    onClick={() => handleOpenTaskDetails(item)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleOpenTaskDetails(item);
                      }
                    }}
                    title="Click to view full completed work details"
                    className="p-4 rounded-xl border border-gray-200/90 bg-white hover:bg-indigo-50/20 hover:border-[#5a36e6] hover:shadow-md transition-all cursor-pointer group space-y-2.5 relative overflow-hidden select-none focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                  >
                    {/* Top Priority Stripe */}
                    <div className={`absolute top-0 left-0 right-0 h-1 ${priorityColor}`} />

                    {/* Header Row: Title & Badges */}
                    <div className="flex items-start justify-between gap-2 pt-0.5">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                          <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                            {item.taskId || `TSK-${String(item.id).replace(/\D/g, '').slice(-4) || '9521'}`}
                          </span>
                          {isSelf && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                              Self Assign
                            </span>
                          )}
                          {!isSelf && item.assignmentType && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                              {item.assignmentType === 'user_to_user' ? 'User → User' : item.assignmentType === 'user_to_admin' ? 'User → Admin' : 'Admin → User'}
                            </span>
                          )}
                        </div>
                        <h4 className="font-bold text-xs text-gray-900 group-hover:text-[#5a36e6] transition-colors line-clamp-1">
                          {item.workTitle || item.title}
                        </h4>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          item.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                          item.status === 'Under Review' ? 'bg-purple-50 text-purple-700 border border-purple-200' :
                          'bg-blue-50 text-blue-700 border border-blue-200'
                        }`}>
                          {item.status}
                        </span>
                      </div>
                    </div>

                    {/* Description preview if present */}
                    {(item.workDescription || item.description) && (
                      <p className="text-[11px] text-gray-500 line-clamp-2 bg-gray-50/70 p-2 rounded-lg">
                        {item.workDescription || item.description}
                      </p>
                    )}

                    {/* People & Dates Row */}
                    <div className="flex items-center justify-between text-[11px] text-gray-500 pt-1 border-t border-gray-100">
                      <div className="flex items-center gap-1.5 min-w-0 truncate">
                        <span className="truncate">
                          {isSelf ? (
                            <span>By: <strong className="text-gray-700">Self ({currentUser?.name || 'You'})</strong></span>
                          ) : isIncoming ? (
                            <span>From: <strong className="text-gray-700">{item.assignerName || item.assignedBy || 'Colleague'}</strong></span>
                          ) : (
                            <span>To: <strong className="text-gray-700">{item.assigneeName || item.role}</strong></span>
                          )}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="flex items-center gap-1 text-[11px] text-gray-600 font-medium">
                          <Clock className="w-3 h-3 text-indigo-500" />
                          {formatTaskDueDate(item.dueDate) || 'Today'}
                        </span>
                        <span className="text-[#5a36e6] group-hover:translate-x-0.5 transition-transform flex items-center font-bold text-[10px]">
                          <ChevronRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
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

