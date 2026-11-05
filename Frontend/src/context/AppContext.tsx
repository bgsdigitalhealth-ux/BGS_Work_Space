import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
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
  Notification
} from '../types';
import { api, API_BASE } from '../services/api';
import { getSocket, connectSocketUser, disconnectSocket } from '../services/socket';

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
}

const AppContext = createContext<AppContextType | undefined>(undefined);

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

  // Portal mode strictly derived from logged in user's role: 'admin' or 'user'
  const portalMode: 'admin' | 'user' = currentUser?.role === 'user' ? 'user' : 'admin';

  // Admin navigation
  const [adminNav, setAdminNav] = useState<string>('dashboard');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState<boolean>(false);

  // Admin states
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
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

  const fetchAssignments = async (teamId: string) => {
    try {
      const data = await api.getAssignments(teamId);
      setAssignments(data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchTasks = async (teamId: string) => {
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
      const data = await api.getNotifications(role, userId);
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
    if (!window.confirm('Are you sure you want to delete this appointment?')) return;
    try {
      await api.deleteAppointment(id);
      await refreshAppointments();
    } catch (e) {
      console.error(e);
    }
  };

  const refreshUserWorkspace = async () => {
    try {
      const data = await api.getUserWorkspace();
      setUserWorkspace(data);
      if (data.assignedWork && data.assignedWork.length > 0) {
        if (!selectedUserTask || !data.assignedWork.some(t => t.id === selectedUserTask.id)) {
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
    } else if (userWorkspace?.assignedWork?.length) {
      setDrawerSelectedTask(userWorkspace.assignedWork[0]);
    }
    setIsSubmitWorkDrawerOpen(true);
  };

  const handleSubmitWork = async (payload: { taskId: string; workStatus: string; comment: string }) => {
    try {
      await api.submitUserWork(payload);
      await refreshUserWorkspace();
      await refreshNotifications();
      setIsSubmitWorkDrawerOpen(false);
    } catch (e) {
      console.error(e);
    }
  };

  const handleApproveWork = async (taskId: string, comment?: string) => {
    try {
      await api.approveWork(taskId, comment);
      await refreshUserWorkspace();
      await refreshNotifications();
      if (selectedTeam) fetchAssignments(selectedTeam.id);
      fetchStats();
      alert('Work successfully approved as Completed!');
    } catch (e) {
      console.error(e);
    }
  };

  const handleRequestRework = async (taskId: string, feedback: string) => {
    try {
      await api.requestRework(taskId, feedback);
      await refreshUserWorkspace();
      await refreshNotifications();
      if (selectedTeam) fetchAssignments(selectedTeam.id);
      fetchStats();
      alert('Rework requested successfully! User notified.');
    } catch (e) {
      console.error(e);
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
      setAllUsers(u || []);
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

  // Real-Time Server-Sent Events (SSE) Listener for Two-Way Instant Sync
  useEffect(() => {
    let es: EventSource | null = null;
    try {
      es = new EventSource(`${API_BASE}/events`);
      es.onmessage = (e) => {
        try {
          const event = JSON.parse(e.data);
          if (event.type && event.type !== 'CONNECTED') {
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
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      await api.deleteTask(id);
      if (selectedTeam) fetchTasks(selectedTeam.id);
      fetchStats();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteWorkDone = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this work log?')) return;
    try {
      await api.deleteWorkDone(id);
      if (selectedTeam) fetchWorkDone(selectedTeam.id);
      fetchStats();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteAssignment = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this assignment?')) return;
    try {
      await api.deleteAssignment(id);
      if (selectedTeam) fetchAssignments(selectedTeam.id);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteMember = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this team member?')) return;
    try {
      await api.deleteMember(id);
      if (selectedTeam) fetchMembers(selectedTeam.id);
      fetchStats();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteDepartment = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this department? All its teams and members will also be affected.')) return;
    try {
      await api.deleteDepartment(id);
      await fetchDepartments();
      fetchStats();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteTeam = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this team?')) return;
    try {
      await api.deleteTeam(id);
      if (selectedDepartment) fetchTeams(selectedDepartment.id);
      fetchStats();
    } catch (e) {
      console.error(e);
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

      socket.on('conversation_updated', handleUpdate);
      socket.on('new_message', handleUpdate);
      socket.on('messages_read', handleUpdate);

      return () => {
        socket.off('conversation_updated', handleUpdate);
        socket.off('new_message', handleUpdate);
        socket.off('messages_read', handleUpdate);
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
        scrollToSection
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
