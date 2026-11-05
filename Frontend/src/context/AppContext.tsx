import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Department, Team, Member, Assignment, Task, WorkDone, DashboardStats } from '../types';
import { api } from '../services/api';

interface AppContextType {
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

  // Redirect / Scroll helper
  scrollToSection: (sectionId: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
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
        // Keep existing selectedTeam if it belongs to this department, otherwise pick first
        setSelectedTeam(prev => (prev && data.some(t => t.id === prev.id) ? prev : data[0]));
      } else {
        setSelectedTeam(null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchTeamDetails = async (teamId: string) => {
    try {
      const [mems, assigns, tsks, wds] = await Promise.all([
        api.getMembers(teamId),
        api.getAssignments(teamId),
        api.getTasks(teamId),
        api.getWorkDone(teamId)
      ]);
      setMembers(mems);
      setAssignments(assigns);
      setTasks(tsks);
      setWorkDone(wds);
    } catch (e) {
      console.error(e);
    }
  };

  const refreshAll = async () => {
    await fetchStats();
    await fetchDepartments();
    if (selectedDepartment) {
      await fetchTeams(selectedDepartment.id);
    }
    if (selectedTeam) {
      await fetchTeamDetails(selectedTeam.id);
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await fetchStats();
      await fetchDepartments();
      setLoading(false);
    };
    init();
  }, []);

  useEffect(() => {
    if (selectedDepartment) {
      fetchTeams(selectedDepartment.id);
    }
  }, [selectedDepartment]);

  useEffect(() => {
    if (selectedTeam) {
      fetchTeamDetails(selectedTeam.id);
    } else {
      setMembers([]);
      setAssignments([]);
      setTasks([]);
      setWorkDone([]);
    }
  }, [selectedTeam]);

  // Edit triggers
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
      if (selectedTeam) {
        const updated = await api.getTasks(selectedTeam.id);
        setTasks(updated);
      }
      fetchStats();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTask = async (id: string) => {
    try {
      await api.deleteTask(id);
      if (selectedTeam) {
        const updated = await api.getTasks(selectedTeam.id);
        setTasks(updated);
      }
      fetchStats();
    } catch (err) {
      console.error(err);
    }
  };

  // WorkDone actions
  const handleDeleteWorkDone = async (id: string) => {
    try {
      await api.deleteWorkDone(id);
      if (selectedTeam) {
        const updated = await api.getWorkDone(selectedTeam.id);
        setWorkDone(updated);
      }
      fetchStats();
    } catch (err) {
      console.error(err);
    }
  };

  // Assignment actions
  const handleDeleteAssignment = async (id: string) => {
    try {
      await api.deleteAssignment(id);
      if (selectedTeam) {
        const updated = await api.getAssignments(selectedTeam.id);
        setAssignments(updated);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Member actions
  const handleDeleteMember = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this team member?')) return;
    try {
      await api.deleteMember(id);
      if (selectedTeam) {
        const updated = await api.getMembers(selectedTeam.id);
        setMembers(updated);
      }
      fetchStats();
    } catch (err) {
      console.error(err);
    }
  };

  // Department actions
  const handleDeleteDepartment = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this department and its teams?')) return;
    try {
      await api.deleteDepartment(id);
      const remaining = departments.filter(d => d.id !== id);
      setDepartments(remaining);
      if (remaining.length > 0) {
        setSelectedDepartment(remaining[0]);
      } else {
        setSelectedDepartment(null);
      }
      fetchStats();
    } catch (err) {
      console.error(err);
    }
  };

  // Team actions
  const handleDeleteTeam = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this team?')) return;
    try {
      await api.deleteTeam(id);
      if (selectedDepartment) {
        const remaining = teams.filter(t => t.id !== id);
        setTeams(remaining);
        if (remaining.length > 0) {
          setSelectedTeam(remaining[0]);
        } else {
          setSelectedTeam(null);
        }
      }
      fetchStats();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <AppContext.Provider
      value={{
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
