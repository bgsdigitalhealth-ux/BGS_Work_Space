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

export type AssignmentType = 'admin_to_user' | 'admin_to_admin' | 'user_to_admin' | 'user_to_user';

export interface Assignment {
  id: string;
  memberId?: string;
  teamId?: string;
  departmentId?: string;
  workTitle: string;
  workDescription: string;
  role: string;
  priority: 'High' | 'Medium' | 'Low';
  dueDate: string;
  status: 'In Progress' | 'To Do' | 'In Review' | 'Completed';
  // Any-to-Any Metadata
  assignerId?: string;
  assignerName?: string;
  assignerRole?: 'admin' | 'user';
  assignerEmail?: string;
  assigneeId?: string;
  assigneeName?: string;
  assigneeRole?: 'admin' | 'user';
  assigneeEmail?: string;
  assignmentType?: AssignmentType;
  createdAt?: string;
}

export interface Task {
  id: string;
  teamId: string;
  title: string;
  priority: 'High' | 'Medium' | 'Low';
  completed: boolean;
  date: string;
  assignmentId?: string;
  memberId?: string;
  memberName?: string;
  assignedBy?: string;
  assignerRole?: string;
  assignmentType?: AssignmentType;
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
  assignerRole?: string;
  assignmentType?: AssignmentType;
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
  meetingId?: string;
  joinUrl?: string;
  senderEmail?: string;
  receiverEmail?: string;
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

// Messaging System Types
export interface MessageAttachment {
  name: string;
  url: string;
  size?: number | string;
  type?: string;
}

export interface MeetingData {
  id: string;
  title: string;
  type: 'direct' | 'group';
  status: 'active' | 'ended';
  startedAt?: string;
  joinUrl?: string;
  hostName: string;
  hostEmail: string;
  participantsCount?: number;
}

export interface ChatMessage {
  id: string;
  customId?: string;
  conversationId: string;
  senderId: string;
  senderEmail: string;
  senderName: string;
  senderRole?: 'admin' | 'user';
  recipientId: string;
  recipientEmail: string;
  recipientName: string;
  text: string;
  attachment?: MessageAttachment | null;
  meeting?: MeetingData | null;
  status: 'sent' | 'delivered' | 'read';
  readAt?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ConversationParticipant {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  avatar?: string;
  phone?: string;
  department?: string;
  team?: string;
}

export interface Conversation {
  id: string;
  customId?: string;
  participants: string[];
  participantEmails: string[];
  otherUser: ConversationParticipant;
  lastMessage?: {
    text: string;
    senderId: string;
    senderEmail: string;
    senderName: string;
    timestamp: string;
    status: 'sent' | 'delivered' | 'read';
  };
  unread: number;
  unreadCounts?: Record<string, number>;
  createdAt?: string;
  updatedAt?: string;
}

export interface EligibleUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  avatar?: string;
  phone?: string;
  department?: string;
  team?: string;
}

export interface VideoMeeting {
  id: string;
  customId?: string;
  meetingId: string;
  title: string;
  type: 'one-to-one' | 'one-to-many';
  senderId: string;
  senderName: string;
  senderEmail: string;
  receiverId?: string;
  receiverName?: string;
  receiverEmail?: string;
  participants: Array<{
    id?: string;
    name?: string;
    email?: string;
    role?: string;
  }>;
  participantEmails: string[];
  date: string;
  time: string;
  mode: 'Online' | 'Offline';
  location?: string;
  joinUrl: string;
  purpose?: string;
  status: 'Pending' | 'Scheduled' | 'Upcoming' | 'Completed' | 'Cancelled';
  requiresApproval: boolean;
  invitationIssued: boolean;
  createdAt?: string;
}





