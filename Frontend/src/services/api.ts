import { Department, Team, Member, Assignment, Task, WorkDone, DashboardStats } from '../types';

const API_BASE = '/api';

export const api = {
  // Stats
  getStats: async (): Promise<DashboardStats> => {
    const res = await fetch(`${API_BASE}/stats`);
    if (!res.ok) throw new Error('Failed to fetch stats');
    return res.json();
  },

  // Departments
  getDepartments: async (): Promise<Department[]> => {
    const res = await fetch(`${API_BASE}/departments`);
    if (!res.ok) throw new Error('Failed to fetch departments');
    return res.json();
  },
  createDepartment: async (data: Partial<Department>): Promise<Department> => {
    const res = await fetch(`${API_BASE}/departments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to create department');
    return res.json();
  },
  updateDepartment: async (id: string, data: Partial<Department>): Promise<Department> => {
    const res = await fetch(`${API_BASE}/departments/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to update department');
    return res.json();
  },
  deleteDepartment: async (id: string): Promise<void> => {
    const res = await fetch(`${API_BASE}/departments/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete department');
  },

  // Teams
  getTeams: async (departmentId?: string): Promise<Team[]> => {
    const url = departmentId ? `${API_BASE}/teams?departmentId=${departmentId}` : `${API_BASE}/teams`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch teams');
    return res.json();
  },
  createTeam: async (data: Partial<Team>): Promise<Team> => {
    const res = await fetch(`${API_BASE}/teams`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to create team');
    return res.json();
  },
  updateTeam: async (id: string, data: Partial<Team>): Promise<Team> => {
    const res = await fetch(`${API_BASE}/teams/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to update team');
    return res.json();
  },
  deleteTeam: async (id: string): Promise<void> => {
    const res = await fetch(`${API_BASE}/teams/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete team');
  },

  // Members
  getMembers: async (teamId?: string, departmentId?: string): Promise<Member[]> => {
    const params = new URLSearchParams();
    if (teamId) params.append('teamId', teamId);
    if (departmentId) params.append('departmentId', departmentId);
    const res = await fetch(`${API_BASE}/members?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch members');
    return res.json();
  },
  createMember: async (data: Partial<Member>): Promise<Member> => {
    const res = await fetch(`${API_BASE}/members`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to create member');
    return res.json();
  },
  updateMember: async (id: string, data: Partial<Member>): Promise<Member> => {
    const res = await fetch(`${API_BASE}/members/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to update member');
    return res.json();
  },
  deleteMember: async (id: string): Promise<void> => {
    const res = await fetch(`${API_BASE}/members/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete member');
  },

  // Assignments
  getAssignments: async (teamId?: string): Promise<Assignment[]> => {
    const url = teamId ? `${API_BASE}/assignments?teamId=${teamId}` : `${API_BASE}/assignments`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch assignments');
    return res.json();
  },
  createAssignment: async (data: Partial<Assignment>): Promise<Assignment> => {
    const res = await fetch(`${API_BASE}/assignments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to create assignment');
    return res.json();
  },
  deleteAssignment: async (id: string): Promise<void> => {
    const res = await fetch(`${API_BASE}/assignments/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete assignment');
  },

  // Tasks
  getTasks: async (teamId?: string): Promise<Task[]> => {
    const url = teamId ? `${API_BASE}/tasks?teamId=${teamId}` : `${API_BASE}/tasks`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch tasks');
    return res.json();
  },
  createTask: async (data: Partial<Task>): Promise<Task> => {
    const res = await fetch(`${API_BASE}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to create task');
    return res.json();
  },
  updateTask: async (id: string, data: Partial<Task>): Promise<Task> => {
    const res = await fetch(`${API_BASE}/tasks/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to update task');
    return res.json();
  },
  toggleTask: async (id: string): Promise<Task> => {
    const res = await fetch(`${API_BASE}/tasks/${id}/toggle`, { method: 'PATCH' });
    if (!res.ok) throw new Error('Failed to toggle task');
    return res.json();
  },
  deleteTask: async (id: string): Promise<void> => {
    const res = await fetch(`${API_BASE}/tasks/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete task');
  },

  // Work Done
  getWorkDone: async (teamId?: string): Promise<WorkDone[]> => {
    const url = teamId ? `${API_BASE}/work-done?teamId=${teamId}` : `${API_BASE}/work-done`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch work done');
    return res.json();
  },
  createWorkDone: async (data: Partial<WorkDone>): Promise<WorkDone> => {
    const res = await fetch(`${API_BASE}/work-done`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to create work done');
    return res.json();
  },
  deleteWorkDone: async (id: string): Promise<void> => {
    const res = await fetch(`${API_BASE}/work-done/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete work done');
  },

  // User Workspace (WorkHub)
  getUserWorkspace: async (): Promise<import('../types').UserWorkspaceData> => {
    const res = await fetch(`${API_BASE}/user/workspace`);
    if (!res.ok) throw new Error('Failed to fetch user workspace');
    return res.json();
  },
  submitUserWork: async (payload: { taskId: string; workStatus: string; comment: string; attachments?: any[] }) => {
    const res = await fetch(`${API_BASE}/user/submit-work`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to submit work');
    return res.json();
  },
  addUserComment: async (taskId: string, payload: { author?: string; role?: string; text: string; badge?: string }) => {
    const res = await fetch(`${API_BASE}/user/comment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ taskId, ...payload })
    });
    if (!res.ok) throw new Error('Failed to add comment');
    return res.json();
  },
  updateUserTaskStatus: async (taskId: string, status: string) => {
    const res = await fetch(`${API_BASE}/user/status/${taskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    if (!res.ok) throw new Error('Failed to update task status');
    return res.json();
  },

  // Appointments
  getAppointmentStats: async (): Promise<import('../types').AppointmentStats> => {
    const res = await fetch(`${API_BASE}/appointments/stats`);
    if (!res.ok) throw new Error('Failed to fetch appointment stats');
    return res.json();
  },
  getAppointments: async (filter?: { status?: string; userId?: string; date?: string; search?: string }): Promise<import('../types').Appointment[]> => {
    const params = new URLSearchParams();
    if (filter?.status) params.append('status', filter.status);
    if (filter?.userId) params.append('userId', filter.userId);
    if (filter?.date) params.append('date', filter.date);
    if (filter?.search) params.append('search', filter.search);
    const res = await fetch(`${API_BASE}/appointments?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch appointments');
    return res.json();
  },
  createAppointment: async (data: Partial<import('../types').Appointment>): Promise<import('../types').Appointment> => {
    const res = await fetch(`${API_BASE}/appointments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to create appointment');
    return res.json();
  },
  updateAppointment: async (id: string, data: Partial<import('../types').Appointment>): Promise<import('../types').Appointment> => {
    const res = await fetch(`${API_BASE}/appointments/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to update appointment');
    return res.json();
  },
  deleteAppointment: async (id: string): Promise<void> => {
    const res = await fetch(`${API_BASE}/appointments/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete appointment');
  }
};
