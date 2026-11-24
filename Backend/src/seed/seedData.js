const initialData = {
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
  userWorkspace: {
    stats: {},
    assignedWork: [],
    history: [],
    recentActivities: []
  },
  users: [
    {
      id: "usr-bgsmch-admin",
      name: "BGS MCH",
      email: "bgsmchhospitalnagarur@gmail.com",
      password: "Apple2026?",
      hasPassword: true,
      role: "admin",
      avatar: "B",
      title: "Administrator"
    }
  ]
};

module.exports = initialData;
