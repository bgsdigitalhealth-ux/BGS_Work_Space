export interface Department {
  id: string;
  name: string;
  icon: string;
  description: string;
}

export interface Team {
  id: string;
  departmentId: string;
  name: string;
  description: string;
}

export interface Member {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  assignedWork: string;
  teamId: string;
  departmentId: string;
  avatar: string;
}

export interface Assignment {
  id: string;
  memberId: string;
  teamId: string;
  workTitle: string;
  workDescription: string;
  role: string;
  priority: 'High' | 'Medium' | 'Low';
  dueDate: string;
  status: 'In Progress' | 'To Do' | 'In Review' | 'Completed';
}

export interface Task {
  id: string;
  teamId: string;
  title: string;
  priority: 'High' | 'Medium' | 'Low';
  completed: boolean;
  date: string;
}

export interface WorkDone {
  id: string;
  teamId: string;
  title: string;
  details?: string;
  date: string;
}

export interface DashboardStats {
  departmentsCount: number;
  teamsCount: number;
  membersCount: number;
  todaysTasksCount: number;
  workDoneTodayCount: number;
  databaseMode?: string;
}

// User Portal (WorkHub) Types
export interface UserTaskComment {
  id: string;
  author: string;
  role: string;
  date: string;
  badge?: string;
  text: string;
}

export interface UserTaskAttachment {
  name: string;
  size: string;
  date: string;
}

export interface UserAssignedWork {
  id: string;
  taskId?: string;
  title: string;
  department: string;
  team: string;
  priority: 'High' | 'Medium' | 'Low';
  dueDate: string;
  status: 'In Progress' | 'Not Started' | 'Completed' | 'Under Review';
  assignedBy?: string;
  assignedOn?: string;
  description?: string;
  progress?: number;
  comments?: UserTaskComment[];
  attachments?: UserTaskAttachment[];
}

export interface UserWorkHistory {
  id: string;
  title: string;
  taskId: string;
  department: string;
  team: string;
  submittedDate: string;
  status: 'Under Review' | 'Approved' | 'Completed' | 'Rework Requested';
  reviewerFeedback: string;
  assignedBy: string;
  dueDate: string;
  submittedComment?: string;
  reviewerComments?: UserTaskComment[];
}

export interface UserActivity {
  id: string;
  type: 'submitted' | 'started' | 'assigned';
  title: string;
  date: string;
}

export interface UserWorkspaceData {
  stats: {
    totalAssigned: number;
    inProgress: number;
    upcomingWork: number;
    completedWork: number;
    completionPercentage: number;
    completedFractionText: string;
  };
  assignedWork: UserAssignedWork[];
  history: UserWorkHistory[];
  recentActivities: UserActivity[];
}

// Appointment Types
export interface Appointment {
  id: string;
  title: string;
  requestedBy: string;
  userId?: string;
  department: string;
  team: string;
  date: string;
  time: string;
  endTime?: string;
  dateTimeDisplay?: string;
  location?: string;
  purpose?: string;
  status: 'Scheduled' | 'Upcoming' | 'Completed' | 'Cancelled';
  isToday?: boolean;
}

export interface AppointmentStats {
  admin: {
    total: number;
    today: number;
    completed: number;
    upcoming: number;
    cancelled: number;
  };
  user: {
    total: number;
    today: number;
    upcoming: number;
    completed: number;
    cancelled: number;
  };
}

// User & Role System (ONLY TWO ROLES: admin and user)
export type UserRole = 'admin' | 'user';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  department?: string;
  team?: string;
  teamRole?: string;
  title?: string;
}

export interface AuthResponse {
  success: boolean;
  user?: User;
  token?: string;
  error?: string;
  requiresPasswordSetup?: boolean;
  name?: string;
}

export interface Notification {
  id: string;
  recipientRole: UserRole;
  recipientUserId?: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  link?: string;
}




