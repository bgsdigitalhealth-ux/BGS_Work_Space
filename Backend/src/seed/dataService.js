const { getStatus } = require('../config/db');
const Department = require('../models/Department');
const Team = require('../models/Team');
const Member = require('../models/Member');
const Assignment = require('../models/Assignment');
const Task = require('../models/Task');
const WorkDone = require('../models/WorkDone');
const User = require('../models/User');
const Appointment = require('../models/Appointment');
const Notification = require('../models/Notification');
const UserTask = require('../models/UserTask');
const WorkHistory = require('../models/WorkHistory');
const initialData = require('./seedData');

const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '../../data/db.json');

// Persistent Disk Store engine
let memoryStore = JSON.parse(JSON.stringify(initialData));

const saveStore = () => {
  try {
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(memoryStore, null, 2), 'utf8');
  } catch (e) {
    console.warn('[Storage] Error persisting to disk:', e.message);
  }
};

const loadStore = () => {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf8');
      const parsed = JSON.parse(raw);
      if (parsed) {
        memoryStore = { ...initialData, ...parsed };
        if (!memoryStore.users || memoryStore.users.length === 0) {
          memoryStore.users = JSON.parse(JSON.stringify(initialData.users));
        } else {
          for (const u of initialData.users) {
            if (!memoryStore.users.some(x => x.email.toLowerCase() === u.email.toLowerCase())) {
              memoryStore.users.unshift(u);
            }
          }
        }
        console.log('[Storage] Persistent database state loaded from disk successfully.');
        return;
      }
    }
  } catch (e) {
    console.warn('[Storage] Disk read error, initializing default store:', e.message);
  }
  memoryStore = JSON.parse(JSON.stringify(initialData));
  saveStore();
};

loadStore();

// Helper for generating unique ID for operations
const generateId = (prefix) => `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

// Purge and reset all dummy data across memory store and MongoDB
const clearAllData = async () => {
  memoryStore.departments = [];
  memoryStore.teams = [];
  memoryStore.members = [];
  memoryStore.assignments = [];
  memoryStore.tasks = [];
  memoryStore.workDone = [];
  memoryStore.appointments = [];
  memoryStore.notifications = [];
  memoryStore.userWorkspace = {
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
  };

  // Reset users to the 2 authorized base roles (Admin and User)
  memoryStore.users = JSON.parse(JSON.stringify(initialData.users));

  if (getStatus()) {
    try {
      await Department.deleteMany({});
      await Team.deleteMany({});
      await Member.deleteMany({});
      await Assignment.deleteMany({});
      await Task.deleteMany({});
      await WorkDone.deleteMany({});
      await Appointment.deleteMany({});
      await Notification.deleteMany({});
      await UserTask.deleteMany({});
      await WorkHistory.deleteMany({});
      await User.deleteMany({ email: { $nin: ['dynamicsajjan@gamil.com', 'dynamicsajjan@gmail.com'] } });
      console.log('[Storage] All dummy data wiped from MongoDB Atlas collections.');
    } catch (e) {
      console.warn('[Storage] Mongo wipe error:', e.message);
    }
  }

  return { success: true, message: 'All dummy data purged completely. Workspace is 100% clean and dynamic.' };
};

// Bidirectional load: read existing MongoDB Atlas records into local store
const loadFromMongo = async () => {
  if (!getStatus()) return;
  try {
    const depts = await Department.find().lean();
    if (depts && depts.length > 0) {
      for (const d of depts) {
        if (!memoryStore.departments.some(x => x.name.toLowerCase() === d.name.toLowerCase())) {
          memoryStore.departments.push({ ...d, id: d.customId || d._id.toString() });
        }
      }
    }
    const tms = await Team.find().lean();
    if (tms && tms.length > 0) {
      for (const t of tms) {
        if (!memoryStore.teams.some(x => x.name.toLowerCase() === t.name.toLowerCase())) {
          memoryStore.teams.push({ ...t, id: t.customId || t._id.toString() });
        }
      }
    }
    const mems = await Member.find().lean();
    if (mems && mems.length > 0) {
      for (const m of mems) {
        if (!memoryStore.members.some(x => x.email.toLowerCase() === m.email.toLowerCase())) {
          memoryStore.members.push({ ...m, id: m.customId || m._id.toString() });
        }
      }
    }
    const usrs = await User.find().lean();
    if (usrs && usrs.length > 0) {
      for (const u of usrs) {
        const idx = memoryStore.users.findIndex(x => x.email.toLowerCase() === u.email.toLowerCase());
        if (idx === -1) {
          memoryStore.users.push({ ...u, id: u.customId || u._id.toString() });
        } else if (u.hasPassword && !memoryStore.users[idx].hasPassword) {
          memoryStore.users[idx].password = u.password;
          memoryStore.users[idx].hasPassword = true;
        }
      }
    }
    const asgs = await Assignment.find().lean();
    if (asgs && asgs.length > 0) {
      for (const a of asgs) {
        if (!memoryStore.assignments.some(x => x.id === (a.customId || a._id.toString()))) {
          memoryStore.assignments.push({ ...a, id: a.customId || a._id.toString() });
        }
      }
    }
    const tsks = await Task.find().lean();
    if (tsks && tsks.length > 0) {
      for (const tk of tsks) {
        if (!memoryStore.tasks.some(x => x.title === tk.title && x.teamId === tk.teamId)) {
          memoryStore.tasks.push({ ...tk, id: tk.customId || tk._id.toString() });
        }
      }
    }
    saveStore();
    console.log('[Storage] Bidirectional sync: MongoDB Atlas records loaded into local store.');
  } catch (err) {
    console.warn('[Storage] Load from Mongo notice:', err.message);
  }
};

// Seed MongoDB if connected and ensure base authentication accounts exist
const initMongoSeed = async () => {
  if (!getStatus()) return;
  try {
    // 1. Merge any existing cloud records from MongoDB Atlas into memoryStore
    await loadFromMongo();

    // 2. Ensure base login accounts (dynamicsajjan@gamil.com, etc.) exist
    for (const u of initialData.users) {
      const exists = await User.findOne({ email: u.email.toLowerCase() });
      if (!exists) {
        await User.create({
          customId: u.id,
          name: u.name,
          email: u.email,
          password: u.password,
          hasPassword: Boolean(u.hasPassword),
          role: u.role,
          memberId: u.memberId || '',
          department: u.department || '',
          team: u.team || '',
          teamRole: u.teamRole || '',
          avatar: u.avatar || '',
          title: u.title || ''
        });
      }
    }
    console.log('[Seed] Base authorized users verified in MongoDB Atlas.');
    await syncToMongo();
  } catch (err) {
    console.error('[Seed Error] Failed to verify base accounts in Atlas:', err);
  }
};

// Seamless synchronization from persistent store into MongoDB Atlas
const syncToMongo = async () => {
  if (!getStatus()) return;
  try {
    // 1. Departments
    for (const d of (memoryStore.departments || [])) {
      const exists = await Department.findOne({ name: d.name });
      if (!exists) {
        await Department.create({
          customId: d.id,
          name: d.name,
          icon: d.icon,
          description: d.description
        });
      }
    }
    // 2. Teams
    for (const t of (memoryStore.teams || [])) {
      const exists = await Team.findOne({ name: t.name });
      if (!exists) {
        await Team.create({
          customId: t.id,
          name: t.name,
          departmentId: t.departmentId
        });
      }
    }
    // 3. Members
    for (const m of (memoryStore.members || [])) {
      const exists = await Member.findOne({ email: m.email.toLowerCase() });
      if (!exists) {
        await Member.create({
          customId: m.id,
          name: m.name,
          email: m.email,
          phone: m.phone,
          role: m.role,
          assignedWork: m.assignedWork,
          teamId: m.teamId,
          departmentId: m.departmentId,
          avatar: m.avatar
        });
      }
    }
    // 4. Users (Members and Admins)
    for (const u of (memoryStore.users || [])) {
      const exists = await User.findOne({ email: u.email.toLowerCase() });
      if (!exists) {
        await User.create({
          customId: u.id,
          name: u.name,
          email: u.email,
          password: u.password,
          hasPassword: Boolean(u.hasPassword),
          role: u.role,
          memberId: u.memberId,
          department: u.department,
          team: u.team,
          teamRole: u.teamRole,
          avatar: u.avatar,
          title: u.title
        });
      } else if (u.hasPassword && !exists.hasPassword) {
        exists.password = u.password;
        exists.hasPassword = true;
        await exists.save();
      }
    }
    // 5. Assignments
    for (const a of (memoryStore.assignments || [])) {
      const exists = await Assignment.findOne({ workTitle: a.workTitle, teamId: a.teamId });
      if (!exists) await Assignment.create(a);
    }
    // 6. Tasks
    for (const tk of (memoryStore.tasks || [])) {
      const exists = await Task.findOne({ title: tk.title, teamId: tk.teamId });
      if (!exists) await Task.create(tk);
    }
    // 7. Work Done
    for (const wd of (memoryStore.workDone || [])) {
      const exists = await WorkDone.findOne({ title: wd.title, teamId: wd.teamId });
      if (!exists) await WorkDone.create(wd);
    }
    // 8. Appointments
    for (const apt of (memoryStore.appointments || [])) {
      const exists = await Appointment.findOne({ title: apt.title, date: apt.date });
      if (!exists) await Appointment.create(apt);
    }
    console.log('[Storage] Seamless synchronization with MongoDB Atlas complete.');
  } catch (err) {
    console.warn('[Storage] Sync notice:', err.message);
  }
};

// --- Departments ---
const getDepartments = async () => {
  if (getStatus()) {
    try {
      const list = await Department.find().lean();
      return list.map(d => ({ ...d, id: d._id.toString() }));
    } catch (e) {
      console.warn('Mongo read error, falling back to memoryStore:', e.message);
    }
  }
  return memoryStore.departments;
};

const createDepartment = async (data) => {
  const newDept = {
    id: generateId('dept'),
    name: data.name,
    icon: data.icon || 'layers',
    description: data.description || 'Manage teams, members, roles and work.'
  };
  memoryStore.departments.push(newDept);
  saveStore();

  if (getStatus()) {
    try {
      const created = await Department.create(data);
      return { ...created.toObject(), id: created._id.toString() };
    } catch (e) {
      console.warn('Mongo create error:', e.message);
    }
  }
  return newDept;
};

const updateDepartment = async (id, data) => {
  const index = memoryStore.departments.findIndex(d => d.id === id);
  if (index !== -1) {
    memoryStore.departments[index] = { ...memoryStore.departments[index], ...data };
    saveStore();
  }

  if (getStatus()) {
    try {
      const updated = await Department.findByIdAndUpdate(id, data, { new: true }).lean();
      if (updated) return { ...updated, id: updated._id.toString() };
    } catch (e) {
      console.warn('Mongo update error:', e.message);
    }
  }
  return index !== -1 ? memoryStore.departments[index] : null;
};

const deleteDepartment = async (id) => {
  memoryStore.departments = memoryStore.departments.filter(d => d.id !== id);
  memoryStore.teams = memoryStore.teams.filter(t => t.departmentId !== id);
  memoryStore.members = memoryStore.members.filter(m => m.departmentId !== id);
  saveStore();

  if (getStatus()) {
    try {
      await Department.findByIdAndDelete(id);
      await Team.deleteMany({ departmentId: id });
      await Member.deleteMany({ departmentId: id });
    } catch (e) {
      console.warn('Mongo delete error:', e.message);
    }
  }
  return true;
};

// --- Teams ---
const getTeams = async (departmentId = null) => {
  if (getStatus()) {
    try {
      const filter = departmentId ? { departmentId } : {};
      const list = await Team.find(filter).lean();
      return list.map(t => ({ ...t, id: t._id.toString(), departmentId: t.departmentId.toString() }));
    } catch (e) {
      console.warn('Mongo read error:', e.message);
    }
  }
  if (departmentId) {
    return memoryStore.teams.filter(t => t.departmentId === departmentId);
  }
  return memoryStore.teams;
};

const createTeam = async (data) => {
  const newTeam = {
    id: generateId('team'),
    name: data.name,
    departmentId: data.departmentId,
    description: data.description || 'Team responsible for department objectives.'
  };
  memoryStore.teams.push(newTeam);
  saveStore();

  if (getStatus()) {
    try {
      const created = await Team.create(data);
      return { ...created.toObject(), id: created._id.toString() };
    } catch (e) {
      console.warn('Mongo create error:', e.message);
    }
  }
  return newTeam;
};

const updateTeam = async (id, data) => {
  const index = memoryStore.teams.findIndex(t => t.id === id);
  if (index !== -1) {
    memoryStore.teams[index] = { ...memoryStore.teams[index], ...data };
    saveStore();
  }

  if (getStatus()) {
    try {
      const updated = await Team.findByIdAndUpdate(id, data, { new: true }).lean();
      if (updated) return { ...updated, id: updated._id.toString() };
    } catch (e) {
      console.warn('Mongo update error:', e.message);
    }
  }
  return index !== -1 ? memoryStore.teams[index] : null;
};

const deleteTeam = async (id) => {
  memoryStore.teams = memoryStore.teams.filter(t => t.id !== id);
  memoryStore.members = memoryStore.members.filter(m => m.teamId !== id);
  saveStore();

  if (getStatus()) {
    try {
      await Team.findByIdAndDelete(id);
      await Member.deleteMany({ teamId: id });
    } catch (e) {
      console.warn('Mongo delete error:', e.message);
    }
  }
  return true;
};

// --- Members ---
const getMembers = async (teamId = null, departmentId = null) => {
  if (getStatus()) {
    try {
      const filter = {};
      if (teamId) filter.teamId = teamId;
      if (departmentId) filter.departmentId = departmentId;
      const list = await Member.find(filter).lean();
      return list.map(m => ({ ...m, id: m._id.toString() }));
    } catch (e) {
      console.warn('Mongo read error:', e.message);
    }
  }
  let res = memoryStore.members;
  if (teamId) res = res.filter(m => m.teamId === teamId);
  else if (departmentId) res = res.filter(m => m.departmentId === departmentId);
  return res;
};

const createMember = async (data) => {
  const newMember = {
    id: generateId('mem'),
    name: data.name,
    email: data.email,
    phone: data.phone || '',
    role: data.role || 'Developer',
    assignedWork: data.assignedWork || '',
    teamId: data.teamId,
    departmentId: data.departmentId,
    avatar: (data.name || 'U').charAt(0).toUpperCase()
  };
  memoryStore.members.push(newMember);

  // Automatically register a dynamic user login account for this member (password to be set by member on first login)
  const cleanEmail = (data.email || '').trim().toLowerCase();
  let existingUser = memoryStore.users.find(u => u.email.toLowerCase() === cleanEmail);
  if (!existingUser) {
    existingUser = {
      id: generateId('usr'),
      name: data.name,
      email: cleanEmail,
      password: '',
      hasPassword: false,
      role: 'user',
      memberId: newMember.id,
      department: data.departmentId,
      team: data.teamId,
      teamRole: data.role || 'Team Member',
      avatar: newMember.avatar,
      title: data.role || 'Team Member'
    };
    memoryStore.users.push(existingUser);
  }
  saveStore();

  if (getStatus()) {
    try {
      const created = await Member.create(data);
      const dbUser = await User.findOne({ email: cleanEmail });
      if (!dbUser) {
        await User.create({
          customId: existingUser.id,
          name: data.name,
          email: cleanEmail,
          password: '',
          hasPassword: false,
          role: 'user',
          memberId: created._id.toString(),
          department: data.departmentId,
          team: data.teamId,
          teamRole: data.role || 'Team Member',
          avatar: newMember.avatar,
          title: data.role || 'Team Member'
        });
      }
      return { ...created.toObject(), id: created._id.toString() };
    } catch (e) {
      console.warn('Mongo create error:', e.message);
    }
  }
  return newMember;
};

const updateMember = async (id, data) => {
  const index = memoryStore.members.findIndex(m => m.id === id);
  if (index !== -1) {
    memoryStore.members[index] = { ...memoryStore.members[index], ...data };
    saveStore();
  }

  if (getStatus()) {
    try {
      const updated = await Member.findByIdAndUpdate(id, data, { new: true }).lean();
      if (updated) return { ...updated, id: updated._id.toString() };
    } catch (e) {
      console.warn('Mongo update error:', e.message);
    }
  }
  return index !== -1 ? memoryStore.members[index] : null;
};

const deleteMember = async (id) => {
  const member = memoryStore.members.find(m => m.id === id);
  if (member) {
    memoryStore.users = memoryStore.users.filter(u => u.email.toLowerCase() !== member.email.toLowerCase());
  }
  memoryStore.members = memoryStore.members.filter(m => m.id !== id);
  memoryStore.assignments = memoryStore.assignments.filter(a => a.memberId !== id);
  saveStore();

  if (getStatus()) {
    try {
      const dbMem = await Member.findById(id);
      if (dbMem) {
        await User.findOneAndDelete({ email: dbMem.email.toLowerCase() });
      }
      await Member.findByIdAndDelete(id);
    } catch (e) {
      console.warn('Mongo delete error:', e.message);
    }
  }
  return true;
};

// --- Assignments ---
const getAssignments = async (teamId = null) => {
  if (getStatus()) {
    try {
      const filter = teamId ? { teamId } : {};
      const list = await Assignment.find(filter).lean();
      return list.map(a => ({ ...a, id: a._id.toString() }));
    } catch (e) {
      console.warn('Mongo read error:', e.message);
    }
  }
  if (teamId) {
    return memoryStore.assignments.filter(a => a.teamId === teamId);
  }
  return memoryStore.assignments;
};

const createAssignment = async (data) => {
  const newAssign = {
    id: generateId('assign'),
    memberId: data.memberId,
    teamId: data.teamId,
    workTitle: data.workTitle,
    workDescription: data.workDescription || '',
    role: data.role || 'Developer',
    priority: data.priority || 'Medium',
    dueDate: data.dueDate || new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
    status: data.status || 'In Progress'
  };
  memoryStore.assignments.unshift(newAssign);

  // Update member assignedWork
  const member = memoryStore.members.find(m => m.id === data.memberId || m.id === (data.memberId && data.memberId.toString()));
  if (member) {
    member.assignedWork = data.workTitle;
  }

  // Look up DB member / team if connected
  let dbMember = null;
  let dbTeam = null;
  if (getStatus()) {
    try {
      dbMember = await Member.findById(data.memberId).lean();
      dbTeam = await Team.findById(data.teamId).lean();
    } catch (e) {
      // ignore
    }
  }

  const memberName = dbMember ? dbMember.name : (member ? member.name : '');
  const team = memoryStore.teams.find(t => t.id === data.teamId || t.id === (data.teamId && data.teamId.toString()));
  const dept = team ? memoryStore.departments.find(d => d.id === team.departmentId) : null;
  const teamName = dbTeam ? dbTeam.name : (team ? team.name : 'Team');

  // --- AUTOMATICALLY CREATE TASK IN "TODAY'S TASKS" ---
  const todayDate = new Date().toISOString().split('T')[0];
  const newTask = {
    id: generateId('task'),
    teamId: data.teamId,
    assignmentId: newAssign.id,
    memberId: data.memberId,
    memberName: memberName,
    title: data.workTitle,
    priority: data.priority || 'Medium',
    completed: false,
    date: todayDate
  };
  memoryStore.tasks.unshift(newTask);

  // Synchronize into User Workspace
  if (!memoryStore.userWorkspace) {
    memoryStore.userWorkspace = {
      stats: { totalAssigned: 0, inProgress: 0, upcomingWork: 0, completedWork: 0, completionRate: 0, completedCount: 0, totalCount: 0 },
      assignedWork: [],
      history: [],
      recentActivities: []
    };
  }

  const userTask = {
    id: generateId('user-task'),
    taskId: `TSK-${Date.now().toString().slice(-4)}`,
    title: data.workTitle,
    department: (dept && dept.name) || (dbTeam && dbTeam.departmentId) || 'General',
    team: teamName,
    priority: data.priority || 'High',
    dueDate: data.dueDate || 'Today',
    status: data.status || 'In Progress',
    assignedBy: 'Admin',
    assignedOn: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
    description: data.workDescription || '',
    progress: 0,
    comments: [],
    userId: dbMember ? (dbMember.userId || dbMember._id.toString()) : (member ? member.id : 'usr-user')
  };
  memoryStore.userWorkspace.assignedWork.unshift(userTask);
  saveStore();

  // Create Notification for User
  createNotification({
    recipientRole: 'user',
    recipientUserId: userTask.userId,
    title: 'New Work Assigned',
    message: `Admin assigned: "${data.workTitle}" to you.`,
    link: 'assigned-work'
  });

  // Persist into MongoDB Atlas if connected
  if (getStatus()) {
    try {
      const createdAssign = await Assignment.create(data);
      const createdTask = await Task.create({
        teamId: data.teamId,
        assignmentId: createdAssign._id.toString(),
        memberId: data.memberId,
        memberName: memberName,
        title: data.workTitle,
        priority: data.priority || 'Medium',
        completed: false,
        date: todayDate
      });
      newTask.id = createdTask._id.toString();

      await UserTask.create({
        customId: userTask.id,
        taskId: userTask.taskId,
        title: userTask.title,
        department: userTask.department,
        team: userTask.team,
        priority: userTask.priority,
        dueDate: userTask.dueDate,
        status: userTask.status,
        assignedBy: userTask.assignedBy,
        assignedOn: userTask.assignedOn,
        description: userTask.description,
        progress: 0,
        comments: [],
        userId: userTask.userId
      });
      return { ...createdAssign.toObject(), id: createdAssign._id.toString() };
    } catch (e) {
      console.warn('Mongo assignment error:', e.message);
    }
  }

  return newAssign;
};

const deleteAssignment = async (id) => {
  memoryStore.assignments = memoryStore.assignments.filter(a => a.id !== id);
  saveStore();
  if (getStatus()) {
    try {
      await Assignment.findByIdAndDelete(id);
    } catch (e) {
      console.warn('Mongo delete error:', e.message);
    }
  }
  return true;
};

// --- Tasks ---
const getTasks = async (teamId = null) => {
  if (getStatus()) {
    try {
      const filter = teamId ? { teamId } : {};
      const list = await Task.find(filter).lean();
      return list.map(t => ({ ...t, id: t._id.toString() }));
    } catch (e) {
      console.warn('Mongo read error:', e.message);
    }
  }
  if (teamId) {
    return memoryStore.tasks.filter(t => t.teamId === teamId);
  }
  return memoryStore.tasks;
};

const createTask = async (data) => {
  const newTask = {
    id: generateId('task'),
    teamId: data.teamId,
    title: data.title,
    priority: data.priority || 'Medium',
    completed: data.completed || false,
    date: data.date || new Date().toISOString().split('T')[0]
  };
  memoryStore.tasks.push(newTask);
  saveStore();

  if (getStatus()) {
    try {
      const created = await Task.create(data);
      return { ...created.toObject(), id: created._id.toString() };
    } catch (e) {
      console.warn('Mongo create error:', e.message);
    }
  }
  return newTask;
};

const updateTask = async (id, data) => {
  const index = memoryStore.tasks.findIndex(t => t.id === id);
  if (index !== -1) {
    memoryStore.tasks[index] = { ...memoryStore.tasks[index], ...data };
    saveStore();
  }

  if (getStatus()) {
    try {
      const updated = await Task.findByIdAndUpdate(id, data, { new: true }).lean();
      if (updated) return { ...updated, id: updated._id.toString() };
    } catch (e) {
      console.warn('Mongo update error:', e.message);
    }
  }
  return index !== -1 ? memoryStore.tasks[index] : null;
};

const toggleTask = async (id) => {
  const index = memoryStore.tasks.findIndex(t => t.id === id);
  if (index !== -1) {
    memoryStore.tasks[index].completed = !memoryStore.tasks[index].completed;
    saveStore();
  }

  if (getStatus()) {
    try {
      const task = await Task.findById(id);
      if (task) {
        task.completed = !task.completed;
        await task.save();
        return { ...task.toObject(), id: task._id.toString() };
      }
    } catch (e) {
      console.warn('Mongo toggle error:', e.message);
    }
  }
  return index !== -1 ? memoryStore.tasks[index] : null;
};

const deleteTask = async (id) => {
  memoryStore.tasks = memoryStore.tasks.filter(t => t.id !== id);
  saveStore();
  if (getStatus()) {
    try {
      await Task.findByIdAndDelete(id);
    } catch (e) {
      console.warn('Mongo delete error:', e.message);
    }
  }
  return true;
};

// --- Work Done ---
const getWorkDone = async (teamId = null) => {
  if (getStatus()) {
    try {
      const filter = teamId ? { teamId } : {};
      const list = await WorkDone.find(filter).lean();
      return list.map(w => ({ ...w, id: w._id.toString() }));
    } catch (e) {
      console.warn('Mongo read error:', e.message);
    }
  }
  if (teamId) {
    return memoryStore.workDone.filter(w => w.teamId === teamId);
  }
  return memoryStore.workDone;
};

const createWorkDone = async (data) => {
  const newWork = {
    id: generateId('wd'),
    teamId: data.teamId,
    title: data.title,
    details: data.details || '',
    date: data.date || new Date().toISOString().split('T')[0]
  };
  memoryStore.workDone.unshift(newWork);
  saveStore();

  if (getStatus()) {
    try {
      const created = await WorkDone.create(data);
      return { ...created.toObject(), id: created._id.toString() };
    } catch (e) {
      console.warn('Mongo create error:', e.message);
    }
  }
  return newWork;
};

const deleteWorkDone = async (id) => {
  memoryStore.workDone = memoryStore.workDone.filter(w => w.id !== id);
  saveStore();
  if (getStatus()) {
    try {
      await WorkDone.findByIdAndDelete(id);
    } catch (e) {
      console.warn('Mongo delete error:', e.message);
    }
  }
  return true;
};

// --- User Portal Workspace ---
const getUserWorkspace = async (userId = null) => {
  let assigned = [];
  let history = [];
  let recentActivities = [];

  const targetUser = userId || 'usr-user';

  if (getStatus()) {
    try {
      const dbTasks = await UserTask.find(userId ? { userId: targetUser } : {}).lean();
      const dbHistory = await WorkHistory.find(userId ? { userId: targetUser } : {}).sort({ createdAt: -1 }).lean();
      assigned = dbTasks.map(t => ({ ...t, id: t.customId || t._id.toString() }));
      history = dbHistory.map(h => ({ ...h, id: h.customId || h._id.toString() }));
    } catch (e) {
      console.warn('Mongo user workspace read error:', e.message);
    }
  }

  // Fallback to memoryStore
  if (assigned.length === 0 && history.length === 0) {
    if (!memoryStore.userWorkspace) {
      memoryStore.userWorkspace = {
        stats: { totalAssigned: 0, inProgress: 0, upcomingWork: 0, completedWork: 0, completionPercentage: 0, completedFractionText: '0 of 0 Tasks' },
        assignedWork: [],
        history: [],
        recentActivities: []
      };
    }
    assigned = memoryStore.userWorkspace.assignedWork || [];
    history = memoryStore.userWorkspace.history || [];
    recentActivities = memoryStore.userWorkspace.recentActivities || [];
  }

  const inProgressCount = assigned.filter(a => a.status === 'In Progress').length;
  const upcomingCount = assigned.filter(a => a.status === 'Not Started' || a.status === 'Upcoming' || a.status === 'To Do').length;
  const completedFromAssigned = assigned.filter(a => a.status === 'Completed').length;
  const completedFromHistory = history.filter(h => h.status === 'Approved' || h.status === 'Completed').length;
  const completedCount = completedFromAssigned + completedFromHistory;
  const totalAssigned = assigned.length;
  const totalTasks = totalAssigned + completedFromHistory;
  const completionPercentage = totalTasks > 0
    ? Math.round((completedCount / totalTasks) * 100)
    : 0;

  return {
    stats: {
      totalAssigned: totalAssigned,
      inProgress: inProgressCount,
      upcomingWork: upcomingCount,
      completedWork: completedCount,
      completionPercentage: completionPercentage,
      completedFractionText: `${completedCount} of ${totalTasks} Tasks`
    },
    assignedWork: assigned,
    history: history,
    recentActivities: recentActivities
  };
};

const submitUserWork = async (data) => {
  if (!memoryStore.userWorkspace) {
    memoryStore.userWorkspace = {
      stats: { totalAssigned: 0, inProgress: 0, upcomingWork: 0, completedWork: 0, completionPercentage: 0, completedFractionText: '0 of 0 Tasks' },
      assignedWork: [],
      history: [],
      recentActivities: []
    };
  }
  const ws = memoryStore.userWorkspace;
  const { taskId, workStatus, comment, userId } = data;

  const taskIndex = ws.assignedWork.findIndex(t => t.id === taskId || t.taskId === taskId);
  let task = taskIndex >= 0 ? ws.assignedWork[taskIndex] : null;

  if (task) {
    task.status = workStatus === 'Completed' ? 'Completed' : 'Under Review';
    task.progress = 100;
  }

  const newHistoryItem = {
    id: generateId('h'),
    title: task ? task.title : 'Submitted Work',
    taskId: task && task.taskId ? task.taskId : `TSK-${Date.now().toString().slice(-4)}`,
    department: task ? task.department : 'General',
    team: task ? task.team : 'Team',
    submittedDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + ', ' + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    status: 'Under Review',
    reviewerFeedback: 'Submitted. Pending review by Admin / Team Lead.',
    assignedBy: task ? task.assignedBy : 'Admin',
    dueDate: task ? task.dueDate : 'Today',
    submittedComment: comment || 'Work completed and submitted for review.',
    reviewerComments: [],
    userId: userId || (task && task.userId) || 'usr-user'
  };

  ws.history.unshift(newHistoryItem);

  ws.recentActivities.unshift({
    id: generateId('act'),
    type: 'submitted',
    title: `Submitted: ${task ? task.title : 'Work Item'}`,
    date: 'Just now'
  });
  saveStore();

  // Create Notification for Admin
  createNotification({
    recipientRole: 'admin',
    title: 'Work Submitted for Review',
    message: `User submitted "${task ? task.title : 'Work'}" for approval.`,
    link: 'work-management'
  });

  // Auto-check and complete corresponding Task in "Today's Tasks"
  const taskTitle = task ? task.title : '';
  const matchingTasks = (memoryStore.tasks || []).filter(t =>
    (taskTitle && t.title && t.title.trim().toLowerCase() === taskTitle.trim().toLowerCase()) ||
    (t.assignmentId && (t.assignmentId === taskId || (task && t.assignmentId === task.id)))
  );
  matchingTasks.forEach(t => {
    t.completed = true;
    t.completedAt = new Date();
    t.completedBy = (task && task.userName) || 'Team Member';
  });

  // Auto-log into "Today's Work Done"
  const teamObj = (memoryStore.teams || []).find(tm => task && tm.name === task.team);
  const completedTeamId = teamObj ? teamObj.id : (matchingTasks[0] ? matchingTasks[0].teamId : null);

  if (completedTeamId) {
    const alreadyLogged = (memoryStore.workDone || []).some(w => w.taskId === taskId || (taskTitle && w.title === taskTitle));
    if (!alreadyLogged) {
      const newWorkDone = {
        id: generateId('wd'),
        teamId: completedTeamId,
        taskId: task ? task.taskId : taskId,
        title: task ? task.title : 'Work Completed',
        details: comment || 'Work deliverables submitted and verified.',
        completedBy: (task && task.userName) || 'Team Member',
        date: new Date().toISOString().split('T')[0]
      };
      if (!memoryStore.workDone) memoryStore.workDone = [];
      memoryStore.workDone.unshift(newWorkDone);
    }
  }
  saveStore();

  // Persist into MongoDB Atlas if connected
  if (getStatus()) {
    try {
      if (task) {
        await UserTask.findOneAndUpdate(
          { $or: [{ customId: taskId }, { taskId: taskId }] },
          { status: task.status, progress: 100 }
        );
      }
      if (taskTitle) {
        await Task.updateMany(
          { $or: [{ title: taskTitle }, { assignmentId: taskId }] },
          { completed: true, completedAt: new Date(), completedBy: 'Team Member' }
        );
      }
      if (completedTeamId) {
        await WorkDone.create({
          teamId: completedTeamId,
          taskId: task ? task.taskId : taskId,
          title: task ? task.title : 'Work Completed',
          details: comment || 'Work deliverables submitted and verified.',
          completedBy: (task && task.userName) || 'Team Member',
          date: new Date().toISOString().split('T')[0]
        });
      }
      await WorkHistory.create({
        customId: newHistoryItem.id,
        title: newHistoryItem.title,
        taskId: newHistoryItem.taskId,
        department: newHistoryItem.department,
        team: newHistoryItem.team,
        submittedDate: newHistoryItem.submittedDate,
        status: newHistoryItem.status,
        reviewerFeedback: newHistoryItem.reviewerFeedback,
        assignedBy: newHistoryItem.assignedBy,
        dueDate: newHistoryItem.dueDate,
        submittedComment: newHistoryItem.submittedComment,
        reviewerComments: [],
        userId: newHistoryItem.userId
      });
    } catch (e) {
      console.warn('Mongo submit error:', e.message);
    }
  }

  return { success: true, historyItem: newHistoryItem, task };
};

const approveWork = async (taskId, comment) => {
  if (!memoryStore.userWorkspace) {
    memoryStore.userWorkspace = {
      stats: { totalAssigned: 0, inProgress: 0, upcomingWork: 0, completedWork: 0, completionPercentage: 0, completedFractionText: '0 of 0 Tasks' },
      assignedWork: [],
      history: [],
      recentActivities: []
    };
  }
  const ws = memoryStore.userWorkspace;
  const task = ws.assignedWork.find(t => t.id === taskId || t.taskId === taskId);
  const historyItem = ws.history.find(h => h.id === taskId || h.taskId === taskId);

  if (task) {
    task.status = 'Completed';
    task.progress = 100;
  }
  if (historyItem) {
    historyItem.status = 'Approved';
    historyItem.reviewerFeedback = comment || 'Approved by Admin. Work completed successfully.';
    if (!historyItem.reviewerComments) historyItem.reviewerComments = [];
    historyItem.reviewerComments.push({
      id: generateId('c'),
      author: 'Admin',
      role: 'Admin',
      date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + ', ' + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      text: comment || 'Work approved and verified as Completed.'
    });
  }

  // Create Notification for User
  createNotification({
    recipientRole: 'user',
    recipientUserId: task ? task.userId : null,
    title: 'Work Approved! 🎉',
    message: `Admin approved your work "${task ? task.title : 'Work'}" as Completed.`,
    link: 'work-history'
  });

  // Ensure matching task in Today's Tasks is marked completed
  const taskTitle = task ? task.title : '';
  const matchingTasks = (memoryStore.tasks || []).filter(t =>
    (taskTitle && t.title && t.title.trim().toLowerCase() === taskTitle.trim().toLowerCase()) ||
    (t.assignmentId && (t.assignmentId === taskId || (task && t.assignmentId === task.id)))
  );
  matchingTasks.forEach(t => {
    t.completed = true;
    t.completedAt = new Date();
  });

  // Ensure logged into Today's Work Done
  const teamObj = (memoryStore.teams || []).find(tm => task && tm.name === task.team);
  const completedTeamId = teamObj ? teamObj.id : (matchingTasks[0] ? matchingTasks[0].teamId : null);
  if (completedTeamId) {
    const alreadyLogged = (memoryStore.workDone || []).some(w => w.taskId === taskId || (taskTitle && w.title === taskTitle));
    if (!alreadyLogged) {
      const newWorkDone = {
        id: generateId('wd'),
        teamId: completedTeamId,
        taskId: task ? task.taskId : taskId,
        title: task ? task.title : 'Work Completed',
        details: comment || 'Work approved and verified as Completed.',
        completedBy: (task && task.userName) || 'Team Member',
        date: new Date().toISOString().split('T')[0]
      };
      if (!memoryStore.workDone) memoryStore.workDone = [];
      memoryStore.workDone.unshift(newWorkDone);
    }
  }
  saveStore();

  // Persist into MongoDB Atlas if connected
  if (getStatus()) {
    try {
      await UserTask.findOneAndUpdate(
        { $or: [{ customId: taskId }, { taskId: taskId }] },
        { status: 'Completed', progress: 100 }
      );
      if (taskTitle) {
        await Task.updateMany(
          { $or: [{ title: taskTitle }, { assignmentId: taskId }] },
          { completed: true, completedAt: new Date() }
        );
      }
      if (completedTeamId) {
        await WorkDone.create({
          teamId: completedTeamId,
          taskId: task ? task.taskId : taskId,
          title: task ? task.title : 'Work Completed',
          details: comment || 'Work approved and verified as Completed.',
          completedBy: (task && task.userName) || 'Team Member',
          date: new Date().toISOString().split('T')[0]
        });
      }
      await WorkHistory.findOneAndUpdate(
        { $or: [{ customId: taskId }, { taskId: taskId }] },
        {
          status: 'Approved',
          reviewerFeedback: comment || 'Approved by Admin. Work completed successfully.',
          $push: {
            reviewerComments: {
              id: generateId('c'),
              author: 'Admin',
              role: 'Admin',
              date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + ', ' + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
              text: comment || 'Work approved and verified as Completed.'
            }
          }
        }
      );
    } catch (e) {
      console.warn('Mongo approve error:', e.message);
    }
  }

  return { success: true, task, historyItem };
};

const requestRework = async (taskId, feedback) => {
  if (!memoryStore.userWorkspace) {
    memoryStore.userWorkspace = {
      stats: { totalAssigned: 0, inProgress: 0, upcomingWork: 0, completedWork: 0, completionPercentage: 0, completedFractionText: '0 of 0 Tasks' },
      assignedWork: [],
      history: [],
      recentActivities: []
    };
  }
  const ws = memoryStore.userWorkspace;
  const task = ws.assignedWork.find(t => t.id === taskId || t.taskId === taskId);
  const historyItem = ws.history.find(h => h.id === taskId || h.taskId === taskId);

  if (task) {
    task.status = 'In Progress';
    task.progress = 50;
  }
  if (historyItem) {
    historyItem.status = 'Rework Requested';
    historyItem.reviewerFeedback = feedback || 'Please review notes and resubmit.';
    if (!historyItem.reviewerComments) historyItem.reviewerComments = [];
    historyItem.reviewerComments.push({
      id: generateId('c'),
      author: 'Admin',
      role: 'Admin',
      date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + ', ' + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      text: feedback || 'Please review notes and resubmit.'
    });
  }

  // Create Notification for User
  createNotification({
    recipientRole: 'user',
    recipientUserId: task ? task.userId : null,
    title: 'Rework Requested ⚠️',
    message: `Admin requested revisions on "${task ? task.title : 'Work'}": ${feedback}`,
    link: 'my-work'
  });

  // Persist into MongoDB Atlas if connected
  if (getStatus()) {
    try {
      await UserTask.findOneAndUpdate(
        { $or: [{ customId: taskId }, { taskId: taskId }] },
        { status: 'In Progress', progress: 50 }
      );
      await WorkHistory.findOneAndUpdate(
        { $or: [{ customId: taskId }, { taskId: taskId }] },
        {
          status: 'Rework Requested',
          reviewerFeedback: feedback || 'Please review notes and resubmit.',
          $push: {
            reviewerComments: {
              id: generateId('c'),
              author: 'Admin',
              role: 'Admin',
              date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + ', ' + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
              text: feedback || 'Please review notes and resubmit.'
            }
          }
        }
      );
    } catch (e) {
      console.warn('Mongo rework error:', e.message);
    }
  }

  saveStore();
  return { success: true, task, historyItem };
};

// --- Authentication & User Accounts (ONLY TWO ROLES: admin, user) ---
const checkEmail = async (email) => {
  const cleanEmail = (email || '').trim().toLowerCase();
  if (!cleanEmail) {
    return { exists: false, error: 'Please enter an email address.' };
  }

  // 1. Check MongoDB Atlas first if connected
  if (getStatus()) {
    try {
      const dbUser = await User.findOne({ email: cleanEmail }).lean();
      if (dbUser) {
        return {
          exists: true,
          hasPassword: Boolean(dbUser.hasPassword && dbUser.password),
          name: dbUser.name,
          role: dbUser.role
        };
      }
      const dbMember = await Member.findOne({ email: cleanEmail }).lean();
      if (dbMember) {
        return {
          exists: true,
          hasPassword: false,
          name: dbMember.name,
          role: 'user'
        };
      }
    } catch (e) {
      console.warn('Mongo checkEmail error:', e.message);
    }
  }

  // 2. Check memoryStore
  const user = (memoryStore.users || []).find(u => u.email.toLowerCase() === cleanEmail);
  if (user) {
    return {
      exists: true,
      hasPassword: Boolean(user.hasPassword && user.password),
      name: user.name,
      role: user.role
    };
  }

  const member = (memoryStore.members || []).find(m => m.email.toLowerCase() === cleanEmail);
  if (member) {
    return {
      exists: true,
      hasPassword: false,
      name: member.name,
      role: 'user'
    };
  }

  return {
    exists: false,
    error: 'Your email is invalid or not registered by Admin.'
  };
};

const createPassword = async (email, password) => {
  const cleanEmail = (email || '').trim().toLowerCase();
  if (!cleanEmail || !password) {
    return { success: false, error: 'Email and new password are required.' };
  }

  let user = (memoryStore.users || []).find(u => u.email.toLowerCase() === cleanEmail);
  let member = (memoryStore.members || []).find(m => m.email.toLowerCase() === cleanEmail);

  if (!user && !member) {
    if (getStatus()) {
      const dbU = await User.findOne({ email: cleanEmail });
      const dbM = await Member.findOne({ email: cleanEmail });
      if (!dbU && !dbM) {
        return { success: false, error: 'Your email is invalid or not registered by Admin.' };
      }
    } else {
      return { success: false, error: 'Your email is invalid or not registered by Admin.' };
    }
  }

  if (!user && member) {
    user = {
      id: generateId('usr'),
      name: member.name,
      email: cleanEmail,
      password: password,
      hasPassword: true,
      role: 'user',
      memberId: member.id,
      department: member.departmentId,
      team: member.teamId,
      teamRole: member.role || 'Team Member',
      avatar: member.avatar,
      title: member.role || 'Team Member'
    };
    memoryStore.users.push(user);
  } else if (user) {
    user.password = password;
    user.hasPassword = true;
  }
  saveStore();

  if (getStatus()) {
    try {
      let dbUser = await User.findOne({ email: cleanEmail });
      if (dbUser) {
        dbUser.password = password;
        dbUser.hasPassword = true;
        await dbUser.save();
      } else {
        const dbMember = await Member.findOne({ email: cleanEmail });
        dbUser = await User.create({
          customId: generateId('usr'),
          name: dbMember ? dbMember.name : (user ? user.name : 'Team Member'),
          email: cleanEmail,
          password: password,
          hasPassword: true,
          role: 'user',
          memberId: dbMember ? dbMember._id.toString() : '',
          department: dbMember ? dbMember.departmentId : '',
          team: dbMember ? dbMember.teamId : '',
          teamRole: dbMember ? dbMember.role : 'Team Member',
          avatar: dbMember ? dbMember.avatar : 'U',
          title: dbMember ? dbMember.role : 'Team Member'
        });
      }
      const safe = {
        id: dbUser.customId || dbUser._id.toString(),
        name: dbUser.name,
        email: dbUser.email,
        role: dbUser.role,
        memberId: dbUser.memberId,
        department: dbUser.department,
        team: dbUser.team,
        teamRole: dbUser.teamRole,
        avatar: dbUser.avatar,
        title: dbUser.title
      };
      return {
        success: true,
        user: safe,
        token: `token-${dbUser.role}-${Date.now()}`
      };
    } catch (e) {
      console.warn('Mongo createPassword error:', e.message);
    }
  }

  const { password: _, ...safeUser } = user;
  return {
    success: true,
    user: safeUser,
    token: `token-${user.role}-${Date.now()}`
  };
};

const loginUser = async (email, password) => {
  const cleanEmail = (email || '').trim().toLowerCase();

  // Check MongoDB Atlas first if connected
  if (getStatus()) {
    try {
      const dbUser = await User.findOne({ email: cleanEmail }).lean();
      if (dbUser) {
        if (!dbUser.hasPassword || !dbUser.password) {
          return {
            success: false,
            requiresPasswordSetup: true,
            name: dbUser.name,
            error: 'Please create a password for your account first.'
          };
        }
        if (dbUser.password !== password) {
          return { success: false, error: 'Invalid password. Please check your credentials.' };
        }
        const { password: _, ...safeUser } = dbUser;
        return {
          success: true,
          user: { ...safeUser, id: dbUser.customId || dbUser._id.toString() },
          token: `token-${dbUser.role}-${Date.now()}`
        };
      }

      // Check if email belongs to registered Member
      const dbMember = await Member.findOne({ email: cleanEmail }).lean();
      if (dbMember) {
        return {
          success: false,
          requiresPasswordSetup: true,
          name: dbMember.name,
          error: 'Please create a password for your account first.'
        };
      }
    } catch (e) {
      console.warn('Mongo login query error, checking in-memory store:', e.message);
    }
  }

  if (!memoryStore.users) {
    memoryStore.users = JSON.parse(JSON.stringify(initialData.users || []));
  }
  const user = memoryStore.users.find(u => u.email.toLowerCase() === cleanEmail);

  if (!user) {
    // Check if email exists in members
    const member = (memoryStore.members || []).find(m => m.email.toLowerCase() === cleanEmail);
    if (member) {
      return {
        success: false,
        requiresPasswordSetup: true,
        name: member.name,
        error: 'Please create a password for your account first.'
      };
    }
    return { success: false, error: 'Your email is invalid or not registered by Admin.' };
  }

  if (!user.hasPassword || !user.password) {
    return {
      success: false,
      requiresPasswordSetup: true,
      name: user.name,
      error: 'Please create a password for your account first.'
    };
  }

  if (user.password !== password) {
    return { success: false, error: 'Invalid password. Please check your credentials.' };
  }

  const { password: _, ...safeUser } = user;
  return {
    success: true,
    user: safeUser,
    token: `token-${user.role}-${Date.now()}`
  };
};

const getUsers = async () => {
  if (getStatus()) {
    try {
      const list = await User.find().select('-password').lean();
      if (list.length > 0) {
        return list.map(u => ({ ...u, id: u.customId || u._id.toString() }));
      }
    } catch (e) {
      console.warn('Mongo read error:', e.message);
    }
  }

  if (!memoryStore.users) {
    memoryStore.users = JSON.parse(JSON.stringify(initialData.users || []));
  }
  return memoryStore.users.map(({ password, ...u }) => u);
};

// --- Admin Management & Profile Settings ---
const updateAdminProfile = async (identifier, { name, email, newPassword }) => {
  const cleanEmail = (email || '').trim().toLowerCase();

  const user = (memoryStore.users || []).find(u =>
    u.id === identifier ||
    (u.email && u.email.toLowerCase() === identifier.toLowerCase()) ||
    (cleanEmail && u.email && u.email.toLowerCase() === cleanEmail)
  );

  if (user) {
    if (name) user.name = name;
    if (cleanEmail) user.email = cleanEmail;
    if (newPassword) {
      user.password = newPassword;
      user.hasPassword = true;
    }
    saveStore();
  }

  if (getStatus()) {
    try {
      const updateData = {};
      if (name) updateData.name = name;
      if (cleanEmail) updateData.email = cleanEmail;
      if (newPassword) {
        updateData.password = newPassword;
        updateData.hasPassword = true;
      }

      const updated = await User.findOneAndUpdate(
        { $or: [{ customId: identifier }, { email: identifier.toLowerCase() }, { email: cleanEmail }] },
        updateData,
        { new: true }
      ).lean();

      if (updated) {
        const { password: _, ...safeUser } = updated;
        return { success: true, user: { ...safeUser, id: updated.customId || updated._id.toString() } };
      }
    } catch (e) {
      console.warn('Mongo updateAdminProfile error:', e.message);
    }
  }

  if (user) {
    const { password: _, ...safeUser } = user;
    return { success: true, user: safeUser };
  }

  return { success: false, error: 'Admin account not found' };
};

const getAdmins = async () => {
  if (getStatus()) {
    try {
      const list = await User.find({ role: 'admin' }).select('-password').lean();
      if (list.length > 0) {
        return list.map(u => ({ ...u, id: u.customId || u._id.toString() }));
      }
    } catch (e) {
      console.warn('Mongo getAdmins error:', e.message);
    }
  }

  return (memoryStore.users || [])
    .filter(u => u.role === 'admin')
    .map(({ password, ...u }) => u);
};

const createAdmin = async ({ name, email, password }) => {
  const cleanEmail = (email || '').trim().toLowerCase();
  if (!cleanEmail || !password) {
    return { success: false, error: 'Email and password are required' };
  }

  const existing = (memoryStore.users || []).find(u => u.email.toLowerCase() === cleanEmail);
  if (existing) {
    return { success: false, error: 'An account with this email address already exists' };
  }

  const newAdmin = {
    id: generateId('adm'),
    name: name || 'Administrator',
    email: cleanEmail,
    password: password,
    hasPassword: true,
    role: 'admin',
    avatar: (name || 'A').charAt(0).toUpperCase(),
    title: 'Administrator'
  };

  memoryStore.users.push(newAdmin);
  saveStore();

  if (getStatus()) {
    try {
      const created = await User.create({
        customId: newAdmin.id,
        name: newAdmin.name,
        email: cleanEmail,
        password: password,
        hasPassword: true,
        role: 'admin',
        avatar: newAdmin.avatar,
        title: 'Administrator'
      });
      const { password: _, ...safeAdmin } = created.toObject();
      return { success: true, user: { ...safeAdmin, id: created._id.toString() } };
    } catch (e) {
      console.warn('Mongo createAdmin error:', e.message);
    }
  }

  const { password: _, ...safeAdmin } = newAdmin;
  return { success: true, user: safeAdmin };
};

const deleteAdmin = async (id) => {
  const adminCount = (memoryStore.users || []).filter(u => u.role === 'admin').length;
  if (adminCount <= 1) {
    return { success: false, error: 'Cannot delete the only administrator account' };
  }

  memoryStore.users = (memoryStore.users || []).filter(u => u.id !== id && u.email !== id);
  saveStore();

  if (getStatus()) {
    try {
      await User.findOneAndDelete({ $or: [{ customId: id }, { _id: id }, { email: id }] });
    } catch (e) {
      console.warn('Mongo deleteAdmin error:', e.message);
    }
  }

  return { success: true, message: 'Administrator removed successfully' };
};

// --- Notifications Engine ---
const getNotifications = async (role = 'all', userId = null) => {
  if (getStatus()) {
    try {
      const filter = {};
      if (role && role !== 'all') {
        filter.$or = [{ recipientRole: role }, { recipientRole: 'all' }];
        if (userId) {
          filter.$or.push({ recipientUserId: userId });
        }
      }
      const list = await Notification.find(filter).sort({ createdAt: -1 }).lean();
      return list.map(n => ({ ...n, id: n.customId || n._id.toString() }));
    } catch (e) {
      console.warn('Mongo notifications read error:', e.message);
    }
  }

  if (!memoryStore.notifications) {
    memoryStore.notifications = [];
  }
  let list = memoryStore.notifications;
  if (role && role !== 'all') {
    list = list.filter(n => n.recipientRole === role || n.recipientRole === 'all' || (userId && n.recipientUserId === userId));
  }
  return list;
};

const createNotification = (data) => {
  const newNotif = {
    id: generateId('notif'),
    recipientRole: data.recipientRole || 'user',
    recipientUserId: data.recipientUserId || null,
    title: data.title || 'Notification',
    message: data.message || '',
    timestamp: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + ', ' + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    read: false,
    link: data.link || ''
  };

  if (!memoryStore.notifications) {
    memoryStore.notifications = [];
  }
  memoryStore.notifications.unshift(newNotif);
  saveStore();

  if (getStatus()) {
    Notification.create({
      customId: newNotif.id,
      recipientRole: newNotif.recipientRole,
      recipientUserId: newNotif.recipientUserId,
      title: newNotif.title,
      message: newNotif.message,
      timestamp: newNotif.timestamp,
      read: false,
      link: newNotif.link
    }).catch(e => console.warn('Mongo notification error:', e.message));
  }

  return newNotif;
};

const markNotificationRead = async (id) => {
  if (!memoryStore.notifications) {
    memoryStore.notifications = [];
  }
  const notif = memoryStore.notifications.find(n => n.id === id);
  if (notif) {
    notif.read = true;
    saveStore();
  }

  if (getStatus()) {
    try {
      await Notification.findOneAndUpdate(
        { $or: [{ customId: id }, { _id: id }] },
        { read: true }
      );
    } catch (e) {
      console.warn('Mongo mark read error:', e.message);
    }
  }

  return notif;
};

const markAllNotificationsRead = async (role) => {
  if (!memoryStore.notifications) {
    memoryStore.notifications = [];
  }
  memoryStore.notifications.forEach(n => {
    if (!role || n.recipientRole === role) {
      n.read = true;
    }
  });
  saveStore();

  if (getStatus()) {
    try {
      const filter = role ? { recipientRole: role } : {};
      await Notification.updateMany(filter, { read: true });
    } catch (e) {
      console.warn('Mongo mark all read error:', e.message);
    }
  }

  return true;
};

const addUserComment = async (taskId, data) => {
  if (!memoryStore.userWorkspace) {
    memoryStore.userWorkspace = {
      stats: { totalAssigned: 0, inProgress: 0, upcomingWork: 0, completedWork: 0, completionPercentage: 0, completedFractionText: '0 of 0 Tasks' },
      assignedWork: [],
      history: [],
      recentActivities: []
    };
  }
  const ws = memoryStore.userWorkspace;
  const task = ws.assignedWork.find(t => t.id === taskId || t.taskId === taskId);

  const newComment = {
    id: generateId('c'),
    author: data.author || 'Team Member',
    role: data.role || 'Team Member',
    date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + ', ' + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    badge: data.badge || 'Update',
    text: data.text || ''
  };

  if (task) {
    if (!task.comments) task.comments = [];
    task.comments.push(newComment);
  }

  const historyItem = ws.history.find(h => h.id === taskId || h.taskId === taskId);
  if (historyItem) {
    if (!historyItem.reviewerComments) historyItem.reviewerComments = [];
    historyItem.reviewerComments.push(newComment);
  }
  saveStore();

  if (getStatus()) {
    try {
      await UserTask.findOneAndUpdate(
        { $or: [{ customId: taskId }, { taskId: taskId }] },
        { $push: { comments: newComment } }
      );
      await WorkHistory.findOneAndUpdate(
        { $or: [{ customId: taskId }, { taskId: taskId }] },
        { $push: { reviewerComments: newComment } }
      );
    } catch (e) {
      console.warn('Mongo comment error:', e.message);
    }
  }

  return newComment;
};

const updateUserWorkStatus = async (taskId, status) => {
  if (!memoryStore.userWorkspace) {
    memoryStore.userWorkspace = {
      stats: { totalAssigned: 0, inProgress: 0, upcomingWork: 0, completedWork: 0, completionPercentage: 0, completedFractionText: '0 of 0 Tasks' },
      assignedWork: [],
      history: [],
      recentActivities: []
    };
  }
  const ws = memoryStore.userWorkspace;
  const task = ws.assignedWork.find(t => t.id === taskId || t.taskId === taskId);
  if (!task) return null;

  task.status = status;
  if (status === 'In Progress' && task.progress === 0) {
    task.progress = 30;
  }

  ws.recentActivities.unshift({
    id: generateId('act'),
    type: 'started',
    title: `Work Started: ${task.title}`,
    date: 'Just now'
  });
  saveStore();

  if (getStatus()) {
    try {
      await UserTask.findOneAndUpdate(
        { $or: [{ customId: taskId }, { taskId: taskId }] },
        { status: status, progress: task.progress }
      );
    } catch (e) {
      console.warn('Mongo update status error:', e.message);
    }
  }

  return task;
};

// --- Appointment Services ---
const getAppointments = async (filter = {}) => {
  if (getStatus()) {
    try {
      const q = {};
      if (filter.status && filter.status !== 'All') {
        q.status = filter.status;
      }
      if (filter.userId) {
        q.userId = filter.userId;
      }
      if (filter.date) {
        q.date = filter.date;
      }
      if (filter.search) {
        const regex = new RegExp(filter.search, 'i');
        q.$or = [
          { title: regex },
          { requestedBy: regex },
          { department: regex },
          { team: regex }
        ];
      }
      const list = await Appointment.find(q).sort({ createdAt: -1 }).lean();
      return list.map(a => ({ ...a, id: a.customId || a._id.toString() }));
    } catch (e) {
      console.warn('Mongo read error, falling back to in-memory appointments:', e.message);
    }
  }

  if (!memoryStore.appointments) {
    memoryStore.appointments = [];
  }
  let list = memoryStore.appointments;

  if (filter.status && filter.status !== 'All') {
    list = list.filter(a => a.status.toLowerCase() === filter.status.toLowerCase());
  }
  if (filter.userId) {
    list = list.filter(a => a.userId === filter.userId);
  }
  if (filter.date) {
    list = list.filter(a => a.date === filter.date);
  }
  if (filter.search) {
    const q = filter.search.toLowerCase();
    list = list.filter(a =>
      a.title.toLowerCase().includes(q) ||
      a.requestedBy.toLowerCase().includes(q) ||
      (a.department && a.department.toLowerCase().includes(q)) ||
      (a.team && a.team.toLowerCase().includes(q)) ||
      (a.location && a.location.toLowerCase().includes(q))
    );
  }

  return list;
};

const createAppointment = async (data) => {
  const dateObj = data.date ? new Date(data.date) : new Date();
  const dateFormatted = dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const timeFormatted = data.time || '11:00 AM';
  const todayStr = new Date().toISOString().split('T')[0];

  const newApt = {
    id: generateId('apt'),
    title: data.title || 'Untitled Meeting',
    requestedBy: data.requestedBy || 'Team Member',
    userId: data.userId || 'usr-user',
    department: data.department || '',
    team: data.team || '',
    date: data.date || todayStr,
    time: timeFormatted,
    endTime: data.endTime || '12:00 PM',
    dateTimeDisplay: `${dateFormatted}, ${timeFormatted}`,
    location: data.location || 'Online (Google Meet)',
    purpose: data.purpose || '',
    status: data.status || 'Scheduled',
    isToday: data.date === todayStr
  };

  if (!memoryStore.appointments) {
    memoryStore.appointments = [];
  }
  memoryStore.appointments.unshift(newApt);
  saveStore();

  if (getStatus()) {
    try {
      const created = await Appointment.create({
        customId: newApt.id,
        title: newApt.title,
        requestedBy: newApt.requestedBy,
        userId: newApt.userId,
        department: newApt.department,
        team: newApt.team,
        date: newApt.date,
        time: newApt.time,
        endTime: newApt.endTime,
        dateTimeDisplay: newApt.dateTimeDisplay,
        location: newApt.location,
        purpose: newApt.purpose,
        status: newApt.status,
        isToday: newApt.isToday
      });
      return { ...created.toObject(), id: created._id.toString() };
    } catch (e) {
      console.warn('Mongo appointment create error:', e.message);
    }
  }

  return newApt;
};

const updateAppointment = async (id, data) => {
  if (!memoryStore.appointments) {
    memoryStore.appointments = [];
  }
  const index = memoryStore.appointments.findIndex(a => a.id === id);
  if (index !== -1) {
    memoryStore.appointments[index] = {
      ...memoryStore.appointments[index],
      ...data
    };
    saveStore();
  }

  if (getStatus()) {
    try {
      const updated = await Appointment.findOneAndUpdate(
        { $or: [{ customId: id }, { _id: id }] },
        data,
        { new: true }
      ).lean();
      if (updated) return { ...updated, id: updated._id.toString() };
    } catch (e) {
      console.warn('Mongo appointment update error:', e.message);
    }
  }

  return index !== -1 ? memoryStore.appointments[index] : null;
};

const deleteAppointment = async (id) => {
  if (!memoryStore.appointments) {
    memoryStore.appointments = [];
  }
  memoryStore.appointments = memoryStore.appointments.filter(a => a.id !== id);
  saveStore();

  if (getStatus()) {
    try {
      await Appointment.findOneAndDelete({ $or: [{ customId: id }, { _id: id }] });
    } catch (e) {
      console.warn('Mongo appointment delete error:', e.message);
    }
  }
  return true;
};

const getAppointmentStats = async (userId = null) => {
  const all = await getAppointments();
  const todayStr = new Date().toISOString().split('T')[0];

  const adminTotal = all.length;
  const adminToday = all.filter(a => a.isToday || a.date === todayStr).length;
  const adminCompleted = all.filter(a => a.status === 'Completed').length;
  const adminUpcoming = all.filter(a => a.status === 'Upcoming' || a.status === 'Scheduled').length;
  const adminCancelled = all.filter(a => a.status === 'Cancelled').length;

  const userApts = userId ? all.filter(a => a.userId === userId) : all;
  const userTotal = userApts.length;
  const userToday = userApts.filter(a => a.isToday || a.date === todayStr).length;
  const userCompleted = userApts.filter(a => a.status === 'Completed').length;
  const userUpcoming = userApts.filter(a => a.status === 'Upcoming' || a.status === 'Scheduled').length;
  const userCancelled = userApts.filter(a => a.status === 'Cancelled').length;

  return {
    admin: {
      total: adminTotal,
      today: adminToday,
      completed: adminCompleted,
      upcoming: adminUpcoming,
      cancelled: adminCancelled
    },
    user: {
      total: userTotal,
      today: userToday,
      completed: userCompleted,
      upcoming: userUpcoming,
      cancelled: userCancelled
    }
  };
};

// --- Top KPI Stats ---
const getStats = async () => {
  const depts = await getDepartments();
  const tms = await getTeams();
  const mems = await getMembers();
  const tsks = await getTasks();
  const wd = await getWorkDone();

  return {
    departmentsCount: depts.length,
    teamsCount: tms.length,
    membersCount: mems.length,
    todaysTasksCount: tsks.length,
    workDoneTodayCount: wd.length,
    databaseMode: getStatus() ? 'MongoDB Atlas' : 'Dynamic Storage (Ready for Atlas)'
  };
};

module.exports = {
  clearAllData,
  initMongoSeed,
  syncToMongo,
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  getTeams,
  createTeam,
  updateTeam,
  deleteTeam,
  getMembers,
  createMember,
  updateMember,
  deleteMember,
  getAssignments,
  createAssignment,
  deleteAssignment,
  getTasks,
  createTask,
  updateTask,
  toggleTask,
  deleteTask,
  getWorkDone,
  createWorkDone,
  deleteWorkDone,
  getStats,
  getUserWorkspace,
  submitUserWork,
  approveWork,
  requestRework,
  addUserComment,
  updateUserWorkStatus,
  loginUser,
  checkEmail,
  createPassword,
  getUsers,
  updateAdminProfile,
  getAdmins,
  createAdmin,
  deleteAdmin,
  getNotifications,
  createNotification,
  markNotificationRead,
  markAllNotificationsRead,
  getAppointments,
  createAppointment,
  updateAppointment,
  deleteAppointment,
  getAppointmentStats
};
