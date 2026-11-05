const initialData = {
  departments: [
    {
      id: 'dept-1',
      name: 'Engineering',
      icon: 'code',
      description: 'Manage teams, members, roles and work.'
    },
    {
      id: 'dept-2',
      name: 'Design',
      icon: 'palette',
      description: 'Product UI/UX design, design system, and creative assets.'
    },
    {
      id: 'dept-3',
      name: 'Marketing',
      icon: 'megaphone',
      description: 'Brand strategy, growth hacking, social media and campaigns.'
    },
    {
      id: 'dept-4',
      name: 'Operations',
      icon: 'layers',
      description: 'Infrastructure, HR, logistics and workplace management.'
    }
  ],

  teams: [
    // Engineering Teams
    {
      id: 'team-1',
      departmentId: 'dept-1',
      name: 'Backend Team',
      description: 'Develops and maintains backend services.'
    },
    {
      id: 'team-2',
      departmentId: 'dept-1',
      name: 'Frontend Team',
      description: 'Builds client web and mobile interfaces.'
    },
    {
      id: 'team-3',
      departmentId: 'dept-1',
      name: 'QA Team',
      description: 'Ensures quality and performance testing across products.'
    },
    // Design Teams
    {
      id: 'team-4',
      departmentId: 'dept-2',
      name: 'UI/UX Design',
      description: 'User experience research, wireframes, and design specs.'
    },
    {
      id: 'team-5',
      departmentId: 'dept-2',
      name: 'Brand & Graphic',
      description: 'Visual identity, marketing graphics, and animations.'
    },
    // Marketing Teams
    {
      id: 'team-6',
      departmentId: 'dept-3',
      name: 'Growth & SEO',
      description: 'Acquisition funnels, analytics, and search optimization.'
    },
    {
      id: 'team-7',
      departmentId: 'dept-3',
      name: 'Content & PR',
      description: 'Editorial content, press releases, and articles.'
    },
    {
      id: 'team-8',
      departmentId: 'dept-3',
      name: 'Social Media',
      description: 'Community engagement, campaigns, and influencer relations.'
    },
    // Operations Teams
    {
      id: 'team-9',
      departmentId: 'dept-4',
      name: 'IT Support & Infra',
      description: 'Hardware, networks, enterprise tools, and sysadmin.'
    },
    {
      id: 'team-10',
      departmentId: 'dept-4',
      name: 'Human Resources',
      description: 'Talent recruitment, onboarding, and employee relations.'
    },
    {
      id: 'team-11',
      departmentId: 'dept-4',
      name: 'Finance & Accounts',
      description: 'Budgeting, payroll, accounting, and compliance.'
    },
    {
      id: 'team-12',
      departmentId: 'dept-4',
      name: 'Facilities',
      description: 'Office management, security, and vendors.'
    }
  ],

  members: [
    // --- Engineering: Backend Team (4 members) ---
    {
      id: 'mem-1',
      name: 'Rahul Sharma',
      email: 'rahul@company.com',
      phone: '+91 98765 43210',
      role: 'Team Lead',
      assignedWork: '',
      teamId: 'team-1',
      departmentId: 'dept-1',
      avatar: 'R'
    },
    {
      id: 'mem-2',
      name: 'Priya Verma',
      email: 'priya@company.com',
      phone: '+91 98765 43211',
      role: 'Developer',
      assignedWork: '',
      teamId: 'team-1',
      departmentId: 'dept-1',
      avatar: 'P'
    },
    {
      id: 'mem-3',
      name: 'Amit Singh',
      email: 'amit@company.com',
      phone: '+91 98765 43212',
      role: 'Tester',
      assignedWork: '',
      teamId: 'team-1',
      departmentId: 'dept-1',
      avatar: 'A'
    },
    {
      id: 'mem-4',
      name: 'Sneha Mehta',
      email: 'sneha@company.com',
      phone: '+91 98765 43213',
      role: 'Designer',
      assignedWork: '',
      teamId: 'team-1',
      departmentId: 'dept-1',
      avatar: 'S'
    },

    // --- Engineering: Frontend Team (3 members) ---
    {
      id: 'mem-5',
      name: 'Vikram Joshi',
      email: 'vikram@company.com',
      phone: '+91 98765 43214',
      role: 'Team Lead',
      assignedWork: '',
      teamId: 'team-2',
      departmentId: 'dept-1',
      avatar: 'V'
    },
    {
      id: 'mem-6',
      name: 'Ananya Roy',
      email: 'ananya@company.com',
      phone: '+91 98765 43215',
      role: 'Developer',
      assignedWork: '',
      teamId: 'team-2',
      departmentId: 'dept-1',
      avatar: 'A'
    },
    {
      id: 'mem-7',
      name: 'Karan Patel',
      email: 'karan@company.com',
      phone: '+91 98765 43216',
      role: 'Developer',
      assignedWork: '',
      teamId: 'team-2',
      departmentId: 'dept-1',
      avatar: 'K'
    },

    // --- Engineering: QA Team (3 members) ---
    {
      id: 'mem-8',
      name: 'Rohan Gupta',
      email: 'rohan@company.com',
      phone: '+91 98765 43218',
      role: 'Team Lead',
      assignedWork: '',
      teamId: 'team-3',
      departmentId: 'dept-1',
      avatar: 'R'
    },
    {
      id: 'mem-9',
      name: 'Meera Iyer',
      email: 'meera@company.com',
      phone: '+91 98765 43219',
      role: 'Tester',
      assignedWork: '',
      teamId: 'team-3',
      departmentId: 'dept-1',
      avatar: 'M'
    },
    {
      id: 'mem-10',
      name: 'Suresh Kumar',
      email: 'suresh@company.com',
      phone: '+91 98765 43220',
      role: 'Tester',
      assignedWork: '',
      teamId: 'team-3',
      departmentId: 'dept-1',
      avatar: 'S'
    },

    // --- Design: UI/UX Design (3 members) ---
    {
      id: 'mem-11',
      name: 'Tanvi Desai',
      email: 'tanvi@company.com',
      phone: '+91 98765 43221',
      role: 'Team Lead',
      assignedWork: '',
      teamId: 'team-4',
      departmentId: 'dept-2',
      avatar: 'T'
    },
    {
      id: 'mem-12',
      name: 'Arjun Nambiar',
      email: 'arjun@company.com',
      phone: '+91 98765 43222',
      role: 'Designer',
      assignedWork: '',
      teamId: 'team-4',
      departmentId: 'dept-2',
      avatar: 'A'
    },
    {
      id: 'mem-13',
      name: 'Ritu Sen',
      email: 'ritu@company.com',
      phone: '+91 98765 43223',
      role: 'Designer',
      assignedWork: '',
      teamId: 'team-4',
      departmentId: 'dept-2',
      avatar: 'R'
    },

    // --- Design: Brand & Graphic (3 members) ---
    {
      id: 'mem-14',
      name: 'Kavita Menon',
      email: 'kavita@company.com',
      phone: '+91 98765 43224',
      role: 'Team Lead',
      assignedWork: '',
      teamId: 'team-5',
      departmentId: 'dept-2',
      avatar: 'K'
    },
    {
      id: 'mem-15',
      name: 'Devansh Reddy',
      email: 'devansh@company.com',
      phone: '+91 98765 43225',
      role: 'Designer',
      assignedWork: '',
      teamId: 'team-5',
      departmentId: 'dept-2',
      avatar: 'D'
    },
    {
      id: 'mem-16',
      name: 'Pooja Hegde',
      email: 'pooja@company.com',
      phone: '+91 98765 43226',
      role: 'Designer',
      assignedWork: '',
      teamId: 'team-5',
      departmentId: 'dept-2',
      avatar: 'P'
    },

    // --- Marketing: Growth & SEO (3 members) ---
    {
      id: 'mem-17',
      name: 'Aditya Rao',
      email: 'aditya@company.com',
      phone: '+91 98765 43227',
      role: 'Team Lead',
      assignedWork: '',
      teamId: 'team-6',
      departmentId: 'dept-3',
      avatar: 'A'
    },
    {
      id: 'mem-18',
      name: 'Bhavna Chawla',
      email: 'bhavna@company.com',
      phone: '+91 98765 43228',
      role: 'Developer',
      assignedWork: '',
      teamId: 'team-6',
      departmentId: 'dept-3',
      avatar: 'B'
    },
    {
      id: 'mem-19',
      name: 'Nikhil Saxena',
      email: 'nikhil@company.com',
      phone: '+91 98765 43229',
      role: 'Tester',
      assignedWork: '',
      teamId: 'team-6',
      departmentId: 'dept-3',
      avatar: 'N'
    },

    // --- Marketing: Content & PR (3 members) ---
    {
      id: 'mem-20',
      name: 'Shalini Nair',
      email: 'shalini@company.com',
      phone: '+91 98765 43230',
      role: 'Team Lead',
      assignedWork: '',
      teamId: 'team-7',
      departmentId: 'dept-3',
      avatar: 'S'
    },
    {
      id: 'mem-21',
      name: 'Manoj Pillai',
      email: 'manoj@company.com',
      phone: '+91 98765 43231',
      role: 'Developer',
      assignedWork: '',
      teamId: 'team-7',
      departmentId: 'dept-3',
      avatar: 'M'
    },
    {
      id: 'mem-22',
      name: 'Radhika Bose',
      email: 'radhika@company.com',
      phone: '+91 98765 43232',
      role: 'Designer',
      assignedWork: '',
      teamId: 'team-7',
      departmentId: 'dept-3',
      avatar: 'R'
    },

    // --- Marketing: Social Media (3 members) ---
    {
      id: 'mem-23',
      name: 'Varun Dhawan',
      email: 'varun@company.com',
      phone: '+91 98765 43233',
      role: 'Team Lead',
      assignedWork: '',
      teamId: 'team-8',
      departmentId: 'dept-3',
      avatar: 'V'
    },
    {
      id: 'mem-24',
      name: 'Deepika Sen',
      email: 'deepika@company.com',
      phone: '+91 98765 43234',
      role: 'Developer',
      assignedWork: '',
      teamId: 'team-8',
      departmentId: 'dept-3',
      avatar: 'D'
    },
    {
      id: 'mem-25',
      name: 'Farhan Ali',
      email: 'farhan@company.com',
      phone: '+91 98765 43235',
      role: 'Tester',
      assignedWork: '',
      teamId: 'team-8',
      departmentId: 'dept-3',
      avatar: 'F'
    },

    // --- Operations: IT Support & Infra (3 members) ---
    {
      id: 'mem-26',
      name: 'Rajesh Kulkarni',
      email: 'rajesh@company.com',
      phone: '+91 98765 43236',
      role: 'Team Lead',
      assignedWork: '',
      teamId: 'team-9',
      departmentId: 'dept-4',
      avatar: 'R'
    },
    {
      id: 'mem-27',
      name: 'Gaurav Bhat',
      email: 'gaurav@company.com',
      phone: '+91 98765 43237',
      role: 'Developer',
      assignedWork: '',
      teamId: 'team-9',
      departmentId: 'dept-4',
      avatar: 'G'
    },
    {
      id: 'mem-28',
      name: 'Aishwarya Patil',
      email: 'aishwarya@company.com',
      phone: '+91 98765 43238',
      role: 'Tester',
      assignedWork: '',
      teamId: 'team-9',
      departmentId: 'dept-4',
      avatar: 'A'
    },

    // --- Operations: Human Resources (3 members) ---
    {
      id: 'mem-29',
      name: 'Sunita Mehra',
      email: 'sunita@company.com',
      phone: '+91 98765 43239',
      role: 'Team Lead',
      assignedWork: '',
      teamId: 'team-10',
      departmentId: 'dept-4',
      avatar: 'S'
    },
    {
      id: 'mem-30',
      name: 'Kunal Kapoor',
      email: 'kunal@company.com',
      phone: '+91 98765 43240',
      role: 'Developer',
      assignedWork: '',
      teamId: 'team-10',
      departmentId: 'dept-4',
      avatar: 'K'
    },
    {
      id: 'mem-31',
      name: 'Tara Sutaria',
      email: 'tara@company.com',
      phone: '+91 98765 43241',
      role: 'Tester',
      assignedWork: '',
      teamId: 'team-10',
      departmentId: 'dept-4',
      avatar: 'T'
    },

    // --- Operations: Finance & Accounts (3 members) ---
    {
      id: 'mem-32',
      name: 'Harish Bajaj',
      email: 'harish@company.com',
      phone: '+91 98765 43242',
      role: 'Team Lead',
      assignedWork: '',
      teamId: 'team-11',
      departmentId: 'dept-4',
      avatar: 'H'
    },
    {
      id: 'mem-33',
      name: 'Geeta Agarwal',
      email: 'geeta@company.com',
      phone: '+91 98765 43243',
      role: 'Developer',
      assignedWork: '',
      teamId: 'team-11',
      departmentId: 'dept-4',
      avatar: 'G'
    },
    {
      id: 'mem-34',
      name: 'Nitin Pandey',
      email: 'nitin@company.com',
      phone: '+91 98765 43244',
      role: 'Tester',
      assignedWork: '',
      teamId: 'team-11',
      departmentId: 'dept-4',
      avatar: 'N'
    },

    // --- Operations: Facilities (2 members) ---
    {
      id: 'mem-35',
      name: 'Ashok Chauhan',
      email: 'ashok@company.com',
      phone: '+91 98765 43245',
      role: 'Team Lead',
      assignedWork: '',
      teamId: 'team-12',
      departmentId: 'dept-4',
      avatar: 'A'
    },
    {
      id: 'mem-36',
      name: 'Pratima Solanki',
      email: 'pratima@company.com',
      phone: '+91 98765 43246',
      role: 'Developer',
      assignedWork: '',
      teamId: 'team-12',
      departmentId: 'dept-4',
      avatar: 'P'
    }
  ],

  // Clean, real assignment state (starts empty)
  assignments: [],

  // Clean, real today tasks state (starts empty)
  tasks: [],

  // Clean, real today work done state (starts empty)
  workDone: [],

  // Clean, dynamic user workspace
  userWorkspace: {
    stats: {
      totalAssigned: 0,
      inProgress: 0,
      upcomingWork: 0,
      completedWork: 0,
      completionRate: 0,
      completedCount: 0,
      totalCount: 0
    },
    assignedWork: [],
    history: [],
    recentActivities: []
  },

  // System Users (ONLY TWO ROLES: admin and user)
  users: [
    {
      id: 'usr-admin',
      name: 'Admin',
      email: 'admin@company.com',
      password: 'admin123',
      role: 'admin',
      avatar: 'A',
      title: 'Admin'
    },
    {
      id: 'usr-rahul',
      name: 'Rahul Sharma',
      email: 'rahul@company.com',
      password: 'user123',
      role: 'user',
      memberId: 'mem-1',
      department: 'Engineering',
      team: 'Backend',
      teamRole: 'Team Lead',
      avatar: 'RS',
      title: 'Team Member'
    },
    {
      id: 'usr-priya',
      name: 'Priya Verma',
      email: 'priya@company.com',
      password: 'user123',
      role: 'user',
      memberId: 'mem-2',
      department: 'Design',
      team: 'UI-UX',
      teamRole: 'Designer',
      avatar: 'PV',
      title: 'Team Member'
    },
    {
      id: 'usr-amit',
      name: 'Amit Singh',
      email: 'amit@company.com',
      password: 'user123',
      role: 'user',
      memberId: 'mem-3',
      department: 'Engineering',
      team: 'Backend',
      teamRole: 'Developer',
      avatar: 'AS',
      title: 'Team Member'
    }
  ],

  // System Notifications for Admin and User (starts empty)
  notifications: [],

  // Real Appointments state (starts empty)
  appointments: []
};

module.exports = initialData;