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
    // Backend Team Members (as shown in images)
    {
      id: 'mem-1',
      name: 'Rahul Sharma',
      email: 'rahul@company.com',
      phone: '+91 98765 43210',
      role: 'Team Lead',
      assignedWork: 'Oversee backend dev, code review',
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
      assignedWork: 'Build APIs & new features',
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
      assignedWork: 'Test APIs & report bugs',
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
      assignedWork: 'Design API documentation UI',
      teamId: 'team-1',
      departmentId: 'dept-1',
      avatar: 'S'
    },
    // Frontend Team Members
    {
      id: 'mem-5',
      name: 'Vikram Joshi',
      email: 'vikram@company.com',
      phone: '+91 98765 43214',
      role: 'Team Lead',
      assignedWork: 'Frontend architecture & state store',
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
      assignedWork: 'Design system components in React',
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
      assignedWork: 'Integrate REST APIs with React Query',
      teamId: 'team-2',
      departmentId: 'dept-1',
      avatar: 'K'
    },
    {
      id: 'mem-8',
      name: 'Divya Nair',
      email: 'divya@company.com',
      phone: '+91 98765 43217',
      role: 'Tester',
      assignedWork: 'Cypress E2E test suite',
      teamId: 'team-2',
      departmentId: 'dept-1',
      avatar: 'D'
    },
    // QA Team Members
    {
      id: 'mem-9',
      name: 'Rohan Gupta',
      email: 'rohan@company.com',
      phone: '+91 98765 43218',
      role: 'Team Lead',
      assignedWork: 'Automated test pipelines in CI/CD',
      teamId: 'team-3',
      departmentId: 'dept-1',
      avatar: 'R'
    },
    {
      id: 'mem-10',
      name: 'Meera Iyer',
      email: 'meera@company.com',
      phone: '+91 98765 43219',
      role: 'Tester',
      assignedWork: 'Load and regression testing',
      teamId: 'team-3',
      departmentId: 'dept-1',
      avatar: 'M'
    },
    {
      id: 'mem-11',
      name: 'Suresh Kumar',
      email: 'suresh@company.com',
      phone: '+91 98765 43220',
      role: 'Tester',
      assignedWork: 'Security and vulnerability audits',
      teamId: 'team-3',
      departmentId: 'dept-1',
      avatar: 'S'
    }
  ],

  assignments: [
    {
      id: 'assign-1',
      memberId: 'mem-1',
      teamId: 'team-1',
      workTitle: 'Oversee backend development',
      workDescription: 'Review code, guide the team, and ensure timely delivery of backend features for the current sprint.',
      role: 'Team Lead',
      priority: 'High',
      dueDate: 'Jan 31, 2026',
      status: 'In Progress'
    },
    {
      id: 'assign-2',
      memberId: 'mem-2',
      teamId: 'team-1',
      workTitle: 'Build APIs & new features',
      workDescription: 'Implement authentication, department management, and task routing endpoints.',
      role: 'Developer',
      priority: 'High',
      dueDate: 'Feb 05, 2026',
      status: 'In Progress'
    },
    {
      id: 'assign-3',
      memberId: 'mem-3',
      teamId: 'team-1',
      workTitle: 'Test APIs & report bugs',
      workDescription: 'Verify edge cases, validation errors, and rate-limiting across all routes.',
      role: 'Tester',
      priority: 'Medium',
      dueDate: 'Jan 29, 2026',
      status: 'To Do'
    },
    {
      id: 'assign-4',
      memberId: 'mem-4',
      teamId: 'team-1',
      workTitle: 'Design API documentation UI',
      workDescription: 'Create interactive OpenAPI / Swagger specifications and responsive layouts.',
      role: 'Designer',
      priority: 'Low',
      dueDate: 'Feb 03, 2026',
      status: 'In Review'
    }
  ],

  tasks: [
    {
      id: 'task-1',
      teamId: 'team-1',
      title: 'Implement user login API',
      priority: 'High',
      completed: false,
      date: '2026-11-05'
    },
    {
      id: 'task-2',
      teamId: 'team-1',
      title: 'Fix reported bugs',
      priority: 'Medium',
      completed: false,
      date: '2026-11-05'
    },
    {
      id: 'task-3',
      teamId: 'team-1',
      title: 'Update API documentation',
      priority: 'Low',
      completed: false,
      date: '2026-11-05'
    }
  ],

  workDone: [
    {
      id: 'wd-1',
      teamId: 'team-1',
      title: 'User registration API completed',
      details: 'Added password hashing with bcrypt and JWT payload generation.',
      date: '2026-11-05'
    },
    {
      id: 'wd-2',
      teamId: 'team-1',
      title: 'Bug #452 fixed',
      details: 'Resolved race condition in concurrent database writes.',
      date: '2026-11-05'
    },
    {
      id: 'wd-3',
      teamId: 'team-1',
      title: 'Code review for PR #118',
      details: 'Reviewed and merged pull request for department routes.',
      date: '2026-11-05'
    }
  ]
};

module.exports = initialData;
