import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import {
  Department,
  Team,
  Member,
  Assignment,
  Task,
  WorkDone,
  DashboardStats,
  UserWorkspaceData,
  UserAssignedWork,
  UserWorkHistory,
  Appointment,
  AppointmentStats,
  User,
  type Notification,
  AttendanceRecord,
  BreakTimeRecord,
  WorkRequest
} from '../types';
import { api, API_BASE } from '../services/api';
import { getSocket, connectSocketUser, disconnectSocket } from '../services/socket';
import { ToastItem, ToastType } from '../components/common/ToastContainer';
import { ConfirmModalProps } from '../components/common/ConfirmModal';

interface AppContextType {
  // Authentication & Session
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  login: (email: string, password: string) => Promise<{ success: boolean; requiresPasswordSetup?: boolean; name?: string; error?: string }>;
  createPassword: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateUserProfile: (data: { name?: string; avatar?: string; currentPassword?: string; newPassword?: string }) => Promise<{ success: boolean; error?: string }>;

  // Portal ('admin' | 'user') derived from logged-in user role
  portalMode: 'admin' | 'user';
  setPortalMode: (mode: 'admin' | 'user') => void;

  // Admin Navigation: 'dashboard' | 'appointments'
  adminNav: string;
  setAdminNav: (nav: string) => void;

  // Responsive Mobile Navigation
  mobileSidebarOpen: boolean;
  setMobileSidebarOpen: (open: boolean) => void;

  // Admin Dashboard State
  departments: Department[];
  selectedDepartment: Department | null;
  setSelectedDepartment: (dept: Department) => void;
  teams: Team[];
  selectedTeam: Team | null;
  setSelectedTeam: (team: Team) => void;
  members: Member[];
  assignments: Assignment[];
  tasks: Task[];
  workDone: WorkDone[];
  stats: DashboardStats | null;
  allUsers: User[];
  fetchAllUsers: () => Promise<void>;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  teamSubTab: string;
  setTeamSubTab: (tab: string) => void;
  loading: boolean;
  refreshAll: () => Promise<void>;

  // Modals & Editing
  isAddDeptOpen: boolean;
  setIsAddDeptOpen: (open: boolean) => void;
  editingDept: Department | null;
  setEditingDept: (dept: Department | null) => void;
  openEditDepartment: (dept: Department) => void;

  isAddTeamOpen: boolean;
  setIsAddTeamOpen: (open: boolean) => void;
  editingTeam: Team | null;
  setEditingTeam: (team: Team | null) => void;
  openEditTeam: (team: Team) => void;

  isAddMemberOpen: boolean;
  setIsAddMemberOpen: (open: boolean) => void;
  editingMember: Member | null;
  setEditingMember: (member: Member | null) => void;
  openEditMember: (member: Member) => void;

  isAddTaskOpen: boolean;
  setIsAddTaskOpen: (open: boolean) => void;
  isAddWorkDoneOpen: boolean;
  setIsAddWorkDoneOpen: (open: boolean) => void;

  // Actions
  handleToggleTask: (id: string) => Promise<void>;
  handleDeleteTask: (id: string) => Promise<void>;
  handleDeleteWorkDone: (id: string) => Promise<void>;
  handleDeleteAssignment: (id: string) => Promise<void>;
  handleDeleteMember: (id: string) => Promise<void>;
  handleDeleteDepartment: (id: string) => Promise<void>;
  handleDeleteTeam: (id: string) => Promise<void>;

  // User Portal (WorkHub) State
  userNav: string;
  setUserNav: (nav: string) => void;

  // Manager Navigation State
  managerNav: string;
  setManagerNav: (nav: string) => void;

  // Unified Non-Blocking Toast Notification System
  toastNotification: { message: string; type: 'success' | 'error' | 'info'; title?: string } | null;
  toasts: ToastItem[];
  notify: (message: string, type?: ToastType, title?: string, duration?: number) => string;
  dismissToast: (id: string) => void;
  clearNotification: () => void;

  // Custom Confirmation & Prompt Modal
  confirmModal: ConfirmModalProps | null;
  confirmAction: (options: {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'primary' | 'warning';
    isPrompt?: boolean;
    promptPlaceholder?: string;
    promptDefaultValue?: string;
  }) => Promise<string | boolean>;
  closeConfirmModal: () => void;
  selectedUserTask: UserAssignedWork | null;
  setSelectedUserTask: (task: UserAssignedWork | null) => void;
  selectedHistoryItem: UserWorkHistory | null;
  setSelectedHistoryItem: (item: UserWorkHistory | null) => void;
  userWorkspace: UserWorkspaceData | null;
  refreshUserWorkspace: () => Promise<void>;
  isSubmitWorkDrawerOpen: boolean;
  setIsSubmitWorkDrawerOpen: (open: boolean) => void;
  drawerSelectedTask: UserAssignedWork | null;
  openSubmitWorkDrawer: (task?: UserAssignedWork) => void;
  userFilterTab: string;
  setUserFilterTab: (tab: string) => void;
  userSearchQuery: string;
  setUserSearchQuery: (q: string) => void;
  handleSubmitWork: (payload: { taskId: string; workStatus: string; comment: string }) => Promise<void>;
  handleAddUserComment: (taskId: string, commentText: string, badge?: string) => Promise<void>;
  handleStartUserWork: (taskId: string) => Promise<void>;

  // Review & Approval Workflow (Admin Action -> User Sync)
  handleApproveWork: (taskId: string, comment?: string) => Promise<void>;
  handleRequestRework: (taskId: string, feedback: string) => Promise<void>;

  // Appointments State
  appointments: Appointment[];
  appointmentStats: AppointmentStats | null;
  selectedAppointmentDate: string;
  setSelectedAppointmentDate: (date: string) => void;
  appointmentFilterTab: string;
  setAppointmentFilterTab: (tab: string) => void;
  appointmentSearchQuery: string;
  setAppointmentSearchQuery: (q: string) => void;
  isAppointmentModalOpen: boolean;
  setIsAppointmentModalOpen: (open: boolean) => void;
  editingAppointment: Appointment | null;
  setEditingAppointment: (apt: Appointment | null) => void;
  handleCreateAppointment: (data: Partial<Appointment>) => Promise<void>;
  handleUpdateAppointment: (id: string, data: Partial<Appointment>) => Promise<void>;
  handleDeleteAppointment: (id: string) => Promise<void>;
  refreshAppointments: () => Promise<void>;

  // Notifications
  notifications: Notification[];
  unreadNotificationCount: number;
  handleMarkNotificationRead: (id: string) => Promise<void>;
  handleMarkAllNotificationsRead: () => Promise<void>;
  refreshNotifications: () => Promise<void>;

  // Real-Time Messages
  unreadMessagesCount: number;
  refreshUnreadMessagesCount: () => Promise<void>;

  // Redirect / Scroll helper
  scrollToSection: (sectionId: string) => void;

  // Real-time Admin & User Toast & WPPConnect
  adminToast: { id: string; title: string; message: string; timestamp: Date } | null;
  setAdminToast: (toast: { id: string; title: string; message: string; timestamp: Date } | null) => void;
  userToast: { id: string; title: string; message: string; timestamp: Date } | null;
  setUserToast: (toast: { id: string; title: string; message: string; timestamp: Date } | null) => void;
  wppStatus: any;
  fetchWppStatus: () => Promise<void>;
  restartWpp: (clean?: boolean) => Promise<void>;

  // Attendance & Time Tracking
  todayAttendance: AttendanceRecord | null;
  liveAttendanceSeconds: number;
  isAttendanceLoading: boolean;
  attendanceRecords: AttendanceRecord[];
  refreshTodayAttendance: () => Promise<void>;
  refreshAttendanceRecords: () => Promise<void>;
  handlePunchIn: () => Promise<void>;
  handlePunchOut: () => Promise<void>;
  handleStartTimer: (taskId: string) => Promise<void>;
  handlePauseTimer: (taskId: string, reason: string) => Promise<void>;
  handleResumeTimer: (taskId: string) => Promise<void>;
  handleFinishTimer: (taskId: string) => Promise<void>;
  handleEditAssignment: (id: string, data: any) => Promise<void>;
  isManagerOrAdmin: boolean;

  // Break Time Management
  activeTeamBreaks: BreakTimeRecord[];
  todayTeamBreaks: BreakTimeRecord[];
  refreshActiveBreaks: () => Promise<void>;
  refreshTodayBreaks: () => Promise<void>;
  handleStartBreak: (payload: {
    fromTime: string;
    toTime: string;
    fromTimestamp?: string;
    toTimestamp?: string;
    durationMinutes?: number;
    timezoneOffset?: number;
    reason?: string;
  }) => Promise<void>;
  handleUpdateBreak: (
    breakId: string,
    payload: {
      fromTime?: string;
      toTime?: string;
      fromTimestamp?: string;
      toTimestamp?: string;
      durationMinutes?: number;
      timezoneOffset?: number;
      reason?: string;
    }
  ) => Promise<void>;
  handleEndBreak: (breakId: string) => Promise<void>;
  handleDeleteBreak: (breakId: string) => Promise<void>;

  // External Work Requests (Assign Extra Work)
  workRequests: WorkRequest[];
  refreshWorkRequests: () => Promise<void>;
  handleApproveWorkRequest: (id: string) => Promise<void>;
  handleRejectWorkRequest: (id: string, reason?: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const BANNED_EMAILS = [
  'admin@company.com',
  'user@company.com',
  'rahul@company.com',
  'priya@company.com',
  'amit@company.com',
  'sneha@company.com'
];

export const isBannedEmail = (email?: string): boolean => {
  if (!email) return false;
  const clean = email.trim().toLowerCase();
  return BANNED_EMAILS.includes(clean) || clean.endsWith('@company.com');
};

// Check if a user holds a Manager, Head, Lead, or Administrator role
export const isUserManager = (user?: User | null, member?: Member | null): boolean => {
  if (!user && !member) return false;
  if (user && (user.role === 'admin' || (user.role as any) === 'manager')) return true;
  const roleString = [
    user?.role,
    user?.teamRole,
    user?.title,
    member?.role
  ].filter(Boolean).join(' ').toLowerCase();

  return roleString.includes('admin') ||
    roleString.includes('manager') ||
    roleString.includes('head') ||
    roleString.includes('lead');
};

// Helper to format due dates properly, replacing text strings like "Today" with proper formatted date
export const formatTaskDueDate = (dueDate?: string): string => {
  if (!dueDate) return '';
  const trimmed = dueDate.trim();
  if (trimmed.toLowerCase() === 'today') {
    return new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  }
  if (trimmed.toLowerCase() === 'tomorrow') {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    try {
      const d = new Date(trimmed);
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
      }
    } catch { }
  }
  return trimmed;
};

// Check if a task is directly assigned to a specific user (by ID, memberId, email, or assignee name)
export const isTaskAssignedToUser = (
  task: UserAssignedWork,
  user: User | null,
  member?: Member | null
): boolean => {
  if (!task || !user) return false;
  const myId = (user.id || '').trim();
  const myMemberId = ((user as any).memberId || member?.id || '').trim();
  const myEmail = (user.email || '').trim().toLowerCase();
  const myName = (user.name || member?.name || '').trim().toLowerCase();

  // Match by user / assignee ID
  if (myId && (task.userId === myId || (task as any).assigneeId === myId)) return true;
  if (myMemberId && ((task as any).memberId === myMemberId || task.userId === myMemberId || (task as any).assigneeId === myMemberId)) return true;

  // Match by email
  if (myEmail && (task as any).assigneeEmail && (task as any).assigneeEmail.trim().toLowerCase() === myEmail) return true;

  // Match by assigneeName or assignedTo
  const taskAssignee = ((task as any).assigneeName || (task as any).assignedTo || '').trim().toLowerCase();
  if (myName && taskAssignee) {
    if (taskAssignee === myName) return true;
    const myFirst = myName.split(' ')[0];
    if (myFirst && myFirst.length >= 2 && taskAssignee.includes(myFirst)) return true;
    const taskFirst = taskAssignee.split(' ')[0];
    if (taskFirst && taskFirst.length >= 2 && myName.includes(taskFirst)) return true;
  }

  return false;
};

// Visibility Isolation:
// - Managers & Admins can see ALL teams' member works when managing.
// - Regular team members can ONLY see works assigned directly to them.
export const filterTasksForUser = (tasks: UserAssignedWork[], user: User | null, member?: Member | null): UserAssignedWork[] => {
  if (!tasks || !Array.isArray(tasks)) return [];
  if (!user) return [];

  // For regular team members, strictly isolate to their own assigned tasks
  if (user.role === 'user' || !isUserManager(user, member)) {
    return tasks.filter(t => isTaskAssignedToUser(t, user, member));
  }

  // Managers and Admins can see all tasks
  return tasks;
};

// Helper to calculate total attendance seconds accurately (completed punches + live active punch)
export const calculateTotalAttendanceSeconds = (rec: AttendanceRecord | null): number => {
  if (!rec) return 0;

  let completed = 0;
  let activePunchInTime: number | null = null;

  if (Array.isArray(rec.punches) && rec.punches.length > 0) {
    for (const p of rec.punches) {
      if (!p.punchIn) continue;
      const inTime = new Date(p.punchIn).getTime();
      if (isNaN(inTime)) continue;

      if (p.punchOut) {
        const outTime = new Date(p.punchOut).getTime();
        if (!isNaN(outTime) && outTime >= inTime) {
          const dur = (typeof p.durationSeconds === 'number' && p.durationSeconds > 0)
            ? p.durationSeconds
            : Math.round((outTime - inTime) / 1000);
          completed += dur;
        }
      } else {
        // Active unclosed punch
        activePunchInTime = inTime;
      }
    }
  } else if (rec.totalSeconds && rec.totalSeconds > 0) {
    completed = rec.totalSeconds;
  }

  if (rec.status === 'punched_in') {
    if (!activePunchInTime && rec.currentPunchIn) {
      const cIn = new Date(rec.currentPunchIn).getTime();
      if (!isNaN(cIn)) activePunchInTime = cIn;
    }
    if (!activePunchInTime && Array.isArray(rec.punches) && rec.punches.length > 0) {
      const last = rec.punches[rec.punches.length - 1];
      if (last?.punchIn) {
        const lastIn = new Date(last.punchIn).getTime();
        if (!isNaN(lastIn)) activePunchInTime = lastIn;
      }
    }

    if (activePunchInTime) {
      const activeElapsed = Math.max(0, Math.floor((Date.now() - activePunchInTime) / 1000));
      return completed + activeElapsed;
    }
  }

  return Math.max(completed, rec.totalSeconds || 0);
};

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Session / Authentication state: default to stored user or null (Login Page)
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('workhub_user');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      // fallback
    }
    return null;
  });

  // Admin navigation
  const [adminNav, setAdminNav] = useState<string>('dashboard');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState<boolean>(false);

  // Admin states
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<Member[]>([]);

  // Modifiable portal mode for managers/admins (toggle between 'admin' Panel and 'user' Workspace)
  const [portalModeState, setPortalModeState] = useState<'admin' | 'user'>(() => {
    try {
      const saved = localStorage.getItem('workhub_portal_mode');
      if (saved === 'admin' || saved === 'user') return saved;
    } catch (_) { }
    return 'user';
  });

  // Find member corresponding to current user to check manager role accurately
  const myMember = (members || []).find(m =>
    (currentUser?.id && (m.id === currentUser.id || (m as any).userId === currentUser.id)) ||
    (currentUser?.email && m.email && m.email.toLowerCase() === currentUser.email.toLowerCase())
  );

  const isMgr = isUserManager(currentUser, myMember);
  // Non-managers are strictly locked to 'user' mode.
  // Managers can seamlessly toggle between 'user' (Manager Workspace) and 'admin' (Manager Panel).
  const portalMode: 'admin' | 'user' = !currentUser ? 'admin' : (!isMgr ? 'user' : portalModeState);

  const setPortalMode = (mode: 'admin' | 'user') => {
    if (mode === 'admin' && !isUserManager(currentUser, myMember)) {
      setPortalModeState('user');
      return;
    }
    setPortalModeState(mode);
    try {
      localStorage.setItem('workhub_portal_mode', mode);
    } catch (_) { }
  };
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [workDone, setWorkDone] = useState<WorkDone[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [activeTab, setActiveTab] = useState<string>('Teams');
  const [teamSubTab, setTeamSubTab] = useState<string>('Members');
  const [loading, setLoading] = useState<boolean>(true);

  // User Portal states
  const [userNav, setUserNav] = useState<string>('dashboard');
  const [managerNav, setManagerNav] = useState<string>('dashboard');
  const [toastNotification, setToastNotification] = useState<{ message: string; type: 'success' | 'error' | 'info'; title?: string } | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [confirmModal, setConfirmModal] = useState<ConfirmModalProps | null>(null);

  const notify = (
    message: string,
    type: ToastType = 'success',
    title?: string,
    duration?: number
  ): string => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    setToasts(prev => {
      // Prevent duplicate notifications if same message is already visible
      if (prev.some(t => t.message === message)) return prev;
      return [...prev, { id, message, type, title, duration }];
    });

    const defaultDuration =
      type === 'error' ? 8000 : type === 'warning' ? 5000 : type === 'processing' ? 30000 : 4000;
    const time = duration ?? defaultDuration;

    if (time > 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, time);
    }

    // Keep backwards compatibility with single toastNotification
    setToastNotification({
      message,
      type: type === 'warning' || type === 'processing' ? 'info' : type,
      title
    });

    return id;
  };

  const dismissToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const clearNotification = () => {
    setToastNotification(null);
    setToasts([]);
  };

  const confirmAction = (options: {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'primary' | 'warning';
    isPrompt?: boolean;
    promptPlaceholder?: string;
    promptDefaultValue?: string;
  }): Promise<string | boolean> => {
    return new Promise((resolve) => {
      setConfirmModal({
        isOpen: true,
        ...options,
        onConfirm: (val) => {
          setConfirmModal(null);
          resolve(options.isPrompt ? (val ?? '') : true);
        },
        onCancel: () => {
          setConfirmModal(null);
          resolve(false);
        }
      });
    });
  };

  const closeConfirmModal = () => setConfirmModal(null);
  const [selectedUserTask, setSelectedUserTask] = useState<UserAssignedWork | null>(null);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<UserWorkHistory | null>(null);
  const [userWorkspace, setUserWorkspace] = useState<UserWorkspaceData | null>(null);
  const [isSubmitWorkDrawerOpen, setIsSubmitWorkDrawerOpen] = useState(false);
  const [drawerSelectedTask, setDrawerSelectedTask] = useState<UserAssignedWork | null>(null);
  const [userFilterTab, setUserFilterTab] = useState<string>('In Progress');
  const [userSearchQuery, setUserSearchQuery] = useState<string>('');

  // Appointments states
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [appointmentStats, setAppointmentStats] = useState<AppointmentStats | null>(null);
  const [selectedAppointmentDate, setSelectedAppointmentDate] = useState<string>('2026-11-05');
  const [appointmentFilterTab, setAppointmentFilterTab] = useState<string>('All');
  const [appointmentSearchQuery, setAppointmentSearchQuery] = useState<string>('');
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);

  // Notifications state
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [adminToast, setAdminToast] = useState<{ id: string; title: string; message: string; timestamp: Date } | null>(null);
  const [userToast, setUserToast] = useState<{ id: string; title: string; message: string; timestamp: Date } | null>(null);

  // WPPConnect Status
  const [wppStatus, setWppStatus] = useState<any>(null);

  const fetchWppStatus = async () => {
    try {
      const res = await api.getWppStatus();
      setWppStatus(res);
    } catch (e) {
      // ignore
    }
  };

  const restartWpp = async (clean: boolean = false) => {
    try {
      await api.restartWpp(clean);
      await fetchWppStatus();
    } catch (e) {
      console.warn(e);
    }
  };

  useEffect(() => {
    fetchWppStatus();
    const interval = setInterval(() => {
      fetchWppStatus();
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  // Attendance & Task Time Tracking
  const [todayAttendance, setTodayAttendance] = useState<AttendanceRecord | null>(() => {
    try {
      const saved = localStorage.getItem('workhub_today_attendance');
      if (saved) return JSON.parse(saved);
    } catch {}
    return null;
  });
  const [liveAttendanceSeconds, setLiveAttendanceSeconds] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('workhub_today_attendance');
      if (saved) {
        return calculateTotalAttendanceSeconds(JSON.parse(saved));
      }
    } catch {}
    return 0;
  });
  const todayAttendanceRef = useRef<AttendanceRecord | null>(todayAttendance);
  const [isAttendanceLoading, setIsAttendanceLoading] = useState<boolean>(true);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);

  useEffect(() => {
    todayAttendanceRef.current = todayAttendance;
    setLiveAttendanceSeconds(calculateTotalAttendanceSeconds(todayAttendance));
    if (todayAttendance) {
      try {
        localStorage.setItem('workhub_today_attendance', JSON.stringify(todayAttendance));
      } catch {}
    }
  }, [todayAttendance]);

  // Central 1-second ticker that never unmounts while user is logged in
  useEffect(() => {
    const tick = () => {
      const rec = todayAttendanceRef.current;
      if (rec && rec.status === 'punched_in') {
        const currentSecs = calculateTotalAttendanceSeconds(rec);
        setLiveAttendanceSeconds(currentSecs);
      }
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);

  const isManagerOrAdmin = Boolean(
    currentUser?.role === 'admin' ||
    currentUser?.role === 'manager' ||
    isUserManager(currentUser, myMember) ||
    currentUser?.teamRole === 'Manager' ||
    currentUser?.teamRole === 'Team Lead' ||
    currentUser?.teamRole === 'Team Head' ||
    (currentUser?.teamRole && currentUser.teamRole.toLowerCase().includes('head')) ||
    (currentUser?.teamRole && currentUser.teamRole.toLowerCase().includes('manager')) ||
    (currentUser?.teamRole && currentUser.teamRole.toLowerCase().includes('lead'))
  );

  const refreshTodayAttendance = async () => {
    if (!currentUser) {
      setIsAttendanceLoading(false);
      return;
    }
    try {
      const rec = await api.getTodayAttendance(currentUser.id, currentUser.email);
      setTodayAttendance(rec);
    } catch (e) {
      console.warn('Could not fetch attendance:', e);
    } finally {
      setIsAttendanceLoading(false);
    }
  };

  const refreshAttendanceRecords = async () => {
    if (!currentUser) return;
    try {
      const records = await api.getAttendanceRecords(currentUser.id, currentUser.email);
      setAttendanceRecords(records || []);
    } catch (e) {
      console.warn('Could not fetch attendance records:', e);
    }
  };

  useEffect(() => {
    if (currentUser) {
      refreshTodayAttendance();
      refreshAttendanceRecords();
    }
  }, [currentUser?.id, currentUser?.email]);

  // Real-time midnight auto-punch-out watcher:
  // Checks if the date has rolled over past midnight 11:59 PM to auto-close sessions and update UI
  useEffect(() => {
    if (!currentUser) return;

    const checkMidnightRollover = () => {
      const now = new Date();
      const localTodayStr = new Date(now.getTime() - (now.getTimezoneOffset() * 60000)).toISOString().split('T')[0];

      if (todayAttendance?.status === 'punched_in' && todayAttendance.date && todayAttendance.date < localTodayStr) {
        // Date rolled over while user was punched in!
        api.autoMidnightPunchOut().finally(() => {
          refreshTodayAttendance();
          refreshAttendanceRecords();
        });
      }
    };

    const interval = setInterval(checkMidnightRollover, 15000);
    return () => clearInterval(interval);
  }, [currentUser?.id, todayAttendance?.status, todayAttendance?.date]);

  const handlePunchIn = async () => {
    if (!currentUser) return;
    try {
      const rec = await api.punchIn({
        userId: currentUser.id,
        userEmail: currentUser.email,
        userName: currentUser.name,
        teamId: currentUser.team,
        departmentId: currentUser.department
      });
      setTodayAttendance(rec);
      todayAttendanceRef.current = rec;
      setLiveAttendanceSeconds(calculateTotalAttendanceSeconds(rec));
      try {
        localStorage.setItem('workhub_today_attendance', JSON.stringify(rec));
      } catch {}
      await Promise.all([refreshTodayAttendance(), refreshAttendanceRecords()]);
      notify('Punch in recorded successfully!', 'success', 'Attendance');
    } catch (e: any) {
      notify(e.message || 'Failed to punch in', 'error', 'Attendance Error');
    }
  };

  const handlePunchOut = async () => {
    if (!currentUser) return;
    try {
      const rec = await api.punchOut({
        userId: currentUser.id,
        userEmail: currentUser.email
      });
      setTodayAttendance(rec);
      todayAttendanceRef.current = rec;
      setLiveAttendanceSeconds(calculateTotalAttendanceSeconds(rec));
      try {
        localStorage.setItem('workhub_today_attendance', JSON.stringify(rec));
      } catch {}
      await Promise.all([refreshTodayAttendance(), refreshAttendanceRecords()]);
      notify('Punch out recorded successfully!', 'success', 'Attendance');
    } catch (e: any) {
      notify(e.message || 'Failed to punch out', 'error', 'Attendance Error');
    }
  };

  // Break Time Management
  const [activeTeamBreaks, setActiveTeamBreaks] = useState<BreakTimeRecord[]>([]);
  const [todayTeamBreaks, setTodayTeamBreaks] = useState<BreakTimeRecord[]>([]);

  const refreshActiveBreaks = async () => {
    if (!currentUser) return;
    try {
      const myMem = (members || []).find(m =>
        (currentUser.id && (m.id === currentUser.id || (m as any).userId === currentUser.id)) ||
        (currentUser.email && m.email && m.email.toLowerCase() === currentUser.email.toLowerCase())
      );
      const teamId = myMem?.teamId || (currentUser as any)?.teamId || currentUser.team || '';
      const teamName = currentUser.team || myMem?.role || '';
      const departmentId = myMem?.departmentId || (currentUser as any)?.departmentId || currentUser.department || '';
      const departmentName = currentUser.department || '';
      const userRole = currentUser.role || 'user';
      const list = await api.getActiveBreaks(teamId, teamName, currentUser.id, departmentId, departmentName, userRole, currentUser.email);
      setActiveTeamBreaks(list || []);
    } catch (e) {
      console.warn('Could not fetch active breaks:', e);
    }
  };

  const refreshTodayBreaks = async () => {
    if (!currentUser) return;
    try {
      const myMem = (members || []).find(m =>
        (currentUser.id && (m.id === currentUser.id || (m as any).userId === currentUser.id)) ||
        (currentUser.email && m.email && m.email.toLowerCase() === currentUser.email.toLowerCase())
      );
      const teamId = myMem?.teamId || (currentUser as any)?.teamId || currentUser.team || '';
      const teamName = currentUser.team || myMem?.role || '';
      const departmentId = myMem?.departmentId || (currentUser as any)?.departmentId || currentUser.department || '';
      const departmentName = currentUser.department || '';
      const userRole = currentUser.role || 'user';
      const list = await api.getTodayBreaks(teamId, teamName, currentUser.id, departmentId, departmentName, userRole, currentUser.email);
      setTodayTeamBreaks(list || []);
    } catch (e) {
      console.warn('Could not fetch today breaks:', e);
    }
  };

  useEffect(() => {
    if (currentUser) {
      refreshActiveBreaks();
      refreshTodayBreaks();
      refreshWorkRequests();
      const interval = setInterval(() => {
        refreshActiveBreaks();
        refreshWorkRequests();
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [currentUser?.id, currentUser?.email, currentUser?.team, currentUser?.department]);

  // External Work Requests (Assign Extra Work)
  const [workRequests, setWorkRequests] = useState<WorkRequest[]>([]);

  const refreshWorkRequests = async () => {
    if (!currentUser) return;
    try {
      const userRole = currentUser.role || 'user';
      const list = await api.getWorkRequests({
        userId: currentUser.id,
        userEmail: currentUser.email,
        userRole,
        managerId: userRole === 'manager' ? currentUser.id : undefined
      });
      setWorkRequests(list || []);
    } catch (e) {
      console.warn('Could not fetch work requests:', e);
    }
  };

  const handleStartBreak = async (payload: {
    fromTime: string;
    toTime: string;
    fromTimestamp?: string;
    toTimestamp?: string;
    durationMinutes?: number;
    timezoneOffset?: number;
    reason?: string;
  }) => {
    if (!currentUser) return;
    try {
      const myMem = (members || []).find(m =>
        (currentUser.id && (m.id === currentUser.id || (m as any).userId === currentUser.id)) ||
        (currentUser.email && m.email && m.email.toLowerCase() === currentUser.email.toLowerCase())
      );
      const teamId = myMem?.teamId || (currentUser as any)?.teamId || currentUser.team || '';
      const teamName = currentUser.team || myMem?.role || '';
      const departmentId = myMem?.departmentId || (currentUser as any)?.departmentId || currentUser.department || '';
      const departmentName = currentUser.department || '';

      await api.recordBreak({
        userId: currentUser.id,
        userName: currentUser.name,
        userEmail: currentUser.email,
        userRole: currentUser.role || 'user',
        teamId,
        teamName,
        departmentId,
        departmentName,
        fromTime: payload.fromTime,
        toTime: payload.toTime,
        fromTimestamp: payload.fromTimestamp,
        toTimestamp: payload.toTimestamp,
        durationMinutes: payload.durationMinutes,
        timezoneOffset: payload.timezoneOffset !== undefined ? payload.timezoneOffset : new Date().getTimezoneOffset(),
        reason: payload.reason || 'Break'
      });

      await Promise.all([refreshActiveBreaks(), refreshTodayBreaks(), refreshNotifications()]);
      notify(`Break notice scheduled (${payload.fromTime} - ${payload.toTime}).`, 'success', 'Break Time');
    } catch (e: any) {
      notify(e.message || 'Failed to start break', 'error', 'Break Error');
      throw e;
    }
  };

  const handleEndBreak = async (breakId: string) => {
    if (!currentUser) return;
    try {
      await api.endBreakEarly(breakId, currentUser.id);
      await Promise.all([refreshActiveBreaks(), refreshTodayBreaks(), refreshNotifications()]);
      notify('Break ended successfully. Welcome back!', 'success', 'Break Time');
    } catch (e: any) {
      notify(e.message || 'Failed to end break', 'error', 'Break Error');
      throw e;
    }
  };

  const handleUpdateBreak = async (
    breakId: string,
    payload: {
      fromTime?: string;
      toTime?: string;
      fromTimestamp?: string;
      toTimestamp?: string;
      durationMinutes?: number;
      timezoneOffset?: number;
      reason?: string;
    }
  ) => {
    if (!currentUser) return;
    try {
      await api.updateBreak(breakId, {
        ...payload,
        timezoneOffset: payload.timezoneOffset !== undefined ? payload.timezoneOffset : new Date().getTimezoneOffset(),
        userId: currentUser.id
      });
      await Promise.all([refreshActiveBreaks(), refreshTodayBreaks(), refreshNotifications()]);
      notify('Break time schedule updated successfully.', 'success', 'Break Time');
    } catch (e: any) {
      notify(e.message || 'Failed to update break', 'error', 'Break Error');
      throw e;
    }
  };

  const handleDeleteBreak = async (breakId: string) => {
    if (!currentUser) return;
    const confirmed = await confirmAction({
      title: 'Delete Break Record',
      message: 'Are you sure you want to delete this break record? This action will remove it permanently.',
      confirmText: 'Delete Break',
      cancelText: 'Keep',
      variant: 'danger'
    });
    if (!confirmed) return;

    try {
      await api.deleteBreak(breakId, currentUser.id, currentUser.role);
      await Promise.all([refreshActiveBreaks(), refreshTodayBreaks(), refreshNotifications()]);
      notify('Break record deleted successfully.', 'success', 'Break Time');
    } catch (e: any) {
      notify(e.message || 'Failed to delete break', 'error', 'Break Error');
      throw e;
    }
  };

  const handleApproveWorkRequest = async (id: string) => {
    if (!currentUser) return;
    try {
      await api.approveWorkRequest(id, {
        managerId: currentUser.id,
        managerName: currentUser.name,
        managerEmail: currentUser.email
      });
      await Promise.all([
        refreshWorkRequests(),
        refreshUserWorkspace(),
        fetchAssignments(),
        refreshNotifications()
      ]);
      notify('External work request approved and assigned successfully!', 'success', 'Work Assignment');
    } catch (e: any) {
      notify(e.message || 'Failed to approve work request', 'error', 'Approval Error');
      throw e;
    }
  };

  const handleRejectWorkRequest = async (id: string, reason?: string) => {
    if (!currentUser) return;
    try {
      await api.rejectWorkRequest(id, {
        managerId: currentUser.id,
        managerName: currentUser.name,
        reason
      });
      await Promise.all([
        refreshWorkRequests(),
        refreshNotifications()
      ]);
      notify('Work request declined.', 'info', 'Work Request');
    } catch (e: any) {
      notify(e.message || 'Failed to reject work request', 'error', 'Error');
      throw e;
    }
  };

  const handleStartTimer = async (taskId: string) => {
  if (!currentUser) return;
  try {
    await api.startTaskTimer(taskId, currentUser);
    await refreshUserWorkspace();
    notify('Task work timer started.', 'info', 'Timer');
  } catch (e: any) {
    notify(e.message || 'Failed to start timer', 'error', 'Timer Error');
  }
};

const handlePauseTimer = async (taskId: string, reason: string) => {
  if (!currentUser) return;
  try {
    await api.pauseTaskTimer(taskId, currentUser, reason);
    await refreshUserWorkspace();
    notify('Task timer paused.', 'info', 'Timer');
  } catch (e: any) {
    notify(e.message || 'Failed to pause timer', 'error', 'Timer Error');
  }
};

const handleResumeTimer = async (taskId: string) => {
  if (!currentUser) return;
  try {
    await api.resumeTaskTimer(taskId, currentUser);
    await refreshUserWorkspace();
    notify('Task timer resumed.', 'info', 'Timer');
  } catch (e: any) {
    notify(e.message || 'Failed to resume timer', 'error', 'Timer Error');
  }
};

const handleFinishTimer = async (taskId: string) => {
  if (!currentUser) return;
  try {
    await api.finishTaskTimer(taskId, currentUser);
    await refreshUserWorkspace();
    notify('Task timer stopped and duration recorded.', 'success', 'Timer Finished');
  } catch (e: any) {
    notify(e.message || 'Failed to finish timer', 'error', 'Timer Error');
  }
};

const handleEditAssignment = async (id: string, data: any) => {
  try {
    const res = await api.editAssignment(id, {
      ...data,
      operatorId: currentUser?.id,
      operatorName: currentUser?.name,
      operatorRole: currentUser?.role,
      operatorTeamRole: currentUser?.teamRole
    });
    if (res?.userTask) {
      if (selectedUserTask && (selectedUserTask.id === id || selectedUserTask.taskId === id || (data.taskId && selectedUserTask.taskId === data.taskId))) {
        setSelectedUserTask(prev => prev ? { ...prev, ...res.userTask } : res.userTask);
      }
      setUserWorkspace(prev => {
        if (!prev) return prev;
        const assignedWork = (prev.assignedWork || []).map(t =>
          (t.id === id || t.taskId === id || (data.taskId && t.taskId === data.taskId)) ? { ...t, ...res.userTask } : t
        );
        return { ...prev, assignedWork };
      });
    }
    const refreshPromises: Promise<any>[] = [refreshUserWorkspace(), fetchAssignments(), fetchTasks()];
    if (selectedTeam) {
      refreshPromises.push(fetchWorkDone(selectedTeam.id));
    }
    await Promise.all(refreshPromises);
    notify('Assignment updated successfully.', 'success', 'Task Updated');
    return res;
  } catch (e: any) {
    console.error('Failed to edit assignment:', e);
    notify(e.message || 'Failed to edit assignment', 'error', 'Update Failed');
    throw e;
  }
};

// Modals & Edit States
const [isAddDeptOpen, setIsAddDeptOpen] = useState(false);
const [editingDept, setEditingDept] = useState<Department | null>(null);

const [isAddTeamOpen, setIsAddTeamOpen] = useState(false);
const [editingTeam, setEditingTeam] = useState<Team | null>(null);

const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
const [editingMember, setEditingMember] = useState<Member | null>(null);

const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
const [isAddWorkDoneOpen, setIsAddWorkDoneOpen] = useState(false);

const scrollToSection = (sectionId: string) => {
  const el = document.getElementById(sectionId);
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
};

// Auth Functions
const login = async (email: string, pass: string): Promise<{ success: boolean; requiresPasswordSetup?: boolean; name?: string; error?: string }> => {
  try {
    const res = await api.login(email, pass);
    if (res.success && res.user) {
      setCurrentUser(res.user);
      try {
        localStorage.setItem('workhub_user', JSON.stringify(res.user));
      } catch (e) {
        // ignore
      }
      await refreshAll();
      return { success: true };
    }
    if (res.requiresPasswordSetup) {
      return { success: false, requiresPasswordSetup: true, name: res.name || 'Team Member' };
    }
    return { success: false, error: res.error || 'Invalid credentials' };
  } catch (e: any) {
    return { success: false, error: e.message || 'Login failed' };
  }
};

const createPassword = async (email: string, pass: string): Promise<boolean> => {
  try {
    const res = await api.createPassword(email, pass);
    if (res.success && res.user) {
      setCurrentUser(res.user);
      try {
        localStorage.setItem('workhub_user', JSON.stringify(res.user));
      } catch (e) {
        // ignore
      }
      await refreshAll();
      return true;
    }
    return false;
  } catch (e: any) {
    alert(e.message || 'Failed to create password');
    return false;
  }
};

const logout = () => {
  setCurrentUser(null);
  setUserNav('dashboard');
  setAdminNav('dashboard');
  setMobileSidebarOpen(false);
  disconnectSocket();
  try {
    localStorage.removeItem('workhub_user');
  } catch (e) {
    // ignore
  }
};

const updateUserProfile = async (data: { name?: string; avatar?: string; currentPassword?: string; newPassword?: string }) => {
  if (!currentUser) return { success: false, error: 'User is not logged in' };
  try {
    const res = await api.updateUserProfile({
      identifier: currentUser.id || currentUser.email,
      ...data
    });
    if (res.success && res.user) {
      setCurrentUser(res.user);
      try {
        localStorage.setItem('workhub_user', JSON.stringify(res.user));
      } catch (e) {
        // ignore
      }
      return { success: true };
    }
    return { success: false, error: 'Failed to update profile' };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to update profile' };
  }
};

const fetchStats = async () => {
  try {
    const data = await api.getStats();
    setStats(data);
  } catch (e) {
    console.error(e);
  }
};

const fetchDepartments = async () => {
  try {
    const data = await api.getDepartments();
    setDepartments(data);
    if (data.length === 0) {
      setSelectedDepartment(null);
      setSelectedTeam(null);
    } else if (!selectedDepartment || !data.some(d => d.id === selectedDepartment.id)) {
      setSelectedDepartment(data[0]);
    }
  } catch (e) {
    console.error(e);
  }
};

const fetchTeams = async (deptId: string) => {
  try {
    const data = await api.getTeams(deptId);
    setTeams(data);
    if (data.length > 0) {
      setSelectedTeam(prev => (prev && data.some(t => t.id === prev.id) ? prev : data[0]));
    } else {
      setSelectedTeam(null);
    }
  } catch (e) {
    console.error(e);
  }
};

const fetchMembers = async (teamId: string) => {
  try {
    const data = await api.getMembers(teamId);
    setMembers(data);
  } catch (e) {
    console.error(e);
  }
};

const fetchAssignments = async (teamId: string = '') => {
  try {
    const data = await api.getAssignments(teamId);
    setAssignments(data);
  } catch (e) {
    console.error(e);
  }
};

const fetchTasks = async (teamId: string = '') => {
  try {
    const data = await api.getTasks(teamId);
    setTasks(data);
  } catch (e) {
    console.error(e);
  }
};

const fetchWorkDone = async (teamId: string) => {
  try {
    const data = await api.getWorkDone(teamId);
    setWorkDone(data);
  } catch (e) {
    console.error(e);
  }
};

const refreshAppointments = async () => {
  try {
    const [aptList, aptStats] = await Promise.all([
      api.getAppointments(),
      api.getAppointmentStats()
    ]);
    setAppointments(aptList);
    setAppointmentStats(aptStats);
  } catch (e) {
    console.error(e);
  }
};

const refreshNotifications = async () => {
  try {
    const role = currentUser ? currentUser.role : 'all';
    const userId = currentUser ? currentUser.id : undefined;
    const email = currentUser ? currentUser.email : undefined;
    const data = await api.getNotifications(role, userId, email);
    setNotifications(data);
  } catch (e) {
    console.error(e);
  }
};

const handleMarkNotificationRead = async (id: string) => {
  try {
    await api.markNotificationRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  } catch (e) {
    console.error(e);
  }
};

const handleMarkAllNotificationsRead = async () => {
  try {
    const role = currentUser ? currentUser.role : undefined;
    await api.markAllNotificationsRead(role);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  } catch (e) {
    console.error(e);
  }
};

const handleCreateAppointment = async (data: Partial<Appointment>) => {
  try {
    await api.createAppointment(data);
    await refreshAppointments();
    await refreshNotifications();
    setIsAppointmentModalOpen(false);
  } catch (e) {
    console.error(e);
  }
};

const handleUpdateAppointment = async (id: string, data: Partial<Appointment>) => {
  try {
    await api.updateAppointment(id, data);
    await refreshAppointments();
    await refreshNotifications();
    setIsAppointmentModalOpen(false);
    setEditingAppointment(null);
  } catch (e) {
    console.error(e);
  }
};

const handleDeleteAppointment = async (id: string) => {
  const ok = await confirmAction({
    title: 'Delete Appointment',
    message: 'Are you sure you want to delete this appointment? This record will be removed from your calendar.',
    confirmText: 'Delete',
    variant: 'danger'
  });
  if (!ok) return;
  try {
    await api.deleteAppointment(id);
    await refreshAppointments();
    notify('Appointment deleted successfully.', 'success', 'Deleted');
  } catch (e: any) {
    console.error(e);
    notify(e.message || 'Failed to delete appointment', 'error', 'Error');
  }
};

const refreshUserWorkspace = async () => {
  try {
    const data = await api.getUserWorkspace(currentUser?.id, currentUser?.email);

    // Dynamic Multi-Team Isolation:
    // Managers & Admins see ALL teams member works.
    // Regular team members ONLY see assigned works of the SAME team.
    if (currentUser && currentUser.role === 'user') {
      const myMember = (members || []).find(m => (m.email && m.email.toLowerCase() === (currentUser.email || '').toLowerCase()) || m.id === currentUser.id);
      const visibleTasks = filterTasksForUser(data.assignedWork || [], currentUser, myMember);

      data.assignedWork = visibleTasks;
      data.stats.totalAssigned = visibleTasks.length;
      data.stats.inProgress = visibleTasks.filter(t => t.status === 'In Progress').length;
      data.stats.upcomingWork = visibleTasks.filter(t => t.status === 'Not Started' || (t.status as any) === 'To Do').length;
      data.stats.completedWork = visibleTasks.filter(t => t.status === 'Completed').length;
      data.stats.completionPercentage = visibleTasks.length > 0
        ? Math.round((data.stats.completedWork / visibleTasks.length) * 100)
        : 0;
      data.stats.completedFractionText = `${data.stats.completedWork} of ${visibleTasks.length} Tasks`;
    }

    setUserWorkspace(data);
    if (data.assignedWork && data.assignedWork.length > 0) {
      const matchingTask = selectedUserTask
        ? data.assignedWork.find(t => t.id === selectedUserTask.id || (selectedUserTask.taskId && t.taskId === selectedUserTask.taskId))
        : null;
      if (matchingTask) {
        setSelectedUserTask(matchingTask);
      } else if (!selectedUserTask || !data.assignedWork.some(t => t.id === selectedUserTask.id)) {
        setSelectedUserTask(data.assignedWork[0]);
      }
    } else {
      setSelectedUserTask(null);
    }
    if (data.history && data.history.length > 0) {
      if (!selectedHistoryItem || !data.history.some(h => h.id === selectedHistoryItem.id)) {
        setSelectedHistoryItem(data.history[0]);
      }
    } else {
      setSelectedHistoryItem(null);
    }
  } catch (e) {
    console.error(e);
  }
};

const openSubmitWorkDrawer = (task?: UserAssignedWork) => {
  if (task) {
    setDrawerSelectedTask(task);
  } else if (selectedUserTask) {
    setDrawerSelectedTask(selectedUserTask);
  } else if (userWorkspace?.assignedWork?.length) {
    setDrawerSelectedTask(userWorkspace.assignedWork[0]);
  }
  setIsSubmitWorkDrawerOpen(true);
};

const handleSubmitWork = async (payload: { taskId: string; workStatus: string; comment: string }) => {
  try {
    await api.submitUserWork(payload);

    // Immediately update selectedUserTask locally for responsive UI in UserWorkDetails
    if (selectedUserTask && (selectedUserTask.id === payload.taskId || selectedUserTask.taskId === payload.taskId)) {
      const now = new Date();
      const formattedDate = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
      const formattedTime = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      const fullDateTime = `${formattedDate}, ${formattedTime}`;

      const updatedComments = [
        ...(selectedUserTask.comments || []),
        {
          id: `c-${Date.now()}`,
          author: currentUser?.name || 'Team Member',
          role: 'Team Member',
          date: fullDateTime,
          badge: 'Submission',
          text: payload.comment || 'Work deliverables submitted for review.'
        }
      ];

      setSelectedUserTask({
        ...selectedUserTask,
        status: payload.workStatus === 'Completed' ? 'Completed' : 'Under Review',
        progress: 100,
        submittedDate: fullDateTime,
        submittedAt: now.toISOString(),
        completedDate: payload.workStatus === 'Completed' ? fullDateTime : undefined,
        completedAt: payload.workStatus === 'Completed' ? now.toISOString() : undefined,
        comments: updatedComments
      });
    }

    await refreshUserWorkspace();
    await refreshNotifications();
    setIsSubmitWorkDrawerOpen(false);
  } catch (e) {
    console.error('Submit work error:', e);
    throw e;
  }
};

const handleApproveWork = async (taskId: string, comment?: string) => {
  try {
    await api.approveWork(taskId, comment);
    await refreshUserWorkspace();
    await refreshNotifications();
    if (selectedTeam) fetchAssignments(selectedTeam.id);
    fetchStats();
    notify('Work successfully approved as Completed!', 'success');
  } catch (e: any) {
    console.error(e);
    notify(e.message || 'Failed to approve work.', 'error');
  }
};

const handleRequestRework = async (taskId: string, feedback: string) => {
  try {
    await api.requestRework(taskId, feedback);
    await refreshUserWorkspace();
    await refreshNotifications();
    if (selectedTeam) fetchAssignments(selectedTeam.id);
    fetchStats();
    notify('Rework requested successfully! User notified.', 'info');
  } catch (e: any) {
    console.error(e);
    notify(e.message || 'Failed to request rework.', 'error');
  }
};

const handleAddUserComment = async (taskId: string, commentText: string, badge: string = 'Update') => {
  try {
    const author = currentUser ? currentUser.name : 'Team Member';
    const role = currentUser ? (currentUser.role === 'admin' ? 'Admin' : 'Team Member') : 'Team Member';
    await api.addUserComment(taskId, {
      author,
      role,
      text: commentText,
      badge
    });
    await refreshUserWorkspace();
    await refreshNotifications();
  } catch (e) {
    console.error(e);
  }
};

const handleStartUserWork = async (taskId: string) => {
  try {
    await api.updateUserTaskStatus(taskId, 'In Progress');
    await refreshUserWorkspace();
    await refreshNotifications();
  } catch (e) {
    console.error(e);
  }
};

const fetchAllUsers = async () => {
  try {
    const u = await api.getUsers();
    const sanitized = (u || []).filter(user => !isBannedEmail(user.email));
    setAllUsers(sanitized);
  } catch (e) {
    console.error(e);
  }
};

const refreshAll = async () => {
  setLoading(true);
  const promises: Promise<any>[] = [
    fetchStats(),
    fetchDepartments(),
    fetchAllUsers(),
    refreshUserWorkspace(),
    refreshAppointments(),
    refreshNotifications()
  ];
  if (selectedDepartment) {
    promises.push(fetchTeams(selectedDepartment.id));
  }
  if (selectedTeam) {
    promises.push(fetchMembers(selectedTeam.id));
    promises.push(fetchAssignments(selectedTeam.id));
    promises.push(fetchTasks(selectedTeam.id));
    promises.push(fetchWorkDone(selectedTeam.id));
  }
  await Promise.all(promises);
  setLoading(false);
};

// Initial load
useEffect(() => {
  refreshAll();
}, []);

// Validate active session on mount and when currentUser changes
useEffect(() => {
  if (!currentUser) return;
  refreshUserWorkspace();
  refreshNotifications();
  let isMounted = true;
  api.validateSession(currentUser.id, currentUser.email).then((res) => {
    if (!isMounted) return;
    // Only revoke session if backend explicitly confirmed deletion in MongoDB Atlas (never on cold start / network blip)
    if (!res.valid && res.deleted) {
      console.warn('[Session] Session verification confirmed account deleted by admin:', res.error);
      logout();
      alert('Your account has been deleted by an administrator. Access denied.');
      window.location.href = '/';
    }
  }).catch((err) => {
    console.warn('[Session] Session validation notice:', err);
  });

  return () => {
    isMounted = false;
  };
}, [currentUser?.id, currentUser?.email]);

// Real-Time Server-Sent Events (SSE) Listener for Two-Way Instant Sync
useEffect(() => {
  let es: EventSource | null = null;
  try {
    es = new EventSource(`${API_BASE}/events`);
    es.onmessage = (e) => {
      try {
        const event = JSON.parse(e.data);
        if (event.type && event.type !== 'CONNECTED') {
          const payload = event.payload || {};
          // If user was deleted and matches currentUser, terminate session immediately
          if (event.type === 'USER_DELETED') {
            if (currentUser && (
              (payload.id && (payload.id === currentUser.id || payload.id === (currentUser as any)._id)) ||
              (payload.email && payload.email.toLowerCase() === (currentUser.email || '').toLowerCase())
            )) {
              logout();
              alert('Your account has been deleted by an administrator. You have been logged out.');
              window.location.href = '/';
              return;
            }
          }
          // Instant background synchronization across all active browser tabs/windows
          refreshAll();
        }
      } catch (err) {
        console.error('[SSE] Failed to parse message', err);
      }
    };
  } catch (err) {
    console.error('[SSE] EventSource connection failed', err);
  }

  return () => {
    if (es) es.close();
  };
}, [currentUser]);

// When selected department changes, load its teams
useEffect(() => {
  if (selectedDepartment) {
    fetchTeams(selectedDepartment.id);
  } else {
    setTeams([]);
    setSelectedTeam(null);
  }
}, [selectedDepartment]);

// When selected team changes, load members, assignments, tasks, work done
useEffect(() => {
  if (selectedTeam) {
    fetchMembers(selectedTeam.id);
    fetchAssignments(selectedTeam.id);
    fetchTasks(selectedTeam.id);
    fetchWorkDone(selectedTeam.id);
  } else {
    setMembers([]);
    setAssignments([]);
    setTasks([]);
    setWorkDone([]);
  }
}, [selectedTeam]);

// Open Edit Modals
const openEditDepartment = (dept: Department) => {
  setEditingDept(dept);
  setIsAddDeptOpen(true);
};

const openEditTeam = (team: Team) => {
  setEditingTeam(team);
  setIsAddTeamOpen(true);
};

const openEditMember = (member: Member) => {
  setEditingMember(member);
  setIsAddMemberOpen(true);
};

// Task actions
const handleToggleTask = async (id: string) => {
  try {
    await api.toggleTask(id);
    if (selectedTeam) fetchTasks(selectedTeam.id);
    fetchStats();
  } catch (e) {
    console.error(e);
  }
};

const handleDeleteTask = async (id: string) => {
  const ok = await confirmAction({
    title: 'Delete Task',
    message: 'Are you sure you want to delete this task?',
    confirmText: 'Delete',
    variant: 'danger'
  });
  if (!ok) return;
  try {
    await api.deleteTask(id);
    if (selectedTeam) fetchTasks(selectedTeam.id);
    fetchStats();
    notify('Task deleted successfully.', 'success');
  } catch (e: any) {
    console.error(e);
    notify(e.message || 'Failed to delete task', 'error');
  }
};

const handleDeleteWorkDone = async (id: string) => {
  const ok = await confirmAction({
    title: 'Delete Work Log',
    message: 'Are you sure you want to delete this completed work entry?',
    confirmText: 'Delete',
    variant: 'danger'
  });
  if (!ok) return;
  try {
    await api.deleteWorkDone(id);
    if (selectedTeam) fetchWorkDone(selectedTeam.id);
    fetchStats();
    notify('Work entry removed successfully.', 'success');
  } catch (e: any) {
    console.error(e);
    notify(e.message || 'Failed to delete work log', 'error');
  }
};

const handleDeleteAssignment = async (id: string) => {
  const ok = await confirmAction({
    title: 'Delete Assigned Work',
    message: 'Are you sure you want to delete this assigned work item?',
    confirmText: 'Delete',
    variant: 'danger'
  });
  if (!ok) return;
  try {
    await api.deleteAssignment(id);
    setUserWorkspace(prev => {
      if (!prev) return prev;
      const assignedWork = (prev.assignedWork || []).filter(t => t.id !== id && t.taskId !== id);
      return { ...prev, assignedWork };
    });
    if (selectedUserTask && (selectedUserTask.id === id || selectedUserTask.taskId === id)) {
      setSelectedUserTask(null);
      if (userNav === 'details') {
        setUserNav('assigned-work');
      }
    }
    const promises: Promise<any>[] = [refreshUserWorkspace(), fetchAssignments(), fetchTasks()];
    if (selectedTeam) {
      promises.push(fetchAssignments(selectedTeam.id));
    }
    await Promise.all(promises);
    notify('Assigned work item deleted.', 'success');
  } catch (e: any) {
    console.error('Failed to delete assignment:', e);
    notify(e.message || 'Failed to delete assignment', 'error', 'Delete Failed');
  }
};

const handleDeleteMember = async (id: string) => {
  const ok = await confirmAction({
    title: 'Delete Team Member',
    message: 'Are you sure you want to remove this team member from the team?',
    confirmText: 'Remove Member',
    variant: 'danger'
  });
  if (!ok) return;
  try {
    await api.deleteMember(id);
    if (selectedTeam) fetchMembers(selectedTeam.id);
    fetchStats();
    notify('Team member removed successfully.', 'success');
  } catch (e: any) {
    console.error(e);
    notify(e.message || 'Failed to remove member', 'error');
  }
};

const handleDeleteDepartment = async (id: string) => {
  const ok = await confirmAction({
    title: 'Delete Department',
    message: 'Are you sure you want to delete this department? All associated teams and members will also be affected.',
    confirmText: 'Delete Department',
    variant: 'danger'
  });
  if (!ok) return;
  try {
    await api.deleteDepartment(id);
    await fetchDepartments();
    fetchStats();
    notify('Department deleted successfully.', 'success');
  } catch (e: any) {
    console.error(e);
    notify(e.message || 'Failed to delete department', 'error');
  }
};

const handleDeleteTeam = async (id: string) => {
  const ok = await confirmAction({
    title: 'Delete Team',
    message: 'Are you sure you want to delete this team and unlink its members?',
    confirmText: 'Delete Team',
    variant: 'danger'
  });
  if (!ok) return;
  try {
    await api.deleteTeam(id);
    if (selectedDepartment) fetchTeams(selectedDepartment.id);
    fetchStats();
    notify('Team deleted successfully.', 'success');
  } catch (e: any) {
    console.error(e);
    notify(e.message || 'Failed to delete team', 'error');
  }
};

const unreadNotificationCount = notifications.filter(n => !n.read).length;

// Real-Time Messaging Unread Count Tracking
const [unreadMessagesCount, setUnreadMessagesCount] = useState<number>(0);

const refreshUnreadMessagesCount = async () => {
  if (!currentUser) {
    setUnreadMessagesCount(0);
    return;
  }
  try {
    const res = await api.getUnreadMessagesCount(currentUser.id);
    setUnreadMessagesCount(res.count || 0);
  } catch (err) {
    console.warn('Failed to fetch unread messages count:', err);
  }
};

useEffect(() => {
  if (currentUser) {
    refreshUnreadMessagesCount();
    connectSocketUser(currentUser);
    const socket = getSocket();

    const handleUpdate = () => {
      refreshUnreadMessagesCount();
    };

    const handleMeetingEvent = () => {
      refreshNotifications();
      refreshAppointments();
    };

    const handleSessionTerminated = (data?: { reason?: string }) => {
      console.warn('[Socket.IO] Session terminated by administrator:', data?.reason);
      logout();
      alert(data?.reason || 'Your account has been deleted by an administrator.');
      window.location.href = '/';
    };

    const handleUserDeleted = (data?: { id?: string; email?: string }) => {
      if (!data) return;
      if (currentUser && (
        (data.id && (data.id === currentUser.id || data.id === (currentUser as any)._id)) ||
        (data.email && data.email.toLowerCase() === (currentUser.email || '').toLowerCase())
      )) {
        logout();
        alert('Your account has been deleted by an administrator. You have been logged out.');
        window.location.href = '/';
      } else {
        refreshAll();
      }
    };

    const handleRealtimeEntityChange = () => {
      refreshAll();
    };

    const handleAdminNotification = (payload: any) => {
      refreshNotifications();
      refreshAppointments();
      refreshAll();
      if (currentUser?.role === 'admin') {
        setAdminToast({
          id: String(Date.now()),
          title: payload?.title || 'New Form Submitted',
          message: payload?.message || 'A new request has arrived.',
          timestamp: new Date()
        });
      }
    };

    const handleReceiverNotification = (payload: any) => {
      refreshNotifications();
      refreshAppointments();
      refreshUserWorkspace();
      setUserToast({
        id: String(Date.now()),
        title: payload?.title || 'New Request Received 📋',
        message: payload?.message || 'You have received a new request.',
        timestamp: new Date()
      });
    };

    const handleNewNotification = () => {
      refreshNotifications();
    };

    const handleWppStatus = (data: any) => {
      setWppStatus((prev: any) => ({ ...(prev || {}), ...data }));
    };

    const handleWppAlert = (data: any) => {
      setAdminToast({
        id: `wpp-alt-${Date.now()}`,
        title: data.title || '⚠️ WhatsApp Disconnected',
        message: data.message || 'WhatsApp session disconnected. Auto-reconnection in progress.',
        timestamp: new Date()
      });
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        try {
          new Notification(data.title || 'WhatsApp Disconnected', {
            body: data.message || 'WhatsApp session disconnected. Auto-reconnection in progress.',
            icon: '/favicon.ico'
          });
        } catch (e) {
          // ignore
        }
      }
    };

    socket.on('admin_notification', handleAdminNotification);
    socket.on('receiver_notification', handleReceiverNotification);
    socket.on('new_notification', handleNewNotification);
    socket.on('notification_received', handleNewNotification);
    socket.on('wpp_status', handleWppStatus);
    socket.on('wpp_message_sent', fetchWppStatus);
    socket.on('wpp_disconnection_alert', handleWppAlert);

    socket.on('conversation_updated', handleUpdate);
    socket.on('new_message', handleUpdate);
    socket.on('messages_read', handleUpdate);
    socket.on('meeting_invitation', handleMeetingEvent);
    socket.on('meeting_popup', handleMeetingEvent);
    socket.on('session_terminated', handleSessionTerminated);
    socket.on('user_deleted', handleUserDeleted);
    socket.on('member_deleted', handleRealtimeEntityChange);
    socket.on('org_changed', handleRealtimeEntityChange);
    socket.on('assignment_deleted', handleRealtimeEntityChange);
    socket.on('task_deleted', handleRealtimeEntityChange);
    socket.on('appointment_deleted', handleRealtimeEntityChange);
    socket.on('work_changed', handleRealtimeEntityChange);
    socket.on('work_done_deleted', handleRealtimeEntityChange);
    socket.on('ATTENDANCE_UPDATED', () => {
      refreshTodayAttendance();
      refreshAttendanceRecords();
    });
    socket.on('BREAK_STARTED', (data?: any) => {
      refreshActiveBreaks();
      refreshTodayBreaks();
      refreshNotifications();
      if (data?.userName && data?.userId !== currentUser?.id) {
        notify(`☕ ${data.userName} is on Break (${data.fromTime} - ${data.toTime})`, 'info', 'Team Break');
      }
    });
    socket.on('BREAK_UPDATED', () => {
      refreshActiveBreaks();
      refreshTodayBreaks();
      refreshNotifications();
    });
    socket.on('BREAK_ENDED', () => {
      refreshActiveBreaks();
      refreshTodayBreaks();
      refreshNotifications();
    });
    socket.on('BREAK_DELETED', () => {
      refreshActiveBreaks();
      refreshTodayBreaks();
      refreshNotifications();
    });
    socket.on('WORK_REQUEST_CREATED', () => {
      refreshWorkRequests();
      refreshNotifications();
    });
    socket.on('WORK_REQUEST_APPROVED', () => {
      refreshWorkRequests();
      refreshUserWorkspace();
      fetchAssignments();
      refreshNotifications();
    });
    socket.on('WORK_REQUEST_REJECTED', () => {
      refreshWorkRequests();
      refreshNotifications();
    });
    socket.on('TASK_TIMER_UPDATED', refreshUserWorkspace);
    socket.on('ASSIGNMENT_UPDATED', () => {
      refreshUserWorkspace();
      fetchAssignments();
    });

    return () => {
      socket.off('admin_notification', handleAdminNotification);
      socket.off('receiver_notification', handleReceiverNotification);
      socket.off('new_notification', handleNewNotification);
      socket.off('notification_received', handleNewNotification);
      socket.off('wpp_status', handleWppStatus);
      socket.off('wpp_message_sent', fetchWppStatus);
      socket.off('wpp_disconnection_alert', handleWppAlert);

      socket.off('conversation_updated', handleUpdate);
      socket.off('new_message', handleUpdate);
      socket.off('messages_read', handleUpdate);
      socket.off('meeting_invitation', handleMeetingEvent);
      socket.off('meeting_popup', handleMeetingEvent);
      socket.off('session_terminated', handleSessionTerminated);
      socket.off('user_deleted', handleUserDeleted);
      socket.off('member_deleted', handleRealtimeEntityChange);
      socket.off('org_changed', handleRealtimeEntityChange);
      socket.off('assignment_deleted', handleRealtimeEntityChange);
      socket.off('task_deleted', handleRealtimeEntityChange);
      socket.off('appointment_deleted', handleRealtimeEntityChange);
      socket.off('work_changed', handleRealtimeEntityChange);
      socket.off('work_done_deleted', handleRealtimeEntityChange);
      socket.off('BREAK_STARTED');
      socket.off('BREAK_UPDATED');
      socket.off('BREAK_ENDED');
      socket.off('BREAK_DELETED');
      socket.off('WORK_REQUEST_CREATED');
      socket.off('WORK_REQUEST_APPROVED');
      socket.off('WORK_REQUEST_REJECTED');
    };
  } else {
    setUnreadMessagesCount(0);
  }
}, [currentUser]);

return (
  <AppContext.Provider
    value={{
      currentUser,
      setCurrentUser,
      login,
      createPassword,
      logout,
      updateUserProfile,
      portalMode,
      setPortalMode,
      adminNav,
      setAdminNav,
      mobileSidebarOpen,
      setMobileSidebarOpen,
      departments,
      selectedDepartment,
      setSelectedDepartment,
      teams,
      selectedTeam,
      setSelectedTeam,
      members,
      assignments,
      tasks,
      workDone,
      stats,
      allUsers,
      fetchAllUsers,
      activeTab,
      setActiveTab,
      teamSubTab,
      setTeamSubTab,
      loading,
      refreshAll,
      isAddDeptOpen,
      setIsAddDeptOpen,
      editingDept,
      setEditingDept,
      openEditDepartment,
      isAddTeamOpen,
      setIsAddTeamOpen,
      editingTeam,
      setEditingTeam,
      openEditTeam,
      isAddMemberOpen,
      setIsAddMemberOpen,
      editingMember,
      setEditingMember,
      openEditMember,
      isAddTaskOpen,
      setIsAddTaskOpen,
      isAddWorkDoneOpen,
      setIsAddWorkDoneOpen,
      handleToggleTask,
      handleDeleteTask,
      handleDeleteWorkDone,
      handleDeleteAssignment,
      handleDeleteMember,
      handleDeleteDepartment,
      handleDeleteTeam,
      userNav,
      setUserNav,
      managerNav,
      setManagerNav,
      toastNotification,
      toasts,
      notify,
      dismissToast,
      clearNotification,
      confirmModal,
      confirmAction,
      closeConfirmModal,
      selectedUserTask,
      setSelectedUserTask,
      selectedHistoryItem,
      setSelectedHistoryItem,
      userWorkspace,
      refreshUserWorkspace,
      isSubmitWorkDrawerOpen,
      setIsSubmitWorkDrawerOpen,
      drawerSelectedTask,
      openSubmitWorkDrawer,
      userFilterTab,
      setUserFilterTab,
      userSearchQuery,
      setUserSearchQuery,
      handleSubmitWork,
      handleAddUserComment,
      handleStartUserWork,
      handleApproveWork,
      handleRequestRework,
      appointments,
      appointmentStats,
      selectedAppointmentDate,
      setSelectedAppointmentDate,
      appointmentFilterTab,
      setAppointmentFilterTab,
      appointmentSearchQuery,
      setAppointmentSearchQuery,
      isAppointmentModalOpen,
      setIsAppointmentModalOpen,
      editingAppointment,
      setEditingAppointment,
      handleCreateAppointment,
      handleUpdateAppointment,
      handleDeleteAppointment,
      refreshAppointments,
      notifications,
      unreadNotificationCount,
      handleMarkNotificationRead,
      handleMarkAllNotificationsRead,
      refreshNotifications,
      unreadMessagesCount,
      refreshUnreadMessagesCount,
      scrollToSection,
      adminToast,
      setAdminToast,
      userToast,
      setUserToast,
      wppStatus,
      fetchWppStatus,
      restartWpp,
      todayAttendance,
      liveAttendanceSeconds,
      isAttendanceLoading,
      attendanceRecords,
      refreshTodayAttendance,
      refreshAttendanceRecords,
      handlePunchIn,
      handlePunchOut,
      handleStartTimer,
      handlePauseTimer,
      handleResumeTimer,
      handleFinishTimer,
      handleEditAssignment,
      isManagerOrAdmin,
      activeTeamBreaks,
      todayTeamBreaks,
      refreshActiveBreaks,
      refreshTodayBreaks,
      handleStartBreak,
      handleUpdateBreak,
      handleEndBreak,
      handleDeleteBreak,
      workRequests,
      refreshWorkRequests,
      handleApproveWorkRequest,
      handleRejectWorkRequest
    }}
  >
    {children}
  </AppContext.Provider>
);
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
