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
  conversations: [],
  messages: [],

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
      email: 'dynamicsajjan@gmail.com',
      password: 'Apple9844?',
      hasPassword: true,
      role: 'admin',
      avatar: 'A',
      title: 'Administrator'
    },
    {
      id: 'usr-hari',
      name: 'Hari',
      email: 'rpy6425@gmail.com',
      password: 'user123',
      hasPassword: true,
      role: 'user',
      memberId: '',
      department: '',
      team: '',
      teamRole: 'Team Member',
      avatar: 'H',
      title: 'Team Member'
    }
  ]
};

module.exports = initialData;
