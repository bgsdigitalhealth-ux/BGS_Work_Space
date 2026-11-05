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
  
  // Modals
  isAddDeptOpen: boolean;
  setIsAddDeptOpen: (open: boolean) => void;
  isAddTeamOpen: boolean;
  setIsAddTeamOpen: (open: boolean) => void;
  isAddMemberOpen: boolean;
  setIsAddMemberOpen: (open: boolean) => void;
  isAddTaskOpen: boolean;
  setIsAddTaskOpen: (open: boolean) => void;
  isAddWorkDoneOpen: boolean;
  setIsAddWorkDoneOpen: (open: boolean) => void;

  // Actions
  handleToggleTask: (id: string) => Promise<void>;
  handleDeleteMember: (id: string) => Promise<void>;
  handleDeleteDepartment: (id: string) => Promise<void>;
  handleDeleteTeam: (id: string) => Promise<void>;
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

  // Modals
  const [isAddDeptOpen, setIsAddDeptOpen] = useState(false);
  const [isAddTeamOpen, setIsAddTeamOpen] = useState(false);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [isAddWorkDoneOpen, setIsAddWorkDoneOpen] = useState(false);

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
        // Default to Engineering if available
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
        // Default to Backend Team if available
        const backend = data.find(t => t.name.toLowerCase().includes('backend')) || data[0];
        setSelectedTeam(backend);
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

  const handleToggleTask = async (id: string) => {
    try {
      await api.toggleTask(id);
      if (selectedTeam) {
        const updated = await api.getTasks(selectedTeam.id);
        setTasks(updated);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteMember = async (id: string) => {
    try {
      await api.deleteMember(id);
      if (selectedTeam) {
        const updated = await api.getMembers(selectedTeam.id);
        setMembers(updated);
        fetchStats();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteDepartment = async (id: string) => {
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

  const handleDeleteTeam = async (id: string) => {
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
        isAddTeamOpen,
        setIsAddTeamOpen,
        isAddMemberOpen,
        setIsAddMemberOpen,
        isAddTaskOpen,
        setIsAddTaskOpen,
        isAddWorkDoneOpen,
        setIsAddWorkDoneOpen,
        handleToggleTask,
        handleDeleteMember,
        handleDeleteDepartment,
        handleDeleteTeam
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
