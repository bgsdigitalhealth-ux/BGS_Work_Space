import { Department, Team, Member, Assignment, Task, WorkDone, DashboardStats, EligibleUser, Conversation, ChatMessage, AttendanceRecord, TimelineEvent, ReportItem, ReportResponse } from '../types';

// Support production backend on Render via VITE_API_URL (Cloudflare Pages) or fallback to local proxy /api
const rawBase = (import.meta.env.VITE_API_URL || '').trim().replace(/\/+$/, '');
export const API_BASE = rawBase ? (rawBase.endsWith('/api') ? rawBase : `${rawBase}/api`) : '/api';

export const getAuthHeaders = (): Record<string, string> => {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  try {
    const raw = localStorage.getItem('workhub_user');
    if (raw) {
      const u = JSON.parse(raw);
      if (u.role) headers['x-user-role'] = u.role;
      if (u.email) headers['x-user-email'] = u.email;
      if (u.id) headers['x-user-id'] = u.id;
    }
  } catch (e) {
    // ignore storage read error
  }
  return headers;
};

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
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to create department');
    return res.json();
  },
  updateDepartment: async (id: string, data: Partial<Department>): Promise<Department> => {
    const res = await fetch(`${API_BASE}/departments/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to update department');
    return res.json();
  },
  deleteDepartment: async (id: string): Promise<void> => {
    const res = await fetch(`${API_BASE}/departments/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
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
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to create team');
    return res.json();
  },
  updateTeam: async (id: string, data: Partial<Team>): Promise<Team> => {
    const res = await fetch(`${API_BASE}/teams/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to update team');
    return res.json();
  },
  deleteTeam: async (id: string): Promise<void> => {
    const res = await fetch(`${API_BASE}/teams/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
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
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(err?.error || err?.message || 'Failed to create member');
    }
    return res.json();
  },
  updateMember: async (id: string, data: Partial<Member>): Promise<Member> => {
    const res = await fetch(`${API_BASE}/members/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(err?.error || err?.message || 'Failed to update member');
    }
    return res.json();
  },
  deleteMember: async (id: string): Promise<void> => {
    const res = await fetch(`${API_BASE}/members/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
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
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to create assignment');
    return res.json();
  },
  deleteAssignment: async (id: string): Promise<void> => {
    const res = await fetch(`${API_BASE}/assignments/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to delete assignment');
  },
  editAssignment: async (id: string, data: any): Promise<any> => {
    const res = await fetch(`${API_BASE}/assignments/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(err?.error || 'Failed to edit assignment');
    }
    return res.json();
  },

  // Attendance (Punch In / Punch Out)
  getTodayAttendance: async (userId?: string, userEmail?: string): Promise<AttendanceRecord> => {
    const params = new URLSearchParams();
    if (userId) params.append('userId', userId);
    if (userEmail) params.append('userEmail', userEmail);
    const res = await fetch(`${API_BASE}/attendance/today?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch today attendance');
    return res.json();
  },
  getAttendanceRecords: async (userId?: string, userEmail?: string, limit?: number): Promise<AttendanceRecord[]> => {
    const params = new URLSearchParams();
    if (userId) params.append('userId', userId);
    if (userEmail) params.append('userEmail', userEmail);
    if (limit) params.append('limit', String(limit));
    const res = await fetch(`${API_BASE}/attendance/records?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch attendance records');
    return res.json();
  },
  punchIn: async (data: { userId: string; userEmail: string; userName?: string; teamId?: string; teamName?: string; departmentId?: string; departmentName?: string }): Promise<AttendanceRecord> => {
    const res = await fetch(`${API_BASE}/attendance/punch-in`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(err?.error || 'Failed to punch in');
    }
    return res.json();
  },
  punchOut: async (data: { userId: string; userEmail: string }): Promise<AttendanceRecord> => {
    const res = await fetch(`${API_BASE}/attendance/punch-out`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(err?.error || 'Failed to punch out');
    }
    return res.json();
  },

  // Task Time Tracking (Start, Pause, Resume, Finish)
  startTaskTimer: async (taskId: string, user: { id: string; name: string; role: string; email?: string }): Promise<any> => {
    const res = await fetch(`${API_BASE}/tasks/${taskId}/timer/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id, userName: user.name, userRole: user.role, userEmail: user.email })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(err?.error || 'Failed to start task timer');
    }
    return res.json();
  },
  pauseTaskTimer: async (taskId: string, user: { id: string; name: string; role: string; email?: string }, reason: string): Promise<any> => {
    const res = await fetch(`${API_BASE}/tasks/${taskId}/timer/pause`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id, userName: user.name, userRole: user.role, userEmail: user.email, reason })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(err?.error || 'Failed to pause task timer');
    }
    return res.json();
  },
  resumeTaskTimer: async (taskId: string, user: { id: string; name: string; role: string; email?: string }): Promise<any> => {
    const res = await fetch(`${API_BASE}/tasks/${taskId}/timer/resume`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id, userName: user.name, userRole: user.role, userEmail: user.email })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(err?.error || 'Failed to resume task timer');
    }
    return res.json();
  },
  finishTaskTimer: async (taskId: string, user: { id: string; name: string; role: string; email?: string }): Promise<any> => {
    const res = await fetch(`${API_BASE}/tasks/${taskId}/timer/finish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id, userName: user.name, userRole: user.role, userEmail: user.email })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(err?.error || 'Failed to finish task timer');
    }
    return res.json();
  },

  // Manager's Daily Timeline
  getManagerTimeline: async (params: { date?: string; teamId?: string; memberId?: string }): Promise<{ date: string; teamId: string; memberId: string; events: TimelineEvent[] }> => {
    const q = new URLSearchParams();
    if (params.date) q.append('date', params.date);
    if (params.teamId) q.append('teamId', params.teamId);
    if (params.memberId) q.append('memberId', params.memberId);
    const res = await fetch(`${API_BASE}/timeline?${q.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch timeline');
    return res.json();
  },

  // Manager Reports
  getReports: async (params: { period?: string; date?: string; teamId?: string }): Promise<ReportResponse> => {
    const q = new URLSearchParams();
    if (params.period) q.append('period', params.period);
    if (params.date) q.append('date', params.date);
    if (params.teamId) q.append('teamId', params.teamId);
    const res = await fetch(`${API_BASE}/reports?${q.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch reports');
    return res.json();
  },
  updateReportEntry: async (id: string, data: any): Promise<ReportItem> => {
    const res = await fetch(`${API_BASE}/reports/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(err?.error || 'Failed to update report entry');
    }
    return res.json();
  },
  deleteReportEntry: async (id: string, userRole?: string): Promise<{ success: boolean; id: string }> => {
    const res = await fetch(`${API_BASE}/reports/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userRole })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(err?.error || 'Failed to delete report entry');
    }
    return res.json();
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
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to create task');
    return res.json();
  },
  updateTask: async (id: string, data: Partial<Task>): Promise<Task> => {
    const res = await fetch(`${API_BASE}/tasks/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to update task');
    return res.json();
  },
  toggleTask: async (id: string): Promise<Task> => {
    const res = await fetch(`${API_BASE}/tasks/${id}/toggle`, { method: 'PATCH', headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to toggle task');
    return res.json();
  },
  deleteTask: async (id: string): Promise<void> => {
    const res = await fetch(`${API_BASE}/tasks/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
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
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to create work done');
    return res.json();
  },
  deleteWorkDone: async (id: string): Promise<void> => {
    const res = await fetch(`${API_BASE}/work-done/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to delete work done');
  },

  // User Workspace (WorkHub) - Strict User Isolation
  getUserWorkspace: async (userId?: string, email?: string): Promise<import('../types').UserWorkspaceData> => {
    const params = new URLSearchParams();
    if (userId) params.append('userId', userId);
    if (email) params.append('email', email);
    const qs = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(`${API_BASE}/user/workspace${qs}`, {
      headers: {
        ...(userId ? { 'x-user-id': userId } : {}),
        ...(email ? { 'x-user-email': email } : {})
      }
    });
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
    const res = await fetch(`${API_BASE}/appointments/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
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
  validateSession: async (id?: string, email?: string): Promise<{ valid: boolean; deleted?: boolean; pendingDb?: boolean; user?: import('../types').User; error?: string }> => {
    try {
      const res = await fetch(`${API_BASE}/auth/validate-session`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ id, email })
      });
      // Only treat explicit 401 from backend (when Atlas confirmed deletion) as revoked session.
      // Transient 5xx / Render wake-up errors must NEVER falsely log out an active user!
      if (res.status === 401) {
        const body = await res.json().catch(() => ({ valid: false, deleted: true }));
        return { valid: false, deleted: body.deleted !== false, error: body.message || 'User account has been deleted' };
      }
      if (!res.ok) {
        return { valid: true, pendingDb: true };
      }
      return res.json();
    } catch (e: any) {
      // Network blip or Render cold start — keep session intact
      return { valid: true, pendingDb: true };
    }
  },
  getUsers: async (): Promise<import('../types').User[]> => {
    const res = await fetch(`${API_BASE}/auth/users`);
    if (!res.ok) throw new Error('Failed to fetch users');
    return res.json();
  },
  updateUser: async (id: string, data: { name?: string; email?: string; role?: 'admin' | 'user' | 'manager'; password?: string; avatar?: string }): Promise<{ success: boolean; user: import('../types').User }> => {
    const res = await fetch(`${API_BASE}/auth/users/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to update user' }));
      throw new Error(err.error || 'Failed to update user');
    }
    return res.json();
  },
  deleteUser: async (id: string): Promise<{ success: boolean; message: string }> => {
    const res = await fetch(`${API_BASE}/auth/users/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to delete user' }));
      throw new Error(err.error || 'Failed to delete user');
    }
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
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to create administrator' }));
      throw new Error(err.error || 'Failed to create administrator');
    }
    return res.json();
  },
  deleteAdmin: async (id: string): Promise<void> => {
    const res = await fetch(`${API_BASE}/auth/admins/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to delete administrator' }));
      throw new Error(err.error || 'Failed to delete administrator');
    }
  },

  // Notifications
  getNotifications: async (role?: string, userId?: string, email?: string): Promise<import('../types').Notification[]> => {
    const params = new URLSearchParams();
    if (role) params.append('role', role);
    if (userId) params.append('userId', userId);
    if (email) params.append('email', email);
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
      headers: getAuthHeaders(),
      body: JSON.stringify({ comment })
    });
    if (!res.ok) throw new Error('Failed to approve work');
    return res.json();
  },
  requestRework: async (taskId: string, feedback: string) => {
    const res = await fetch(`${API_BASE}/work/${taskId}/rework`, {
      method: 'POST',
      headers: getAuthHeaders(),
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
  },

  // Video Meetings & WebRTC API
  getMeetings: async (userId?: string, email?: string, role?: string): Promise<any[]> => {
    const params = new URLSearchParams();
    if (userId) params.append('userId', userId);
    if (email) params.append('email', email);
    if (role) params.append('role', role);
    const res = await fetch(`${API_BASE}/meetings?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch meetings');
    return res.json();
  },

  getMeetingById: async (meetingId: string): Promise<any> => {
    const res = await fetch(`${API_BASE}/meetings/${meetingId}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to fetch meeting' }));
      throw new Error(err.error || 'Failed to fetch meeting');
    }
    return res.json();
  },

  createMeeting: async (data: any): Promise<any> => {
    const res = await fetch(`${API_BASE}/meetings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to create meeting' }));
      throw new Error(err.error || 'Failed to create meeting');
    }
    return res.json();
  },

  approveMeeting: async (meetingId: string, adminUser?: any): Promise<any> => {
    const res = await fetch(`${API_BASE}/meetings/${meetingId}/approve`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminUser })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to approve meeting' }));
      throw new Error(err.error || 'Failed to approve meeting');
    }
    return res.json();
  },

  verifyMeetingAccess: async (meetingId: string, userId?: string, email?: string, role?: string): Promise<{ allowed: boolean; meeting?: any; role?: string; reason?: string }> => {
    const params = new URLSearchParams();
    if (userId) params.append('userId', userId);
    if (email) params.append('email', email);
    if (role) params.append('role', role);
    const res = await fetch(`${API_BASE}/meetings/${meetingId}/verify?${params.toString()}`);
    if (res.status === 403) {
      const err = await res.json().catch(() => ({ error: 'Access Denied' }));
      return { allowed: false, reason: err.reason || err.error || 'Access Denied' };
    }
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Verification failed' }));
      return { allowed: false, reason: err.reason || err.error || 'Verification failed' };
    }
    return res.json();
  },

  getTurnCredentials: async (userId?: string): Promise<{ iceServers: RTCIceServer[] }> => {
    const url = userId ? `${API_BASE}/meetings/turn-credentials?userId=${encodeURIComponent(userId)}` : `${API_BASE}/meetings/turn-credentials`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to get ICE servers');
    return res.json();
  },

  // Receiver Email Verification for Work Requests (Meeting, Event, General Info)
  verifyReceiverEmail: async (email: string): Promise<{ exists: boolean; user?: any; error?: string }> => {
    try {
      const res = await fetch(`${API_BASE}/auth/verify-receiver`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: (email || '').trim().toLowerCase() })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.exists) {
        return {
          exists: false,
          error: data.error || 'Invalid receiver email. Enter the email address of a registered user.'
        };
      }
      return { exists: true, user: data.user };
    } catch (err: any) {
      return {
        exists: false,
        error: err.message || 'Invalid receiver email. Enter the email address of a registered user.'
      };
    }
  },

  // WPPConnect WhatsApp Integration
  sendWppNotifications: async (payload: {
    formType: string;
    referenceId: string;
    senderName: string;
    senderNumber: string;
    receiverName: string;
    receiverNumber: string;
    agreedToNotifications?: boolean;
  }): Promise<any> => {
    try {
      const res = await fetch(`${API_BASE}/wpp/send-notifications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      return await res.json().catch(() => ({ success: true }));
    } catch (err) {
      console.warn('WPP notification error:', err);
      return { success: false };
    }
  },

  getWppStatus: async (): Promise<any> => {
    const res = await fetch(`${API_BASE}/wpp/status`);
    if (!res.ok) throw new Error('Failed to fetch WPPConnect status');
    return res.json();
  },

  restartWpp: async (clean: boolean = false): Promise<any> => {
    const res = await fetch(`${API_BASE}/wpp/restart`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clean })
    });
    if (!res.ok) throw new Error('Failed to restart WPPConnect session');
    return res.json();
  },

  getWppMessages: async (): Promise<any[]> => {
    const res = await fetch(`${API_BASE}/wpp/messages`);
    if (!res.ok) throw new Error('Failed to fetch WhatsApp messages');
    return res.json();
  },

  flushWppQueue: async (): Promise<any> => {
    const res = await fetch(`${API_BASE}/wpp/flush`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    if (!res.ok) throw new Error('Failed to flush WhatsApp message queue');
    return res.json();
  },

  getWppAlertSettings: async (): Promise<any> => {
    const res = await fetch(`${API_BASE}/wpp/alerts/settings`);
    if (!res.ok) throw new Error('Failed to fetch alert settings');
    return res.json();
  },

  updateWppAlertSettings: async (settings: any): Promise<any> => {
    const res = await fetch(`${API_BASE}/wpp/alerts/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    });
    if (!res.ok) throw new Error('Failed to update alert settings');
    return res.json();
  },

  sendWppAlertTest: async (channel: string = 'all'): Promise<any> => {
    const res = await fetch(`${API_BASE}/wpp/alerts/test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ channel })
    });
    if (!res.ok) throw new Error('Failed to send test alert');
    return res.json();
  }
};
