import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Department, Team, Member, Assignment, Task, WorkDone, DashboardStats, UserWorkspaceData, UserAssignedWork, UserWorkHistory } from '../types';
import { api } from '../services/api';

interface AppContextType {
  // Portal Toggle
  portalMode: 'admin' | 'user';
  setPortalMode: (mode: 'admin' | 'user') => void;

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

  // Redirect / Scroll helper
  scrollToSection: (sectionId: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Portal mode: toggle between 'admin' and 'user' (WorkHub)
  const [portalMode, setPortalMode] = useState<'admin' | 'user'>('user');

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
      if (data.length > 0 && !selectedDepartment) {
        const eng = data.find(d => d.name.toLowerCase().includes('engineer')) || data[0];
        setSelectedDepartment(eng);
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

  const refreshUserWorkspace = async () => {
    try {
      const data = await api.getUserWorkspace();
      setUserWorkspace(data);
      if (data.assignedWork && data.assignedWork.length > 0 && !selectedUserTask) {
        // Set default selected task (TSK-2026-0487 CME poster)
        const cmeTask = data.assignedWork.find(t => t.taskId === 'TSK-2026-0487') || data.assignedWork[0];
        setSelectedUserTask(cmeTask);
      }
      if (data.history && data.history.length > 0 && !selectedHistoryItem) {
        setSelectedHistoryItem(data.history[0]);
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
      setIsSubmitWorkDrawerOpen(false);
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddUserComment = async (taskId: string, commentText: string, badge: string = 'Update') => {
    try {
      await api.addUserComment(taskId, {
        author: 'Rahul Sharma',
        role: 'Team Member',
        text: commentText,
        badge
      });
      await refreshUserWorkspace();
    } catch (e) {
      console.error(e);
    }
  };

  const handleStartUserWork = async (taskId: string) => {
    try {
      await api.updateUserTaskStatus(taskId, 'In Progress');
      await refreshUserWorkspace();
    } catch (e) {
      console.error(e);
    }
  };

  const refreshAll = async () => {
    setLoading(true);
    await Promise.all([
      fetchStats(),
      fetchDepartments(),
      refreshUserWorkspace()
    ]);
    setLoading(false);
  };

  // Initial load
  useEffect(() => {
    refreshAll();
  }, []);

  // When selected department changes, load its teams
  useEffect(() => {
    if (selectedDepartment) {
      fetchTeams(selectedDepartment.id);
    }
  }, [selectedDepartment]);

  // When selected team changes, load members, assignments, tasks, work done
  useEffect(() => {
    if (selectedTeam) {
      fetchMembers(selectedTeam.id);
      fetchAssignments(selectedTeam.id);
      fetchTasks(selectedTeam.id);
      fetchWorkDone(selectedTeam.id);
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

  return (
    <AppContext.Provider
      value={{
        portalMode,
        setPortalMode,
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
