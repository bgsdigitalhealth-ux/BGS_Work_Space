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

