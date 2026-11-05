import { Department, Team, Member, Assignment, Task, WorkDone, DashboardStats, EligibleUser, Conversation, ChatMessage } from '../types';

// Support production backend on Render via VITE_API_URL or fallback to local proxy /api
const rawBase = (import.meta.env.VITE_API_URL || '').trim();
export const API_BASE = rawBase ? (rawBase.endsWith('/api') ? rawBase : `${rawBase.replace(/\/+$/, '')}/api`) : '/api';

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
  getAssignments: async (filter?: string | { teamId?: string; assignerId?: string; assigneeId?: string; type?: string }): Promise<Assignment[]> => {
    let url = `${API_BASE}/assignments`;
    if (typeof filter === 'string') {
      url += `?teamId=${filter}`;
    } else if (filter) {
      const params = new URLSearchParams();
      if (filter.teamId) params.append('teamId', filter.teamId);
      if (filter.assignerId) params.append('assignerId', filter.assignerId);
      if (filter.assigneeId) params.append('assigneeId', filter.assigneeId);
      if (filter.type) params.append('type', filter.type);
      url += `?${params.toString()}`;
    }
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
  },

  // Authentication (ONLY TWO ROLES: admin, user)
  checkEmail: async (email: string): Promise<{ exists: boolean; hasPassword?: boolean; name?: string; role?: string; error?: string }> => {
    const res = await fetch(`${API_BASE}/auth/check-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    return res.json();
  },
  createPassword: async (email: string, password: string): Promise<import('../types').AuthResponse> => {
    const res = await fetch(`${API_BASE}/auth/create-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to create password' }));
      throw new Error(err.error || 'Failed to create password');
    }
    return res.json();
  },
  login: async (email: string, password: string): Promise<import('../types').AuthResponse> => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Login failed' }));
      throw new Error(err.error || 'Invalid credentials');
    }
    return res.json();
  },
  getUsers: async (): Promise<import('../types').User[]> => {
    const res = await fetch(`${API_BASE}/auth/users`);
    if (!res.ok) throw new Error('Failed to fetch users');
    return res.json();
  },
  updateAdminProfile: async (data: { identifier: string; name?: string; email?: string; newPassword?: string }): Promise<{ success: boolean; user: import('../types').User }> => {
    const res = await fetch(`${API_BASE}/auth/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to update profile' }));
      throw new Error(err.error || 'Failed to update profile');
    }
    return res.json();
  },
  updateUserProfile: async (data: {
    identifier: string;
    name?: string;
    avatar?: string;
    currentPassword?: string;
    newPassword?: string;
  }): Promise<{ success: boolean; user: import('../types').User }> => {
    const res = await fetch(`${API_BASE}/user/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to update profile' }));
      throw new Error(err.error || 'Failed to update profile');
    }
    return res.json();
  },
  getAdmins: async (): Promise<import('../types').User[]> => {
    const res = await fetch(`${API_BASE}/auth/admins`);
    if (!res.ok) throw new Error('Failed to fetch administrators');
    return res.json();
  },
  createAdmin: async (data: { name: string; email: string; password: string }): Promise<{ success: boolean; user: import('../types').User }> => {
    const res = await fetch(`${API_BASE}/auth/admins`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to create administrator' }));
      throw new Error(err.error || 'Failed to create administrator');
    }
    return res.json();
  },
  deleteAdmin: async (id: string): Promise<void> => {
    const res = await fetch(`${API_BASE}/auth/admins/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to delete administrator' }));
      throw new Error(err.error || 'Failed to delete administrator');
    }
  },

  // Notifications
  getNotifications: async (role?: string, userId?: string): Promise<import('../types').Notification[]> => {
    const params = new URLSearchParams();
    if (role) params.append('role', role);
    if (userId) params.append('userId', userId);
    const res = await fetch(`${API_BASE}/notifications?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch notifications');
    return res.json();
  },
  markNotificationRead: async (id: string): Promise<void> => {
    const res = await fetch(`${API_BASE}/notifications/${id}/read`, { method: 'PATCH' });
    if (!res.ok) throw new Error('Failed to mark notification read');
  },
  markAllNotificationsRead: async (role?: string): Promise<void> => {
    const res = await fetch(`${API_BASE}/notifications/mark-all-read`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role })
    });
    if (!res.ok) throw new Error('Failed to mark all notifications read');
  },

  // Work Review (Admin Actions)
  approveWork: async (taskId: string, comment?: string) => {
    const res = await fetch(`${API_BASE}/work/${taskId}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ comment })
    });
    if (!res.ok) throw new Error('Failed to approve work');
    return res.json();
  },
  requestRework: async (taskId: string, feedback: string) => {
    const res = await fetch(`${API_BASE}/work/${taskId}/rework`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ feedback })
    });
    if (!res.ok) throw new Error('Failed to request rework');
    return res.json();
  },

  // Real-Time Messaging API
  getOnlineUsers: async (): Promise<Array<{ id: string; email: string; name?: string; role?: string }>> => {
    try {
      const res = await fetch(`${API_BASE}/messages/online-users`);
      if (!res.ok) return [];
      return res.json();
    } catch (e) {
      return [];
    }
  },

  getEligibleUsers: async (currentUserId?: string): Promise<EligibleUser[]> => {
    const url = currentUserId ? `${API_BASE}/messages/eligible-users?currentUserId=${encodeURIComponent(currentUserId)}` : `${API_BASE}/messages/eligible-users`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch eligible users');
    return res.json();
  },

  getConversations: async (userId?: string, email?: string): Promise<Conversation[]> => {
    const params = new URLSearchParams();
    if (userId) params.append('userId', userId);
    if (email) params.append('email', email);
    const res = await fetch(`${API_BASE}/messages/conversations?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch conversations');
    return res.json();
  },

  startConversation: async (currentUserId: string, recipientEmail: string): Promise<Conversation> => {
    const res = await fetch(`${API_BASE}/messages/conversations/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentUserId, recipientEmail })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to start conversation' }));
      throw new Error(err.error || 'Failed to start conversation');
    }
    return res.json();
  },

  getMessageHistory: async (conversationId: string, userId?: string): Promise<ChatMessage[]> => {
    const url = userId ? `${API_BASE}/messages/history/${conversationId}?userId=${encodeURIComponent(userId)}` : `${API_BASE}/messages/history/${conversationId}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch message history');
    return res.json();
  },

  sendMessage: async (data: {
    conversationId: string;
    senderId: string;
    senderEmail: string;
    senderName: string;
    senderRole?: string;
    recipientEmail: string;
    text: string;
    attachment?: any;
  }): Promise<ChatMessage> => {
    const res = await fetch(`${API_BASE}/messages/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to send message' }));
      throw new Error(err.error || 'Failed to send message');
    }
    return res.json();
  },

  markMessagesRead: async (conversationId: string, userId: string): Promise<{ success: boolean }> => {
    const res = await fetch(`${API_BASE}/messages/read/${conversationId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId })
    });
    if (!res.ok) throw new Error('Failed to mark messages as read');
    return res.json();
  },

  getUnreadMessagesCount: async (userId: string): Promise<{ count: number }> => {
    const res = await fetch(`${API_BASE}/messages/unread-count?userId=${encodeURIComponent(userId)}`);
    if (!res.ok) throw new Error('Failed to fetch unread messages count');
    return res.json();
  }
};
