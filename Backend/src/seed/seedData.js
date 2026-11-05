const initialData = {
  // Purely dynamic - starts 100% clean
  departments: [],
  teams: [],
  members: [],
  assignments: [],
  tasks: [],
  workDone: [],
  appointments: [],
  notifications: [],

  // Dynamic user workspace
  userWorkspace: {
    stats: {
      totalAssigned: 0,
      inProgress: 0,
      upcomingWork: 0,
      completedWork: 0,
      completionRate: 0,
      completionPercentage: 0,
      completedCount: 0,
      totalCount: 0,
      completedFractionText: '0 of 0 Tasks'
    },
    assignedWork: [],
    history: [],
    recentActivities: []
  },

  // Authorized login accounts (2 Roles Only: admin and user)
  users: [
    {
      id: 'usr-admin',
      name: 'Admin',
      email: 'dynamicsajjan@gamil.com',
      password: 'Apple9844?',
      role: 'admin',
      avatar: 'A',
      title: 'Administrator'
    },
    {
      id: 'usr-admin-alias',
      name: 'Admin',
      email: 'dynamicsajjan@gmail.com',
      password: 'Apple9844?',
      role: 'admin',
      avatar: 'A',
      title: 'Administrator'
    },
    {
      id: 'usr-admin-backup',
      name: 'Admin',
      email: 'admin@company.com',
      password: 'Apple9844?',
      role: 'admin',
      avatar: 'A',
      title: 'Administrator'
    },
    {
      id: 'usr-user',
      name: 'Team Member',
      email: 'user@company.com',
      password: 'user123',
      role: 'user',
      memberId: '',
      department: '',
      team: '',
      teamRole: 'Team Member',
      avatar: 'TM',
      title: 'Team Member'
    },
    {
      id: 'usr-rahul',
      name: 'Rahul Sharma',
      email: 'rahul@company.com',
      password: 'user123',
      role: 'user',
      memberId: '',
      department: '',
      team: '',
      teamRole: 'Team Member',
      avatar: 'RS',
      title: 'Team Member'
    }
  ]
};

module.exports = initialData;
