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

    // --- Engineering: Frontend Team (3 members) ---
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

    // --- Engineering: QA Team (3 members) ---
    {
      id: 'mem-8',
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
      id: 'mem-9',
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
      id: 'mem-10',
      name: 'Suresh Kumar',
      email: 'suresh@company.com',
      phone: '+91 98765 43220',
      role: 'Tester',
      assignedWork: 'Security and vulnerability audits',
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
      assignedWork: 'Design system tokens and audits',
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
      assignedWork: 'Mobile application user flows',
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
      assignedWork: 'Usability testing with customers',
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
      assignedWork: 'Brand guidelines and asset catalog',
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
      assignedWork: 'Landing page illustrations',
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
      assignedWork: 'Social media visual banners',
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
      assignedWork: 'Conversion funnel optimization',
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
      assignedWork: 'Analytics tracking & tag management',
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
      assignedWork: 'A/B testing campaign validation',
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
      assignedWork: 'Quarterly PR roadmap & press releases',
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
      assignedWork: 'Blog CMS setup & SEO articles',
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
      assignedWork: 'Whitepaper layout and infographics',
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
      assignedWork: 'Multi-channel social campaigns',
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
      assignedWork: 'Social scheduling automation bot',
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
      assignedWork: 'Engagement metrics monitoring',
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
      assignedWork: 'Network firewall & VPN security update',
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
      assignedWork: 'Cloud server provisioning & IAM roles',
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
      assignedWork: 'Workstation security compliance check',
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
      assignedWork: 'Annual performance review coordination',
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
      assignedWork: 'HR portal onboarding module',
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
      assignedWork: 'Employee feedback survey analysis',
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
      assignedWork: 'Quarterly financial audit & filing',
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
      assignedWork: 'Automated invoice processing engine',
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
      assignedWork: 'Payroll reconciliation validation',
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
      assignedWork: 'Office infrastructure & vendor agreements',
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
      assignedWork: 'Smart badge access control deployment',
      teamId: 'team-12',
      departmentId: 'dept-4',
      avatar: 'P'
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
    },
    // Operations: IT Support assignment
    {
      id: 'assign-5',
      memberId: 'mem-26',
      teamId: 'team-9',
      workTitle: 'Network firewall & VPN security update',
      workDescription: 'Upgrade corporate edge routers and configure Zero Trust certificates.',
      role: 'Team Lead',
      priority: 'High',
      dueDate: 'Feb 10, 2026',
      status: 'In Progress'
    },
    {
      id: 'assign-6',
      memberId: 'mem-27',
      teamId: 'team-9',
      workTitle: 'Cloud server provisioning & IAM roles',
      workDescription: 'Setup auto-scaling group and configure least-privilege service accounts.',
      role: 'Developer',
      priority: 'Medium',
      dueDate: 'Feb 08, 2026',
      status: 'To Do'
    }
  ],

  tasks: [
    // Backend Team Tasks
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
    },
    // IT Support & Infra Tasks
    {
      id: 'task-4',
      teamId: 'team-9',
      title: 'Audit VPN logs for anomalous logins',
      priority: 'High',
      completed: false,
      date: '2026-11-05'
    },
    {
      id: 'task-5',
      teamId: 'team-9',
      title: 'Renew SSL wildcard certificates',
      priority: 'Medium',
      completed: false,
      date: '2026-11-05'
    },
    {
      id: 'task-6',
      teamId: 'team-9',
      title: 'Verify offsite automated backups',
      priority: 'Low',
      completed: false,
      date: '2026-11-05'
    }
  ],

  workDone: [
    // Backend Team Work Done
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
    },
    // IT Support Work Done
    {
      id: 'wd-4',
      teamId: 'team-9',
      title: 'Upgraded primary office switch firmware to v4.2',
      details: 'Zero downtime maintenance during early morning window.',
      date: '2026-11-05'
    },
    {
      id: 'wd-5',
      teamId: 'team-9',
      title: 'Onboarded 5 new engineer laptops with MDM',
      details: 'Enrolled in BitLocker and automated compliance monitoring.',
      date: '2026-11-05'
    }
  ],

  userWorkspace: {
    stats: {
      totalAssigned: 12,
      inProgress: 5,
      upcomingWork: 4,
      completedWork: 18,
      completionRate: 82,
      completedCount: 18,
      totalCount: 22
    },
    assignedWork: [
      {
        id: 'user-task-1',
        title: 'Update departmental website content',
        department: 'Marketing',
        team: 'Digital Media',
        priority: 'High',
        dueDate: 'Today, 05 Nov',
        status: 'In Progress',
        assignedBy: 'Priya Verma',
        assignedOn: '04 Nov 2026, 09:30 AM',
        description: 'Update the department homepage, added CME details and new banner images.',
        progress: 75,
        comments: [
          {
            id: 'c-1',
            author: 'Rahul Sharma',
            role: 'Team Member',
            date: '04 Nov 2026, 11:10 AM',
            badge: 'Work Started',
            text: 'Started updating copy and banner sections.'
          }
        ]
      },
      {
        id: 'TSK-2026-0487',
        title: 'Prepare event poster for CME',
        department: 'Events',
        team: 'Design',
        priority: 'Medium',
        dueDate: 'Tomorrow, 06 Nov',
        status: 'In Progress',
        assignedBy: 'Priya Verma',
        assignedOn: '03 Nov 2026, 10:30 AM',
        timeLeft: '2 Days',
        description: 'Design an event poster for the upcoming CME on "Anaesthesia Awareness Programme" with institutional branding, date, venue and resource faculty details.',
        progress: 60,
        timeline: {
          assigned: '03 Nov, 10:30 AM',
          workStarted: '03 Nov, 11:10 AM',
          current: 'In Progress',
          submitted: null,
          completed: null
        },
        comments: [
          {
            id: 'c-2',
            author: 'Rahul Sharma',
            role: 'Team Member',
            date: '04 Nov 2026, 11:10 AM',
            badge: 'Work Started',
            text: 'Started working on the poster. Concept and layout are under progress.'
          },
          {
            id: 'c-3',
            author: 'Rahul Sharma',
            role: 'Team Member',
            date: '05 Nov 2026, 04:20 PM',
            badge: 'Update',
            text: 'Draft version completed. Attached for review and feedback.'
          },
          {
            id: 'c-4',
            author: 'Priya Verma',
            role: 'Team Lead',
            date: '05 Nov 2026, 05:00 PM',
            badge: 'Feedback',
            text: 'Looks good. Please add the venue and contact details, then submit the final version.'
          }
        ],
        attachments: [
          { name: 'CME_Brief.pdf', size: '1.2 MB', date: '03 Nov 2026' },
          { name: 'Branding_Assets.zip', size: '4.8 MB', date: '03 Nov 2026' }
        ]
      },
      {
        id: 'user-task-3',
        title: 'Upload photos for "Anaesthesia Awareness"',
        department: 'Events',
        team: 'Content',
        priority: 'Medium',
        dueDate: '07 Nov 2026',
        status: 'In Progress',
        assignedBy: 'Priya Verma',
        assignedOn: '04 Nov 2026, 02:00 PM',
        description: 'Upload high-resolution event photographs to the media drive.',
        progress: 40,
        comments: []
      },
      {
        id: 'user-task-4',
        title: 'Social media post - Deepavali Wishes',
        department: 'Branding',
        team: 'Social Media',
        priority: 'Low',
        dueDate: '08 Nov 2026',
        status: 'Not Started',
        assignedBy: 'Aditya Rao',
        assignedOn: '05 Nov 2026, 10:00 AM',
        description: 'Draft bilingual festive greeting copy and graphics.',
        progress: 0,
        comments: []
      },
      {
        id: 'user-task-5',
        title: 'Update team progress report (October)',
        department: 'Administration',
        team: 'Reporting',
        priority: 'High',
        dueDate: '08 Nov 2026',
        status: 'Not Started',
        assignedBy: 'Sunita Mehra',
        assignedOn: '05 Nov 2026, 11:30 AM',
        description: 'Consolidate monthly sprint velocity and team metrics.',
        progress: 0,
        comments: []
      }
    ],
    history: [
      {
        id: 'h-1',
        title: 'Prepare event poster for CME',
        taskId: 'TSK-2026-0487',
        department: 'Events',
        team: 'Design',
        submittedDate: '03 Nov 2026, 11:10 AM',
        status: 'Under Review',
        reviewerFeedback: 'Looks good. Minor changes suggested.',
        assignedBy: 'Priya Verma',
        dueDate: '06 Nov 2026',
        submittedComment: 'Completed the event poster design, updated branding elements, and shared final files for review.',
        reviewerComments: [
          {
            author: 'Priya Verma',
            role: 'Team Lead',
            date: '03 Nov 2026, 03:40 PM',
            text: 'Looks good overall. Please make a minor adjustment to the event date size and share the updated version.'
          },
          {
            author: 'Rahul Sharma',
            role: 'You',
            date: '03 Nov 2026, 04:05 PM',
            text: 'Updated the event date size as suggested and re-uploaded the final file.'
          }
        ]
      },
      {
        id: 'h-2',
        title: 'Update CME landing page',
        taskId: 'TSK-2026-0412',
        department: 'Events',
        team: 'Web',
        submittedDate: '31 Oct 2026, 05:40 PM',
        status: 'Approved',
        reviewerFeedback: 'Approved. Ready to publish.',
        assignedBy: 'Vikram Joshi',
        dueDate: '31 Oct 2026',
        submittedComment: 'Landing page responsive layout and registration CTA deployed.',
        reviewerComments: []
      },
      {
        id: 'h-3',
        title: 'Create presentation deck',
        taskId: 'TSK-2026-0390',
        department: 'Design',
        team: 'Design',
        submittedDate: '29 Oct 2026, 02:15 PM',
        status: 'Completed',
        reviewerFeedback: 'Well structured and on brand.',
        assignedBy: 'Tanvi Desai',
        dueDate: '29 Oct 2026',
        submittedComment: 'Slide deck formatted with standard enterprise typography.',
        reviewerComments: []
      },
      {
        id: 'h-4',
        title: 'Branding assets - Phase 2',
        taskId: 'TSK-2026-0341',
        department: 'Design',
        team: 'Design',
        submittedDate: '27 Oct 2026, 04:20 PM',
        status: 'Rework Requested',
        reviewerFeedback: 'Please update the icon set and resubmit.',
        assignedBy: 'Kavita Menon',
        dueDate: '27 Oct 2026',
        submittedComment: 'SVG vector icons exported for web and mobile.',
        reviewerComments: []
      },
      {
        id: 'h-5',
        title: 'CME venue & logistics plan',
        taskId: 'TSK-2026-0310',
        department: 'Events',
        team: 'Events',
        submittedDate: '24 Oct 2026, 01:05 PM',
        status: 'Approved',
        reviewerFeedback: 'Plan is good. Proceed as discussed.',
        assignedBy: 'Ashok Chauhan',
        dueDate: '24 Oct 2026',
        submittedComment: 'Audio-visual equipment booked and seating capacity verified.',
        reviewerComments: []
      }
    ],
    recentActivities: [
      {
        id: 'act-1',
        type: 'submitted',
        title: 'Submitted: Social media post - World Suicide Prevention Day',
        date: '04 Nov, 05:20 PM'
      },
      {
        id: 'act-2',
        type: 'started',
        title: 'Work Started: Update departmental brochure',
        date: '04 Nov, 11:10 AM'
      },
      {
        id: 'act-3',
        type: 'assigned',
        title: 'Assigned: Prepare event poster for CME',
        date: '03 Nov, 04:45 PM'
      }
    ]
  },

  appointments: [
    {
      id: 'apt-1',
      title: 'Project Review Meeting',
      requestedBy: 'Rahul Sharma',
      userId: 'mem-1',
      department: 'Engineering',
      team: 'Backend',
      date: '2026-11-05',
      time: '11:00 AM',
      endTime: '12:00 PM',
      dateTimeDisplay: '05 Nov 2026, 11:00 AM',
      location: 'Online (Google Meet)',
      purpose: 'Sprint milestone review, backend API progress, and blockers resolution.',
      status: 'Scheduled',
      isToday: true
    },
    {
      id: 'apt-2',
      title: 'Design Discussion',
      requestedBy: 'Priya Verma',
      userId: 'mem-2',
      department: 'Design',
      team: 'UI-UX',
      date: '2026-11-05',
      time: '02:00 PM',
      endTime: '03:00 PM',
      dateTimeDisplay: '05 Nov 2026, 02:00 PM',
      location: 'Meeting Room - 2',
      purpose: 'Review of wireframes and high-fidelity mockups for new portal design.',
      status: 'Scheduled',
      isToday: true
    },
    {
      id: 'apt-3',
      title: 'Marketing Plan Review',
      requestedBy: 'Amit Singh',
      userId: 'mem-3',
      department: 'Marketing',
      team: 'Growth & SEO',
      date: '2026-11-06',
      time: '10:30 AM',
      endTime: '11:30 AM',
      dateTimeDisplay: '06 Nov 2026, 10:30 AM',
      location: 'Conference Hall',
      purpose: 'Q4 lead generation campaigns and content calendar planning.',
      status: 'Upcoming',
      isToday: false
    },
    {
      id: 'apt-4',
      title: 'Monthly Team Sync',
      requestedBy: 'Nanditha V.',
      userId: 'mem-4',
      department: 'Operations',
      team: 'Human Resources',
      date: '2026-11-06',
      time: '03:00 PM',
      endTime: '04:00 PM',
      dateTimeDisplay: '06 Nov 2026, 03:00 PM',
      location: 'Operations Hub',
      purpose: 'Monthly cross-departmental operations sync and workplace updates.',
      status: 'Upcoming',
      isToday: false
    },
    {
      id: 'apt-5',
      title: 'Website Content Approval',
      requestedBy: 'Akarsh M.',
      userId: 'mem-5',
      department: 'Marketing',
      team: 'Content',
      date: '2026-11-04',
      time: '04:00 PM',
      endTime: '05:00 PM',
      dateTimeDisplay: '04 Nov 2026, 04:00 PM',
      location: 'Online (Zoom)',
      purpose: 'Final sign-off on updated landing page copy and press releases.',
      status: 'Completed',
      isToday: false
    },
    {
      id: 'apt-6',
      title: 'Architecture Review: Microservices',
      requestedBy: 'Rahul Sharma',
      userId: 'mem-1',
      department: 'Engineering',
      team: 'Backend',
      date: '2026-11-12',
      time: '10:00 AM',
      endTime: '11:00 AM',
      dateTimeDisplay: '12 Nov 2026, 10:00 AM',
      location: 'Online (Google Meet)',
      purpose: 'Service discovery and gRPC communication latency evaluation.',
      status: 'Upcoming',
      isToday: false
    },
    {
      id: 'apt-7',
      title: 'Sprint Retrospective & Demo',
      requestedBy: 'Rahul Sharma',
      userId: 'mem-1',
      department: 'Engineering',
      team: 'Backend',
      date: '2026-11-19',
      time: '04:00 PM',
      endTime: '05:30 PM',
      dateTimeDisplay: '19 Nov 2026, 04:00 PM',
      location: 'Conference Room A',
      purpose: 'Sprint closing demo for stakeholders and retro action items.',
      status: 'Upcoming',
      isToday: false
    },
    {
      id: 'apt-8',
      title: 'Security Compliance Audit Sync',
      requestedBy: 'Rahul Sharma',
      userId: 'mem-1',
      department: 'Operations',
      team: 'IT Support & Infra',
      date: '2026-11-26',
      time: '02:30 PM',
      endTime: '03:30 PM',
      dateTimeDisplay: '26 Nov 2026, 02:30 PM',
      location: 'Virtual Room 4',
      purpose: 'Quarterly SOC2 compliance review and access logs review.',
      status: 'Upcoming',
      isToday: false
    }
  ]
};

module.exports = initialData;
