const { getStatus } = require('../config/db');
const Department = require('../models/Department');
const Team = require('../models/Team');
const Member = require('../models/Member');
const Assignment = require('../models/Assignment');
const Task = require('../models/Task');
const WorkDone = require('../models/WorkDone');
const initialData = require('./seedData');

// In-Memory store initialized with clone of seed data
let memoryStore = JSON.parse(JSON.stringify(initialData));

// Helper for generating unique ID for in-memory operations
const generateId = (prefix) => `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

// Seed MongoDB if connected and empty
const initMongoSeed = async () => {
  if (!getStatus()) return;
  try {
    const deptCount = await Department.countDocuments();
    if (deptCount === 0) {
      console.log('[Seed] Seeding initial data into MongoDB...');
      // Insert departments
      const deptMap = {};
      for (const d of initialData.departments) {
        const created = await Department.create({
          name: d.name,
          icon: d.icon,
          description: d.description
        });
        deptMap[d.id] = created._id;
      }

      // Insert teams
      const teamMap = {};
      for (const t of initialData.teams) {
        const created = await Team.create({
          name: t.name,
          departmentId: deptMap[t.departmentId],
          description: t.description
        });
        teamMap[t.id] = created._id;
      }

      // Insert members
      const memberMap = {};
      for (const m of initialData.members) {
        const created = await Member.create({
          name: m.name,
          email: m.email,
          phone: m.phone,
          role: m.role,
          assignedWork: m.assignedWork,
          teamId: teamMap[m.teamId],
          departmentId: deptMap[m.departmentId],
          avatar: m.avatar
        });
        memberMap[m.id] = created._id;
      }

      // Insert assignments
      for (const a of initialData.assignments) {
        if (memberMap[a.memberId] && teamMap[a.teamId]) {
          await Assignment.create({
            memberId: memberMap[a.memberId],
            teamId: teamMap[a.teamId],
            workTitle: a.workTitle,
            workDescription: a.workDescription,
            role: a.role,
            priority: a.priority,
            dueDate: a.dueDate,
            status: a.status
          });
        }
      }

      // Insert tasks
      for (const tk of initialData.tasks) {
        if (teamMap[tk.teamId]) {
          await Task.create({
            teamId: teamMap[tk.teamId],
            title: tk.title,
            priority: tk.priority,
            completed: tk.completed,
            date: tk.date
          });
        }
      }

      // Insert workDone
      for (const wd of initialData.workDone) {
        if (teamMap[wd.teamId]) {
          await WorkDone.create({
            teamId: teamMap[wd.teamId],
            title: wd.title,
            details: wd.details,
            date: wd.date
          });
        }
      }
      console.log('[Seed] MongoDB initial seeding finished!');
    }
  } catch (err) {
    console.error('[Seed Error] Failed to seed MongoDB:', err);
  }
};

// Data service methods
const getDepartments = async () => {
  if (getStatus()) {
    const list = await Department.find().lean();
    return list.map(d => ({ ...d, id: d._id.toString() }));
  }
  return memoryStore.departments;
};

const createDepartment = async (data) => {
  if (getStatus()) {
    const created = await Department.create(data);
    return { ...created.toObject(), id: created._id.toString() };
  }
  const newDept = {
    id: generateId('dept'),
    name: data.name,
    icon: data.icon || 'layers',
    description: data.description || ''
  };
  memoryStore.departments.push(newDept);
  return newDept;
};

const updateDepartment = async (id, data) => {
  if (getStatus()) {
    const updated = await Department.findByIdAndUpdate(id, data, { new: true }).lean();
    return updated ? { ...updated, id: updated._id.toString() } : null;
  }
  const index = memoryStore.departments.findIndex(d => d.id === id);
  if (index === -1) return null;
  memoryStore.departments[index] = { ...memoryStore.departments[index], ...data };
  return memoryStore.departments[index];
};

const deleteDepartment = async (id) => {
  if (getStatus()) {
    await Department.findByIdAndDelete(id);
    return true;
  }
  memoryStore.departments = memoryStore.departments.filter(d => d.id !== id);
  memoryStore.teams = memoryStore.teams.filter(t => t.departmentId !== id);
  return true;
};

// Teams
const getTeams = async (departmentId = null) => {
  if (getStatus()) {
    const filter = departmentId ? { departmentId } : {};
    const list = await Team.find(filter).lean();
    return list.map(t => ({ ...t, id: t._id.toString(), departmentId: t.departmentId.toString() }));
  }
  if (departmentId) {
    return memoryStore.teams.filter(t => t.departmentId === departmentId);
  }
  return memoryStore.teams;
};

const createTeam = async (data) => {
  if (getStatus()) {
    const created = await Team.create(data);
    return { ...created.toObject(), id: created._id.toString() };
  }
  const newTeam = {
    id: generateId('team'),
    name: data.name,
    departmentId: data.departmentId,
    description: data.description || ''
  };
  memoryStore.teams.push(newTeam);
  return newTeam;
};

const updateTeam = async (id, data) => {
  if (getStatus()) {
    const updated = await Team.findByIdAndUpdate(id, data, { new: true }).lean();
    return updated ? { ...updated, id: updated._id.toString() } : null;
  }
  const index = memoryStore.teams.findIndex(t => t.id === id);
  if (index === -1) return null;
  memoryStore.teams[index] = { ...memoryStore.teams[index], ...data };
  return memoryStore.teams[index];
};

const deleteTeam = async (id) => {
  if (getStatus()) {
    await Team.findByIdAndDelete(id);
    return true;
  }
  memoryStore.teams = memoryStore.teams.filter(t => t.id !== id);
  memoryStore.members = memoryStore.members.filter(m => m.teamId !== id);
  return true;
};

// Members
const getMembers = async (teamId = null, departmentId = null) => {
  if (getStatus()) {
    const filter = {};
    if (teamId) filter.teamId = teamId;
    if (departmentId) filter.departmentId = departmentId;
    const list = await Member.find(filter).lean();
    return list.map(m => ({ ...m, id: m._id.toString() }));
  }
  let res = memoryStore.members;
  if (teamId) res = res.filter(m => m.teamId === teamId);
  if (departmentId) res = res.filter(m => m.departmentId === departmentId);
  return res;
};

const createMember = async (data) => {
  if (getStatus()) {
    const created = await Member.create(data);
    return { ...created.toObject(), id: created._id.toString() };
  }
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
  return newMember;
};

const updateMember = async (id, data) => {
  if (getStatus()) {
    const updated = await Member.findByIdAndUpdate(id, data, { new: true }).lean();
    return updated ? { ...updated, id: updated._id.toString() } : null;
  }
  const index = memoryStore.members.findIndex(m => m.id === id);
  if (index === -1) return null;
  memoryStore.members[index] = { ...memoryStore.members[index], ...data };
  return memoryStore.members[index];
};

const deleteMember = async (id) => {
  if (getStatus()) {
    await Member.findByIdAndDelete(id);
    return true;
  }
  memoryStore.members = memoryStore.members.filter(m => m.id !== id);
  return true;
};

// Assignments
const getAssignments = async (teamId = null) => {
  if (getStatus()) {
    const filter = teamId ? { teamId } : {};
    const list = await Assignment.find(filter).lean();
    return list.map(a => ({ ...a, id: a._id.toString() }));
  }
  if (teamId) {
    return memoryStore.assignments.filter(a => a.teamId === teamId);
  }
  return memoryStore.assignments;
};

const createAssignment = async (data) => {
  if (getStatus()) {
    const created = await Assignment.create(data);
    return { ...created.toObject(), id: created._id.toString() };
  }
  const newAssign = {
    id: generateId('assign'),
    memberId: data.memberId,
    teamId: data.teamId,
    workTitle: data.workTitle,
    workDescription: data.workDescription || '',
    role: data.role || 'Developer',
    priority: data.priority || 'Medium',
    dueDate: data.dueDate || '',
    status: data.status || 'In Progress'
  };
  memoryStore.assignments.unshift(newAssign);
  return newAssign;
};

// Tasks
const getTasks = async (teamId = null) => {
  if (getStatus()) {
    const filter = teamId ? { teamId } : {};
    const list = await Task.find(filter).lean();
    return list.map(t => ({ ...t, id: t._id.toString() }));
  }
  if (teamId) {
    return memoryStore.tasks.filter(t => t.teamId === teamId);
  }
  return memoryStore.tasks;
};

const createTask = async (data) => {
  if (getStatus()) {
    const created = await Task.create(data);
    return { ...created.toObject(), id: created._id.toString() };
  }
  const newTask = {
    id: generateId('task'),
    teamId: data.teamId,
    title: data.title,
    priority: data.priority || 'Medium',
    completed: data.completed || false,
    date: data.date || new Date().toISOString().split('T')[0]
  };
  memoryStore.tasks.push(newTask);
  return newTask;
};

const toggleTask = async (id) => {
  if (getStatus()) {
    const task = await Task.findById(id);
    if (!task) return null;
    task.completed = !task.completed;
    await task.save();
    return { ...task.toObject(), id: task._id.toString() };
  }
  const index = memoryStore.tasks.findIndex(t => t.id === id);
  if (index === -1) return null;
  memoryStore.tasks[index].completed = !memoryStore.tasks[index].completed;
  return memoryStore.tasks[index];
};

const deleteTask = async (id) => {
  if (getStatus()) {
    await Task.findByIdAndDelete(id);
    return true;
  }
  memoryStore.tasks = memoryStore.tasks.filter(t => t.id !== id);
  return true;
};

// WorkDone
const getWorkDone = async (teamId = null) => {
  if (getStatus()) {
    const filter = teamId ? { teamId } : {};
    const list = await WorkDone.find(filter).lean();
    return list.map(w => ({ ...w, id: w._id.toString() }));
  }
  if (teamId) {
    return memoryStore.workDone.filter(w => w.teamId === teamId);
  }
  return memoryStore.workDone;
};

const createWorkDone = async (data) => {
  if (getStatus()) {
    const created = await WorkDone.create(data);
    return { ...created.toObject(), id: created._id.toString() };
  }
  const newWork = {
    id: generateId('wd'),
    teamId: data.teamId,
    title: data.title,
    details: data.details || '',
    date: data.date || new Date().toISOString().split('T')[0]
  };
  memoryStore.workDone.unshift(newWork);
  return newWork;
};

// Summary / Stats for Top Cards
const getStats = async () => {
  const depts = await getDepartments();
  const tms = await getTeams();
  const mems = await getMembers();
  const tsks = await getTasks();
  const wd = await getWorkDone();

  return {
    departmentsCount: depts.length,
    teamsCount: tms.length,
    membersCount: Math.max(mems.length, 36), // Keep baseline consistent or dynamic
    todaysTasksCount: Math.max(tsks.length, 18),
    workDoneTodayCount: Math.max(wd.length, 14),
    databaseMode: getStatus() ? 'MongoDB' : 'In-Memory Store (Ready for MongoDB)'
  };
};

module.exports = {
  initMongoSeed,
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
  getTasks,
  createTask,
  toggleTask,
  deleteTask,
  getWorkDone,
  createWorkDone,
  getStats
};
