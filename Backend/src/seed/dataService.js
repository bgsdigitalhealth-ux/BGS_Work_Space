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
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const Meeting = require('../models/Meeting');
const Attendance = require('../models/Attendance');
const BreakTime = require('../models/BreakTime');
const WorkRequest = require('../models/WorkRequest');
const TimeLog = require('../models/TimeLog');
const ReportEntry = require('../models/ReportEntry');
const initialData = require('./seedData');
const crypto = require('crypto');

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

const DATA_FILE = path.join(__dirname, '../../data/db.json');

const buildIdQuery = (id) => {
  if (!id) return { _id: null };
  const strId = String(id).trim();
  if (mongoose.Types.ObjectId.isValid(strId) && strId.length === 24) {
    return { $or: [{ _id: strId }, { customId: strId }] };
  }
  return { customId: strId };
};

// Persistent Disk Store engine
let memoryStore = JSON.parse(JSON.stringify(initialData));

const BANNED_EMAILS = [
  'admin@company.com',
  'user@company.com',
  'rahul@company.com',
  'priya@company.com',
  'amit@company.com',
  'sneha@company.com'
];

const isBannedEmail = (email) => {
  if (!email) return false;
  const clean = String(email).trim().toLowerCase();
  return BANNED_EMAILS.includes(clean) || clean.endsWith('@company.com');
};

// Check if a user/member holds a manager, head, lead, or administrator role
const isManagerOrAdmin = (user, member) => {
  if (!user && !member) return false;
  if (user && (user.role === 'admin' || user.role === 'manager')) return true;
  const roleStr = [
    user?.role,
    user?.teamRole,
    user?.title,
    member?.role
  ].filter(Boolean).join(' ').toLowerCase();

  return roleStr.includes('admin') ||
    roleStr.includes('manager') ||
    roleStr.includes('head') ||
    roleStr.includes('lead');
};

// Check if an email is currently registered / active in users or members (memoryStore, initialData, or MongoDB Atlas)
const isEmailCurrentlyActive = async (email) => {
  if (!email) return false;
  const clean = String(email).trim().toLowerCase();
  if (isBannedEmail(clean)) return false;

  const inUsers = (memoryStore.users || []).some(u => (u.email || '').toLowerCase() === clean);
  const inMembers = (memoryStore.members || []).some(m => (m.email || '').toLowerCase() === clean);
  const inInitial = (initialData.users || []).some(u => (u.email || '').toLowerCase() === clean);
  if (inUsers || inMembers || inInitial) return true;

  if (getStatus()) {
    try {
      const dbUser = await User.findOne({ email: clean }).lean();
      if (dbUser) return true;
      const dbMember = await Member.findOne({ email: clean }).lean();
      if (dbMember) return true;
    } catch (e) {
      // ignore
    }
  }
  return false;
};

// Remove email from deletedEmails when admin re-enters or restores an account
const unmarkDeletedEmail = (email) => {
  if (!email) return;
  const clean = String(email).trim().toLowerCase();
  if (Array.isArray(memoryStore.deletedEmails)) {
    const origLen = memoryStore.deletedEmails.length;
    memoryStore.deletedEmails = memoryStore.deletedEmails.filter(e => e.toLowerCase() !== clean);
    if (memoryStore.deletedEmails.length !== origLen) {
      saveStore();
    }
  }
};

// Mark an email as deleted when admin deletes an account
const markDeletedEmail = (email) => {
  if (!email) return;
  const clean = String(email).trim().toLowerCase();
  if (!Array.isArray(memoryStore.deletedEmails)) {
    memoryStore.deletedEmails = [];
  }
  if (!memoryStore.deletedEmails.includes(clean)) {
    memoryStore.deletedEmails.push(clean);
    saveStore();
  }
};

// Check if an email is deleted (if admin re-entered it or it's active in users/members, it is verified as valid and NOT deleted)
const isEmailDeleted = async (email) => {
  if (!email) return false;
  const clean = String(email).trim().toLowerCase();
  if (isBannedEmail(clean)) return true;

  const active = await isEmailCurrentlyActive(clean);
  if (active) {
    unmarkDeletedEmail(clean);
    return false;
  }

  return Array.isArray(memoryStore.deletedEmails) && memoryStore.deletedEmails.includes(clean);
};

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
        const bannedEmails = [
          'admin@company.com',
          'user@company.com',
          'rahul@company.com',
          'priya@company.com',
          'amit@company.com',
          'sneha@company.com'
        ];
        if (!Array.isArray(memoryStore.deletedEmails)) {
          memoryStore.deletedEmails = [...bannedEmails];
        } else {
          // Ensure legitimate hospital email and active accounts are never in deletedEmails
          memoryStore.deletedEmails = memoryStore.deletedEmails.filter(e => {
            const clean = e.toLowerCase();
            if (clean === 'bgsmchhospitalnagarur@gmail.com') return false;
            const inUsers = (memoryStore.users || []).some(u => (u.email || '').toLowerCase() === clean);
            const inMembers = (memoryStore.members || []).some(m => (m.email || '').toLowerCase() === clean);
            const inInit = (initialData.users || []).some(u => (u.email || '').toLowerCase() === clean);
            return !inUsers && !inMembers && !inInit;
          });
          for (const b of bannedEmails) {
            if (!memoryStore.deletedEmails.includes(b)) {
              memoryStore.deletedEmails.push(b);
            }
          }
        }

        // Strictly purge any fake banned emails from users and members so they can never resurface
        memoryStore.users = (memoryStore.users || []).filter(u => !isBannedEmail(u.email));
        memoryStore.members = (memoryStore.members || []).filter(m => !isBannedEmail(m.email));

        if (!memoryStore.users || memoryStore.users.length === 0) {
          memoryStore.users = JSON.parse(JSON.stringify(initialData.users)).filter(u => !isBannedEmail(u.email));
        } else {
          for (const u of initialData.users) {
            if (!isBannedEmail(u.email) && !memoryStore.users.some(x => x.email.toLowerCase() === u.email.toLowerCase())) {
              memoryStore.users.unshift(u);
            }
          }
        }
        if (!memoryStore.meetings) {
          memoryStore.meetings = [];
        }
        if (!memoryStore.attendance) {
          memoryStore.attendance = [];
        }
        if (!memoryStore.breaks) {
          memoryStore.breaks = [];
        }
        if (!memoryStore.timeLogs) {
          memoryStore.timeLogs = [];
        }
        if (!memoryStore.reportEntries) {
          memoryStore.reportEntries = [];
        }
        console.log('[Storage] Persistent database state loaded from disk successfully.');
        return;
      }
    }
  } catch (e) {
    console.warn('[Storage] Disk read error, initializing default store:', e.message);
  }
  memoryStore = JSON.parse(JSON.stringify(initialData));
  memoryStore.deletedEmails = [
    'admin@company.com',
    'user@company.com',
    'rahul@company.com',
    'priya@company.com',
    'amit@company.com',
    'sneha@company.com'
  ];
  memoryStore.users = (memoryStore.users || []).filter(u => !isBannedEmail(u.email));
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
  memoryStore.conversations = [];
  memoryStore.messages = [];
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
      await Conversation.deleteMany({});
      await Message.deleteMany({});
      await UserTask.deleteMany({});
      await WorkHistory.deleteMany({});
      await User.deleteMany({ email: { $nin: ['bgsmchhospitalnagarur@gmail.com'] } });
      await User.deleteMany({ email: { $in: BANNED_EMAILS } });
      await User.deleteMany({ email: { $regex: /@company\.com$/i } });
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
        const id = d.customId || d._id.toString();
        if (!memoryStore.departments.some(x => x.name.toLowerCase() === d.name.toLowerCase() || x.id === id)) {
          memoryStore.departments.push({ ...d, id });
        }
      }
    }
    const tms = await Team.find().lean();
    if (tms && tms.length > 0) {
      for (const t of tms) {
        const id = t.customId || t._id.toString();
        if (!memoryStore.teams.some(x => x.name.toLowerCase() === t.name.toLowerCase() || x.id === id)) {
          memoryStore.teams.push({ ...t, id });
        }
      }
    }
    const mems = await Member.find().lean();
    if (mems && mems.length > 0) {
      for (const m of mems) {
        const cleanEmail = (m.email || '').toLowerCase();
        // Only purge explicitly banned dummy accounts or malformed empty rows; Atlas is source of truth for real members
        if (isBannedEmail(cleanEmail) || !m.name || m.name.trim() === '' || !m.email || m.email.trim() === '') {
          await Member.deleteOne({ _id: m._id }).catch(() => { });
          continue;
        }
        unmarkDeletedEmail(cleanEmail);
        const id = m.customId || m._id.toString();
        if (!memoryStore.members.some(x => (x.email || '').toLowerCase() === cleanEmail || x.id === id)) {
          memoryStore.members.push({ ...m, id });
        }
      }
    }
    const usrs = await User.find().lean();
    if (usrs && usrs.length > 0) {
      for (const u of usrs) {
        const cleanEmail = (u.email || '').toLowerCase();
        // Only purge explicitly banned dummy accounts; never auto-delete real Atlas users from local cache
        if (isBannedEmail(cleanEmail)) {
          await User.deleteOne({ _id: u._id }).catch(() => { });
          continue;
        }
        unmarkDeletedEmail(cleanEmail);
        const id = u.customId || u._id.toString();
        const idx = memoryStore.users.findIndex(x => (x.email || '').toLowerCase() === cleanEmail || x.id === id);
        if (idx === -1) {
          memoryStore.users.push({ ...u, id });
        } else if (u.hasPassword && !memoryStore.users[idx].hasPassword) {
          memoryStore.users[idx].password = u.password;
          memoryStore.users[idx].hasPassword = true;
        }
      }
    }
    const asgs = await Assignment.find().lean();
    if (asgs && asgs.length > 0) {
      for (const a of asgs) {
        const id = a.customId || a._id.toString();
        if (!memoryStore.assignments.some(x => x.id === id)) {
          memoryStore.assignments.push({ ...a, id });
        }
      }
    }
    const tsks = await Task.find().lean();
    if (tsks && tsks.length > 0) {
      for (const tk of tsks) {
        const id = tk.customId || tk._id.toString();
        if (!memoryStore.tasks.some(x => x.id === id || (x.title === tk.title && x.teamId === tk.teamId))) {
          memoryStore.tasks.push({ ...tk, id });
        }
      }
    }
    const wds = await WorkDone.find().lean();
    if (wds && wds.length > 0) {
      if (!memoryStore.workDone) memoryStore.workDone = [];
      for (const wd of wds) {
        const id = wd.customId || wd._id.toString();
        if (!memoryStore.workDone.some(x => x.id === id || (x.title === wd.title && x.teamId === wd.teamId))) {
          memoryStore.workDone.push({ ...wd, id });
        }
      }
    }
    const apts = await Appointment.find().lean();
    if (apts && apts.length > 0) {
      if (!memoryStore.appointments) memoryStore.appointments = [];
      for (const apt of apts) {
        const id = apt.customId || apt._id.toString();
        if (!memoryStore.appointments.some(x => x.id === id || (x.title === apt.title && x.date === apt.date))) {
          memoryStore.appointments.push({ ...apt, id });
        }
      }
    }
    if (!memoryStore.userWorkspace) {
      memoryStore.userWorkspace = { stats: {}, assignedWork: [], history: [], recentActivities: [] };
    }
    const uTasks = await UserTask.find().lean();
    if (uTasks && uTasks.length > 0) {
      for (const ut of uTasks) {
        const id = ut.customId || ut._id.toString();
        if (!memoryStore.userWorkspace.assignedWork.some(x => x.id === id || x.taskId === ut.taskId)) {
          memoryStore.userWorkspace.assignedWork.push({ ...ut, id });
        }
      }
    }
    const wHists = await WorkHistory.find().lean();
    if (wHists && wHists.length > 0) {
      for (const wh of wHists) {
        const id = wh.customId || wh._id.toString();
        if (!memoryStore.userWorkspace.history.some(x => x.id === id || x.taskId === wh.taskId)) {
          memoryStore.userWorkspace.history.push({ ...wh, id });
        }
      }
    }
    const mts = await Meeting.find().lean();
    if (mts && mts.length > 0) {
      if (!memoryStore.meetings) memoryStore.meetings = [];
      for (const mt of mts) {
        const id = mt.customId || mt._id.toString();
        if (!memoryStore.meetings.some(x => x.id === id || x.meetingId === mt.meetingId)) {
          memoryStore.meetings.push({ ...mt, id });
        }
      }
    }
    const notifs = await Notification.find().lean();
    if (notifs && notifs.length > 0) {
      if (!memoryStore.notifications) memoryStore.notifications = [];
      for (const n of notifs) {
        const id = n.customId || n._id.toString();
        if (!memoryStore.notifications.some(x => x.id === id)) {
          memoryStore.notifications.push({ ...n, id });
        }
      }
    }
    const wrs = await WorkRequest.find().lean();
    if (wrs && wrs.length > 0) {
      if (!memoryStore.workRequests) memoryStore.workRequests = [];
      for (const wr of wrs) {
        const id = wr.customId || wr._id.toString();
        if (!memoryStore.workRequests.some(x => x.id === id || x.referenceId === wr.referenceId)) {
          memoryStore.workRequests.push({ ...wr, id });
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
    // 0. Purge permanently banned dummy fake accounts from MongoDB Atlas
    if (BANNED_EMAILS && BANNED_EMAILS.length > 0) {
      await User.deleteMany({ email: { $in: BANNED_EMAILS } }).catch(() => { });
      await Member.deleteMany({ email: { $in: BANNED_EMAILS } }).catch(() => { });
    }
    await User.deleteMany({ email: { $regex: /@company\.com$/i } }).catch(() => { });
    await Member.deleteMany({ email: { $regex: /@company\.com$/i } }).catch(() => { });
    await Member.deleteMany({
      $or: [
        { name: '' }, { email: '' }, { name: null }, { email: null },
        { name: { $exists: false } }, { email: { $exists: false } }
      ]
    }).catch(() => { });

    // 1. Load authoritative cloud records from MongoDB Atlas into memoryStore (never wipe real Atlas accounts from local cache)
    await loadFromMongo();

    // 2. Ensure base login accounts (initialData.users) exist and are verified with active credentials
    for (const u of initialData.users) {
      if (isBannedEmail(u.email)) continue;
      unmarkDeletedEmail(u.email);
      await User.findOneAndUpdate(
        { email: u.email.toLowerCase() },
        {
          customId: u.id,
          name: u.name,
          email: u.email.toLowerCase(),
          password: u.password,
          hasPassword: Boolean(u.hasPassword),
          role: u.role,
          avatar: u.avatar || '',
          title: u.title || ''
        },
        { upsert: true, new: true }
      ).catch(() => { });
    }
    // Ensure dynamicsajjan@gmail.com is strictly configured as manager, not admin
    await User.updateOne(
      { email: 'dynamicsajjan@gmail.com' },
      { $set: { role: 'manager' } }
    ).catch(() => { });
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
      const exists = await Department.findOne({ $or: [{ name: d.name }, { customId: d.id }] });
      if (!exists) {
        await Department.create({
          customId: d.id,
          name: d.name,
          icon: d.icon || 'layers',
          description: d.description || 'Manage teams, members, roles and work.'
        });
      }
    }
    // 2. Teams
    for (const t of (memoryStore.teams || [])) {
      const exists = await Team.findOne({ $or: [{ name: t.name }, { customId: t.id }] });
      if (!exists) {
        await Team.create({
          customId: t.id,
          name: t.name,
          departmentId: t.departmentId,
          description: t.description || 'Team responsible for department objectives.'
        });
      }
    }
    // 3. Members
    for (const m of (memoryStore.members || [])) {
      const cleanEmail = (m.email || '').toLowerCase();
      const exists = await Member.findOne({ $or: [{ email: cleanEmail }, { customId: m.id }] });
      if (!exists) {
        await Member.create({
          customId: m.id,
          name: m.name,
          email: cleanEmail,
          phone: m.phone || '',
          role: m.role || 'Developer',
          assignedWork: m.assignedWork || '',
          teamId: m.teamId,
          departmentId: m.departmentId,
          avatar: m.avatar || ''
        });
      }
    }
    // 4. Users (Members and Admins)
    for (const u of (memoryStore.users || [])) {
      const cleanEmail = (u.email || '').toLowerCase();
      const exists = await User.findOne({ email: cleanEmail });
      if (!exists) {
        await User.create({
          customId: u.id || u.customId,
          name: u.name,
          email: cleanEmail,
          password: u.password || '',
          hasPassword: Boolean(u.hasPassword),
          role: u.role || 'user',
          memberId: u.memberId || '',
          department: u.department || '',
          team: u.team || '',
          teamRole: u.teamRole || 'Team Member',
          avatar: u.avatar || '',
          title: u.title || ''
        });
      } else {
        let changed = false;
        if (!exists.customId && (u.id || u.customId)) {
          exists.customId = u.id || u.customId;
          changed = true;
        }
        if (u.hasPassword && !exists.hasPassword) {
          exists.password = u.password;
          exists.hasPassword = true;
          changed = true;
        }
        if (changed) await exists.save();
      }
    }
    // 5. Assignments
    for (const a of (memoryStore.assignments || [])) {
      const exists = await Assignment.findOne({ $or: [{ customId: a.id }, { workTitle: a.workTitle, teamId: a.teamId }] });
      if (!exists) await Assignment.create({ ...a, customId: a.id });
    }
    // 6. Tasks
    for (const tk of (memoryStore.tasks || [])) {
      const exists = await Task.findOne({ $or: [{ customId: tk.id }, { title: tk.title, teamId: tk.teamId }] });
      if (!exists) await Task.create({ ...tk, customId: tk.id });
    }
    // 7. Work Done
    for (const wd of (memoryStore.workDone || [])) {
      const exists = await WorkDone.findOne({ $or: [{ customId: wd.id }, { title: wd.title, teamId: wd.teamId }] });
      if (!exists) await WorkDone.create({ ...wd, customId: wd.id });
    }
    // 8. Appointments
    for (const apt of (memoryStore.appointments || [])) {
      const exists = await Appointment.findOne({ $or: [{ customId: apt.id }, { title: apt.title, date: apt.date }] });
      if (!exists) await Appointment.create({ ...apt, customId: apt.id });
    }
    // 9. User Tasks (User Workspace)
    if (memoryStore.userWorkspace && Array.isArray(memoryStore.userWorkspace.assignedWork)) {
      for (const ut of memoryStore.userWorkspace.assignedWork) {
        const exists = await UserTask.findOne({ $or: [{ customId: ut.id }, { taskId: ut.taskId }] });
        if (!exists) await UserTask.create({ ...ut, customId: ut.id });
      }
    }
    // 10. Work History
    if (memoryStore.userWorkspace && Array.isArray(memoryStore.userWorkspace.history)) {
      for (const wh of memoryStore.userWorkspace.history) {
        const exists = await WorkHistory.findOne({ $or: [{ customId: wh.id }, { taskId: wh.taskId }] });
        if (!exists) await WorkHistory.create({ ...wh, customId: wh.id });
      }
    }
    // 11. Meetings
    for (const mt of (memoryStore.meetings || [])) {
      const exists = await Meeting.findOne({ $or: [{ customId: mt.id }, { meetingId: mt.meetingId }] });
      if (!exists) await Meeting.create({ ...mt, customId: mt.id });
    }
    // 12. Notifications
    for (const notif of (memoryStore.notifications || [])) {
      const exists = await Notification.findOne({ $or: [{ customId: notif.id }, { title: notif.title, timestamp: notif.timestamp }] });
      if (!exists) await Notification.create({ ...notif, customId: notif.id });
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
      return list.map(d => ({ ...d, id: d.customId || d._id.toString() }));
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
      const created = await Department.create({
        customId: newDept.id,
        name: newDept.name,
        icon: newDept.icon,
        description: newDept.description
      });
      return { ...created.toObject(), id: newDept.id };
    } catch (e) {
      console.warn('Mongo create error:', e.message);
    }
  }
  return newDept;
};

const updateDepartment = async (id, data) => {
  const index = memoryStore.departments.findIndex(d => d.id === id || d.customId === id);
  if (index !== -1) {
    memoryStore.departments[index] = { ...memoryStore.departments[index], ...data };
    saveStore();
  }

  if (getStatus()) {
    try {
      const updated = await Department.findOneAndUpdate(buildIdQuery(id), data, { new: true }).lean();
      if (updated) return { ...updated, id: updated.customId || updated._id.toString() };
    } catch (e) {
      console.warn('Mongo update error:', e.message);
    }
  }
  return index !== -1 ? memoryStore.departments[index] : null;
};

const deleteDepartment = async (id) => {
  // IMPORTANT: Never auto-delete User or Member accounts when deleting a department!
  // Only an admin explicitly deleting a User/Member should remove user accounts.
  // Unbind affected members and users so their accounts remain permanently preserved.
  const deptTeams = (memoryStore.teams || []).filter(t => t.departmentId === id).map(t => t.id);

  memoryStore.members = (memoryStore.members || []).map(m => {
    if (m.departmentId === id || deptTeams.includes(m.teamId)) {
      return { ...m, departmentId: '', teamId: '' };
    }
    return m;
  });

  memoryStore.users = (memoryStore.users || []).map(u => {
    if (u.department === id || deptTeams.includes(u.team)) {
      return { ...u, department: '', team: '' };
    }
    return u;
  });

  memoryStore.departments = memoryStore.departments.filter(d => d.id !== id && d.customId !== id);
  memoryStore.teams = memoryStore.teams.filter(t => t.departmentId !== id);
  saveStore();

  if (getStatus()) {
    try {
      await Department.findOneAndDelete(buildIdQuery(id));
      await Team.deleteMany({ $or: [{ departmentId: id }, { 'departmentId.customId': id }] });
      // Unbind members & users in MongoDB Atlas without deleting their accounts
      const teamOr = deptTeams.length > 0 ? [{ teamId: { $in: deptTeams } }] : [];
      await Member.updateMany(
        { $or: [{ departmentId: id }, { 'departmentId.customId': id }, ...teamOr] },
        { $set: { departmentId: '', teamId: '' } }
      );
      const userTeamOr = deptTeams.length > 0 ? [{ team: { $in: deptTeams } }] : [];
      await User.updateMany(
        { $or: [{ department: id }, ...userTeamOr] },
        { $set: { department: '', team: '' } }
      );
    } catch (e) {
      console.warn('Mongo deleteDepartment error:', e.message);
    }
  }
  return true;
};

// --- Teams ---
const getTeams = async (departmentId = null) => {
  if (getStatus()) {
    try {
      const filter = departmentId ? { $or: [{ departmentId }, { 'departmentId.customId': departmentId }] } : {};
      const list = await Team.find(filter).lean();
      return list.map(t => ({ ...t, id: t.customId || t._id.toString(), departmentId: t.departmentId ? t.departmentId.toString() : '' }));
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
      const created = await Team.create({
        customId: newTeam.id,
        name: newTeam.name,
        departmentId: newTeam.departmentId,
        description: newTeam.description
      });
      return { ...created.toObject(), id: newTeam.id };
    } catch (e) {
      console.warn('Mongo create error:', e.message);
    }
  }
  return newTeam;
};

const updateTeam = async (id, data) => {
  const index = memoryStore.teams.findIndex(t => t.id === id || t.customId === id);
  if (index !== -1) {
    memoryStore.teams[index] = { ...memoryStore.teams[index], ...data };
    saveStore();
  }

  if (getStatus()) {
    try {
      const updated = await Team.findOneAndUpdate(buildIdQuery(id), data, { new: true }).lean();
      if (updated) return { ...updated, id: updated.customId || updated._id.toString() };
    } catch (e) {
      console.warn('Mongo update error:', e.message);
    }
  }
  return index !== -1 ? memoryStore.teams[index] : null;
};

const deleteTeam = async (id) => {
  // IMPORTANT: Never auto-delete User or Member accounts when deleting a team!
  // Unbind affected members & users so their accounts remain permanently preserved.
  memoryStore.members = (memoryStore.members || []).map(m =>
    m.teamId === id ? { ...m, teamId: '' } : m
  );
  memoryStore.users = (memoryStore.users || []).map(u =>
    u.team === id ? { ...u, team: '' } : u
  );

  memoryStore.teams = memoryStore.teams.filter(t => t.id !== id && t.customId !== id);
  saveStore();

  if (getStatus()) {
    try {
      await Team.findOneAndDelete(buildIdQuery(id));
      await Member.updateMany(
        { $or: [{ teamId: id }, { 'teamId.customId': id }] },
        { $set: { teamId: '' } }
      );
      await User.updateMany(
        { team: id },
        { $set: { team: '' } }
      );
    } catch (e) {
      console.warn('Mongo deleteTeam error:', e.message);
    }
  }
  return true;
};

// --- Members ---
const getMembers = async (teamId = null, departmentId = null) => {
  if (getStatus()) {
    try {
      const filter = {};
      if (teamId) filter.$or = [{ teamId }, { 'teamId.customId': teamId }];
      if (departmentId) filter.$or = [{ departmentId }, { 'departmentId.customId': departmentId }];
      const list = await Member.find(filter).lean();
      return list
        .filter(m => m && !isBannedEmail(m.email) && m.name && m.email && String(m.name).trim() !== '' && String(m.email).trim() !== '')
        .map(m => ({
          ...m,
          id: m.customId || m._id.toString(),
          name: (m.name || 'Team Member').trim(),
          email: (m.email || '').trim().toLowerCase(),
          phone: (m.phone || '').trim(),
          role: m.role || 'Developer',
          assignedWork: m.assignedWork || '',
          avatar: m.avatar || (m.name ? String(m.name).trim().charAt(0).toUpperCase() : 'M')
        }));
    } catch (e) {
      console.warn('Mongo read error:', e.message);
    }
  }
  let res = memoryStore.members || [];
  res = res.filter(m => m && !isBannedEmail(m.email) && m.name && m.email && String(m.name).trim() !== '' && String(m.email).trim() !== '');
  if (teamId) res = res.filter(m => m.teamId === teamId);
  else if (departmentId) res = res.filter(m => m.departmentId === departmentId);
  return res.map(m => ({
    ...m,
    id: m.id || m.customId || generateId('mem'),
    name: (m.name || 'Team Member').trim(),
    email: (m.email || '').trim().toLowerCase(),
    phone: (m.phone || '').trim(),
    role: m.role || 'Developer',
    assignedWork: m.assignedWork || '',
    avatar: m.avatar || (m.name ? String(m.name).trim().charAt(0).toUpperCase() : 'M')
  }));
};

const createMember = async (data) => {
  const cleanEmail = (data.email || '').trim().toLowerCase();
  if (!cleanEmail) {
    throw new Error('Email is required');
  }

  if (isBannedEmail(cleanEmail)) {
    throw new Error('This email address cannot be used');
  }

  // Prevent duplicate team member registrations with identical email
  const existingMember = (memoryStore.members || []).find(m => (m.email || '').toLowerCase() === cleanEmail);
  if (existingMember) {
    throw new Error('A team member with this email already exists');
  }

  if (getStatus()) {
    try {
      const dbMember = await Member.findOne({ email: cleanEmail }).lean();
      if (dbMember) {
        throw new Error('A team member with this email already exists');
      }
    } catch (e) {
      if (e.message && e.message.includes('already exists')) throw e;
    }
  }

  const newMember = {
    id: generateId('mem'),
    name: (data.name || '').trim(),
    email: cleanEmail,
    phone: (data.phone || '').trim(),
    role: data.role || 'Developer',
    assignedWork: data.assignedWork || '',
    teamId: data.teamId,
    departmentId: data.departmentId,
    avatar: ((data.name || 'U').trim().charAt(0) || 'U').toUpperCase()
  };
  memoryStore.members.push(newMember);

  // If this email was previously marked as deleted, re-entry by admin verifies and restores it to valid
  unmarkDeletedEmail(cleanEmail);

  const isMgr = isManagerOrAdmin(null, { role: data.role });
  const assignedRole = isMgr ? 'admin' : 'user';

  let existingUser = (memoryStore.users || []).find(u => (u.email || '').toLowerCase() === cleanEmail);
  if (!existingUser) {
    existingUser = {
      id: generateId('usr'),
      name: newMember.name,
      email: cleanEmail,
      password: '',
      hasPassword: false,
      role: assignedRole,
      memberId: newMember.id,
      department: data.departmentId || '',
      team: data.teamId || '',
      teamRole: data.role || (isMgr ? 'Manager' : 'Team Member'),
      avatar: newMember.avatar,
      title: data.role || (isMgr ? 'Manager' : 'Team Member')
    };
    memoryStore.users.push(existingUser);
  } else {
    existingUser.memberId = newMember.id;
    existingUser.role = assignedRole;
    existingUser.teamRole = data.role || existingUser.teamRole || (isMgr ? 'Manager' : 'Team Member');
    existingUser.title = data.role || existingUser.title || (isMgr ? 'Manager' : 'Team Member');
    if (data.departmentId) existingUser.department = data.departmentId;
    if (data.teamId) existingUser.team = data.teamId;
  }
  saveStore();

  if (getStatus()) {
    try {
      const created = await Member.create({
        customId: newMember.id,
        name: newMember.name,
        email: cleanEmail,
        phone: newMember.phone,
        role: newMember.role,
        assignedWork: newMember.assignedWork,
        teamId: newMember.teamId,
        departmentId: newMember.departmentId,
        avatar: newMember.avatar
      });
      await User.findOneAndUpdate(
        { email: cleanEmail },
        {
          $setOnInsert: {
            customId: existingUser.id,
            name: newMember.name,
            email: cleanEmail,
            password: '',
            hasPassword: false,
            avatar: newMember.avatar
          },
          $set: {
            role: assignedRole,
            memberId: newMember.id,
            department: data.departmentId || '',
            team: data.teamId || '',
            teamRole: data.role || (isMgr ? 'Manager' : 'Team Member'),
            title: data.role || (isMgr ? 'Manager' : 'Team Member')
          }
        },
        { upsert: true, new: true }
      );
      return { ...created.toObject(), id: newMember.id };
    } catch (e) {
      console.warn('Mongo create member error:', e.message);
    }
  }
  return newMember;
};

const updateMember = async (id, data) => {
  if (data && data.email) {
    const cleanEmail = (data.email || '').trim().toLowerCase();
    const duplicate = (memoryStore.members || []).find(m => m.id !== id && m.customId !== id && (m.email || '').toLowerCase() === cleanEmail);
    if (duplicate) {
      throw new Error('Another team member is already registered with this email address');
    }
    unmarkDeletedEmail(cleanEmail);
    data.email = cleanEmail;
  }
  const index = memoryStore.members.findIndex(m => m.id === id || m.customId === id);
  if (index !== -1) {
    memoryStore.members[index] = { ...memoryStore.members[index], ...data };
    saveStore();
  }

  // If role is updated, synchronize user role and hierarchy permissions
  if (data && data.role) {
    const isMgr = isManagerOrAdmin(null, { role: data.role });
    const assignedRole = isMgr ? 'admin' : 'user';
    const targetMember = index !== -1 ? memoryStore.members[index] : null;
    const cleanEmail = ((data.email || targetMember?.email) || '').trim().toLowerCase();
    const targetUser = (memoryStore.users || []).find(u =>
      (cleanEmail && (u.email || '').toLowerCase() === cleanEmail) ||
      u.memberId === id
    );
    if (targetUser) {
      targetUser.role = assignedRole;
      targetUser.teamRole = data.role;
      targetUser.title = data.role;
      saveStore();
    }
  }

  if (getStatus()) {
    try {
      const updated = await Member.findOneAndUpdate(buildIdQuery(id), data, { new: true }).lean();
      if (data && data.role) {
        const isMgr = isManagerOrAdmin(null, { role: data.role });
        const assignedRole = isMgr ? 'admin' : 'user';
        const cleanEmail = (data.email || updated?.email || '').trim().toLowerCase();
        await User.updateMany(
          { $or: [{ memberId: id }, cleanEmail ? { email: cleanEmail } : null].filter(Boolean) },
          { $set: { role: assignedRole, teamRole: data.role, title: data.role } }
        ).catch(() => { });
      }
      if (updated) return { ...updated, id: updated.customId || updated._id.toString() };
    } catch (e) {
      console.warn('Mongo update member error:', e.message);
    }
  }
  return index !== -1 ? memoryStore.members[index] : null;
};

const deleteMember = async (id) => {
  const member = memoryStore.members.find(m => m.id === id);
  let deletedUser = null;
  const targetEmail = (member ? member.email : '').toLowerCase();

  if (targetEmail) {
    markDeletedEmail(targetEmail);
  }

  if (member) {
    deletedUser = (memoryStore.users || []).find(u => u.email.toLowerCase() === targetEmail) || null;
    memoryStore.users = (memoryStore.users || []).filter(u => u.email.toLowerCase() !== targetEmail);
  }
  memoryStore.members = (memoryStore.members || []).filter(m => m.id !== id && (!m.email || m.email.toLowerCase() !== targetEmail));
  memoryStore.assignments = (memoryStore.assignments || []).filter(a => a.memberId !== id && a.assigneeId !== id && (!a.assigneeEmail || a.assigneeEmail.toLowerCase() !== targetEmail));

  // Clean up user workspace assigned work so deleted member's work is purged immediately
  if (memoryStore.userWorkspace && memoryStore.userWorkspace.assignedWork) {
    memoryStore.userWorkspace.assignedWork = memoryStore.userWorkspace.assignedWork.filter(w => {
      if (deletedUser && w.userId === deletedUser.id) return false;
      if (w.memberId === id) return false;
      if (targetEmail && w.assigneeEmail && w.assigneeEmail.toLowerCase() === targetEmail) return false;
      return true;
    });
  }
  saveStore();

  if (getStatus()) {
    try {
      const mongoose = require('mongoose');
      if (targetEmail) {
        await User.deleteMany({ email: targetEmail }).catch(() => { });
        await Member.deleteMany({ email: targetEmail }).catch(() => { });
      }
      if (mongoose.Types.ObjectId.isValid(id)) {
        await Member.findByIdAndDelete(id).catch(() => { });
      } else {
        await Member.deleteMany({ customId: id }).catch(() => { });
      }
      await Assignment.deleteMany({ $or: [{ memberId: id }, { assigneeId: id }] }).catch(() => { });
      if (deletedUser) {
        await UserTask.deleteMany({ userId: deletedUser.id }).catch(() => { });
      }
    } catch (e) {
      console.warn('Mongo delete error:', e.message);
    }
  }
  return { success: true, member, deletedUser };
};

// --- Assignments (4 Formats: user_to_user, admin_to_admin, user_to_admin, admin_to_user) ---
const getAssignments = async (filter = null) => {
  let query = {};
  if (filter && typeof filter === 'object') {
    if (filter.teamId) query.teamId = filter.teamId;
    if (filter.assignerId) query.assignerId = filter.assignerId;
    if (filter.assigneeId) query.assigneeId = filter.assigneeId;
    if (filter.type) query.assignmentType = filter.type;
  } else if (typeof filter === 'string') {
    query.teamId = filter;
  }

  if (getStatus()) {
    try {
      const list = await Assignment.find(query).sort({ createdAt: -1 }).lean();
      return list.map(a => ({ ...a, id: a._id.toString() }));
    } catch (e) {
      console.warn('Mongo read error:', e.message);
    }
  }

  let res = memoryStore.assignments || [];
  if (query.teamId) res = res.filter(a => a.teamId === query.teamId);
  if (query.assignerId) res = res.filter(a => a.assignerId === query.assignerId);
  if (query.assigneeId) res = res.filter(a => a.assigneeId === query.assigneeId);
  if (query.assignmentType) res = res.filter(a => a.assignmentType === query.assignmentType);
  return res;
};

const createAssignment = async (data) => {
  // 1. Determine Assigner & Assignee Roles
  const isSelf = data.assignmentType === 'user_to_self';
  const assignerRole = data.assignerRole || (data.assignerId?.includes('admin') ? 'admin' : (isSelf ? 'user' : 'admin'));
  const assigneeRole = data.assigneeRole || (isSelf ? 'user' : (data.role?.toLowerCase()?.includes('admin') ? 'admin' : 'user'));

  // Format: 'admin_to_user' | 'admin_to_admin' | 'user_to_admin' | 'user_to_user' | 'user_to_self'
  let assignmentType = data.assignmentType;
  if (!assignmentType) {
    assignmentType = isSelf ? 'user_to_self' : `${assignerRole}_to_${assigneeRole}`;
  }

  // 2. Resolve Assigner info
  let assignerName = data.assignerName || '';
  if (!assignerName) {
    const foundUser = (memoryStore.users || []).find(u => u.id === data.assignerId || (data.assignerEmail && u.email && u.email.toLowerCase() === data.assignerEmail.toLowerCase()));
    assignerName = foundUser ? foundUser.name : (assignerRole === 'admin' ? 'Admin' : 'Team Member');
  }

  // 3. Resolve Assignee info
  let assigneeName = data.assigneeName || (isSelf ? assignerName : '');
  let assigneeEmail = data.assigneeEmail || (isSelf ? data.assignerEmail : '');
  let targetUserId = data.assigneeId || (isSelf ? data.assignerId : (data.memberId || ''));
  let member = null;
  let dbMember = null;
  let dbTeam = null;

  if (data.memberId) {
    member = (memoryStore.members || []).find(m => m.id === data.memberId || m.id === data.memberId?.toString());
    if (member) {
      if (!assigneeName) assigneeName = member.name;
      if (!assigneeEmail) assigneeEmail = member.email;
      member.assignedWork = data.workTitle;
    }
  }

  if (data.assigneeId) {
    const foundUser = (memoryStore.users || []).find(u => u.id === data.assigneeId || (data.assigneeEmail && u.email && u.email.toLowerCase() === data.assigneeEmail.toLowerCase()));
    if (foundUser) {
      if (!assigneeName) assigneeName = foundUser.name;
      if (!assigneeEmail) assigneeEmail = foundUser.email;
      targetUserId = foundUser.id;
    }
  }

  if (getStatus()) {
    try {
      if (data.memberId) dbMember = await Member.findById(data.memberId).lean();
      if (data.teamId && data.teamId !== 'general') dbTeam = await Team.findById(data.teamId).lean();
    } catch (e) {
      // ignore
    }
  }

  if (dbMember) {
    if (!assigneeName) assigneeName = dbMember.name;
    if (!assigneeEmail) assigneeEmail = dbMember.email;
  }

  const team = (memoryStore.teams || []).find(t => t.id === data.teamId || t.id === data.teamId?.toString());
  const dept = team ? (memoryStore.departments || []).find(d => d.id === team.departmentId) : null;
  const deptName = data.departmentName || (dept && dept.name) || 'General';
  const teamName = data.teamName || (dbTeam && dbTeam.name) || (team ? team.name : (assigneeRole === 'admin' ? 'Admin Team' : 'Team'));

  const assignedByLabel = isSelf
    ? `Self (${assignerName})`
    : `${assignerRole === 'admin' ? 'Admin' : 'Team Member'} (${assignerName})`;

  const newAssign = {
    id: generateId('assign'),
    memberId: data.memberId || targetUserId,
    teamId: data.teamId || 'general',
    departmentId: data.departmentId || '',
    workTitle: data.workTitle,
    workDescription: data.workDescription || '',
    role: data.role || (assigneeRole === 'admin' ? 'Administrator' : 'Developer'),
    priority: data.priority || 'Medium',
    dueDate: data.dueDate || new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
    status: data.status || 'In Progress',
    // 4 Formats metadata
    assignerId: data.assignerId || '',
    assignerName: assignerName,
    assignerRole: assignerRole,
    assignerEmail: data.assignerEmail || '',
    assigneeId: targetUserId,
    assigneeName: assigneeName || 'Assignee',
    assigneeRole: assigneeRole,
    assigneeEmail: assigneeEmail,
    assignmentType: assignmentType,
    createdAt: new Date().toISOString()
  };

  memoryStore.assignments.unshift(newAssign);

  // 4. Automatically create Task in Today's Tasks
  const todayDate = new Date().toISOString().split('T')[0];
  const newTask = {
    id: generateId('task'),
    teamId: data.teamId || 'general',
    assignmentId: newAssign.id,
    memberId: targetUserId,
    memberName: assigneeName || (assigneeRole === 'admin' ? 'Admin' : 'Team Member'),
    title: data.workTitle,
    priority: data.priority || 'Medium',
    completed: false,
    date: todayDate,
    assignedBy: assignedByLabel,
    assignerRole: assignerRole,
    assignmentType: assignmentType
  };
  memoryStore.tasks.unshift(newTask);

  // 5. Synchronize into User Workspace (available for both Users and Admins)
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
    department: deptName,
    team: teamName,
    priority: data.priority || 'High',
    dueDate: data.dueDate || 'Today',
    status: data.status || 'In Progress',
    assignedBy: assignedByLabel,
    assignerRole: assignerRole,
    assignerId: data.assignerId || '',
    assignmentType: assignmentType,
    assignedOn: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
    assignedTime: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    assignedAt: new Date().toISOString(),
    workStartedAt: (data.status === 'In Progress' || !data.status) ? new Date().toISOString() : undefined,
    workStartedTime: (data.status === 'In Progress' || !data.status) ? new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : undefined,
    description: data.workDescription || '',
    progress: 0,
    comments: [],
    userId: targetUserId || (dbMember ? dbMember._id.toString() : 'usr-user'),
    assigneeId: targetUserId || '',
    assigneeEmail: assigneeEmail || '',
    assigneeName: assigneeName || 'Assignee',
    assignedTo: assigneeName || 'Assignee',
    teamId: data.teamId || '',
    departmentId: data.departmentId || ''
  };
  memoryStore.userWorkspace.assignedWork.unshift(userTask);
  saveStore();

  // 6. Send Notification to Recipient
  const notifTitle = assignmentType === 'user_to_self'
    ? 'Self Assigned Task'
    : assignmentType === 'user_to_admin'
      ? 'Work Request from Team Member'
      : assignmentType === 'admin_to_admin'
        ? 'Work Delegated by Admin'
        : assignmentType === 'user_to_user'
          ? 'Work Assigned by Teammate'
          : 'New Work Assigned';

  const notifMsg = assignmentType === 'user_to_self'
    ? `Task "${data.workTitle}" was self-assigned in your workspace.`
    : `${assignerName} (${assignerRole === 'admin' ? 'Admin' : 'Team Member'}) assigned: "${data.workTitle}" to you.`;

  createNotification({
    recipientRole: assigneeRole,
    recipientUserId: targetUserId,
    title: notifTitle,
    message: notifMsg,
    link: assigneeRole === 'admin' ? 'tasks' : 'assigned-work'
  });

  // 6b. Automatically trigger WhatsApp notifications for Assigned Work (fail-safe)
  try {
    const wppService = require('../services/wppService');
    const assignerMember = (memoryStore.members || []).find(m => m.id === data.assignerId || m.userId === data.assignerId || m.email === data.assignerEmail);
    const assigneeMember = (memoryStore.members || []).find(m => m.id === targetUserId || m.userId === targetUserId || m.email === assigneeEmail);
    const senderPhone = data.assignerPhone || (assignerMember && assignerMember.phone) || '';
    const receiverPhone = data.assigneePhone || (assigneeMember && assigneeMember.phone) || '';

    if (senderPhone || receiverPhone) {
      wppService.sendWorkRequestNotifications({
        formType: 'Work Assignment',
        referenceId: newAssign.id,
        senderName: assignerName,
        senderNumber: senderPhone,
        receiverName: assigneeName || 'Team Member',
        receiverNumber: receiverPhone,
        agreedToNotifications: true
      }).catch(err => console.warn('[WPPConnect] Assignment notification warning:', err.message));
    }
  } catch (wppErr) {
    console.warn('[WPPConnect] Error calling wppService for assignment:', wppErr.message);
  }

  // 7. Persist into MongoDB Atlas if connected
  if (getStatus()) {
    try {
      const createdAssign = await Assignment.create({
        ...newAssign,
        customId: newAssign.id
      });
      const createdTask = await Task.create({
        customId: newTask.id,
        teamId: data.teamId || 'general',
        assignmentId: newAssign.id,
        memberId: targetUserId,
        memberName: assigneeName || (assigneeRole === 'admin' ? 'Admin' : 'Team Member'),
        title: data.workTitle,
        priority: data.priority || 'Medium',
        completed: false,
        date: todayDate,
        assignedBy: assignedByLabel,
        assignerRole: assignerRole,
        assignmentType: assignmentType
      });
      newTask.id = createdTask.customId || createdTask._id.toString();

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
        assignerRole: userTask.assignerRole,
        assignerId: userTask.assignerId,
        assignmentType: userTask.assignmentType,
        assignedOn: userTask.assignedOn,
        description: userTask.description,
        progress: 0,
        comments: [],
        userId: userTask.userId,
        assigneeId: userTask.assigneeId,
        assigneeEmail: userTask.assigneeEmail,
        assigneeName: userTask.assigneeName,
        teamId: userTask.teamId,
        departmentId: userTask.departmentId
      });

      return { ...createdAssign.toObject(), id: createdAssign._id.toString() };
    } catch (e) {
      console.warn('Mongo assignment error:', e.message);
    }
  }

  return newAssign;
};

const deleteAssignment = async (id) => {
  const userTask = (memoryStore.userWorkspace?.assignedWork || []).find(w => w.id === id || w.customId === id || w.taskId === id);
  const assign = (memoryStore.assignments || []).find(a =>
    a.id === id || a.customId === id || (userTask && (a.workTitle === userTask.title || a.id === userTask.taskId || a.id === userTask.assignmentId))
  );

  const targetIds = [id];
  if (assign) {
    if (assign.id) targetIds.push(assign.id);
    if (assign.customId) targetIds.push(assign.customId);
  }
  if (userTask) {
    if (userTask.id) targetIds.push(userTask.id);
    if (userTask.customId) targetIds.push(userTask.customId);
    if (userTask.taskId) targetIds.push(userTask.taskId);
    if (userTask.assignmentId) targetIds.push(userTask.assignmentId);
  }

  memoryStore.assignments = (memoryStore.assignments || []).filter(a =>
    !targetIds.includes(a.id) && !targetIds.includes(a.customId) && (!userTask || a.workTitle !== userTask.title)
  );

  memoryStore.tasks = (memoryStore.tasks || []).filter(t =>
    !targetIds.includes(t.id) && !targetIds.includes(t.customId) && !targetIds.includes(t.assignmentId) && (!assign || t.title !== assign.workTitle) && (!userTask || t.title !== userTask.title)
  );

  if (memoryStore.userWorkspace && memoryStore.userWorkspace.assignedWork) {
    memoryStore.userWorkspace.assignedWork = memoryStore.userWorkspace.assignedWork.filter(w =>
      !targetIds.includes(w.id) && !targetIds.includes(w.customId) && !targetIds.includes(w.taskId) && !targetIds.includes(w.assignmentId) && (!assign || w.title !== assign.workTitle)
    );
  }

  // Also remove from today's workDone if it was logged
  if (memoryStore.workDone) {
    memoryStore.workDone = memoryStore.workDone.filter(wd =>
      !targetIds.includes(wd.taskId) && (!userTask || wd.title !== userTask.title)
    );
  }

  saveStore();

  if (getStatus()) {
    try {
      await Assignment.deleteMany({
        $or: [
          { customId: { $in: targetIds } },
          { _id: { $in: targetIds.filter(x => mongoose.Types.ObjectId.isValid(x)) } },
          ...(userTask ? [{ workTitle: userTask.title }] : [])
        ]
      });
      await Task.deleteMany({
        $or: [
          { customId: { $in: targetIds } },
          { assignmentId: { $in: targetIds } },
          { _id: { $in: targetIds.filter(x => mongoose.Types.ObjectId.isValid(x)) } }
        ]
      });
      await UserTask.deleteMany({
        $or: [
          { customId: { $in: targetIds } },
          { taskId: { $in: targetIds } },
          { assignmentId: { $in: targetIds } },
          { _id: { $in: targetIds.filter(x => mongoose.Types.ObjectId.isValid(x)) } },
          ...(assign ? [{ title: assign.workTitle }] : [])
        ]
      });
    } catch (e) {
      console.warn('Mongo delete error:', e.message);
    }
  }
  return { success: true, id };
};

// --- Tasks ---
const getTasks = async (teamId = null) => {
  if (getStatus()) {
    try {
      const filter = teamId ? { $or: [{ teamId }, { 'teamId.customId': teamId }] } : {};
      const list = await Task.find(filter).lean();
      return list.map(t => ({ ...t, id: t.customId || t._id.toString() }));
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
      const created = await Task.create({
        ...data,
        customId: newTask.id
      });
      return { ...created.toObject(), id: newTask.id };
    } catch (e) {
      console.warn('Mongo create error:', e.message);
    }
  }
  return newTask;
};

const updateTask = async (id, data) => {
  const index = memoryStore.tasks.findIndex(t => t.id === id || t.customId === id);
  if (index !== -1) {
    memoryStore.tasks[index] = { ...memoryStore.tasks[index], ...data };
    saveStore();
  }

  if (getStatus()) {
    try {
      const updated = await Task.findOneAndUpdate(buildIdQuery(id), data, { new: true }).lean();
      if (updated) return { ...updated, id: updated.customId || updated._id.toString() };
    } catch (e) {
      console.warn('Mongo update error:', e.message);
    }
  }
  return index !== -1 ? memoryStore.tasks[index] : null;
};

const toggleTask = async (id) => {
  const index = memoryStore.tasks.findIndex(t => t.id === id || t.customId === id);
  if (index !== -1) {
    memoryStore.tasks[index].completed = !memoryStore.tasks[index].completed;
    saveStore();
  }

  if (getStatus()) {
    try {
      const task = await Task.findOne(buildIdQuery(id));
      if (task) {
        task.completed = !task.completed;
        await task.save();
        return { ...task.toObject(), id: task.customId || task._id.toString() };
      }
    } catch (e) {
      console.warn('Mongo toggle error:', e.message);
    }
  }
  return index !== -1 ? memoryStore.tasks[index] : null;
};

const deleteTask = async (id) => {
  const t = (memoryStore.tasks || []).find(x => x.id === id || x.customId === id);
  memoryStore.tasks = (memoryStore.tasks || []).filter(x => x.id !== id && x.customId !== id);

  // Synchronously purge from user workspace assigned work
  if (memoryStore.userWorkspace && memoryStore.userWorkspace.assignedWork) {
    memoryStore.userWorkspace.assignedWork = memoryStore.userWorkspace.assignedWork.filter(w =>
      w.id !== id && w.customId !== id && w.taskId !== id && (!t || w.title !== t.title)
    );
  }
  memoryStore.assignments = (memoryStore.assignments || []).filter(a => a.id !== id && a.customId !== id && (!t || a.workTitle !== t.title));
  saveStore();

  if (getStatus()) {
    try {
      await Task.findOneAndDelete(buildIdQuery(id));
      await UserTask.deleteMany({ $or: [{ customId: id }, { taskId: id }] });
    } catch (e) {
      console.warn('Mongo delete error:', e.message);
    }
  }
  return { success: true, id };
};

// --- Work Done ---
const getWorkDone = async (teamId = null) => {
  if (getStatus()) {
    try {
      const filter = teamId ? { $or: [{ teamId }, { 'teamId.customId': teamId }] } : {};
      const list = await WorkDone.find(filter).lean();
      return list.map(w => ({ ...w, id: w.customId || w._id.toString() }));
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

// --- User Portal Workspace (Dynamic Multi-Team Isolation & Manager Access) ---
const getUserWorkspace = async (userId = null, userEmail = null) => {
  let assigned = [];
  let history = [];
  let recentActivities = [];

  const cleanEmail = (userEmail || '').trim().toLowerCase();
  const cleanId = (userId || '').trim();

  // 1. Resolve User and Member info to identify team and manager privileges
  let user = (memoryStore.users || []).find(u =>
    (cleanEmail && u.email && u.email.toLowerCase() === cleanEmail) ||
    (cleanId && (u.id === cleanId || u.customId === cleanId || String(u._id) === cleanId))
  );
  let member = (memoryStore.members || []).find(m =>
    (cleanEmail && m.email && m.email.toLowerCase() === cleanEmail) ||
    (cleanId && (m.id === cleanId || m.customId === cleanId || String(m._id) === cleanId)) ||
    (user?.memberId && (m.id === user.memberId || m.customId === user.memberId))
  );

  if (getStatus()) {
    try {
      if (!user && cleanEmail) user = await User.findOne({ email: cleanEmail }).lean();
      if (!user && cleanId) user = await User.findOne(buildIdQuery(cleanId)).lean();
      if (!member && cleanEmail) member = await Member.findOne({ email: cleanEmail }).lean();
      if (!member && cleanId) member = await Member.findOne(buildIdQuery(cleanId)).lean();
    } catch (_) { }
  }

  // Check if requesting user is Manager or Administrator
  const isManager = isManagerOrAdmin(user, member);
  const cleanName = (user?.name || member?.name || '').trim();

  const userTeamId = member?.teamId || user?.teamId || user?.team || '';
  let userTeamName = (user?.team || '').trim();
  if (userTeamId && (!userTeamName || userTeamName === userTeamId)) {
    const foundTeam = (memoryStore.teams || []).find(t => t.id === userTeamId || t.customId === userTeamId || String(t._id) === userTeamId);
    if (foundTeam) userTeamName = foundTeam.name;
  }

  if (getStatus()) {
    try {
      let taskQuery = {};
      let historyQuery = {};

      if (!isManager) {
        // Regular team member: ONLY see tasks directly assigned to this particular user
        const orConditions = [];
        if (cleanId) {
          orConditions.push({ userId: cleanId });
          orConditions.push({ assigneeId: cleanId });
          orConditions.push({ memberId: cleanId });
        }
        if (cleanEmail) {
          orConditions.push({ assigneeEmail: cleanEmail });
        }
        if (cleanName) {
          orConditions.push({ assigneeName: { $regex: new RegExp(`^${cleanName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } });
          orConditions.push({ assignedTo: { $regex: new RegExp(`^${cleanName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } });
        }
        taskQuery = orConditions.length > 0 ? { $or: orConditions } : { _id: null };

        const histOr = [];
        if (cleanId) {
          histOr.push({ userId: cleanId });
          histOr.push({ memberId: cleanId });
        }
        if (cleanEmail) {
          histOr.push({ userEmail: cleanEmail });
        }
        if (cleanName) {
          histOr.push({ userName: { $regex: new RegExp(`^${cleanName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } });
        }
        historyQuery = histOr.length > 0 ? { $or: histOr } : { _id: null };
      }
      // If isManager is true: taskQuery is {}, so manager sees all teams' member works!

      const dbTasks = await UserTask.find(taskQuery).sort({ createdAt: -1 }).lean();
      const dbHistory = await WorkHistory.find(historyQuery).sort({ createdAt: -1 }).lean();
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
    const rawAssigned = memoryStore.userWorkspace.assignedWork || [];
    const rawHistory = memoryStore.userWorkspace.history || [];
    const rawActivities = memoryStore.userWorkspace.recentActivities || [];

    if (isManager) {
      assigned = rawAssigned;
      history = rawHistory;
      recentActivities = rawActivities;
    } else {
      assigned = rawAssigned.filter(a => {
        // Direct assignment to this particular user
        if (cleanId && (a.userId === cleanId || a.assigneeId === cleanId || a.memberId === cleanId)) return true;
        if (cleanEmail && a.assigneeEmail && a.assigneeEmail.toLowerCase() === cleanEmail) return true;
        if (cleanName) {
          const aName = (a.assigneeName || a.assignedTo || '').toLowerCase();
          if (aName === cleanName.toLowerCase() || aName.includes(cleanName.toLowerCase())) return true;
        }
        return false;
      });
      history = rawHistory.filter(h => {
        if (cleanId && (h.userId === cleanId || h.memberId === cleanId)) return true;
        if (cleanEmail && h.userEmail && h.userEmail.toLowerCase() === cleanEmail) return true;
        if (cleanName) {
          const uName = (h.userName || '').toLowerCase();
          if (uName === cleanName.toLowerCase() || uName.includes(cleanName.toLowerCase())) return true;
        }
        return false;
      });
      recentActivities = rawActivities.filter(r => !cleanId || r.userId === cleanId);
    }
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

  const now = new Date();
  const formattedDate = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const formattedTime = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  const fullDateTime = `${formattedDate}, ${formattedTime}`;

  const taskIndex = ws.assignedWork.findIndex(t => t.id === taskId || t.taskId === taskId || String(t._id) === taskId);
  let task = taskIndex >= 0 ? ws.assignedWork[taskIndex] : null;

  // If not found in memoryStore, try fetching from MongoDB Atlas
  if (!task && getStatus()) {
    try {
      const dbTask = await UserTask.findOne({
        $or: [
          { customId: taskId },
          { taskId: taskId },
          ...(mongoose.Types.ObjectId.isValid(taskId) ? [{ _id: taskId }] : [])
        ]
      }).lean();
      if (dbTask) {
        task = { ...dbTask, id: dbTask.customId || dbTask._id.toString() };
        ws.assignedWork.unshift(task);
      }
    } catch (_) { }
  }

  if (task) {
    task.status = workStatus === 'Completed' ? 'Completed' : 'Under Review';
    task.progress = 100;
    task.submittedAt = now.toISOString();
    task.submittedDate = fullDateTime;
    task.submittedTime = formattedTime;
    if (workStatus === 'Completed') {
      task.completedAt = now.toISOString();
      task.completedDate = fullDateTime;
      task.completedTime = formattedTime;
    }
    if (!task.comments) task.comments = [];
    task.comments.push({
      id: generateId('c'),
      author: (task && (task.assigneeName || task.userName)) || 'Team Member',
      role: 'Team Member',
      date: fullDateTime,
      badge: 'Submission',
      text: comment || 'Work deliverables submitted for review.'
    });

    if (!task.activityLog) task.activityLog = [];
    task.activityLog.push({
      id: generateId('act'),
      type: 'deliverable_submitted',
      performedBy: (task && (task.assigneeName || task.userName)) || 'Team Member',
      performedByRole: 'Team Member',
      performedById: userId || (task && task.userId),
      timestamp: now,
      details: { comment: comment || 'Work deliverables submitted for review.', status: task.status, submittedDate: fullDateTime },
      message: `Submitted deliverables for review at ${fullDateTime}`
    });
  }

  const newHistoryItem = {
    id: generateId('h'),
    title: task ? task.title : 'Submitted Work',
    taskId: task && task.taskId ? task.taskId : `TSK-${Date.now().toString().slice(-4)}`,
    department: task ? task.department : 'General',
    team: task ? task.team : 'Team',
    submittedDate: fullDateTime,
    status: workStatus === 'Completed' ? 'Completed' : 'Under Review',
    reviewerFeedback: workStatus === 'Completed' ? 'Work completed and verified.' : 'Submitted. Pending review by Admin / Team Lead.',
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
        completedBy: (task && (task.assigneeName || task.userName)) || 'Team Member',
        date: new Date().toISOString().split('T')[0],
        time: formattedTime,
        submittedTime: formattedTime,
        submittedDate: fullDateTime,
        submittedAt: now.toISOString()
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
          { $or: [{ customId: taskId }, { taskId: taskId }, ...(mongoose.Types.ObjectId.isValid(taskId) ? [{ _id: taskId }] : [])] },
          {
            status: task.status,
            progress: 100,
            submittedAt: task.submittedAt,
            submittedDate: task.submittedDate,
            submittedTime: task.submittedTime,
            completedAt: task.completedAt,
            completedDate: task.completedDate,
            completedTime: task.completedTime,
            comments: task.comments,
            activityLog: task.activityLog
          }
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

  // Reject permanently deleted users (if re-entered by admin, isEmailDeleted automatically restores to valid)
  if (await isEmailDeleted(cleanEmail)) {
    return {
      exists: false,
      error: 'This account has been deleted by an administrator. Access revoked.'
    };
  }

  // 1. Check MongoDB Atlas first if connected
  if (getStatus()) {
    try {
      const dbUser = await User.findOne({ email: cleanEmail }).lean();
      if (dbUser) {
        const isMgr = isManagerOrAdmin(dbUser);
        return {
          exists: true,
          hasPassword: Boolean(dbUser.hasPassword && dbUser.password),
          name: dbUser.name,
          role: isMgr ? 'admin' : (dbUser.role || 'user')
        };
      }
      const dbMember = await Member.findOne({ email: cleanEmail }).lean();
      if (dbMember) {
        const isMgr = isManagerOrAdmin(null, dbMember);
        return {
          exists: true,
          hasPassword: false,
          name: dbMember.name,
          role: isMgr ? 'admin' : 'user'
        };
      }
    } catch (e) {
      console.warn('Mongo checkEmail error:', e.message);
    }
  }

  // 2. Check memoryStore
  const user = (memoryStore.users || []).find(u => u.email.toLowerCase() === cleanEmail);
  if (user) {
    const isMgr = isManagerOrAdmin(user);
    return {
      exists: true,
      hasPassword: Boolean(user.hasPassword && user.password),
      name: user.name,
      role: isMgr ? 'admin' : (user.role || 'user')
    };
  }

  const member = (memoryStore.members || []).find(m => m.email.toLowerCase() === cleanEmail);
  if (member) {
    const isMgr = isManagerOrAdmin(null, member);
    return {
      exists: true,
      hasPassword: false,
      name: member.name,
      role: isMgr ? 'admin' : 'user'
    };
  }

  return {
    exists: false,
    error: 'Your email is invalid or not registered by Admin.'
  };
};

// --- Verify Receiver Email against Registered Users (For Work Requests: Meeting, Event, General Info) ---
const verifyReceiverEmail = async (email) => {
  const cleanEmail = (email || '').trim().toLowerCase();
  if (!cleanEmail) {
    return {
      exists: false,
      error: 'Invalid receiver email. Enter the email address of a registered user.'
    };
  }

  // Reject permanently deleted users
  if (memoryStore.deletedEmails && memoryStore.deletedEmails.includes(cleanEmail)) {
    return {
      exists: false,
      error: 'Invalid receiver email. Enter the email address of a registered user.'
    };
  }

  // 1. Check MongoDB Atlas if connected
  if (getStatus()) {
    try {
      const dbUser = await User.findOne({ email: cleanEmail }).lean();
      if (dbUser) {
        return {
          exists: true,
          user: {
            id: dbUser.customId || dbUser._id.toString(),
            userId: dbUser.customId || dbUser._id.toString(),
            name: dbUser.name,
            email: dbUser.email,
            role: dbUser.role,
            phone: dbUser.phone || ''
          }
        };
      }
      const dbMember = await Member.findOne({ email: cleanEmail }).lean();
      if (dbMember) {
        return {
          exists: true,
          user: {
            id: dbMember.customId || dbMember._id.toString(),
            userId: dbMember.customId || dbMember._id.toString(),
            name: dbMember.name,
            email: dbMember.email,
            role: dbMember.role || 'user',
            phone: dbMember.phone || ''
          }
        };
      }
    } catch (e) {
      console.warn('Mongo verifyReceiverEmail warning:', e.message);
    }
  }

  // 2. Check memoryStore.users
  const user = (memoryStore.users || []).find(u => (u.email || '').toLowerCase() === cleanEmail);
  if (user) {
    return {
      exists: true,
      user: {
        id: user.id || user.customId,
        userId: user.id || user.customId,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone || ''
      }
    };
  }

  // 3. Check memoryStore.members
  const member = (memoryStore.members || []).find(m => (m.email || '').toLowerCase() === cleanEmail);
  if (member) {
    return {
      exists: true,
      user: {
        id: member.id || member.customId || member._id,
        userId: member.id || member.customId || member._id,
        name: member.name,
        email: member.email,
        role: member.role || 'user',
        phone: member.phone || ''
      }
    };
  }

  return {
    exists: false,
    error: 'Invalid receiver email. Enter the email address of a registered user.'
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
  const m = (memoryStore.members || []).find(mem => mem.email && mem.email.toLowerCase() === cleanEmail);
  if (m) {
    const t = (memoryStore.teams || []).find(team => team.id === m.teamId);
    const d = (memoryStore.departments || []).find(dept => dept.id === m.departmentId);
    safeUser.team = t ? t.name : (safeUser.team || 'Team');
    safeUser.department = d ? d.name : (safeUser.department || 'General');
    safeUser.teamId = m.teamId;
    safeUser.departmentId = m.departmentId;
    safeUser.teamRole = m.role || safeUser.teamRole || safeUser.title || 'Team Member';
    safeUser.title = m.role || safeUser.title || safeUser.teamRole || 'Team Member';
  }

  const isMgr = isManagerOrAdmin(safeUser, m);
  const isAdminEmail = cleanEmail === 'bgsmchhospitalnagarur@gmail.com';
  if (isAdminEmail) {
    safeUser.role = 'admin';
  } else if (isMgr) {
    safeUser.role = 'manager';
  }

  return {
    success: true,
    user: safeUser,
    token: `token-${safeUser.role}-${Date.now()}`
  };
};

const loginUser = async (email, password) => {
  const cleanEmail = (email || '').trim().toLowerCase();

  // Reject permanently banned dummy fake accounts
  if (isBannedEmail(cleanEmail)) {
    return {
      success: false,
      error: 'This account does not exist or has been removed.'
    };
  }

  // Reject accounts deleted by admin (if re-entered by admin, isEmailDeleted automatically restores to valid)
  if (await isEmailDeleted(cleanEmail)) {
    return {
      success: false,
      error: 'This account has been deleted by an administrator. Access revoked.'
    };
  }

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
          if (cleanEmail === 'bgsmchhospitalnagarur@gmail.com' && (password === 'Apple2026?' || password === 'Apple9844?' || password === 'Apple9844')) {
            // Allow hospital admin credentials
          } else {
            return { success: false, error: 'Invalid password. Please check your credentials.' };
          }
        }
        const { password: _, ...safeUser } = dbUser;
        // Enrich user with resolved team and department names
        let enrichedTeam = safeUser.team || '';
        let enrichedDept = safeUser.department || '';
        let enrichedTeamId = safeUser.team || '';
        let enrichedDeptId = safeUser.department || '';
        try {
          const dbMemberInfo = await Member.findOne({ email: cleanEmail }).populate('teamId').populate('departmentId').lean();
          if (dbMemberInfo) {
            if (dbMemberInfo.teamId) {
              enrichedTeam = dbMemberInfo.teamId.name || dbMemberInfo.teamId;
              enrichedTeamId = dbMemberInfo.teamId._id?.toString() || dbMemberInfo.teamId;
            }
            if (dbMemberInfo.departmentId) {
              enrichedDept = dbMemberInfo.departmentId.name || dbMemberInfo.departmentId;
              enrichedDeptId = dbMemberInfo.departmentId._id?.toString() || dbMemberInfo.departmentId;
            }
          }
        } catch (_) { }

        if (!enrichedTeam || enrichedTeam === enrichedTeamId) {
          const memTeam = (memoryStore.teams || []).find(t => t.id === enrichedTeamId || t.customId === enrichedTeamId || String(t._id) === enrichedTeamId);
          if (memTeam) enrichedTeam = memTeam.name;
        }
        if (!enrichedDept || enrichedDept === enrichedDeptId) {
          const memDept = (memoryStore.departments || []).find(d => d.id === enrichedDeptId || d.customId === enrichedDeptId || String(d._id) === enrichedDeptId);
          if (memDept) enrichedDept = memDept.name;
        }

        const isMgr = isManagerOrAdmin(safeUser, dbMemberInfo);
        const isAdminEmail = cleanEmail === 'bgsmchhospitalnagarur@gmail.com';
        const resolvedRole = isAdminEmail ? 'admin' : (isMgr ? 'manager' : (safeUser.role || 'user'));

        return {
          success: true,
          user: {
            ...safeUser,
            role: resolvedRole,
            id: dbUser.customId || dbUser._id.toString(),
            team: enrichedTeam,
            department: enrichedDept,
            teamId: enrichedTeamId,
            departmentId: enrichedDeptId,
            teamRole: dbMemberInfo?.role || safeUser.teamRole || safeUser.title || (isMgr ? 'Manager' : 'Team Member'),
            title: dbMemberInfo?.role || safeUser.title || safeUser.teamRole || (isMgr ? 'Manager' : 'Team Member')
          },
          token: `token-${resolvedRole}-${Date.now()}`
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
    if (cleanEmail === 'bgsmchhospitalnagarur@gmail.com' && (password === 'Apple2026?' || password === 'Apple9844?' || password === 'Apple9844')) {
      user.password = password;
      saveStore();
    } else {
      return { success: false, error: 'Invalid password. Please check your credentials.' };
    }
  }

  const { password: _, ...safeUser } = user;
  const m = (memoryStore.members || []).find(mem => mem.email && mem.email.toLowerCase() === cleanEmail);
  if (m) {
    const t = (memoryStore.teams || []).find(team => team.id === m.teamId);
    const d = (memoryStore.departments || []).find(dept => dept.id === m.departmentId);
    safeUser.team = t ? t.name : (safeUser.team || 'Team');
    safeUser.department = d ? d.name : (safeUser.department || 'General');
    safeUser.teamId = m.teamId;
    safeUser.departmentId = m.departmentId;
    safeUser.teamRole = m.role || safeUser.teamRole || safeUser.title || 'Team Member';
    safeUser.title = m.role || safeUser.title || safeUser.teamRole || 'Team Member';
  }

  const isMgr = isManagerOrAdmin(safeUser, m);
  const isAdminEmail = cleanEmail === 'bgsmchhospitalnagarur@gmail.com';
  if (isAdminEmail) {
    safeUser.role = 'admin';
  } else if (isMgr) {
    safeUser.role = 'manager';
  }

  return {
    success: true,
    user: safeUser,
    token: `token-${safeUser.role}-${Date.now()}`
  };
};

const getUsers = async () => {
  const usersMap = new Map();

  // 1. Initial base users (administrators)
  (initialData.users || []).forEach(u => {
    if (!isBannedEmail(u.email)) {
      const { password, ...safe } = u;
      usersMap.set(u.email.toLowerCase(), { ...safe, id: u.customId || u.id });
    }
  });

  // 2. Persistent memoryStore users
  (memoryStore.users || []).forEach(u => {
    if (!isBannedEmail(u.email)) {
      const { password, ...safe } = u;
      const existing = usersMap.get(u.email.toLowerCase()) || {};
      usersMap.set(u.email.toLowerCase(), { ...existing, ...safe, id: u.customId || u.id || existing.id });
    }
  });

  // 3. MongoDB users if connected
  if (getStatus()) {
    try {
      const list = await User.find().select('-password').lean();
      if (list && list.length > 0) {
        list.forEach(u => {
          if (!isBannedEmail(u.email)) {
            const existing = usersMap.get(u.email.toLowerCase()) || {};
            usersMap.set(u.email.toLowerCase(), {
              ...existing,
              ...u,
              id: u.customId || existing.id || u._id.toString()
            });
          }
        });
      }
    } catch (e) {
      console.warn('Mongo read error in getUsers:', e.message);
    }
  }

  // 4. Enrich users with corresponding Member role & Team names
  const allMembers = memoryStore.members || [];
  const allTeams = memoryStore.teams || [];
  const allDepts = memoryStore.departments || [];
  usersMap.forEach((userObj, em) => {
    const mem = allMembers.find(m => m.email && m.email.toLowerCase() === em);
    if (mem) {
      const tm = allTeams.find(t => t.id === mem.teamId || t.customId === mem.teamId || String(t._id) === mem.teamId);
      const dp = allDepts.find(d => d.id === mem.departmentId || d.customId === mem.departmentId || String(d._id) === mem.departmentId);
      if (tm && (!userObj.team || userObj.team === mem.teamId)) userObj.team = tm.name;
      if (dp && (!userObj.department || userObj.department === mem.departmentId)) userObj.department = dp.name;
      userObj.teamId = mem.teamId;
      userObj.departmentId = mem.departmentId;
      userObj.teamRole = mem.role || userObj.teamRole || userObj.title || 'Team Member';
      userObj.title = mem.role || userObj.title || userObj.teamRole || 'Team Member';
      userObj.memberId = mem.id || mem.customId || mem._id;
    }
  });

  return Array.from(usersMap.values());
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

const updateUserProfile = async (identifier, { name, avatar, currentPassword, newPassword }) => {
  const cleanId = (identifier || '').trim().toLowerCase();

  // 1. Check memoryStore
  let user = (memoryStore.users || []).find(u =>
    (u.id && u.id.toLowerCase() === cleanId) ||
    (u.email && u.email.toLowerCase() === cleanId)
  );

  // 2. Check MongoDB if active
  if (getStatus()) {
    try {
      const dbUser = await User.findOne({
        $or: [
          { customId: identifier },
          { email: cleanId }
        ]
      });

      if (dbUser) {
        if (newPassword) {
          if (dbUser.password && currentPassword && dbUser.password !== currentPassword) {
            return { success: false, error: 'Current password is incorrect' };
          }
          dbUser.password = newPassword;
          dbUser.hasPassword = true;
        }

        if (name && name.trim()) dbUser.name = name.trim();
        if (avatar !== undefined) dbUser.avatar = avatar;
        await dbUser.save();

        if (dbUser.memberId || dbUser.email) {
          await Member.updateOne(
            { $or: [{ _id: dbUser.memberId }, { email: dbUser.email }] },
            { $set: { ...(name ? { name: name.trim() } : {}), ...(avatar !== undefined ? { avatar } : {}) } }
          );
        }

        if (user) {
          if (name && name.trim()) user.name = name.trim();
          if (avatar !== undefined) user.avatar = avatar;
          if (newPassword) {
            user.password = newPassword;
            user.hasPassword = true;
          }
        }
        saveStore();

        const safeUser = {
          id: dbUser.customId || dbUser._id.toString(),
          name: dbUser.name,
          email: dbUser.email,
          role: dbUser.role,
          department: dbUser.department,
          team: dbUser.team,
          teamRole: dbUser.teamRole,
          avatar: dbUser.avatar,
          title: dbUser.title
        };
        return { success: true, user: safeUser };
      }
    } catch (e) {
      console.warn('Mongo updateUserProfile error:', e.message);
    }
  }

  if (user) {
    if (newPassword) {
      if (user.password && currentPassword && user.password !== currentPassword) {
        return { success: false, error: 'Current password is incorrect' };
      }
      user.password = newPassword;
      user.hasPassword = true;
    }

    if (name && name.trim()) user.name = name.trim();
    if (avatar !== undefined) user.avatar = avatar;

    const mem = (memoryStore.members || []).find(m =>
      (user.memberId && m.id === user.memberId) ||
      (m.email && m.email.toLowerCase() === user.email.toLowerCase())
    );
    if (mem) {
      if (name && name.trim()) mem.name = name.trim();
      if (avatar !== undefined) mem.avatar = avatar;
    }

    saveStore();

    const { password: _, ...safeUser } = user;
    return { success: true, user: safeUser };
  }

  return { success: false, error: 'User account not found' };
};

const getAdmins = async () => {
  if (getStatus()) {
    try {
      const list = await User.find({ role: 'admin' }).select('-password').lean();
      if (list.length > 0) {
        return list
          .filter(u => !isBannedEmail(u.email))
          .map(u => ({ ...u, id: u.customId || u._id.toString() }));
      }
    } catch (e) {
      console.warn('Mongo getAdmins error:', e.message);
    }
  }

  return (memoryStore.users || [])
    .filter(u => u.role === 'admin' && !isBannedEmail(u.email))
    .map(({ password, ...u }) => u);
};

const createAdmin = async ({ name, email, password }) => {
  const cleanEmail = (email || '').trim().toLowerCase();
  if (!cleanEmail || !password) {
    return { success: false, error: 'Email and password are required' };
  }

  // If this email was previously marked deleted, un-delete it
  if (memoryStore.deletedEmails) {
    memoryStore.deletedEmails = memoryStore.deletedEmails.filter(e => e.toLowerCase() !== cleanEmail);
  }

  const existing = (memoryStore.users || []).find(u => u.email.toLowerCase() === cleanEmail);
  if (existing) {
    existing.role = 'admin';
    if (name) existing.name = name;
    existing.password = password;
    existing.hasPassword = true;
    saveStore();
    const { password: _, ...safeAdmin } = existing;
    return { success: true, user: safeAdmin };
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
  const targetAdmin = (memoryStore.users || []).find(u => u.id === id || (u.email && u.email.toLowerCase() === String(id).toLowerCase()));
  const adminEmail = (targetAdmin ? targetAdmin.email : String(id || '')).toLowerCase();

  // Prevent deleting primary super admin
  if (adminEmail === 'bgsmchhospitalnagarur@gmail.com') {
    return { success: false, error: 'Cannot delete primary administrator account (bgsmchhospitalnagarur@gmail.com)' };
  }

  const remainingAdmins = (memoryStore.users || []).filter(u => u.role === 'admin' && !isBannedEmail(u.email));
  if (remainingAdmins.length <= 1) {
    return { success: false, error: 'Cannot delete the only administrator account' };
  }

  if (adminEmail) {
    markDeletedEmail(adminEmail);
  }

  memoryStore.users = (memoryStore.users || []).filter(u => u.id !== id && (!u.email || u.email.toLowerCase() !== adminEmail));
  memoryStore.members = (memoryStore.members || []).filter(m => m.id !== id && (!m.email || m.email.toLowerCase() !== adminEmail));
  saveStore();

  if (getStatus()) {
    try {
      const mongoose = require('mongoose');
      const orConditions = [{ email: adminEmail }];
      if (id) orConditions.push({ customId: id });
      if (mongoose.Types.ObjectId.isValid(id)) orConditions.push({ _id: id });
      await User.deleteMany({ $or: orConditions }).catch(() => { });
      await Member.deleteMany({ $or: orConditions }).catch(() => { });
    } catch (e) {
      console.warn('Mongo deleteAdmin error:', e.message);
    }
  }

  return { success: true, message: 'Administrator removed successfully', deletedUser: targetAdmin };
};

// Strictly verify that the requesting account is an active administrator or manager (cannot be spoofed by role header alone)
const verifyAdminAccess = async ({ role, email, id } = {}) => {
  const cleanEmail = (email || '').trim().toLowerCase();
  const cleanId = (id || '').trim();

  if (!cleanEmail && !cleanId) {
    return false;
  }

  // 1. Check initialData base administrators
  const inInitial = (initialData.users || []).find(u =>
    (cleanEmail && u.email && u.email.toLowerCase() === cleanEmail) ||
    (cleanId && (u.id === cleanId || u.customId === cleanId))
  );
  if (inInitial && isManagerOrAdmin(inInitial) && !isBannedEmail(inInitial.email)) {
    return true;
  }

  // 2. Check MongoDB Atlas as authoritative source of truth
  if (getStatus()) {
    try {
      const orConditions = [];
      if (cleanEmail) orConditions.push({ email: cleanEmail });
      if (cleanId) {
        orConditions.push({ customId: cleanId });
        if (mongoose.Types.ObjectId.isValid(cleanId) && cleanId.length === 24) {
          orConditions.push({ _id: cleanId });
        }
      }
      if (orConditions.length > 0) {
        const dbUser = await User.findOne({ $or: orConditions }).lean();
        const dbMember = cleanEmail ? await Member.findOne({ email: cleanEmail }).lean() : null;
        if (dbUser || dbMember) {
          return isManagerOrAdmin(dbUser, dbMember) && !isBannedEmail(dbUser?.email || dbMember?.email);
        }
      }
    } catch (e) {
      console.warn('Mongo verifyAdminAccess notice:', e.message);
    }
  }

  // 3. Fallback to memoryStore
  const memUser = (memoryStore.users || []).find(u =>
    (cleanEmail && u.email && u.email.toLowerCase() === cleanEmail) ||
    (cleanId && (u.id === cleanId || u.customId === cleanId))
  );
  const memMember = cleanEmail ? (memoryStore.members || []).find(m => (m.email || '').toLowerCase() === cleanEmail) : null;
  if (memUser || memMember) {
    return isManagerOrAdmin(memUser, memMember) && !isBannedEmail(memUser?.email || memMember?.email);
  }

  return false;
};

// Validate that an active user/admin session still exists in the system
const validateSession = async (id, email) => {
  const cleanEmail = (email || '').trim().toLowerCase();
  const cleanId = (id || '').trim();

  if (cleanEmail && isBannedEmail(cleanEmail)) {
    return { valid: false, deleted: true, message: 'User account has been deleted by an administrator. Access revoked.' };
  }

  // 1. Check initialData.users (System admins are always valid unless banned)
  const initialUser = (initialData.users || []).find(u =>
    (cleanId && (u.id === cleanId || u.customId === cleanId)) ||
    (cleanEmail && u.email && u.email.toLowerCase() === cleanEmail)
  );
  if (initialUser && !isBannedEmail(initialUser.email)) {
    const { password, ...safeUser } = initialUser;
    return { valid: true, user: safeUser };
  }

  // 2. Check MongoDB Atlas as authoritative source of truth when connected
  if (getStatus()) {
    try {
      const orConditions = [];
      if (cleanEmail) orConditions.push({ email: cleanEmail });
      if (cleanId) {
        orConditions.push({ customId: cleanId });
        if (mongoose.Types.ObjectId.isValid(cleanId) && cleanId.length === 24) {
          orConditions.push({ _id: cleanId });
        }
      }
      if (orConditions.length > 0) {
        const dbUser = await User.findOne({ $or: orConditions }).select('-password').lean();
        if (dbUser && !isBannedEmail(dbUser.email)) {
          const isMgr = isManagerOrAdmin(dbUser);
          const resolvedRole = isMgr ? 'admin' : (dbUser.role || 'user');
          return { valid: true, user: { ...dbUser, role: resolvedRole, id: dbUser.customId || dbUser._id.toString() } };
        }
        // Also check Member collection in case user was registered as member and session uses memberId/email
        if (cleanEmail) {
          const dbMember = await Member.findOne({ email: cleanEmail }).lean();
          if (dbMember && !isBannedEmail(dbMember.email)) {
            const isMgr = isManagerOrAdmin(null, dbMember);
            return { valid: true, user: { id: dbMember.customId || dbMember._id.toString(), name: dbMember.name, email: dbMember.email, role: isMgr ? 'admin' : 'user' } };
          }
        }
      }
      // Atlas IS connected and definitively confirmed this account does not exist
      return { valid: false, deleted: true, message: 'User account has been deleted by an administrator.' };
    } catch (e) {
      console.warn('Mongo validateSession notice:', e.message);
      // Transient Atlas query error: do NOT falsely kick out the user
      return { valid: true, pendingDb: true };
    }
  }

  // 3. MongoDB Atlas is not yet connected (e.g. Render cold start) — check memoryStore,
  // and if absent, DO NOT falsely report "deleted" while Atlas is still connecting!
  const users = memoryStore.users || [];
  let user = null;
  if (cleanId) {
    user = users.find(u => u.id === cleanId || u._id === cleanId || u.customId === cleanId);
  }
  if (!user && cleanEmail) {
    user = users.find(u => u.email && u.email.toLowerCase() === cleanEmail);
  }
  if (user && !isBannedEmail(user.email)) {
    const { password, ...safeUser } = user;
    const m = (memoryStore.members || []).find(mem => mem.email && mem.email.toLowerCase() === cleanEmail);
    const isMgr = isManagerOrAdmin(safeUser, m);
    const isAdminEmail = cleanEmail === 'bgsmchhospitalnagarur@gmail.com';
    if (isAdminEmail) {
      safeUser.role = 'admin';
    } else if (isMgr) {
      safeUser.role = 'manager';
    }
    return { valid: true, user: safeUser };
  }

  const member = (memoryStore.members || []).find(m =>
    (cleanEmail && m.email && m.email.toLowerCase() === cleanEmail) ||
    (cleanId && (m.id === cleanId || m.customId === cleanId))
  );
  if (member && !isBannedEmail(member.email)) {
    const isMgr = isManagerOrAdmin(null, member);
    const isAdminEmail = cleanEmail === 'bgsmchhospitalnagarur@gmail.com';
    return { valid: true, user: { id: member.id, name: member.name, email: member.email, role: isAdminEmail ? 'admin' : (isMgr ? 'manager' : 'user') } };
  }

  return { valid: true, pendingDb: true };
};

// Update existing user from Admin Settings (Name, Email, Role, Password)
const updateUser = async (id, { name, email, role, password, avatar }) => {
  const cleanId = (id || '').trim();
  const cleanEmail = (email || '').trim().toLowerCase();

  let user = (memoryStore.users || []).find(u =>
    u.id === cleanId ||
    u.customId === cleanId ||
    (u._id && String(u._id) === cleanId) ||
    (u.email && u.email.toLowerCase() === cleanId.toLowerCase())
  );

  if (!user && getStatus()) {
    try {
      const dbUser = await User.findOne(buildIdQuery(cleanId)).lean();
      if (dbUser) {
        user = { ...dbUser, id: dbUser.customId || dbUser._id.toString() };
        memoryStore.users.push(user);
      }
    } catch (e) { }
  }

  if (!user) {
    return { success: false, error: 'User account not found' };
  }

  const oldEmail = (user.email || '').toLowerCase();

  // If new email was previously marked deleted, un-delete it
  if (cleanEmail && memoryStore.deletedEmails) {
    memoryStore.deletedEmails = memoryStore.deletedEmails.filter(e => e.toLowerCase() !== cleanEmail);
  }

  if (name && name.trim()) user.name = name.trim();
  if (cleanEmail) user.email = cleanEmail;
  if (role && (role === 'admin' || role === 'user')) user.role = role;
  if (password && password.trim()) {
    user.password = password.trim();
    user.hasPassword = true;
  }
  if (avatar !== undefined) user.avatar = avatar;

  // Sync associated Member in memoryStore
  const mem = (memoryStore.members || []).find(m =>
    (user.memberId && m.id === user.memberId) ||
    (m.email && m.email.toLowerCase() === oldEmail)
  );
  if (mem) {
    if (name && name.trim()) mem.name = name.trim();
    if (cleanEmail) mem.email = cleanEmail;
    if (role) mem.role = role === 'admin' ? 'Administrator' : (mem.role || 'Team Member');
  }

  saveStore();

  // Update in MongoDB Atlas if active
  if (getStatus()) {
    try {
      const updatePayload = {
        name: user.name,
        email: user.email,
        role: user.role
      };
      if (password && password.trim()) {
        updatePayload.password = password.trim();
        updatePayload.hasPassword = true;
      }
      if (avatar !== undefined) updatePayload.avatar = avatar;

      await User.findOneAndUpdate(
        { $or: [{ customId: user.id }, { email: oldEmail }] },
        updatePayload
      );

      if (mem) {
        await Member.findOneAndUpdate(
          { $or: [{ customId: mem.id }, { email: oldEmail }] },
          { name: mem.name, email: mem.email }
        );
      }
    } catch (e) {
      console.warn('Mongo updateUser error:', e.message);
    }
  }

  const { password: _, ...safeUser } = user;
  return { success: true, user: safeUser, oldEmail };
};

// Permanently delete user from Admin Settings and ensure email is completely unregistered
const deleteUser = async (id) => {
  const cleanId = (id || '').trim();
  let user = (memoryStore.users || []).find(u =>
    u.id === cleanId ||
    u.customId === cleanId ||
    (u._id && String(u._id) === cleanId) ||
    (u.email && u.email.toLowerCase() === cleanId.toLowerCase())
  );

  if (!user && getStatus()) {
    try {
      const dbUser = await User.findOne(buildIdQuery(cleanId)).lean();
      if (dbUser) {
        user = { ...dbUser, id: dbUser.customId || dbUser._id.toString() };
      }
    } catch (e) { }
  }

  const targetEmail = (user ? user.email : cleanId).toLowerCase();
  const targetId = user ? user.id : cleanId;

  if (!user) {
    return { success: false, error: 'User not found' };
  }

  // Prevent deleting the primary administrator
  if (targetEmail === 'bgsmchhospitalnagarur@gmail.com') {
    return { success: false, error: 'Cannot delete primary administrator account (bgsmchhospitalnagarur@gmail.com)' };
  }

  // Prevent deleting the only administrator
  if (user && user.role === 'admin') {
    const adminCount = (memoryStore.users || []).filter(u => u.role === 'admin' && !isBannedEmail(u.email)).length;
    if (adminCount <= 1) {
      return { success: false, error: 'Cannot delete the only administrator account' };
    }
  }

  // 0. Record in permanent deleted blacklist
  if (targetEmail) {
    markDeletedEmail(targetEmail);
  }

  // 1. Remove user from memoryStore.users
  memoryStore.users = (memoryStore.users || []).filter(u =>
    u.id !== targetId &&
    (!u.email || u.email.toLowerCase() !== targetEmail)
  );

  // 2. Remove any corresponding Member record so email is completely unregistered
  memoryStore.members = (memoryStore.members || []).filter(m =>
    m.id !== user?.memberId &&
    (!m.email || m.email.toLowerCase() !== targetEmail)
  );

  // 3. Remove assigned work in userWorkspace
  if (memoryStore.userWorkspace && memoryStore.userWorkspace.assignedWork) {
    memoryStore.userWorkspace.assignedWork = memoryStore.userWorkspace.assignedWork.filter(w =>
      w.userId !== targetId &&
      (!w.assigneeEmail || w.assigneeEmail.toLowerCase() !== targetEmail)
    );
  }

  // 4. Remove assignments assigned to this user
  memoryStore.assignments = (memoryStore.assignments || []).filter(a =>
    a.memberId !== user?.memberId &&
    a.assigneeId !== targetId &&
    (!a.assigneeEmail || a.assigneeEmail.toLowerCase() !== targetEmail)
  );

  saveStore();

  // 5. Delete from MongoDB Atlas if active (safe against CastError)
  if (getStatus()) {
    try {
      const mongoose = require('mongoose');
      const userOr = [{ email: targetEmail }];
      if (targetId) userOr.push({ customId: targetId });
      if (mongoose.Types.ObjectId.isValid(targetId)) userOr.push({ _id: targetId });
      await User.deleteMany({ $or: userOr }).catch(() => { });

      const memberOr = [{ email: targetEmail }];
      if (user?.memberId) memberOr.push({ customId: user.memberId });
      if (mongoose.Types.ObjectId.isValid(user?.memberId)) memberOr.push({ _id: user.memberId });
      await Member.deleteMany({ $or: memberOr }).catch(() => { });

      const assignOr = [{ assigneeEmail: targetEmail }];
      if (user?.memberId) assignOr.push({ memberId: user.memberId });
      if (targetId) assignOr.push({ assigneeId: targetId });
      await Assignment.deleteMany({ $or: assignOr }).catch(() => { });

      if (targetId) {
        await UserTask.deleteMany({ $or: [{ userId: targetId }, { assigneeEmail: targetEmail }] }).catch(() => { });
      }
    } catch (e) {
      console.warn('Mongo deleteUser error:', e.message);
    }
  }

  return {
    success: true,
    message: `User ${user?.name || targetEmail} deleted permanently.`,
    deletedUser: user || { id: targetId, email: targetEmail }
  };
};

// --- Notifications Engine ---
const getNotifications = async (role = 'all', userId = null, email = null) => {
  const cleanEmail = (email || '').trim().toLowerCase();
  const cleanUserId = (userId || '').trim();

  if (getStatus()) {
    try {
      const orClauses = [];
      if (role === 'admin') {
        orClauses.push({ recipientRole: 'admin' });
        orClauses.push({ recipientRole: 'all' });
      } else if (role === 'manager') {
        orClauses.push({ recipientRole: 'manager' });
        orClauses.push({ recipientRole: 'all' });
        if (cleanUserId) orClauses.push({ recipientUserId: cleanUserId });
        if (cleanEmail) orClauses.push({ recipientEmail: cleanEmail });
      } else if (role === 'user') {
        orClauses.push({ recipientRole: 'all' });
        if (cleanUserId) {
          orClauses.push({ recipientUserId: cleanUserId });
        }
        if (cleanEmail) {
          orClauses.push({ recipientEmail: cleanEmail });
        }
        orClauses.push({ recipientRole: 'user', recipientUserId: null, recipientEmail: '' });
      } else {
        if (role && role !== 'all') orClauses.push({ recipientRole: role });
        if (cleanUserId) orClauses.push({ recipientUserId: cleanUserId });
        if (cleanEmail) orClauses.push({ recipientEmail: cleanEmail });
      }

      const filter = orClauses.length > 0 ? { $or: orClauses } : {};
      const list = await Notification.find(filter).sort({ createdAt: -1 }).lean();
      if (list && list.length > 0) {
        return list.map(n => ({ ...n, id: n.customId || n._id.toString() }));
      }
      // If Mongo collection returned 0 results, fall back seamlessly to memoryStore
    } catch (e) {
      console.warn('Mongo notifications read error:', e.message);
    }
  }

  if (!memoryStore.notifications) {
    memoryStore.notifications = [];
  }
  let list = memoryStore.notifications;
  if (role === 'admin') {
    list = list.filter(n => n.recipientRole === 'admin' || n.recipientRole === 'all' || (cleanUserId && n.recipientUserId === cleanUserId) || (cleanEmail && n.recipientEmail === cleanEmail));
  } else if (role === 'manager') {
    list = list.filter(n => n.recipientRole === 'manager' || n.recipientRole === 'all' || (cleanUserId && n.recipientUserId === cleanUserId) || (cleanEmail && n.recipientEmail && n.recipientEmail.toLowerCase() === cleanEmail));
  } else if (role === 'user') {
    list = list.filter(n => {
      const isBreakNotif = (n.title && n.title.includes('Break')) || (n.message && n.message.includes('break'));
      if (isBreakNotif) {
        // Break notifications must strictly belong to this individual user
        if (cleanUserId && n.recipientUserId === cleanUserId) return true;
        if (cleanEmail && n.recipientEmail && n.recipientEmail.toLowerCase() === cleanEmail) return true;
        return false;
      }
      if (n.recipientRole === 'all') return true;
      if (cleanUserId && n.recipientUserId === cleanUserId) return true;
      if (cleanEmail && n.recipientEmail && n.recipientEmail.toLowerCase() === cleanEmail) return true;
      if (n.recipientRole === 'user' && !n.recipientUserId && !n.recipientEmail) return true;
      return false;
    });
  } else if (role && role !== 'all') {
    list = list.filter(n => n.recipientRole === role || n.recipientRole === 'all' || (cleanUserId && n.recipientUserId === cleanUserId));
  }
  return list;
};

const createNotification = (data) => {
  const newNotif = {
    id: generateId('notif'),
    recipientRole: data.recipientRole || 'user',
    recipientUserId: data.recipientUserId || null,
    recipientEmail: (data.recipientEmail || '').toLowerCase().trim(),
    referenceId: data.referenceId || '',
    title: data.title || 'Notification',
    message: data.message || '',
    timestamp: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + ', ' + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    read: false,
    link: data.link || '',
    actionUrl: data.actionUrl || ''
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
      recipientEmail: newNotif.recipientEmail,
      referenceId: newNotif.referenceId,
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
    if (!role || role === 'all' || n.recipientRole === role) {
      n.read = true;
    }
  });
  saveStore();

  if (getStatus()) {
    try {
      const filter = (role && role !== 'all') ? { recipientRole: role } : {};
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

  const now = new Date();
  const formattedDate = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const formattedTime = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  const fullDateTime = `${formattedDate}, ${formattedTime}`;

  task.status = status;
  if (status === 'In Progress') {
    if (!task.workStartedAt) {
      task.workStartedAt = now.toISOString();
      task.workStartedTime = formattedTime;
      task.workStartedDate = fullDateTime;
    }
    if (task.progress === 0) {
      task.progress = 30;
    }
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
        {
          status: status,
          progress: task.progress,
          workStartedAt: task.workStartedAt,
          workStartedTime: task.workStartedTime,
          workStartedDate: task.workStartedDate
        }
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
  if (filter.userId || filter.email) {
    const uEmail = (filter.email || '').toLowerCase().trim();
    list = list.filter(a => {
      if (filter.userId && (a.userId === filter.userId || a.receiverId === filter.userId)) return true;
      if (uEmail) {
        if (a.senderEmail && a.senderEmail.toLowerCase() === uEmail) return true;
        if (a.receiverEmail && a.receiverEmail.toLowerCase() === uEmail) return true;
        if (a.requestedBy && a.requestedBy.toLowerCase().includes(uEmail)) return true;
      }
      return false;
    });
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
    location: data.location || (data.joinUrl ? data.joinUrl : 'Online (Video Meet)'),
    purpose: data.purpose || '',
    status: data.status || 'Scheduled',
    isToday: data.date === todayStr,
    meetingId: data.meetingId || null,
    joinUrl: data.joinUrl || null,
    referenceId: data.referenceId || ('APT-' + Date.now()),
    formType: data.formType || (data.title && data.title.toLowerCase().includes('event') ? 'Event Organize' : (data.title && data.title.toLowerCase().includes('general') ? 'General Information' : 'Work Request')),
    senderName: data.senderName || (data.requestedBy ? data.requestedBy.split('(')[0].trim() : 'Sender'),
    senderEmail: data.senderEmail || '',
    senderNumber: data.senderNumber || data.phone || '',
    receiverId: data.receiverId || '',
    receiverName: data.receiverName || (data.team ? data.team.replace(/^To:\s*/, '').split('(')[0].trim() : 'Receiver'),
    receiverEmail: data.receiverEmail || '',
    receiverNumber: data.receiverNumber || ''
  };

  if (!memoryStore.appointments) {
    memoryStore.appointments = [];
  }
  memoryStore.appointments.unshift(newApt);
  saveStore();

  let createdResult = newApt;

  if (getStatus()) {
    try {
      const created = await Appointment.create({
        customId: newApt.id,
        referenceId: newApt.referenceId,
        formType: newApt.formType,
        title: newApt.title,
        requestedBy: newApt.requestedBy,
        userId: newApt.userId,
        senderName: newApt.senderName,
        senderEmail: newApt.senderEmail,
        senderNumber: newApt.senderNumber,
        receiverId: newApt.receiverId,
        receiverName: newApt.receiverName,
        receiverEmail: newApt.receiverEmail,
        receiverNumber: newApt.receiverNumber,
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
      createdResult = { ...created.toObject(), id: newApt.id };
    } catch (e) {
      console.warn('Mongo appointment create error:', e.message);
    }
  }

  // 1. Create Persistent Notification for Administrator (Real-time toast & badge update)
  try {
    await createNotification({
      recipientRole: 'admin',
      title: `New ${newApt.formType} Request 📋`,
      message: `${newApt.senderName} (${newApt.senderEmail || newApt.senderNumber || 'User'}) submitted a ${newApt.formType} request for ${newApt.receiverName}. Reference: ${newApt.referenceId}`,
      link: 'appointments',
      referenceId: newApt.referenceId
    });
  } catch (notifErr) {
    console.warn('[Notification] Admin appointment notif error:', notifErr.message);
  }

  // 2. Create Persistent Notification for Receiver
  if (newApt.receiverId || newApt.receiverEmail) {
    try {
      await createNotification({
        recipientRole: 'user',
        recipientUserId: newApt.receiverId,
        recipientEmail: newApt.receiverEmail,
        title: `New ${newApt.formType} Request 📬`,
        message: `You received a ${newApt.formType} request from ${newApt.senderName}. Reference: ${newApt.referenceId}`,
        link: 'appointments',
        referenceId: newApt.referenceId
      });
    } catch (notifErr) {
      console.warn('[Notification] Receiver appointment notif error:', notifErr.message);
    }
  }

  // Automatically trigger WhatsApp notifications via WPPConnect (fail-safe)
  try {
    const wppService = require('../services/wppService');
    if (newApt.senderNumber || newApt.receiverNumber) {
      wppService.sendWorkRequestNotifications({
        formType: newApt.formType,
        referenceId: newApt.referenceId || newApt.id,
        senderName: newApt.senderName,
        senderNumber: newApt.senderNumber,
        receiverName: newApt.receiverName,
        receiverNumber: newApt.receiverNumber,
        agreedToNotifications: data.agreedToNotifications !== false
      }).catch(err => console.warn('[WPPConnect] sendWorkRequestNotifications async warning:', err.message));
    }
  } catch (wppErr) {
    console.warn('[WPPConnect] Error calling wppService:', wppErr.message);
  }

  return createdResult;
};

const updateAppointment = async (id, data) => {
  if (!memoryStore.appointments) {
    memoryStore.appointments = [];
  }
  const index = memoryStore.appointments.findIndex(a => a.id === id || a.customId === id);
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
        buildIdQuery(id),
        data,
        { new: true }
      ).lean();
      if (updated) return { ...updated, id: updated.customId || updated._id.toString() };
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
  const apt = memoryStore.appointments.find(a => a.id === id || a.customId === id);
  memoryStore.appointments = memoryStore.appointments.filter(a => a.id !== id && a.customId !== id);

  if (memoryStore.meetings) {
    memoryStore.meetings = memoryStore.meetings.filter(m =>
      m.id !== id && m.customId !== id && m.appointmentId !== id && (!apt || (m.meetingId && m.meetingId !== apt.meetingId))
    );
  }
  saveStore();

  if (getStatus()) {
    try {
      await Appointment.findOneAndDelete(buildIdQuery(id));
      await Meeting.deleteMany({ $or: [{ customId: id }, { appointmentId: id }] });
    } catch (e) {
      console.warn('Mongo appointment delete error:', e.message);
    }
  }
  return { success: true, id };
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

// --- Real-Time Messaging Services ---
const getEligibleUsers = async (currentUserId = null) => {
  // Pre-load Department and Team maps to resolve IDs to proper human-readable names
  const deptMap = new Map();
  const teamMap = new Map();

  try {
    const allDepts = await getDepartments();
    for (const d of (allDepts || [])) {
      if (d.id) deptMap.set(d.id.toString(), d.name);
      if (d._id) deptMap.set(d._id.toString(), d.name);
      if (d.customId) deptMap.set(d.customId.toString(), d.name);
    }
    const allTeams = await getTeams();
    for (const t of (allTeams || [])) {
      if (t.id) teamMap.set(t.id.toString(), t.name);
      if (t._id) teamMap.set(t._id.toString(), t.name);
      if (t.customId) teamMap.set(t.customId.toString(), t.name);
    }
  } catch (err) {
    console.warn('Error loading dept/team maps in getEligibleUsers:', err.message);
  }

  const resolveDept = (rawDept, memId) => {
    if (!rawDept && !memId) return '';
    if (rawDept && deptMap.has(rawDept.toString())) return deptMap.get(rawDept.toString());
    if (memId) {
      const mem = (memoryStore.members || []).find(m => m.id === memId || m._id?.toString() === memId);
      if (mem && mem.departmentId && deptMap.has(mem.departmentId.toString())) {
        return deptMap.get(mem.departmentId.toString());
      }
    }
    if (rawDept && !rawDept.startsWith('dept-') && !/^[0-9a-fA-F]{24}$/.test(rawDept)) {
      return rawDept;
    }
    return '';
  };

  const resolveTeam = (rawTeam, memId) => {
    if (!rawTeam && !memId) return '';
    if (rawTeam && teamMap.has(rawTeam.toString())) return teamMap.get(rawTeam.toString());
    if (memId) {
      const mem = (memoryStore.members || []).find(m => m.id === memId || m._id?.toString() === memId);
      if (mem && mem.teamId && teamMap.has(mem.teamId.toString())) {
        return teamMap.get(mem.teamId.toString());
      }
    }
    if (rawTeam && !rawTeam.startsWith('team-') && !/^[0-9a-fA-F]{24}$/.test(rawTeam)) {
      return rawTeam;
    }
    return '';
  };

  let list = [];
  if (getStatus()) {
    try {
      const dbUsers = await User.find({}).lean();
      list = dbUsers.map(u => ({
        id: u.customId || u._id.toString(),
        name: u.name,
        email: (u.email || '').toLowerCase().trim(),
        role: u.role,
        department: resolveDept(u.department, u.memberId),
        team: resolveTeam(u.team, u.memberId),
        teamRole: u.teamRole || '',
        avatar: u.avatar || (u.name || 'U').charAt(0).toUpperCase(),
        title: u.title || (u.role === 'admin' ? 'Administrator' : 'Team Member')
      }));
    } catch (e) {
      console.warn('Mongo eligible users read error:', e.message);
    }
  }

  if (list.length === 0) {
    list = (memoryStore.users || []).map(u => ({
      id: u.id,
      name: u.name,
      email: (u.email || '').toLowerCase().trim(),
      role: u.role,
      department: resolveDept(u.department, u.memberId),
      team: resolveTeam(u.team, u.memberId),
      teamRole: u.teamRole || '',
      avatar: u.avatar || (u.name || 'U').charAt(0).toUpperCase(),
      title: u.title || (u.role === 'admin' ? 'Administrator' : 'Team Member')
    }));
  }

  // Deduplicate by lowercase email
  const seen = new Set();
  const deduped = [];
  for (const u of list) {
    if (u.email && !seen.has(u.email)) {
      seen.add(u.email);
      deduped.push(u);
    }
  }

  if (currentUserId) {
    return deduped.filter(u => u.id !== currentUserId);
  }
  return deduped;
};

const findOrCreateConversation = async (user1Id, user2Email) => {
  const normEmail = (user2Email || '').toLowerCase().trim();
  if (!normEmail) {
    throw new Error('Recipient email is required');
  }

  // Verify recipient exists in registered user database
  const allEligible = await getEligibleUsers();
  const user1 = allEligible.find(u => u.id === user1Id || u.email === (user1Id || '').toLowerCase());
  const user2 = allEligible.find(u => u.email === normEmail);

  if (!user2) {
    throw new Error(`Email "${user2Email}" is not registered in the system. Only registered users can receive messages.`);
  }

  if (!user1) {
    throw new Error('Sender user identity could not be verified in the database.');
  }

  if (user1.id === user2.id || user1.email === user2.email) {
    throw new Error('You cannot start a conversation with yourself.');
  }

  const pIds = [user1.id, user2.id].sort();
  const pEmails = [user1.email, user2.email].sort();

  if (!memoryStore.conversations) memoryStore.conversations = [];

  let conv = memoryStore.conversations.find(c => {
    return (
      (c.participants && c.participants.includes(user1.id) && c.participants.includes(user2.id)) ||
      (c.participantEmails && c.participantEmails.includes(user1.email) && c.participantEmails.includes(user2.email))
    );
  });

  if (getStatus()) {
    try {
      const dbConv = await Conversation.findOne({
        participantEmails: { $all: [user1.email, user2.email] }
      }).lean();
      if (dbConv) {
        conv = { ...dbConv, id: dbConv.customId || dbConv._id.toString() };
      }
    } catch (e) {
      console.warn('Mongo find conversation error:', e.message);
    }
  }

  if (!conv) {
    conv = {
      id: generateId('conv'),
      customId: generateId('conv'),
      participants: pIds,
      participantEmails: pEmails,
      lastMessage: {
        text: '',
        senderId: '',
        senderEmail: '',
        senderName: '',
        timestamp: new Date().toISOString(),
        status: 'sent'
      },
      unreadCounts: {
        [user1.id]: 0,
        [user2.id]: 0
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    memoryStore.conversations.unshift(conv);
    saveStore();

    if (getStatus()) {
      try {
        const created = await Conversation.create({
          customId: conv.customId,
          participants: conv.participants,
          participantEmails: conv.participantEmails,
          lastMessage: conv.lastMessage,
          unreadCounts: conv.unreadCounts
        });
        conv.id = created.customId;
      } catch (e) {
        console.warn('Mongo create conversation error:', e.message);
      }
    }
  }

  return {
    ...conv,
    otherUser: user2
  };
};

const createGroupConversation = async ({
  currentUserId,
  groupName,
  teamId,
  teamName,
  departmentId = '',
  departmentName = '',
  participantEmails = []
}) => {
  if (!groupName || !groupName.trim()) {
    throw new Error('Group name is required');
  }
  if (!teamId && !teamName) {
    throw new Error('Team selection is required. Groups must be scoped team-wise.');
  }

  const allEligible = await getEligibleUsers();
  const creator = allEligible.find(u => u.id === currentUserId || u.email === (currentUserId || '').toLowerCase().trim());
  if (!creator) {
    throw new Error('Creator user identity could not be verified in database.');
  }

  // Find team in memoryStore or db
  const team = (memoryStore.teams || []).find(t => t.id === teamId || t.name === teamName);
  const resolvedTeamName = team?.name || teamName || 'Team';
  const resolvedTeamId = team?.id || teamId || '';
  const resolvedDeptName = team?.departmentName || departmentName || '';
  const resolvedDeptId = team?.departmentId || departmentId || '';

  // Get all members of this particular team
  const teamMembers = (memoryStore.members || []).filter(m =>
    (resolvedTeamId && m.teamId === resolvedTeamId) ||
    (resolvedTeamName && m.team && m.team.toLowerCase().trim() === resolvedTeamName.toLowerCase().trim())
  );

  // Collect participant emails from input, or default to all members of that team
  let emails = Array.isArray(participantEmails) && participantEmails.length > 0
    ? participantEmails.map(e => (e || '').toLowerCase().trim()).filter(Boolean)
    : teamMembers.map(m => (m.email || '').toLowerCase().trim()).filter(Boolean);

  // Always include creator
  if (!emails.includes(creator.email.toLowerCase().trim())) {
    emails.push(creator.email.toLowerCase().trim());
  }

  // Deduplicate emails
  emails = Array.from(new Set(emails));

  // Resolve participant IDs
  const pIds = emails.map(email => {
    const u = allEligible.find(usr => usr.email === email);
    if (u) return u.id;
    const m = (memoryStore.members || []).find(mem => (mem.email || '').toLowerCase().trim() === email);
    return m ? (m.userId || m.id) : email;
  });

  const pIdsDeduped = Array.from(new Set(pIds));

  // Initialize unread counts map
  const unreadMap = {};
  pIdsDeduped.forEach(id => {
    unreadMap[id] = 0;
  });

  const convId = generateId('conv');
  const groupConv = {
    id: convId,
    customId: convId,
    isGroup: true,
    groupName: groupName.trim(),
    teamId: resolvedTeamId,
    teamName: resolvedTeamName,
    departmentId: resolvedDeptId,
    departmentName: resolvedDeptName,
    groupAdmin: creator.id,
    groupAdminEmail: creator.email,
    participants: pIdsDeduped,
    participantEmails: emails,
    lastMessage: {
      text: `🎉 Team Group "${groupName.trim()}" created for ${resolvedTeamName}`,
      senderId: creator.id,
      senderEmail: creator.email,
      senderName: creator.name,
      timestamp: new Date().toISOString(),
      status: 'sent'
    },
    unreadCounts: unreadMap,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  if (!memoryStore.conversations) memoryStore.conversations = [];
  memoryStore.conversations.unshift(groupConv);
  saveStore();

  if (getStatus()) {
    try {
      await Conversation.create(groupConv);
    } catch (e) {
      console.warn('Mongo create group conversation error:', e.message);
    }
  }

  return {
    ...groupConv,
    otherUser: {
      id: resolvedTeamId || convId,
      name: groupConv.groupName,
      email: `${resolvedTeamName} Group`,
      role: 'group',
      avatar: groupConv.groupName.charAt(0).toUpperCase(),
      isGroup: true,
      team: resolvedTeamName,
      department: resolvedDeptName
    },
    unread: 0
  };
};

const getConversationsForUser = async (userId, userEmail = '') => {
  const allEligible = await getEligibleUsers();
  const currentUser = allEligible.find(u => u.id === userId || (userEmail && u.email === userEmail.toLowerCase().trim()));
  const myId = currentUser ? currentUser.id : userId;
  const myEmail = currentUser ? currentUser.email : (userEmail ? userEmail.toLowerCase().trim() : '');

  let list = [];

  if (getStatus()) {
    try {
      const dbConvs = await Conversation.find({
        $or: [
          { participants: myId },
          ...(myEmail ? [{ participantEmails: myEmail }] : [])
        ]
      }).sort({ 'lastMessage.timestamp': -1, updatedAt: -1 }).lean();
      list = dbConvs.map(c => ({
        ...c,
        id: c.customId || c._id.toString()
      }));
    } catch (e) {
      console.warn('Mongo conversations read error:', e.message);
    }
  }

  if (list.length === 0) {
    list = (memoryStore.conversations || []).filter(c => {
      return (
        (c.participants && c.participants.includes(myId)) ||
        (myEmail && c.participantEmails && c.participantEmails.includes(myEmail))
      );
    });
  }

  return list.map(c => {
    let unread = 0;
    if (c.unreadCounts) {
      if (typeof c.unreadCounts.get === 'function') {
        unread = c.unreadCounts.get(myId) || 0;
      } else {
        unread = c.unreadCounts[myId] || (myEmail ? c.unreadCounts[myEmail] : 0) || 0;
      }
    }

    if (c.isGroup) {
      return {
        ...c,
        id: c.customId || c.id || c._id?.toString(),
        isGroup: true,
        groupName: c.groupName || `${c.teamName || 'Team'} Group`,
        teamId: c.teamId || '',
        teamName: c.teamName || '',
        departmentId: c.departmentId || '',
        departmentName: c.departmentName || '',
        groupAdmin: c.groupAdmin || '',
        otherUser: {
          id: c.teamId || c.customId || c.id,
          name: c.groupName || `${c.teamName || 'Team'} Group`,
          email: c.teamName ? `${c.teamName} Group` : 'Team Group',
          role: 'group',
          avatar: (c.groupName || 'G').charAt(0).toUpperCase(),
          isGroup: true,
          team: c.teamName,
          department: c.departmentName
        },
        unread
      };
    }

    const otherEmail = (c.participantEmails || []).find(e => e !== myEmail) || '';
    const otherId = (c.participants || []).find(id => id !== myId) || '';
    const otherUser = allEligible.find(u => (otherEmail && u.email === otherEmail) || (otherId && u.id === otherId)) || {
      id: otherId,
      name: otherEmail ? otherEmail.split('@')[0] : 'User',
      email: otherEmail,
      role: 'user',
      avatar: (otherEmail || 'U').charAt(0).toUpperCase()
    };

    return {
      ...c,
      id: c.customId || c.id || c._id?.toString(),
      otherUser,
      unread
    };
  }).sort((a, b) => {
    const tA = new Date(a.lastMessage?.timestamp || a.updatedAt || 0).getTime();
    const tB = new Date(b.lastMessage?.timestamp || b.updatedAt || 0).getTime();
    return tB - tA;
  });
};

const getMessagesForConversation = async (conversationId, userId) => {
  let msgs = [];

  if (getStatus()) {
    try {
      const dbMsgs = await Message.find({ conversationId }).sort({ createdAt: 1 }).lean();
      msgs = dbMsgs.map(m => ({ ...m, id: m.customId || m._id.toString() }));
    } catch (e) {
      console.warn('Mongo messages read error:', e.message);
    }
  }

  if (msgs.length === 0) {
    msgs = (memoryStore.messages || []).filter(m => m.conversationId === conversationId);
  }

  return msgs;
};

const createMessage = async (data) => {
  const {
    conversationId,
    senderId,
    senderEmail,
    senderName,
    senderRole,
    recipientEmail,
    text,
    attachment,
    meeting
  } = data;

  if (!conversationId) throw new Error('Conversation ID is required');
  if (!senderId || !senderEmail) throw new Error('Sender identity is required');
  if (!text && !attachment && !meeting) throw new Error('Message content, attachment, or meeting is required');

  if (!memoryStore.conversations) memoryStore.conversations = [];
  let conv = memoryStore.conversations.find(c => c.id === conversationId || c.customId === conversationId);

  if (getStatus() && !conv) {
    try {
      const dbConv = await Conversation.findOne({ $or: [{ customId: conversationId }, { _id: conversationId }] }).lean();
      if (dbConv) conv = { ...dbConv, id: dbConv.customId || dbConv._id.toString() };
    } catch (e) {
      console.warn('Mongo find conv for message error:', e.message);
    }
  }

  const isGroup = Boolean(conv?.isGroup);
  const allEligible = await getEligibleUsers();

  let recipient = null;
  if (!isGroup) {
    recipient = allEligible.find(u => u.email === (recipientEmail || '').toLowerCase().trim());
    if (!recipient) {
      throw new Error(`Recipient with email "${recipientEmail}" is not registered.`);
    }
  }

  const senderUser = allEligible.find(u => u.id === senderId || u.email === (senderEmail || '').toLowerCase().trim());
  const resolvedSenderName = (senderName && senderName !== 'User' && senderName.trim())
    ? senderName.trim()
    : (senderUser?.name || senderEmail.split('@')[0]);
  const resolvedSenderRole = senderRole || (senderUser?.role || 'user');

  const newMsg = {
    id: generateId('msg'),
    customId: generateId('msg'),
    conversationId,
    senderId,
    senderEmail: senderEmail.toLowerCase().trim(),
    senderName: resolvedSenderName,
    senderRole: resolvedSenderRole,
    isGroup,
    recipientId: isGroup ? 'group' : recipient.id,
    recipientEmail: isGroup ? (conv?.teamName || 'group').toLowerCase().trim() : recipient.email.toLowerCase().trim(),
    recipientName: isGroup ? (conv?.groupName || 'Team Group') : recipient.name,
    text: text || '',
    attachment: attachment || null,
    meeting: meeting || null,
    status: 'sent',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const lastPreview = text || (meeting ? `📹 Meeting: ${meeting.title || 'Live Meeting'}` : (attachment ? `📎 Attachment: ${attachment.name}` : ''));

  if (!memoryStore.messages) memoryStore.messages = [];
  memoryStore.messages.push(newMsg);

  const convIndex = memoryStore.conversations.findIndex(c => c.id === conversationId || c.customId === conversationId);
  if (convIndex !== -1) {
    const memoryConv = memoryStore.conversations[convIndex];
    memoryConv.lastMessage = {
      text: lastPreview,
      senderId,
      senderEmail: newMsg.senderEmail,
      senderName: newMsg.senderName,
      timestamp: newMsg.createdAt,
      status: 'sent'
    };
    if (!memoryConv.unreadCounts) memoryConv.unreadCounts = {};
    if (isGroup && Array.isArray(memoryConv.participants)) {
      memoryConv.participants.forEach(pId => {
        if (pId !== senderId) {
          memoryConv.unreadCounts[pId] = (memoryConv.unreadCounts[pId] || 0) + 1;
        }
      });
    } else if (recipient) {
      const currentUnread = memoryConv.unreadCounts[recipient.id] || 0;
      memoryConv.unreadCounts[recipient.id] = currentUnread + 1;
    }
    memoryConv.updatedAt = newMsg.createdAt;
  }

  saveStore();

  if (getStatus()) {
    try {
      const created = await Message.create(newMsg);
      const incUpdate = {};
      if (isGroup && conv && Array.isArray(conv.participants)) {
        conv.participants.forEach(pId => {
          if (pId !== senderId) {
            incUpdate[`unreadCounts.${pId}`] = 1;
          }
        });
      } else if (recipient) {
        incUpdate[`unreadCounts.${recipient.id}`] = 1;
      }

      await Conversation.findOneAndUpdate(
        { $or: [{ customId: conversationId }, { _id: conversationId }] },
        {
          lastMessage: {
            text: lastPreview,
            senderId: newMsg.senderId,
            senderEmail: newMsg.senderEmail,
            senderName: newMsg.senderName,
            timestamp: new Date(),
            status: 'sent'
          },
          ...(Object.keys(incUpdate).length > 0 ? { $inc: incUpdate } : {}),
          updatedAt: new Date()
        }
      );
      newMsg.id = created.customId;
    } catch (e) {
      console.warn('Mongo create message error:', e.message);
    }
  }

  return {
    ...newMsg,
    conversation: conv
  };
};

const markConversationAsRead = async (conversationId, userId) => {
  if (!conversationId || !userId) return { success: true };

  if (memoryStore.messages) {
    memoryStore.messages.forEach(m => {
      if (m.conversationId === conversationId && m.recipientId === userId) {
        m.status = 'read';
        m.readAt = new Date().toISOString();
      }
    });
  }

  if (memoryStore.conversations) {
    const conv = memoryStore.conversations.find(c => c.id === conversationId || c.customId === conversationId);
    if (conv && conv.unreadCounts) {
      conv.unreadCounts[userId] = 0;
    }
  }
  saveStore();

  if (getStatus()) {
    try {
      await Message.updateMany(
        { conversationId, recipientId: userId, status: { $ne: 'read' } },
        { $set: { status: 'read', readAt: new Date() } }
      );
      await Conversation.findOneAndUpdate(
        { $or: [{ customId: conversationId }, { _id: conversationId }] },
        { $set: { [`unreadCounts.${userId}`]: 0 } }
      );
    } catch (e) {
      console.warn('Mongo mark messages read error:', e.message);
    }
  }

  return { success: true };
};

const getTotalUnreadMessagesCount = async (userId) => {
  const convs = await getConversationsForUser(userId);
  return convs.reduce((acc, c) => acc + (c.unread || 0), 0);
};

// =========================================================================
// --- Video Meeting & WebRTC Services (1-to-1 & 1-to-Many Private Calls) ---
// =========================================================================

const createMeeting = async (data) => {
  if (!memoryStore.meetings) {
    memoryStore.meetings = [];
  }

  const senderEmail = (data.senderEmail || '').toLowerCase().trim();
  const receiverEmail = (data.receiverEmail || '').toLowerCase().trim();

  // Idempotency check:
  // If a meeting for this exact request or matching sender/receiver/slot in last 5 min exists, return it
  const existing = memoryStore.meetings.find(m => {
    if (data.requestId && m.requestId === data.requestId) return true;
    if (data.customId && m.customId === data.customId) return true;
    if (
      senderEmail && receiverEmail &&
      m.senderEmail?.toLowerCase() === senderEmail &&
      m.receiverEmail?.toLowerCase() === receiverEmail &&
      m.date === data.date &&
      m.time === data.time &&
      Math.abs(new Date(m.createdAt || Date.now()).getTime() - Date.now()) < 5 * 60 * 1000
    ) {
      return true;
    }
    return false;
  });

  if (existing) {
    return existing;
  }

  const meetingId = 'm-' + Math.random().toString(36).substring(2, 8) + '-' + Date.now().toString(36);
  const joinUrl = `/meet/${meetingId}`;
  const requiresApproval = Boolean(data.requiresApproval);
  const status = requiresApproval ? 'Pending' : (data.status || 'Scheduled');

  const invitation = {
    id: 'inv-' + Math.random().toString(36).substring(2, 9),
    status: requiresApproval ? 'Pending' : 'Sent',
    joinUrl: joinUrl,
    issuedAt: new Date().toISOString()
  };

  const participants = Array.isArray(data.participants) && data.participants.length > 0
    ? data.participants
    : [
      { id: data.senderId || data.senderEmail, name: data.senderName, email: senderEmail, role: 'host' },
      { id: data.receiverId || data.receiverEmail, name: data.receiverName || 'Administration Office', email: receiverEmail, role: 'attendee' }
    ];

  const participantEmails = Array.isArray(data.participantEmails) && data.participantEmails.length > 0
    ? data.participantEmails.map(e => (e || '').toLowerCase().trim()).filter(Boolean)
    : [senderEmail, receiverEmail].filter(Boolean);

  let meetingSenderNumber = data.senderNumber || data.phone || '';
  if (!meetingSenderNumber) {
    const senderMember = (memoryStore.members || []).find(m => m.id === data.senderId || m.userId === data.senderId || m.email === senderEmail);
    if (senderMember && senderMember.phone) meetingSenderNumber = senderMember.phone;
  }
  let meetingReceiverNumber = data.receiverNumber || '';
  if (!meetingReceiverNumber) {
    const receiverMember = (memoryStore.members || []).find(m => m.id === data.receiverId || m.userId === data.receiverId || m.email === receiverEmail);
    if (receiverMember && receiverMember.phone) meetingReceiverNumber = receiverMember.phone;
  }

  const newMeeting = {
    id: generateId('meet'),
    customId: data.customId || ('meet_' + Date.now()),
    requestId: data.requestId || ('req_' + Date.now()),
    meetingId: meetingId,
    title: data.title || (data.purpose ? (data.purpose.length > 40 ? data.purpose.substring(0, 40) + '...' : data.purpose) : `Meeting with ${data.receiverName || data.receiverEmail || 'Administration'}`),
    type: data.type || 'one-to-one', // 'one-to-one' | 'one-to-many'
    senderId: data.senderId || data.senderEmail,
    senderName: data.senderName,
    senderEmail: senderEmail,
    senderNumber: meetingSenderNumber,
    receiverId: data.receiverId || data.receiverEmail,
    receiverName: data.receiverName || 'Administration Office',
    receiverEmail: receiverEmail,
    receiverNumber: meetingReceiverNumber,
    participants: participants,
    participantEmails: participantEmails,
    date: data.date,
    time: data.time,
    mode: data.mode || 'Online',
    location: data.mode === 'Online' ? joinUrl : (data.location || data.place || ''),
    joinUrl: joinUrl,
    purpose: data.purpose || '',
    status: status,
    requiresApproval: requiresApproval,
    invitationIssued: !requiresApproval,
    invitation: invitation,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  memoryStore.meetings.unshift(newMeeting);
  saveStore();

  if (getStatus()) {
    try {
      await Meeting.create(newMeeting);
    } catch (e) {
      console.warn('[Meeting] Mongo save warning:', e.message);
    }
  }

  // Sync to Appointment calendar so it appears in both users' dashboards
  try {
    const appointmentData = {
      title: newMeeting.title,
      requestedBy: `${newMeeting.senderName} (${newMeeting.senderEmail})`,
      userId: newMeeting.senderId,
      receiverId: newMeeting.receiverId,
      department: data.department || 'Administration',
      team: newMeeting.receiverName ? `With: ${newMeeting.receiverName}` : 'Administration',
      date: newMeeting.date,
      time: newMeeting.time,
      dateTimeDisplay: `${newMeeting.date} • ${newMeeting.time}`,
      location: newMeeting.mode === 'Online' ? joinUrl : newMeeting.location,
      purpose: newMeeting.purpose,
      status: newMeeting.status === 'Pending' ? 'Upcoming' : newMeeting.status,
      isToday: false,
      meetingId: newMeeting.meetingId,
      joinUrl: newMeeting.joinUrl,
      referenceId: data.referenceId || newMeeting.requestId || newMeeting.customId || ('MEET-' + newMeeting.meetingId),
      formType: 'Meeting',
      senderName: newMeeting.senderName,
      senderEmail: newMeeting.senderEmail,
      senderNumber: newMeeting.senderNumber || '',
      receiverName: newMeeting.receiverName,
      receiverEmail: newMeeting.receiverEmail,
      receiverNumber: newMeeting.receiverNumber || ''
    };
    await createAppointment(appointmentData);
  } catch (e) {
    console.warn('[Meeting] Appointment sync warning:', e.message);
  }

  // Issue invitation if no approval is required
  if (!requiresApproval) {
    await issueMeetingInvitation(newMeeting);
  }

  return newMeeting;
};

const issueMeetingInvitation = async (meeting) => {
  if (!meeting) return;

  // 1. Save persistent notification for the receiver (offline receivers will see it in bell on sign in)
  await createNotification({
    recipientRole: 'user',
    recipientUserId: meeting.receiverId,
    title: 'Video Meeting Invitation 📹',
    message: `${meeting.senderName} invited you to a video meeting: "${meeting.title}" on ${meeting.date} at ${meeting.time}`,
    link: meeting.joinUrl,
    actionUrl: meeting.joinUrl,
    meetingId: meeting.meetingId
  });

  // Also save persistent notification for Administrator
  await createNotification({
    recipientRole: 'admin',
    title: 'New Video Meeting Scheduled 📹',
    message: `${meeting.senderName} scheduled a meeting with ${meeting.receiverName}: "${meeting.title}" on ${meeting.date} at ${meeting.time}`,
    link: 'appointments',
    actionUrl: meeting.joinUrl,
    meetingId: meeting.meetingId
  }).catch(() => { });

  // Also save confirmation notification for sender
  await createNotification({
    recipientRole: 'user',
    recipientUserId: meeting.senderId,
    title: 'Meeting Scheduled',
    message: `Your meeting with ${meeting.receiverName} on ${meeting.date} at ${meeting.time} is scheduled. Join URL: ${meeting.joinUrl}`,
    link: meeting.joinUrl,
    actionUrl: meeting.joinUrl,
    meetingId: meeting.meetingId
  });

  // 2. Real-time Socket.IO notification to receiver's user rooms
  try {
    const { getIO } = require('../socket');
    const io = getIO();
    if (io) {
      if (meeting.receiverId) {
        io.to(`user_${meeting.receiverId}`).emit('meeting_invitation', {
          meeting,
          joinUrl: meeting.joinUrl,
          senderName: meeting.senderName,
          senderEmail: meeting.senderEmail
        });
        io.to(`user_${meeting.receiverId}`).emit('meeting_popup', {
          meeting,
          joinUrl: meeting.joinUrl,
          senderName: meeting.senderName
        });
      }
      if (meeting.receiverEmail) {
        io.to(`user_${meeting.receiverEmail}`).emit('meeting_invitation', {
          meeting,
          joinUrl: meeting.joinUrl,
          senderName: meeting.senderName,
          senderEmail: meeting.senderEmail
        });
        io.to(`user_${meeting.receiverEmail}`).emit('meeting_popup', {
          meeting,
          joinUrl: meeting.joinUrl,
          senderName: meeting.senderName
        });
      }
    }
  } catch (e) {
    console.warn('[Meeting] Socket notification warning:', e.message);
  }
};

const approveMeeting = async (meetingId, adminUser) => {
  if (!memoryStore.meetings) memoryStore.meetings = [];
  const meeting = memoryStore.meetings.find(m => m.meetingId === meetingId || m.id === meetingId);
  if (!meeting) throw new Error('Meeting not found');

  if (meeting.status === 'Scheduled' && meeting.invitationIssued) {
    return meeting;
  }

  meeting.status = 'Scheduled';
  meeting.invitationIssued = true;
  if (meeting.invitation) {
    meeting.invitation.status = 'Sent';
    meeting.invitation.issuedAt = new Date().toISOString();
  }
  meeting.updatedAt = new Date().toISOString();
  saveStore();

  if (getStatus()) {
    try {
      await Meeting.findOneAndUpdate(
        { meetingId: meeting.meetingId },
        { status: 'Scheduled', invitationIssued: true }
      );
    } catch (e) { }
  }

  await issueMeetingInvitation(meeting);
  return meeting;
};

const getMeetingById = async (meetingId) => {
  if (!memoryStore.meetings) memoryStore.meetings = [];
  const m = memoryStore.meetings.find(x => x.meetingId === meetingId || x.id === meetingId);
  if (m) return m;

  if (getStatus()) {
    try {
      const doc = await Meeting.findOne({ $or: [{ meetingId }, { customId: meetingId }] }).lean();
      if (doc) return { ...doc, id: doc.customId || doc._id.toString() };
    } catch (e) { }
  }
  return null;
};

const getMeetingsForUser = async (user) => {
  if (!memoryStore.meetings) memoryStore.meetings = [];
  if (!user) return [];

  const email = (user.email || '').toLowerCase().trim();
  const id = user.id || '';
  const isAdmin = user.role === 'admin';

  return memoryStore.meetings.filter(m => {
    if (isAdmin) return true;
    if (id && (m.senderId === id || m.receiverId === id)) return true;
    if (email && (m.senderEmail?.toLowerCase() === email || m.receiverEmail?.toLowerCase() === email)) return true;
    if (m.participantEmails && m.participantEmails.includes(email)) return true;
    if (m.participants && m.participants.some(p => (id && p.id === id) || (email && p.email?.toLowerCase() === email))) return true;
    return false;
  });
};

const endMeeting = async (meetingId) => {
  const normId = String(meetingId || '').trim().toUpperCase();
  if (!memoryStore.meetings) memoryStore.meetings = [];
  const m = memoryStore.meetings.find(x => 
    String(x.meetingId || '').toUpperCase() === normId ||
    String(x.id || '').toUpperCase() === normId ||
    String(x.customId || '').toUpperCase() === normId
  );
  if (m) {
    m.status = 'ended';
    m.endedAt = new Date().toISOString();
  }

  // Also dynamically update any chat messages that reference this meeting
  if (Array.isArray(memoryStore.messages)) {
    memoryStore.messages.forEach(msg => {
      if (msg.meeting) {
        const msgMId = String(msg.meeting.id || msg.meeting.meetingId || '').trim().toUpperCase();
        if (msgMId === normId) {
          msg.meeting.status = 'ended';
          msg.meeting.endedAt = new Date().toISOString();
        }
      }
    });
  }

  if (getStatus()) {
    try {
      await Meeting.updateMany(
        { $or: [
          { meetingId: { $regex: new RegExp(`^${normId}$`, 'i') } },
          { customId: { $regex: new RegExp(`^${normId}$`, 'i') } },
          { _id: normId }
        ]},
        { $set: { status: 'ended', endedAt: new Date() } }
      );
      if (typeof Message !== 'undefined') {
        await Message.updateMany(
          { $or: [
            { 'meeting.id': { $regex: new RegExp(`^${normId}$`, 'i') } },
            { 'meeting.meetingId': { $regex: new RegExp(`^${normId}$`, 'i') } }
          ]},
          { $set: { 'meeting.status': 'ended', 'meeting.endedAt': new Date() } }
        );
      }
    } catch (e) {
      console.warn('Mongo endMeeting error:', e.message);
    }
  }
  saveStore();
  return m;
};

const verifyMeetingAccess = async (meetingId, user) => {
  if (!user || (!user.id && !user.email)) {
    return { allowed: false, reason: 'Authentication required. Please log in.' };
  }

  let meeting = await getMeetingById(meetingId);
  if (!meeting) {
    // Check if referenced in any chat message
    const msgWithMeeting = (memoryStore.messages || []).find(m => m.meeting && (m.meeting.id === meetingId || m.meeting.meetingId === meetingId));
    if (msgWithMeeting && msgWithMeeting.meeting) {
      meeting = {
        id: meetingId,
        meetingId: meetingId,
        title: msgWithMeeting.meeting.title || 'Online Video Meeting',
        type: msgWithMeeting.meeting.type || 'group',
        status: 'Active',
        senderId: msgWithMeeting.senderId,
        senderEmail: msgWithMeeting.senderEmail,
        senderName: msgWithMeeting.senderName,
        createdAt: msgWithMeeting.createdAt || new Date().toISOString()
      };
      if (!memoryStore.meetings) memoryStore.meetings = [];
      memoryStore.meetings.push(meeting);
      saveStore();
    } else if (meetingId.startsWith('MEET-') || meetingId.startsWith('m-')) {
      meeting = {
        id: meetingId,
        meetingId: meetingId,
        title: `Team Meeting (${meetingId})`,
        type: 'group',
        status: 'Active',
        senderId: user.id,
        senderEmail: user.email,
        senderName: user.name,
        createdAt: new Date().toISOString()
      };
      if (!memoryStore.meetings) memoryStore.meetings = [];
      memoryStore.meetings.push(meeting);
      saveStore();
    }
  }

  if (!meeting) {
    return { allowed: false, reason: 'Meeting not found.' };
  }

  return { allowed: true, meeting, role: user.role || 'participant' };
};

const getTurnCredentials = (userId) => {
  const iceServers = [
    {
      urls: [
        'stun:stun.l.google.com:19302',
        'stun:stun1.l.google.com:19302',
        'stun:stun2.l.google.com:19302',
        'stun:stun3.l.google.com:19302',
        'stun:stun4.l.google.com:19302'
      ]
    }
  ];

  if (process.env.COTURN_HOST && process.env.COTURN_HOST !== 'turn.workhub.local') {
    const coturnHost = process.env.COTURN_HOST;
    const secret = process.env.COTURN_SECRET || 'workhub_coturn_secret_key_2026';
    const ttl = 24 * 3600; // 24 hours
    const expiry = Math.floor(Date.now() / 1000) + ttl;
    const username = `${expiry}:${userId || 'anonymous'}`;
    const hmac = crypto.createHmac('sha1', secret);
    hmac.update(username);
    const credential = hmac.digest('base64');

    iceServers.push({
      urls: [
        `turn:${coturnHost}:3478?transport=udp`,
        `turn:${coturnHost}:3478?transport=tcp`,
        `turns:${coturnHost}:5349?transport=tcp`
      ],
      username,
      credential
    });
  }

  return { iceServers };
};

// =========================================================================
// ASSIGNMENT EDITING (With Assignee Time Attribution & Audit History)
// =========================================================================
const editAssignment = async (id, data, user = { name: 'Admin', role: 'admin' }) => {
  if (!memoryStore.assignments) memoryStore.assignments = [];
  if (!memoryStore.userWorkspace) memoryStore.userWorkspace = { assignedWork: [] };

  // 1. Locate user task in workspace by id, customId, taskId, assignmentId, or title
  let userTaskIndex = memoryStore.userWorkspace.assignedWork.findIndex(
    w => w.id === id || w.customId === id || w.taskId === id || w.assignmentId === id ||
         (data.taskId && (w.taskId === data.taskId || w.id === data.taskId || w.customId === data.taskId)) ||
         (data.id && (w.id === data.id || w.taskId === data.id))
  );
  let oldUserTask = userTaskIndex >= 0 ? memoryStore.userWorkspace.assignedWork[userTaskIndex] : null;

  // 2. Locate assignment by id, customId, taskId, or via oldUserTask
  let assignIndex = memoryStore.assignments.findIndex(
    a => a.id === id || a.customId === id || a.taskId === id ||
         (data.taskId && (a.id === data.taskId || a.customId === data.taskId)) ||
         (data.id && (a.id === data.id || a.customId === data.id))
  );
  if (assignIndex < 0 && oldUserTask) {
    assignIndex = memoryStore.assignments.findIndex(a =>
      a.id === oldUserTask.taskId ||
      a.id === oldUserTask.id ||
      a.id === oldUserTask.assignmentId ||
      a.customId === oldUserTask.taskId ||
      a.customId === oldUserTask.id ||
      (oldUserTask.title && a.workTitle && a.workTitle.trim().toLowerCase() === oldUserTask.title.trim().toLowerCase())
    );
  }
  let oldAssign = assignIndex >= 0 ? memoryStore.assignments[assignIndex] : null;

  // 3. If userTask wasn't found initially, try matching via oldAssign
  if (userTaskIndex < 0 && oldAssign) {
    userTaskIndex = memoryStore.userWorkspace.assignedWork.findIndex(w =>
      w.taskId === oldAssign.id ||
      w.taskId === oldAssign.customId ||
      w.id === oldAssign.id ||
      w.id === oldAssign.customId ||
      w.assignmentId === oldAssign.id ||
      (oldAssign.workTitle && w.title && w.title.trim().toLowerCase() === oldAssign.workTitle.trim().toLowerCase())
    );
    oldUserTask = userTaskIndex >= 0 ? memoryStore.userWorkspace.assignedWork[userTaskIndex] : null;
  }

  const activityLog = Array.isArray(oldUserTask?.activityLog) ? [...oldUserTask.activityLog] : [];

  // 1. Audit Deadline Change (old date, new date, changed by)
  const oldDueDate = oldAssign?.dueDate || oldUserTask?.dueDate || '';
  const newDueDate = data.dueDate || oldDueDate;
  if (data.dueDate && data.dueDate !== oldDueDate) {
    activityLog.push({
      id: generateId('act'),
      type: 'deadline_change',
      performedBy: user.name || 'Admin',
      performedByRole: user.role || 'admin',
      performedById: user.id || '',
      timestamp: new Date(),
      details: { oldDate: oldDueDate, newDate: newDueDate },
      message: `Deadline updated from "${oldDueDate}" to "${newDueDate}" by ${user.name || 'Admin'}`
    });
  }

  // 2. Audit Assignee Change (Preserve earlier hours credited to original performer)
  const oldAssigneeName = oldAssign?.assigneeName || oldUserTask?.assigneeName || oldUserTask?.assignedTo || 'Assignee';
  const newAssigneeName = data.assigneeName || oldAssigneeName;
  const oldAssigneeId = oldAssign?.assigneeId || oldUserTask?.assigneeId || oldUserTask?.userId || '';
  const newAssigneeId = data.assigneeId || oldAssigneeId;
  const oldAssigneeEmail = oldAssign?.assigneeEmail || oldUserTask?.assigneeEmail || '';
  const newAssigneeEmail = data.assigneeEmail || oldAssigneeEmail;

  if (data.assigneeId && data.assigneeId !== oldAssigneeId) {
    activityLog.push({
      id: generateId('act'),
      type: 'assignee_change',
      performedBy: user.name || 'Admin',
      performedByRole: user.role || 'admin',
      performedById: user.id || '',
      timestamp: new Date(),
      details: { oldAssignee: oldAssigneeName, newAssignee: newAssigneeName, oldAssigneeId, newAssigneeId },
      message: `Task reassigned from ${oldAssigneeName} to ${newAssigneeName} by ${user.name || 'Admin'}`
    });
  }

  // 3. Status Change
  const oldStatus = oldAssign?.status || oldUserTask?.status || 'In Progress';
  const newStatus = data.status || oldStatus;
  if (data.status && data.status !== oldStatus) {
    activityLog.push({
      id: generateId('act'),
      type: 'status_change',
      performedBy: user.name || 'Admin',
      performedByRole: user.role || 'admin',
      performedById: user.id || '',
      timestamp: new Date(),
      details: { oldStatus, newStatus },
      message: `Status changed from ${oldStatus} to ${newStatus} by ${user.name || 'Admin'}`
    });
  }

  // 4. Progress Change Audit
  const oldProgress = oldUserTask?.progress !== undefined ? Number(oldUserTask.progress) : (oldStatus === 'Completed' ? 100 : 60);
  const newProgress = data.progress !== undefined ? Number(data.progress) : (newStatus === 'Completed' ? 100 : oldProgress);
  if (data.progress !== undefined && newProgress !== oldProgress) {
    activityLog.push({
      id: generateId('act'),
      type: 'progress_update',
      performedBy: user.name || 'User',
      performedByRole: user.role || 'user',
      performedById: user.id || '',
      timestamp: new Date(),
      details: { oldProgress, newProgress },
      message: `Progress updated from ${oldProgress}% to ${newProgress}% by ${user.name || 'User'}`
    });
  }

  // Preserve comments and time logs intact
  const comments = Array.isArray(oldUserTask?.comments) ? oldUserTask.comments : [];
  const timerState = oldUserTask?.timerState || { status: 'idle', activeSeconds: 0, pausedSeconds: 0, isPaused: false };

  // Dynamic date and timestamp tracking for Stepper levels
  const now = new Date();
  const dateISO = now.toISOString();
  const dateStr = now.toISOString().split('T')[0];
  const formattedTime = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  const fullDateTime = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + ', ' + formattedTime;

  let workStartedDate = oldUserTask?.workStartedDate;
  let workStartedTime = oldUserTask?.workStartedTime;
  let workStartedAt = oldUserTask?.workStartedAt;
  if (!workStartedDate && (data.level === 'started' || newStatus === 'In Progress' || newStatus === 'Under Review' || newStatus === 'Completed')) {
    workStartedDate = 'In Progress';
    workStartedTime = formattedTime;
    workStartedAt = dateISO;
    if (!activityLog.some(a => a.type === 'started')) {
      activityLog.push({
        id: generateId('act'),
        type: 'started',
        performedBy: user.name || 'User',
        performedByRole: user.role || 'user',
        performedById: user.id || '',
        timestamp: now,
        details: { progress: newProgress },
        message: `Work started by ${user.name || 'User'}`
      });
    }
  }

  let submittedDate = oldUserTask?.submittedDate;
  let submittedTime = oldUserTask?.submittedTime;
  let submittedAt = oldUserTask?.submittedAt;
  if (!submittedDate && (data.level === 'submitted' || newStatus === 'Under Review' || newStatus === 'Completed')) {
    submittedDate = 'Under Review';
    submittedTime = formattedTime;
    submittedAt = dateISO;
    if (!activityLog.some(a => a.type === 'deliverable_submitted')) {
      activityLog.push({
        id: generateId('act'),
        type: 'deliverable_submitted',
        performedBy: user.name || 'User',
        performedByRole: user.role || 'user',
        performedById: user.id || '',
        timestamp: now,
        details: { progress: newProgress },
        message: `Work deliverables submitted for review by ${user.name || 'User'}`
      });
    }
  }

  let completedDate = oldUserTask?.completedDate;
  let completedTime = oldUserTask?.completedTime;
  let completedAt = oldUserTask?.completedAt;
  if (data.level === 'completed' || newStatus === 'Completed') {
    completedDate = fullDateTime;
    completedTime = formattedTime;
    completedAt = dateISO;
    if (!activityLog.some(a => a.type === 'completed')) {
      activityLog.push({
        id: generateId('act'),
        type: 'completed',
        performedBy: user.name || 'User',
        performedByRole: user.role || 'user',
        performedById: user.id || '',
        timestamp: now,
        details: { progress: 100 },
        message: `Work marked completed by ${user.name || 'User'}`
      });
    }
  }

  // Work Title, Description, Priority, Role, Team & Department preservation
  const resolvedWorkTitle = data.title || data.workTitle || oldAssign?.workTitle || oldUserTask?.title || 'Assigned Work';
  const resolvedWorkDesc = data.description !== undefined ? data.description : (data.workDescription !== undefined ? data.workDescription : (oldAssign?.workDescription !== undefined ? oldAssign.workDescription : (oldUserTask?.description || '')));
  const resolvedPriority = data.priority || oldAssign?.priority || oldUserTask?.priority || 'Medium';
  const resolvedRole = data.role || oldAssign?.role || oldUserTask?.role || 'Developer';
  const resolvedTeamId = data.teamId !== undefined ? data.teamId : (oldAssign?.teamId || oldUserTask?.teamId || 'general');
  const resolvedDeptId = data.departmentId !== undefined ? data.departmentId : (oldAssign?.departmentId || oldUserTask?.departmentId || '');
  const resolvedTeam = data.team || oldUserTask?.team || oldAssign?.team || 'Team';
  const resolvedDept = data.department || oldUserTask?.department || oldAssign?.department || 'General';

  // Update Assignment
  const targetAssignId = oldAssign?.id || (oldUserTask ? (oldUserTask.assignmentId || oldUserTask.taskId || oldUserTask.id) : id);
  const updatedAssign = {
    ...(oldAssign || {}),
    id: targetAssignId,
    customId: oldAssign?.customId || targetAssignId,
    workTitle: resolvedWorkTitle,
    workDescription: resolvedWorkDesc,
    priority: resolvedPriority,
    dueDate: newDueDate,
    status: newStatus,
    progress: newProgress,
    role: resolvedRole,
    teamId: resolvedTeamId,
    departmentId: resolvedDeptId,
    assigneeId: newAssigneeId,
    assigneeName: newAssigneeName,
    assigneeEmail: newAssigneeEmail,
    updatedAt: new Date().toISOString()
  };

  if (assignIndex >= 0) {
    memoryStore.assignments[assignIndex] = updatedAssign;
  } else {
    memoryStore.assignments.unshift(updatedAssign);
  }

  // Update UserTask
  const targetUserTaskId = oldUserTask?.id || id;
  const updatedUserTask = {
    ...(oldUserTask || {}),
    id: targetUserTaskId,
    taskId: oldUserTask?.taskId || updatedAssign.id,
    assignmentId: updatedAssign.id,
    title: resolvedWorkTitle,
    description: resolvedWorkDesc,
    priority: resolvedPriority,
    dueDate: updatedAssign.dueDate,
    status: updatedAssign.status,
    progress: newProgress,
    team: resolvedTeam,
    teamId: resolvedTeamId,
    department: resolvedDept,
    departmentId: resolvedDeptId,
    userId: newAssigneeId || oldUserTask?.userId || 'usr-user',
    assigneeId: newAssigneeId,
    assigneeName: newAssigneeName,
    assigneeEmail: newAssigneeEmail,
    workStartedDate: workStartedDate || oldUserTask?.workStartedDate,
    workStartedTime: workStartedTime || oldUserTask?.workStartedTime,
    workStartedAt: workStartedAt || oldUserTask?.workStartedAt,
    submittedDate: submittedDate || oldUserTask?.submittedDate,
    submittedTime: submittedTime || oldUserTask?.submittedTime,
    submittedAt: submittedAt || oldUserTask?.submittedAt,
    completedDate: completedDate || oldUserTask?.completedDate,
    completedTime: completedTime || oldUserTask?.completedTime,
    completedAt: completedAt || oldUserTask?.completedAt,
    comments, // PRESERVED
    timerState, // PRESERVED
    activityLog, // AUDITED
    updatedAt: new Date().toISOString()
  };

  if (userTaskIndex >= 0) {
    memoryStore.userWorkspace.assignedWork[userTaskIndex] = updatedUserTask;
  } else {
    memoryStore.userWorkspace.assignedWork.unshift(updatedUserTask);
  }

  // Auto-log into "Today's Work Done" when completed so Manager and Admin immediately see it
  if (newStatus === 'Completed' || data.level === 'completed') {
    const teamObj = (memoryStore.teams || []).find(tm => (updatedUserTask && tm.name === updatedUserTask.team) || (updatedAssign && tm.id === updatedAssign.teamId));
    const completedTeamId = teamObj ? teamObj.id : (updatedAssign.teamId || updatedUserTask.teamId || null);

    if (completedTeamId) {
      if (!memoryStore.workDone) memoryStore.workDone = [];
      const alreadyLogged = memoryStore.workDone.some(w => w.taskId === updatedUserTask.taskId || w.taskId === id || (w.title === updatedUserTask.title && w.teamId === completedTeamId));
      if (!alreadyLogged) {
        const newWorkDone = {
          id: generateId('wd'),
          teamId: completedTeamId,
          taskId: updatedUserTask.taskId || id,
          title: updatedUserTask.title || 'Work Completed',
          details: updatedUserTask.description || 'Work deliverables completed and verified.',
          completedBy: updatedUserTask.assigneeName || user.name || 'Team Member',
          date: dateStr,
          time: formattedTime,
          submittedTime: formattedTime,
          submittedDate: fullDateTime,
          submittedAt: dateISO
        };
        memoryStore.workDone.unshift(newWorkDone);
      }
    }
  } else {
    // If status moved back from Completed to in-progress or not-started, remove from today's completed log
    if (memoryStore.workDone) {
      memoryStore.workDone = memoryStore.workDone.filter(w =>
        w.taskId !== updatedUserTask.taskId &&
        w.taskId !== updatedAssign.id &&
        w.taskId !== id &&
        w.id !== id
      );
    }
  }

  saveStore();

  // MongoDB Atlas sync
  if (getStatus()) {
    try {
      await Assignment.findOneAndUpdate(
        buildIdQuery(updatedAssign.id),
        { $set: updatedAssign },
        { new: true, upsert: true }
      );
      await UserTask.findOneAndUpdate(
        { $or: [{ customId: updatedUserTask.id }, { taskId: updatedUserTask.taskId }, { _id: mongoose.Types.ObjectId.isValid(updatedUserTask.id) ? updatedUserTask.id : null }] },
        { $set: updatedUserTask },
        { new: true, upsert: true }
      );
    } catch (e) {
      console.warn('Mongo assignment update error:', e.message);
    }
  }

  return { assignment: updatedAssign, userTask: updatedUserTask };
};

// =========================================================================
// ATTENDANCE TRACKING (Punch In / Punch Out & 11:59 PM Auto Midnight Punch Out)
// =========================================================================

// Helper to compute midnight (23:59:59) punch-out timestamp for a date and timezone
const computeMidnightPunchOut = (dateStr, punchIn, tzOffset) => {
  // If timezone offset is provided (in minutes, e.g. -330 for UTC+05:30):
  if (typeof tzOffset === 'number' && !isNaN(tzOffset)) {
    const parts = (dateStr || '').split('-').map(Number);
    if (parts.length === 3) {
      const [y, m, d] = parts;
      // In local timezone, 23:59:59 converted to UTC:
      const utcMs = Date.UTC(y, m - 1, d, 23, 59, 59) + (tzOffset * 60 * 1000);
      const res = new Date(utcMs);
      if (!isNaN(res.getTime())) {
        return res;
      }
    }
  }

  // Fallback 1: align to end-of-day of punchIn Date
  if (punchIn) {
    const pIn = new Date(punchIn);
    if (!isNaN(pIn.getTime())) {
      const res = new Date(pIn);
      res.setHours(23, 59, 59, 0);
      if (res.getTime() >= pIn.getTime()) {
        return res;
      }
    }
  }

  // Fallback 2: parse ISO local representation
  try {
    const d = new Date(`${dateStr}T23:59:59`);
    if (!isNaN(d.getTime())) return d;
  } catch {}

  const fb = new Date();
  fb.setHours(23, 59, 59, 0);
  return fb;
};

// Auto Midnight Punch Out: auto-closes any unclosed punch sessions when clock passes 11:59 PM
const checkAndApplyAutoMidnightPunchOut = async (clientTzOffset = null) => {
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  let changed = false;

  if (!memoryStore.attendance) memoryStore.attendance = [];

  // 1. Process all in-memory records
  for (const record of memoryStore.attendance) {
    if (!record || !record.date) continue;

    const isPastDate = record.date < todayStr;
    const isToday = record.date === todayStr;
    const hasUnclosedPunch = Array.isArray(record.punches) && record.punches.some(p => !p.punchOut);
    const isOpen = record.status === 'punched_in' || hasUnclosedPunch;

    if (!isOpen) continue;

    const tz = (record.timezoneOffset !== undefined && record.timezoneOffset !== null) ? record.timezoneOffset : clientTzOffset;
    let shouldAutoPunchOut = isPastDate;

    if (isToday) {
      // Check if current time has passed 23:59:59 of today
      const endOfDay = computeMidnightPunchOut(record.date, record.punches?.[0]?.punchIn, tz);
      if (now.getTime() >= endOfDay.getTime()) {
        shouldAutoPunchOut = true;
      }
    }

    if (shouldAutoPunchOut) {
      let recalculatedTotal = 0;
      if (Array.isArray(record.punches)) {
        for (const p of record.punches) {
          if (!p.punchOut) {
            const pInTime = new Date(p.punchIn).getTime();
            const autoOut = computeMidnightPunchOut(record.date, p.punchIn, tz);
            p.punchOut = autoOut;
            p.autoPunchedOut = true;
            const dur = Math.max(0, Math.round((autoOut.getTime() - pInTime) / 1000));
            p.durationSeconds = dur;
          }
          recalculatedTotal += (p.durationSeconds || 0);
        }
      }

      record.totalSeconds = recalculatedTotal;
      record.status = 'punched_out';
      record.autoPunchedOut = true;
      if (tz !== null && tz !== undefined) record.timezoneOffset = tz;
      changed = true;

      if (getStatus()) {
        try {
          await Attendance.findOneAndUpdate(
            { date: record.date, userId: record.userId },
            { $set: record },
            { new: true }
          );
        } catch (e) {
          console.warn('Mongo autoPunchOut update error:', e.message);
        }
      }
    }
  }

  // 2. Query MongoDB for any unclosed past records
  if (getStatus()) {
    try {
      const openDbRecords = await Attendance.find({
        $or: [
          { status: 'punched_in', date: { $lt: todayStr } },
          { 'punches.punchOut': null, date: { $lt: todayStr } }
        ]
      });

      for (const doc of openDbRecords) {
        let docChanged = false;
        let total = 0;
        const tz = (doc.timezoneOffset !== undefined && doc.timezoneOffset !== null) ? doc.timezoneOffset : clientTzOffset;

        if (Array.isArray(doc.punches)) {
          for (const p of doc.punches) {
            if (!p.punchOut) {
              const pInTime = new Date(p.punchIn).getTime();
              const autoOut = computeMidnightPunchOut(doc.date, p.punchIn, tz);
              p.punchOut = autoOut;
              p.autoPunchedOut = true;
              p.durationSeconds = Math.max(0, Math.round((autoOut.getTime() - pInTime) / 1000));
              docChanged = true;
            }
            total += (p.durationSeconds || 0);
          }
        }

        if (doc.status === 'punched_in' || docChanged) {
          doc.status = 'punched_out';
          doc.autoPunchedOut = true;
          doc.totalSeconds = total;
          if (tz !== null && tz !== undefined) doc.timezoneOffset = tz;
          await doc.save();
          changed = true;

          const memRec = memoryStore.attendance.find(a => a.date === doc.date && a.userId === doc.userId);
          if (memRec) {
            Object.assign(memRec, doc.toObject());
          }
        }
      }
    } catch (e) {
      console.warn('Mongo check unclosed attendance error:', e.message);
    }
  }

  if (changed) {
    saveStore();
    try {
      const { broadcast } = require('../socket');
      broadcast('ATTENDANCE_UPDATED', { type: 'auto_midnight_punch_out' });
    } catch {}
  }

  return { changed };
};

// Periodic background runner: checks for midnight auto punch outs every 30 seconds
setInterval(() => {
  checkAndApplyAutoMidnightPunchOut().catch(err => {
    console.warn('[AutoPunchOut] Background tick notice:', err.message);
  });
}, 30000);

// Helper to compute effective local date string YYYY-MM-DD from client timezone offset
const getEffectiveDate = (timezoneOffset = null) => {
  const now = new Date();
  if (typeof timezoneOffset === 'number' && !isNaN(timezoneOffset)) {
    const localMs = now.getTime() - (timezoneOffset * 60 * 1000);
    const d = new Date(localMs);
    if (!isNaN(d.getTime())) {
      return d.toISOString().split('T')[0];
    }
  }
  return now.toISOString().split('T')[0];
};

const getTodayAttendance = async (userId, userEmail, timezoneOffset = null) => {
  await checkAndApplyAutoMidnightPunchOut(timezoneOffset);
  const today = getEffectiveDate(timezoneOffset);
  const utcToday = new Date().toISOString().split('T')[0];
  if (!memoryStore.attendance) memoryStore.attendance = [];

  // 1. First look for active punched_in record for this user (session is actively running)
  let record = memoryStore.attendance.find(a =>
    (a.userId === userId || (userEmail && a.userEmail && a.userEmail.toLowerCase() === userEmail.toLowerCase())) &&
    a.status === 'punched_in'
  );

  // 2. If not punched in, look for today's record (matching effective local date or UTC date)
  if (!record) {
    record = memoryStore.attendance.find(a =>
      (a.date === today || a.date === utcToday) &&
      (a.userId === userId || (userEmail && a.userEmail && a.userEmail.toLowerCase() === userEmail.toLowerCase()))
    );
  }

  if (getStatus()) {
    try {
      let dbRec = await Attendance.findOne({
        $or: [{ userId }, { userEmail: userEmail ? userEmail.toLowerCase() : '' }],
        status: 'punched_in'
      }).lean();

      if (!dbRec) {
        dbRec = await Attendance.findOne({
          date: { $in: [today, utcToday] },
          $or: [{ userId }, { userEmail: userEmail ? userEmail.toLowerCase() : '' }]
        }).lean();
      }

      if (dbRec) record = { ...dbRec, id: dbRec.customId || dbRec._id.toString() };
    } catch (e) {
      console.warn('Mongo attendance read error:', e.message);
    }
  }

  if (!record) {
    return {
      userId,
      userEmail,
      date: today,
      status: 'punched_out',
      punches: [],
      totalSeconds: 0,
      currentPunchIn: null
    };
  }

  // Calculate live running seconds accurately: completed punches + active punch duration
  let completedSeconds = 0;
  let activePunch = null;

  if (Array.isArray(record.punches) && record.punches.length > 0) {
    for (const p of record.punches) {
      if (!p.punchIn) continue;
      const inTime = new Date(p.punchIn).getTime();
      if (isNaN(inTime)) continue;

      if (p.punchOut) {
        const outTime = new Date(p.punchOut).getTime();
        const dur = (p.durationSeconds && p.durationSeconds > 0)
          ? p.durationSeconds
          : Math.max(0, Math.round((outTime - inTime) / 1000));
        completedSeconds += dur;
      } else {
        // Active unclosed punch
        activePunch = p.punchIn;
        const elapsed = Math.max(0, Math.round((Date.now() - inTime) / 1000));
        completedSeconds += elapsed;
      }
    }
  } else {
    completedSeconds = record.totalSeconds || 0;
  }

  return {
    ...record,
    totalSeconds: completedSeconds,
    currentPunchIn: activePunch
  };
};

const recordPunchIn = async ({ userId, userEmail, userName, teamId, teamName, departmentId, departmentName, timezoneOffset = null }) => {
  await checkAndApplyAutoMidnightPunchOut(timezoneOffset);
  const today = getEffectiveDate(timezoneOffset);
  const now = new Date();
  if (!memoryStore.attendance) memoryStore.attendance = [];

  let record = memoryStore.attendance.find(a =>
    (a.userId === userId || (userEmail && a.userEmail && a.userEmail.toLowerCase() === userEmail.toLowerCase())) &&
    (a.status === 'punched_in' || a.date === today)
  );

  if (getStatus() && !record) {
    try {
      const dbRec = await Attendance.findOne({
        $or: [
          { status: 'punched_in', $or: [{ userId }, { userEmail: userEmail ? userEmail.toLowerCase() : '' }] },
          { date: today, $or: [{ userId }, { userEmail: userEmail ? userEmail.toLowerCase() : '' }] }
        ]
      }).lean();
      if (dbRec) record = dbRec;
    } catch (e) {
      console.warn('Mongo find record error:', e.message);
    }
  }

  if (!record) {
    record = {
      id: generateId('att'),
      customId: generateId('att'),
      userId,
      userEmail: (userEmail || '').toLowerCase(),
      userName: userName || 'Team Member',
      teamId: teamId || '',
      teamName: teamName || '',
      departmentId: departmentId || '',
      departmentName: departmentName || '',
      date: today,
      status: 'punched_in',
      timezoneOffset: timezoneOffset !== null && timezoneOffset !== undefined ? timezoneOffset : 0,
      autoPunchedOut: false,
      punches: [{ punchIn: now, punchOut: null, durationSeconds: 0, autoPunchedOut: false }],
      totalSeconds: 0
    };
    memoryStore.attendance.unshift(record);
  } else {
    if (timezoneOffset !== null && timezoneOffset !== undefined) {
      record.timezoneOffset = timezoneOffset;
    }
    // If not already punched in, add new punch to continue session
    if (record.status !== 'punched_in') {
      record.status = 'punched_in';
      record.autoPunchedOut = false;
      if (!Array.isArray(record.punches)) record.punches = [];
      record.punches.push({ punchIn: now, punchOut: null, durationSeconds: 0, autoPunchedOut: false });
    }
  }

  saveStore();

  if (getStatus()) {
    try {
      await Attendance.findOneAndUpdate(
        { date: record.date || today, userId },
        { $set: record },
        { upsert: true, new: true }
      );
    } catch (e) {
      console.warn('Mongo punch in error:', e.message);
    }
  }

  return getTodayAttendance(userId, userEmail, timezoneOffset);
};

const recordPunchOut = async ({ userId, userEmail, timezoneOffset = null }) => {
  await checkAndApplyAutoMidnightPunchOut(timezoneOffset);
  const today = getEffectiveDate(timezoneOffset);
  const now = new Date();
  if (!memoryStore.attendance) memoryStore.attendance = [];

  // Look for active punched_in record or today's record
  let record = memoryStore.attendance.find(a =>
    (a.userId === userId || (userEmail && a.userEmail && a.userEmail.toLowerCase() === userEmail.toLowerCase())) &&
    (a.status === 'punched_in' || a.date === today)
  );

  if (getStatus()) {
    try {
      let dbRec = await Attendance.findOne({
        $or: [{ userId }, { userEmail: userEmail ? userEmail.toLowerCase() : '' }],
        status: 'punched_in'
      });
      if (!dbRec) {
        dbRec = await Attendance.findOne({
          date: today,
          $or: [{ userId }, { userEmail: userEmail ? userEmail.toLowerCase() : '' }]
        });
      }
      if (dbRec) record = dbRec;
    } catch (e) {
      console.warn('Mongo find record error:', e.message);
    }
  }

  if (record && record.status === 'punched_in') {
    record.status = 'punched_out';
    if (timezoneOffset !== null && timezoneOffset !== undefined) {
      record.timezoneOffset = timezoneOffset;
    }
    if (Array.isArray(record.punches) && record.punches.length > 0) {
      const lastPunch = record.punches[record.punches.length - 1];
      if (lastPunch && !lastPunch.punchOut) {
        lastPunch.punchOut = now;
        lastPunch.autoPunchedOut = false;
        const dur = Math.max(0, Math.round((now.getTime() - new Date(lastPunch.punchIn).getTime()) / 1000));
        lastPunch.durationSeconds = dur;
      }
      // Re-sum all completed punches for 100% accurate total
      record.totalSeconds = record.punches.reduce((sum, p) => sum + (p.durationSeconds || 0), 0);
    }
    saveStore();

    if (getStatus()) {
      try {
        await Attendance.findOneAndUpdate(
          { _id: record._id || undefined, date: record.date || today, userId },
          { $set: record },
          { new: true }
        );
      } catch (e) {
        console.warn('Mongo punch out error:', e.message);
      }
    }
  }

  return getTodayAttendance(userId, userEmail, timezoneOffset);
};

const getAttendanceRecords = async ({ userId, userEmail, limit = 60, timezoneOffset = null }) => {
  await checkAndApplyAutoMidnightPunchOut(timezoneOffset);
  if (!memoryStore.attendance) memoryStore.attendance = [];

  // Seed sample past records if user only has <= 1 record, so day-by-day record view shows history
  const userMatches = memoryStore.attendance.filter(a =>
    (userId && a.userId === userId) ||
    (userEmail && a.userEmail && a.userEmail.toLowerCase() === userEmail.toLowerCase())
  );

  if (userMatches.length <= 1) {
    const today = new Date();
    const pastDays = [
      { daysAgo: 1, inTime: '09:15:00', outTime: '17:45:00', lunchIn: '13:00:00', lunchOut: '13:45:00' },
      { daysAgo: 2, inTime: '09:00:00', outTime: '17:30:00', lunchIn: '13:15:00', lunchOut: '14:00:00' },
      { daysAgo: 3, inTime: '09:30:00', outTime: '18:15:00', lunchIn: '13:00:00', lunchOut: '13:45:00' },
      { daysAgo: 4, inTime: '09:10:00', outTime: '17:40:00', lunchIn: '13:30:00', lunchOut: '14:15:00' },
      { daysAgo: 5, inTime: '09:05:00', outTime: '17:25:00', lunchIn: '13:00:00', lunchOut: '13:50:00' }
    ];

    pastDays.forEach(pd => {
      const d = new Date(today);
      d.setDate(d.getDate() - pd.daysAgo);
      if (d.getDay() === 0) return; // Skip Sundays
      const dateStr = d.toISOString().split('T')[0];

      const exists = memoryStore.attendance.some(a =>
        a.date === dateStr && ((userId && a.userId === userId) || (userEmail && a.userEmail && a.userEmail.toLowerCase() === userEmail.toLowerCase()))
      );

      if (!exists) {
        const morningIn = new Date(`${dateStr}T${pd.inTime}`);
        const morningOut = new Date(`${dateStr}T${pd.lunchIn}`);
        const dur1 = Math.round((morningOut.getTime() - morningIn.getTime()) / 1000);

        const afternoonIn = new Date(`${dateStr}T${pd.lunchOut}`);
        const afternoonOut = new Date(`${dateStr}T${pd.outTime}`);
        const dur2 = Math.round((afternoonOut.getTime() - afternoonIn.getTime()) / 1000);

        memoryStore.attendance.push({
          id: generateId('att'),
          customId: generateId('att'),
          userId: userId || 'usr-user',
          userEmail: (userEmail || 'mehul@company.com').toLowerCase(),
          userName: (userMatches[0]?.userName) || 'Team Member',
          teamId: userMatches[0]?.teamId || 'team-1',
          teamName: userMatches[0]?.teamName || 'Neural Network Team',
          departmentId: userMatches[0]?.departmentId || 'dept-1',
          departmentName: userMatches[0]?.departmentName || 'Digital Health & AI Center',
          date: dateStr,
          status: 'punched_out',
          punches: [
            { punchIn: morningIn, punchOut: morningOut, durationSeconds: dur1, autoPunchedOut: false },
            { punchIn: afternoonIn, punchOut: afternoonOut, durationSeconds: dur2, autoPunchedOut: false }
          ],
          totalSeconds: dur1 + dur2
        });
      }
    });
    saveStore();
  }

  let records = memoryStore.attendance.filter(a =>
    (!userId || a.userId === userId) ||
    (userEmail && a.userEmail && a.userEmail.toLowerCase() === userEmail.toLowerCase())
  );

  if (getStatus()) {
    try {
      const query = {};
      if (userId && userEmail) {
        query.$or = [{ userId }, { userEmail: userEmail.toLowerCase() }];
      } else if (userId) {
        query.userId = userId;
      } else if (userEmail) {
        query.userEmail = userEmail.toLowerCase();
      }
      const dbRecords = await Attendance.find(query).sort({ date: -1 }).limit(limit).lean();
      if (dbRecords && dbRecords.length > 0) {
        records = dbRecords.map(r => ({ ...r, id: r.customId || r._id.toString() }));
      }
    } catch (e) {
      console.warn('Mongo getAttendanceRecords error:', e.message);
    }
  }

  const today = getEffectiveDate(timezoneOffset);
  const mapped = records.map(r => {
    let totalSecs = r.totalSeconds || 0;
    const isPast = r.date < today;
    const isCurrentlyIn = r.status === 'punched_in';
    let currentInTime = null;

    if (isCurrentlyIn && Array.isArray(r.punches) && r.punches.length > 0) {
      const last = r.punches[r.punches.length - 1];
      if (last && !last.punchOut) {
        currentInTime = last.punchIn;
        const elapsed = Math.round((Date.now() - new Date(last.punchIn).getTime()) / 1000);
        totalSecs += Math.max(0, elapsed);
      }
    }

    const firstPunch = Array.isArray(r.punches) && r.punches.length > 0 ? r.punches[0] : null;
    const lastPunch = Array.isArray(r.punches) && r.punches.length > 0 ? r.punches[r.punches.length - 1] : null;

    let formattedLastPunchOut = null;
    if (lastPunch && lastPunch.punchOut) {
      formattedLastPunchOut = lastPunch.punchOut;
    } else if (isCurrentlyIn) {
      formattedLastPunchOut = 'Active';
    } else if (r.autoPunchedOut || isPast) {
      formattedLastPunchOut = '11:59 PM';
    }

    // Safety fallback calculation for past records where totalSeconds is 0
    if (isPast && totalSecs === 0 && Array.isArray(r.punches) && r.punches.length > 0) {
      totalSecs = r.punches.reduce((acc, p) => {
        if (p.durationSeconds && p.durationSeconds > 0) return acc + p.durationSeconds;
        const pIn = new Date(p.punchIn).getTime();
        const pOut = p.punchOut ? new Date(p.punchOut).getTime() : computeMidnightPunchOut(r.date, p.punchIn, r.timezoneOffset ?? timezoneOffset).getTime();
        return acc + Math.max(0, Math.round((pOut - pIn) / 1000));
      }, 0);
    }

    return {
      ...r,
      status: isPast ? 'punched_out' : r.status,
      totalSeconds: totalSecs,
      currentPunchIn: currentInTime,
      firstPunchIn: firstPunch ? firstPunch.punchIn : null,
      lastPunchOut: formattedLastPunchOut,
      punchCount: Array.isArray(r.punches) ? r.punches.length : 0
    };
  });

  mapped.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  return mapped;
};

// =========================================================================
// TASK TIME TRACKING (Start / Pause / Resume / Finish)
// =========================================================================
const startTaskTimer = async (taskId, user) => {
  if (!memoryStore.userWorkspace) memoryStore.userWorkspace = { assignedWork: [] };
  const task = memoryStore.userWorkspace.assignedWork.find(w => w.id === taskId || w.taskId === taskId);
  if (!task) throw new Error('Task not found');

  const now = new Date();
  const today = now.toISOString().split('T')[0];

  if (!task.timerState) {
    task.timerState = { status: 'idle', activeSeconds: 0, pausedSeconds: 0, isPaused: false };
  }
  if (!task.activityLog) task.activityLog = [];

  task.timerState.status = 'running';
  task.timerState.isPaused = false;
  task.timerState.activeSessionStart = now;
  task.timerState.pausedAt = null;
  task.timerState.pauseReason = '';
  task.status = 'In Progress';

  if (!memoryStore.timeLogs) memoryStore.timeLogs = [];
  let log = memoryStore.timeLogs.find(l => l.taskId === taskId && l.userId === user.id && l.date === today);
  if (!log) {
    log = {
      id: generateId('tlog'),
      customId: generateId('tlog'),
      taskId,
      taskTitle: task.title,
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      teamId: task.teamId || '',
      date: today,
      sessions: [],
      totalActiveSeconds: task.timerState.activeSeconds || 0,
      totalPausedSeconds: task.timerState.pausedSeconds || 0,
      status: 'running'
    };
    memoryStore.timeLogs.push(log);
  }
  log.status = 'running';
  log.sessions.push({
    startTime: now,
    endTime: null,
    activeSeconds: 0,
    pausedSeconds: 0,
    pauses: [],
    status: 'running'
  });

  task.activityLog.push({
    id: generateId('act'),
    type: 'started',
    performedBy: user.name,
    performedByRole: user.role,
    performedById: user.id,
    timestamp: now,
    message: `${user.name} started working on "${task.title}"`
  });

  saveStore();

  if (getStatus()) {
    try {
      await UserTask.findOneAndUpdate(
        { $or: [{ customId: taskId }, { taskId }] },
        { $set: { timerState: task.timerState, status: task.status, activityLog: task.activityLog } }
      );
      await TimeLog.findOneAndUpdate(
        { taskId, userId: user.id, date: today },
        { $set: log },
        { upsert: true }
      );
    } catch (e) {
      console.warn('Mongo start task timer error:', e.message);
    }
  }

  return { task, timeLog: log };
};

const pauseTaskTimer = async (taskId, user, reason) => {
  if (!reason || !reason.trim()) {
    throw new Error('A pause reason is required.');
  }
  if (!memoryStore.userWorkspace) memoryStore.userWorkspace = { assignedWork: [] };
  const task = memoryStore.userWorkspace.assignedWork.find(w => w.id === taskId || w.taskId === taskId);
  if (!task) throw new Error('Task not found');

  const now = new Date();
  const today = now.toISOString().split('T')[0];

  if (!task.timerState || task.timerState.status !== 'running') {
    throw new Error('Task timer is not currently running.');
  }

  const sessionStart = new Date(task.timerState.activeSessionStart || now);
  const activeElapsed = Math.max(0, Math.round((now.getTime() - sessionStart.getTime()) / 1000));
  task.timerState.activeSeconds = (task.timerState.activeSeconds || 0) + activeElapsed;
  task.timerState.status = 'paused';
  task.timerState.isPaused = true;
  task.timerState.pausedAt = now;
  task.timerState.pauseReason = reason.trim();

  if (!memoryStore.timeLogs) memoryStore.timeLogs = [];
  let log = memoryStore.timeLogs.find(l => l.taskId === taskId && l.userId === user.id && l.date === today);
  if (log && log.sessions.length > 0) {
    const currentSession = log.sessions[log.sessions.length - 1];
    currentSession.activeSeconds = (currentSession.activeSeconds || 0) + activeElapsed;
    currentSession.status = 'paused';
    currentSession.currentPause = { pausedAt: now, reason: reason.trim() };
    log.totalActiveSeconds = task.timerState.activeSeconds;
    log.status = 'paused';
  }

  if (!task.activityLog) task.activityLog = [];
  task.activityLog.push({
    id: generateId('act'),
    type: 'paused',
    performedBy: user.name,
    performedByRole: user.role,
    performedById: user.id,
    timestamp: now,
    details: { reason: reason.trim() },
    message: `${user.name} paused work on "${task.title}": Reason: "${reason.trim()}"`
  });

  saveStore();

  if (getStatus()) {
    try {
      await UserTask.findOneAndUpdate(
        { $or: [{ customId: taskId }, { taskId }] },
        { $set: { timerState: task.timerState, activityLog: task.activityLog } }
      );
      if (log) {
        await TimeLog.findOneAndUpdate(
          { taskId, userId: user.id, date: today },
          { $set: log }
        );
      }
    } catch (e) {
      console.warn('Mongo pause task timer error:', e.message);
    }
  }

  return { task, timeLog: log };
};

const resumeTaskTimer = async (taskId, user) => {
  if (!memoryStore.userWorkspace) memoryStore.userWorkspace = { assignedWork: [] };
  const task = memoryStore.userWorkspace.assignedWork.find(w => w.id === taskId || w.taskId === taskId);
  if (!task) throw new Error('Task not found');

  const now = new Date();
  const today = now.toISOString().split('T')[0];

  if (!task.timerState || !task.timerState.isPaused || !task.timerState.pausedAt) {
    throw new Error('Task is not currently paused.');
  }

  const pausedAt = new Date(task.timerState.pausedAt);
  const pauseDuration = Math.max(0, Math.round((now.getTime() - pausedAt.getTime()) / 1000));
  task.timerState.pausedSeconds = (task.timerState.pausedSeconds || 0) + pauseDuration;
  task.timerState.status = 'running';
  task.timerState.isPaused = false;
  task.timerState.activeSessionStart = now;
  const pauseReason = task.timerState.pauseReason || 'Pause';
  task.timerState.pausedAt = null;
  task.timerState.pauseReason = '';

  if (!memoryStore.timeLogs) memoryStore.timeLogs = [];
  let log = memoryStore.timeLogs.find(l => l.taskId === taskId && l.userId === user.id && l.date === today);
  if (log && log.sessions.length > 0) {
    const currentSession = log.sessions[log.sessions.length - 1];
    currentSession.pausedSeconds = (currentSession.pausedSeconds || 0) + pauseDuration;
    currentSession.status = 'running';
    currentSession.currentPause = null;
    if (!Array.isArray(currentSession.pauses)) currentSession.pauses = [];
    currentSession.pauses.push({
      pausedAt,
      resumedAt: now,
      reason: pauseReason,
      durationSeconds: pauseDuration
    });
    log.totalPausedSeconds = task.timerState.pausedSeconds;
    log.status = 'running';
  }

  if (!task.activityLog) task.activityLog = [];
  task.activityLog.push({
    id: generateId('act'),
    type: 'resumed',
    performedBy: user.name,
    performedByRole: user.role,
    performedById: user.id,
    timestamp: now,
    details: { pauseDurationSeconds: pauseDuration, reason: pauseReason },
    message: `${user.name} resumed work after ${Math.round(pauseDuration / 60)}m (${pauseReason})`
  });

  saveStore();

  if (getStatus()) {
    try {
      await UserTask.findOneAndUpdate(
        { $or: [{ customId: taskId }, { taskId }] },
        { $set: { timerState: task.timerState, activityLog: task.activityLog } }
      );
      if (log) {
        await TimeLog.findOneAndUpdate(
          { taskId, userId: user.id, date: today },
          { $set: log }
        );
      }
    } catch (e) {
      console.warn('Mongo resume task timer error:', e.message);
    }
  }

  return { task, timeLog: log };
};

const finishTaskTimer = async (taskId, user) => {
  if (!memoryStore.userWorkspace) memoryStore.userWorkspace = { assignedWork: [] };
  const task = memoryStore.userWorkspace.assignedWork.find(w => w.id === taskId || w.taskId === taskId);
  if (!task) throw new Error('Task not found');

  const now = new Date();
  const today = now.toISOString().split('T')[0];

  if (!task.timerState) {
    task.timerState = { status: 'idle', activeSeconds: 0, pausedSeconds: 0, isPaused: false };
  }

  if (task.timerState.status === 'running' && task.timerState.activeSessionStart) {
    const sessionStart = new Date(task.timerState.activeSessionStart);
    const activeElapsed = Math.max(0, Math.round((now.getTime() - sessionStart.getTime()) / 1000));
    task.timerState.activeSeconds = (task.timerState.activeSeconds || 0) + activeElapsed;
  }
  if (task.timerState.isPaused && task.timerState.pausedAt) {
    const pausedAt = new Date(task.timerState.pausedAt);
    const pauseDuration = Math.max(0, Math.round((now.getTime() - pausedAt.getTime()) / 1000));
    task.timerState.pausedSeconds = (task.timerState.pausedSeconds || 0) + pauseDuration;
  }

  task.timerState.status = 'finished';
  task.timerState.isPaused = false;
  task.status = 'Completed';
  task.progress = 100;
  task.completedAt = now;
  task.completedBy = user.name;

  if (!memoryStore.timeLogs) memoryStore.timeLogs = [];
  let log = memoryStore.timeLogs.find(l => l.taskId === taskId && l.userId === user.id && l.date === today);
  if (log && log.sessions.length > 0) {
    const currentSession = log.sessions[log.sessions.length - 1];
    currentSession.endTime = now;
    currentSession.status = 'finished';
    log.totalActiveSeconds = task.timerState.activeSeconds;
    log.totalPausedSeconds = task.timerState.pausedSeconds;
    log.status = 'finished';
  }

  if (!task.activityLog) task.activityLog = [];
  task.activityLog.push({
    id: generateId('act'),
    type: 'finished',
    performedBy: user.name,
    performedByRole: user.role,
    performedById: user.id,
    timestamp: now,
    details: {
      totalActiveSeconds: task.timerState.activeSeconds,
      totalPausedSeconds: task.timerState.pausedSeconds
    },
    message: `${user.name} completed task "${task.title}". Active work: ${Math.round(task.timerState.activeSeconds / 60)}m, Paused: ${Math.round(task.timerState.pausedSeconds / 60)}m`
  });

  saveStore();

  if (getStatus()) {
    try {
      await UserTask.findOneAndUpdate(
        { $or: [{ customId: taskId }, { taskId }] },
        { $set: { timerState: task.timerState, status: 'Completed', progress: 100, completedAt: now, completedBy: user.name, activityLog: task.activityLog } }
      );
      if (log) {
        await TimeLog.findOneAndUpdate(
          { taskId, userId: user.id, date: today },
          { $set: log }
        );
      }
    } catch (e) {
      console.warn('Mongo finish task timer error:', e.message);
    }
  }

  return { task, timeLog: log };
};

// =========================================================================
// MANAGER'S DAILY TIMELINE
// =========================================================================
const getManagerTimeline = async ({ date, teamId, memberId, userId, userRole, userEmail }) => {
  const targetDate = date || new Date().toISOString().split('T')[0];
  let events = [];

  const isRegularUser = userRole === 'user';
  const cleanEmail = (userEmail || '').trim().toLowerCase();
  const cleanUserId = userId ? String(userId).trim() : '';

  // 1. Attendance punches
  if (!memoryStore.attendance) memoryStore.attendance = [];
  let attendanceList = memoryStore.attendance.filter(a => a.date === targetDate);
  if (getStatus()) {
    try {
      const dbAtt = await Attendance.find({ date: targetDate }).lean();
      if (dbAtt && dbAtt.length > 0) attendanceList = dbAtt;
    } catch (e) {
      console.warn('Mongo timeline attendance error:', e.message);
    }
  }

  // Strict user isolation if regular user
  if (isRegularUser && (cleanUserId || cleanEmail)) {
    attendanceList = attendanceList.filter(a => {
      const aId = String(a.userId || '').trim();
      const aEmail = (a.userEmail || '').trim().toLowerCase();
      return (cleanUserId && aId === cleanUserId) || (cleanEmail && aEmail === cleanEmail);
    });
  } else {
    if (memberId && memberId !== 'All' && memberId !== 'All Members') {
      const cleanMem = String(memberId).trim().toLowerCase();
      const foundMem = (memoryStore.members || []).find(m => m.id === memberId || (m.email && m.email.toLowerCase() === cleanMem));
      const targetEmails = new Set([cleanMem]);
      const targetIds = new Set([String(memberId).trim()]);
      if (foundMem) {
        if (foundMem.id) targetIds.add(String(foundMem.id));
        if (foundMem.userId) targetIds.add(String(foundMem.userId));
        if (foundMem.email) targetEmails.add(foundMem.email.toLowerCase());
      }
      attendanceList = attendanceList.filter(a =>
        (a.userId && targetIds.has(String(a.userId))) ||
        (a.userEmail && targetEmails.has(a.userEmail.toLowerCase()))
      );
    }
    if (teamId && teamId !== 'All' && teamId !== 'All Teams') {
      attendanceList = attendanceList.filter(a => a.teamId === teamId || a.teamName === teamId);
    }
  }

  for (const att of attendanceList) {
    const memberName = att.userName || 'Team Member';
    if (Array.isArray(att.punches)) {
      for (const p of att.punches) {
        if (p.punchIn) {
          events.push({
            id: `att-in-${p.punchIn}`,
            timestamp: new Date(p.punchIn),
            type: 'punch_in',
            actorName: memberName,
            actorRole: 'Member',
            userId: att.userId,
            team: att.teamName || 'Team',
            title: 'Punched In (Attendance)',
            description: `${memberName} punched in for workspace attendance.`,
            badgeColor: 'emerald'
          });
        }
        if (p.punchOut) {
          const durMins = Math.round((p.durationSeconds || 0) / 60);
          events.push({
            id: `att-out-${p.punchOut}`,
            timestamp: new Date(p.punchOut),
            type: 'punch_out',
            actorName: memberName,
            actorRole: 'Member',
            userId: att.userId,
            team: att.teamName || 'Team',
            title: 'Punched Out (Attendance)',
            description: `${memberName} punched out. Recorded duration: ${durMins}m.`,
            badgeColor: 'rose'
          });
        }
      }
    }
  }

  // 2. Task Activity Logs & Comments
  if (!memoryStore.userWorkspace) memoryStore.userWorkspace = { assignedWork: [] };
  let allTasks = memoryStore.userWorkspace.assignedWork || [];
  if (getStatus()) {
    try {
      const dbTasks = await UserTask.find().lean();
      if (dbTasks && dbTasks.length > 0) allTasks = dbTasks;
    } catch (e) {
      console.warn('Mongo timeline tasks error:', e.message);
    }
  }

  if (isRegularUser && (cleanUserId || cleanEmail)) {
    allTasks = allTasks.filter(t => {
      const tId = String(t.userId || t.assigneeId || '').trim();
      const tEmail = (t.userEmail || t.assigneeEmail || '').trim().toLowerCase();
      return (cleanUserId && tId === cleanUserId) || (cleanEmail && tEmail === cleanEmail);
    });
  } else {
    if (memberId && memberId !== 'All' && memberId !== 'All Members') {
      const cleanMem = String(memberId).trim().toLowerCase();
      const foundMem = (memoryStore.members || []).find(m => m.id === memberId || (m.email && m.email.toLowerCase() === cleanMem));
      const targetEmails = new Set([cleanMem]);
      const targetIds = new Set([String(memberId).trim()]);
      if (foundMem) {
        if (foundMem.id) targetIds.add(String(foundMem.id));
        if (foundMem.userId) targetIds.add(String(foundMem.userId));
        if (foundMem.email) targetEmails.add(foundMem.email.toLowerCase());
      }
      allTasks = allTasks.filter(t =>
        (t.userId && targetIds.has(String(t.userId))) ||
        (t.assigneeId && targetIds.has(String(t.assigneeId))) ||
        (t.assigneeEmail && targetEmails.has(t.assigneeEmail.toLowerCase())) ||
        (t.userEmail && targetEmails.has(t.userEmail.toLowerCase()))
      );
    }
    if (teamId && teamId !== 'All' && teamId !== 'All Teams') {
      allTasks = allTasks.filter(t => t.teamId === teamId || t.team === teamId || (t as any).teamName === teamId);
    }
  }

  for (const t of allTasks) {
    if (Array.isArray(t.activityLog)) {
      for (const act of t.activityLog) {
        const actDate = new Date(act.timestamp).toISOString().split('T')[0];
        if (actDate === targetDate) {
          let badgeColor = 'indigo';
          if (act.type === 'paused') badgeColor = 'amber';
          if (act.type === 'resumed') badgeColor = 'blue';
          if (act.type === 'finished' || act.type === 'completed' || act.type === 'deliverable_submitted') badgeColor = 'emerald';
          if (act.type === 'deadline_change') badgeColor = 'purple';
          if (act.type === 'assignee_change') badgeColor = 'sky';

          events.push({
            id: act.id || `act-${act.timestamp}`,
            timestamp: new Date(act.timestamp),
            type: act.type,
            actorName: act.performedBy || 'System',
            actorRole: act.performedByRole || 'Admin',
            userId: act.performedById || t.userId,
            team: t.team || 'Team',
            taskTitle: t.title,
            taskId: t.taskId || t.id,
            title: act.type === 'paused' ? `Paused Task: "${act.details?.reason || 'Pause'}"` :
              act.type === 'resumed' ? `Resumed Task` :
                act.type === 'started' ? `Started Task` :
                  act.type === 'finished' ? `Completed Task` :
                    act.type === 'deliverable_submitted' ? `Work Deliverables Submitted: "${t.title}"` :
                      act.type === 'deadline_change' ? `Deadline Changed: ${act.details?.oldDate} → ${act.details?.newDate}` :
                        act.type === 'assignee_change' ? `Assignee Changed: ${act.details?.oldAssignee} → ${act.details?.newAssignee}` :
                          `Task Activity`,
            description: act.message || act.type,
            details: act.details,
            badgeColor
          });
        }
      }
    }

    if (Array.isArray(t.comments)) {
      for (const c of t.comments) {
        events.push({
          id: `cmt-${c.id || c.date}`,
          timestamp: new Date(c.timestamp || Date.now()),
          type: 'comment',
          actorName: c.author || 'Team Member',
          actorRole: c.role || 'Member',
          userId: t.userId,
          team: t.team || 'Team',
          taskTitle: t.title,
          taskId: t.taskId || t.id,
          title: `Comment Added`,
          description: `"${c.text}"`,
          badgeColor: 'blue'
        });
      }
    }
  }

  // Defense-in-depth: If regular user, strictly isolate all generated events to this user only
  if (isRegularUser && (cleanUserId || cleanEmail)) {
    events = events.filter(e => {
      const eId = String(e.userId || '').trim();
      const eEmail = (e.userEmail || '').trim().toLowerCase();
      return (cleanUserId && eId === cleanUserId) || (cleanEmail && eEmail === cleanEmail);
    });
  }

  events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  return {
    date: targetDate,
    teamId: isRegularUser ? 'Personal' : (teamId || 'All'),
    memberId: isRegularUser ? (cleanUserId || 'Self') : (memberId || 'All'),
    events
  };
};

// =========================================================================
// MANAGER'S REPORTS (Daily, Weekly, Monthly)
// =========================================================================
const getReports = async ({ period = 'daily', date, teamId, userId, userRole, userEmail }) => {
  const refDate = date ? new Date(date) : new Date();
  const dateStr = refDate.toISOString().split('T')[0];

  let startDate = dateStr;
  let endDate = dateStr;

  if (period === 'weekly') {
    const day = refDate.getDay();
    const diff = refDate.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(refDate);
    monday.setDate(diff);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    startDate = monday.toISOString().split('T')[0];
    endDate = sunday.toISOString().split('T')[0];
  } else if (period === 'monthly') {
    const year = refDate.getFullYear();
    const month = refDate.getMonth();
    startDate = new Date(year, month, 1).toISOString().split('T')[0];
    endDate = new Date(year, month + 1, 0).toISOString().split('T')[0];
  }

  let members = memoryStore.members || [];
  if (getStatus()) {
    try {
      const dbMem = await Member.find().lean();
      if (dbMem && dbMem.length > 0) members = dbMem;
    } catch (e) {
      console.warn('Mongo reports members error:', e.message);
    }
  }

  // Role-Based Member Isolation:
  // - If userRole is 'user': ONLY return that particular user's breakdown
  // - If userRole is 'admin': return all members (admin can see all)
  // - If userRole is 'manager': return members in their team/division
  if (userRole === 'user' && (userEmail || userId)) {
    const targetEmail = (userEmail || '').trim().toLowerCase();
    const targetId = userId ? String(userId).trim() : '';
    members = members.filter(m => {
      const mId = String(m.id || m.customId || m._id?.toString() || m.userId || '').trim();
      const mEmail = (m.email || '').trim().toLowerCase();
      if (targetEmail && mEmail === targetEmail) return true;
      if (targetId && mId === targetId) return true;
      return false;
    });
  } else if (teamId && teamId !== 'All' && teamId !== 'All Teams') {
    members = members.filter(m => m.teamId === teamId || m.team === teamId);
  }

  const allTasks = memoryStore.userWorkspace?.assignedWork || [];
  const allAttendance = memoryStore.attendance || [];
  const allTimeLogs = memoryStore.timeLogs || [];
  const reportOverrides = memoryStore.reportEntries || [];

  const reportItems = [];

  for (const m of members) {
    const memId = m.id || m.customId || m._id?.toString();
    const memEmail = (m.email || '').toLowerCase();

    // Check if manager deleted this report entry
    const override = reportOverrides.find(r =>
      r.period === period && r.date === startDate && (r.userId === memId || (r.userEmail && r.userEmail === memEmail))
    );

    if (override && override.status === 'deleted') {
      continue;
    }

    // 1. Attendance Seconds in period
    const memberAttendance = allAttendance.filter(a => {
      const isUser = a.userId === memId || (a.userEmail && a.userEmail.toLowerCase() === memEmail);
      return isUser && a.date >= startDate && a.date <= endDate;
    });
    const rawAttendanceSeconds = memberAttendance.reduce((acc, curr) => acc + (curr.totalSeconds || 0), 0);

    // 2. Active Task Time & Paused Time in period
    const memberLogs = allTimeLogs.filter(l => {
      const isUser = l.userId === memId || (l.userEmail && l.userEmail.toLowerCase() === memEmail);
      return isUser && l.date >= startDate && l.date <= endDate;
    });
    const rawActiveSeconds = memberLogs.reduce((acc, curr) => acc + (curr.totalActiveSeconds || 0), 0);
    const rawPausedSeconds = memberLogs.reduce((acc, curr) => acc + (curr.totalPausedSeconds || 0), 0);

    // 3. Completed work uses task's completion date within period
    const memberTasks = allTasks.filter(t => t.userId === memId || t.assigneeId === memId || (t.assigneeEmail && t.assigneeEmail.toLowerCase() === memEmail));
    const completedTasks = memberTasks.filter(t => {
      if (t.status !== 'Completed') return false;
      const compDate = t.completedAt ? new Date(t.completedAt).toISOString().split('T')[0] : (t.dueDate || '');
      return compDate >= startDate && compDate <= endDate;
    });
    const inProgressTasks = memberTasks.filter(t => t.status === 'In Progress' || t.status === 'To Do');

    // Apply manager override if modified
    const finalAttendance = override && override.attendanceSeconds !== undefined ? override.attendanceSeconds : rawAttendanceSeconds;
    const finalActive = override && override.activeWorkSeconds !== undefined ? override.activeWorkSeconds : rawActiveSeconds;
    const finalPaused = override && override.pausedSeconds !== undefined ? override.pausedSeconds : rawPausedSeconds;
    const finalCompleted = override && override.completedTasksCount !== undefined ? override.completedTasksCount : completedTasks.length;

    reportItems.push({
      id: override?.id || `rep-${memId}-${startDate}`,
      userId: memId,
      userName: m.name,
      userEmail: memEmail,
      teamId: m.teamId || '',
      teamName: m.team || 'Team',
      period,
      startDate,
      endDate,
      attendanceSeconds: finalAttendance,
      activeWorkSeconds: finalActive,
      pausedSeconds: finalPaused,
      completedTasksCount: finalCompleted,
      inProgressTasksCount: inProgressTasks.length,
      managerNotes: override?.managerNotes || '',
      isModified: override?.status === 'modified',
      modifiedBy: override?.modifiedBy || '',
      rawCalculations: {
        attendanceSeconds: rawAttendanceSeconds,
        activeWorkSeconds: rawActiveSeconds,
        pausedSeconds: rawPausedSeconds,
        completedTasksCount: completedTasks.length
      }
    });
  }

  return {
    period,
    startDate,
    endDate,
    date: dateStr,
    teamId: teamId || 'All',
    items: reportItems
  };
};

const updateReportEntry = async (id, data, user) => {
  if (!memoryStore.reportEntries) memoryStore.reportEntries = [];
  let entryIndex = memoryStore.reportEntries.findIndex(r => r.id === id || r.customId === id);

  const updated = {
    ...(entryIndex >= 0 ? memoryStore.reportEntries[entryIndex] : {}),
    id: id || generateId('rep'),
    customId: id || generateId('rep'),
    ...data,
    status: 'modified',
    modifiedBy: user.name || 'Manager',
    modifiedAt: new Date()
  };

  if (entryIndex >= 0) {
    memoryStore.reportEntries[entryIndex] = updated;
  } else {
    memoryStore.reportEntries.push(updated);
  }

  saveStore();

  if (getStatus()) {
    try {
      await ReportEntry.findOneAndUpdate(
        { $or: [{ customId: id }, { _id: mongoose.Types.ObjectId.isValid(id) ? id : null }] },
        { $set: updated },
        { upsert: true }
      );
    } catch (e) {
      console.warn('Mongo report update error:', e.message);
    }
  }

  return updated;
};

const deleteReportEntry = async (id, user) => {
  if (!memoryStore.reportEntries) memoryStore.reportEntries = [];
  let entry = memoryStore.reportEntries.find(r => r.id === id || r.customId === id);

  if (entry) {
    entry.status = 'deleted';
    entry.modifiedBy = user.name || 'Manager';
    entry.modifiedAt = new Date();
  } else {
    memoryStore.reportEntries.push({
      id,
      customId: id,
      status: 'deleted',
      modifiedBy: user.name || 'Manager',
      modifiedAt: new Date()
    });
  }

  saveStore();

  if (getStatus()) {
    try {
      await ReportEntry.findOneAndUpdate(
        { $or: [{ customId: id }, { _id: mongoose.Types.ObjectId.isValid(id) ? id : null }] },
        { $set: { status: 'deleted', modifiedBy: user.name || 'Manager', modifiedAt: new Date() } },
        { upsert: true }
      );
    } catch (e) {
      console.warn('Mongo report delete error:', e.message);
    }
  }

  return { success: true, id };
};

// =========================================================================
// BREAK TIME MANAGEMENT
// =========================================================================

const parseTimeToTodayDate = (timeStr, baseDate = new Date(), timezoneOffset = null) => {
  if (!timeStr) return new Date();
  const clean = String(timeStr).trim().toUpperCase();

  // Check 12-hour or 24-hour time format (e.g. "11:34 AM", "12:04 PM", "1:15 AM", "14:30")
  const match = clean.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?$/);
  if (match) {
    let hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    const meridiem = match[4];
    if (meridiem === 'PM') {
      if (hours < 12) hours += 12; // 1 PM -> 13, 11 PM -> 23, 12 PM -> 12 (noon)
    } else if (meridiem === 'AM') {
      if (hours === 12) hours = 0; // 12 AM -> 0 (midnight)
    } else if (!meridiem && baseDate.getHours() >= 12 && hours < 12) {
      hours += 12;
    }

    if (timezoneOffset !== null && typeof timezoneOffset === 'number' && !isNaN(timezoneOffset)) {
      // client timezone offset in minutes (e.g. -330 for UTC+5:30)
      // UTC Minutes = Local Minutes + timezoneOffset
      const now = new Date(baseDate);
      const utcDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
      utcDate.setUTCMinutes(hours * 60 + minutes + timezoneOffset);
      return utcDate;
    }

    const date = new Date(baseDate);
    date.setHours(hours, minutes, 0, 0);
    return date;
  }

  const d = new Date(timeStr);
  if (!isNaN(d.getTime())) return d;
  return new Date();
};

const getActiveBreaks = async ({ teamId, teamName, departmentId, departmentName, userId, userEmail, userRole } = {}) => {
  if (!memoryStore.breaks) memoryStore.breaks = [];
  const now = new Date();

  // Check and update any break whose time has expired
  let changed = false;
  memoryStore.breaks.forEach(b => {
    if (b.status === 'active' && new Date(b.toTimestamp).getTime() <= now.getTime()) {
      b.status = 'completed';
      changed = true;
    }
  });

  if (changed) {
    saveStore();
    if (getStatus()) {
      try {
        await BreakTime.updateMany(
          { status: 'active', toTimestamp: { $lte: now } },
          { $set: { status: 'completed' } }
        );
      } catch (e) {
        console.warn('Mongo update expired breaks error:', e.message);
      }
    }
  }

  // Active breaks must have toTimestamp in the future
  let activeList = memoryStore.breaks.filter(b => b.status === 'active' && new Date(b.toTimestamp).getTime() > now.getTime());

  // 1. Regular User: Strictly User-Based Isolation (No other user can see other users' breaks or count)
  if (userRole === 'user') {
    return activeList.filter(b => {
      const matchId = userId && b.userId && String(b.userId) === String(userId);
      const matchEmail = userEmail && b.userEmail && b.userEmail.toLowerCase() === userEmail.toLowerCase();
      return matchId || matchEmail;
    });
  }

  // 2. Admin sees all active breaks
  if (userRole === 'admin') {
    return activeList;
  }

  // 3. Manager sees breaks across their team, department, or managed workspace
  if (userRole === 'manager') {
    return activeList.filter(b => {
      if (userId && b.userId === userId) return true;
      if (departmentId && b.departmentId && b.departmentId === departmentId) return true;
      if (departmentName && b.departmentName && b.departmentName.toLowerCase() === departmentName.toLowerCase()) return true;
      if (teamId && b.teamId && b.teamId === teamId) return true;
      if (teamName && b.teamName && b.teamName.toLowerCase() === teamName.toLowerCase()) return true;
      // In manager view, also see any user breaks within their supervised organization
      return true;
    });
  }

  // Default fallback if role not specified: user-based
  if (userId || userEmail) {
    return activeList.filter(b => {
      const matchId = userId && b.userId && String(b.userId) === String(userId);
      const matchEmail = userEmail && b.userEmail && b.userEmail.toLowerCase() === userEmail.toLowerCase();
      return matchId || matchEmail;
    });
  }

  return activeList;
};

const getTodayBreaks = async ({ teamId, teamName, departmentId, departmentName, userId, userEmail, userRole } = {}) => {
  if (!memoryStore.breaks) memoryStore.breaks = [];
  const today = new Date().toISOString().split('T')[0];

  let list = memoryStore.breaks.filter(b => b.date === today);

  // 1. Regular User: Strictly User-Based Isolation (No other user can see other users' breaks or count)
  if (userRole === 'user') {
    return list.filter(b => {
      const matchId = userId && b.userId && String(b.userId) === String(userId);
      const matchEmail = userEmail && b.userEmail && b.userEmail.toLowerCase() === userEmail.toLowerCase();
      return matchId || matchEmail;
    });
  }

  if (userRole === 'admin') {
    // Admin sees all breaks today
  } else if (userRole === 'manager') {
    list = list.filter(b => {
      if (userId && b.userId === userId) return true;
      if (departmentId && b.departmentId && b.departmentId === departmentId) return true;
      if (departmentName && b.departmentName && b.departmentName.toLowerCase() === departmentName.toLowerCase()) return true;
      if (teamId && b.teamId && b.teamId === teamId) return true;
      if (teamName && b.teamName && b.teamName.toLowerCase() === teamName.toLowerCase()) return true;
      return true;
    });
  } else if (userId || userEmail) {
    list = list.filter(b => {
      const matchId = userId && b.userId && String(b.userId) === String(userId);
      const matchEmail = userEmail && b.userEmail && b.userEmail.toLowerCase() === userEmail.toLowerCase();
      return matchId || matchEmail;
    });
  }

  return list.sort((a, b) => new Date(b.createdAt || b.fromTimestamp).getTime() - new Date(a.createdAt || a.fromTimestamp).getTime());
};

const recordBreak = async ({
  userId,
  userName,
  userEmail,
  userRole = 'user',
  teamId = '',
  teamName = '',
  departmentId = '',
  departmentName = '',
  fromTime,
  toTime,
  fromTimestamp,
  toTimestamp,
  durationMinutes,
  timezoneOffset,
  reason = 'Break'
}) => {
  if (!userName || !fromTime || !toTime) {
    throw new Error('Name, fromTime and toTime are required');
  }

  if (!memoryStore.breaks) memoryStore.breaks = [];
  const today = new Date().toISOString().split('T')[0];
  const now = new Date();

  let fromTs = (fromTimestamp && !isNaN(new Date(fromTimestamp).getTime()))
    ? new Date(fromTimestamp)
    : parseTimeToTodayDate(fromTime, now, timezoneOffset);

  let toTs = (toTimestamp && !isNaN(new Date(toTimestamp).getTime()))
    ? new Date(toTimestamp)
    : parseTimeToTodayDate(toTime, now, timezoneOffset);

  // If toTs <= fromTs, roll over to the next day
  if (toTs.getTime() <= fromTs.getTime()) {
    toTs = new Date(toTs.getTime() + 24 * 60 * 60 * 1000);
  }

  // End any currently active break for this user
  memoryStore.breaks.forEach(b => {
    if (b.userId === userId && b.status === 'active') {
      b.status = 'completed';
    }
  });

  const breakRecord = {
    id: generateId('brk'),
    customId: generateId('brk'),
    userId: userId || generateId('usr'),
    userName: userName.trim(),
    userEmail: (userEmail || '').toLowerCase().trim(),
    userRole: userRole || 'user',
    teamId: teamId || '',
    teamName: teamName || '',
    departmentId: departmentId || '',
    departmentName: departmentName || '',
    date: today,
    fromTime: String(fromTime).trim(),
    toTime: String(toTime).trim(),
    fromTimestamp: fromTs,
    toTimestamp: toTs,
    durationMinutes: durationMinutes || Math.round((toTs.getTime() - fromTs.getTime()) / (60 * 1000)),
    reason: reason || 'Break',
    status: 'active',
    createdAt: now.toISOString()
  };

  memoryStore.breaks.unshift(breakRecord);
  saveStore();

  if (getStatus()) {
    try {
      await BreakTime.create(breakRecord);
    } catch (e) {
      console.warn('Mongo recordBreak error:', e.message);
    }
  }

  // Notification delivery: strictly notify managers/admins (for supervisor oversight) and self-confirmation
  try {
    // 1. Notify all managers and admins so they stay informed in real-time
    const targetManagers = (memoryStore.users || []).filter(u => {
      if (u.id === userId || (userEmail && u.email?.toLowerCase() === userEmail.toLowerCase())) return false;
      if (u.role === 'manager' || u.role === 'admin') return true;
      return false;
    });

    for (const mgr of targetManagers) {
      createNotification({
        recipientRole: mgr.role || 'manager',
        recipientUserId: mgr.id,
        recipientEmail: mgr.email,
        referenceId: breakRecord.id,
        title: `☕ ${userName} is on Break (${reason})`,
        message: `${userName} (${teamName || 'Workspace'}) is on break until ${toTime}.`,
        link: 'break-time'
      });
    }

    // 2. Self-confirmation notification
    createNotification({
      recipientRole: userRole,
      recipientUserId: userId,
      recipientEmail: userEmail,
      referenceId: breakRecord.id,
      title: `☕ Your Break is Active (${reason})`,
      message: `Your break notice is live from ${fromTime} to ${toTime}. Your manager is notified.`,
      link: 'break-time'
    });
  } catch (err) {
    console.warn('Break notifications error:', err.message);
  }

  return breakRecord;
};

const endBreakEarly = async (breakId, { userId } = {}) => {
  if (!memoryStore.breaks) memoryStore.breaks = [];
  const now = new Date();
  const record = memoryStore.breaks.find(b => b.id === breakId || b.customId === breakId || b._id === breakId);
  if (!record) throw new Error('Break record not found');

  record.status = 'completed';
  record.toTimestamp = now;
  record.toTime = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  saveStore();

  if (getStatus()) {
    try {
      await BreakTime.findOneAndUpdate(
        buildIdQuery(breakId),
        { $set: { status: 'completed', toTimestamp: now, toTime: record.toTime } }
      );
    } catch (e) {
      console.warn('Mongo endBreakEarly error:', e.message);
    }
  }

  return record;
};

const updateBreak = async (breakId, { fromTime, toTime, fromTimestamp, toTimestamp, durationMinutes, timezoneOffset, reason, userId } = {}) => {
  if (!memoryStore.breaks) memoryStore.breaks = [];
  const record = memoryStore.breaks.find(b => b.id === breakId || b.customId === breakId || b._id === breakId);
  if (!record) throw new Error('Break record not found');

  if (fromTime) {
    record.fromTime = String(fromTime).trim();
    if (fromTimestamp && !isNaN(new Date(fromTimestamp).getTime())) {
      record.fromTimestamp = new Date(fromTimestamp);
    } else {
      record.fromTimestamp = parseTimeToTodayDate(record.fromTime, new Date(), timezoneOffset);
    }
  }
  if (toTime) {
    record.toTime = String(toTime).trim();
    let toDate = (toTimestamp && !isNaN(new Date(toTimestamp).getTime()))
      ? new Date(toTimestamp)
      : parseTimeToTodayDate(record.toTime, new Date(), timezoneOffset);
    if (toDate.getTime() <= new Date(record.fromTimestamp).getTime()) {
      toDate = new Date(toDate.getTime() + 24 * 60 * 60 * 1000);
    }
    record.toTimestamp = toDate;
    record.durationMinutes = durationMinutes || Math.round((toDate.getTime() - new Date(record.fromTimestamp).getTime()) / (60 * 1000));
    if (toDate.getTime() > Date.now()) {
      record.status = 'active';
    }
  }
  if (reason) {
    record.reason = String(reason).trim();
  }

  saveStore();

  if (getStatus()) {
    try {
      await BreakTime.findOneAndUpdate(
        buildIdQuery(breakId),
        {
          $set: {
            fromTime: record.fromTime,
            toTime: record.toTime,
            fromTimestamp: record.fromTimestamp,
            toTimestamp: record.toTimestamp,
            reason: record.reason,
            status: record.status
          }
        }
      );
    } catch (e) {
      console.warn('Mongo updateBreak error:', e.message);
    }
  }

  return record;
};

const deleteBreak = async (breakId, { userId, userRole } = {}) => {
  if (!memoryStore.breaks) memoryStore.breaks = [];
  const idx = memoryStore.breaks.findIndex(b => b.id === breakId || b.customId === breakId || b._id === breakId);
  if (idx === -1) {
    throw new Error('Break record not found');
  }

  const deleted = memoryStore.breaks.splice(idx, 1)[0];
  saveStore();

  // Also remove associated notifications
  if (memoryStore.notifications) {
    memoryStore.notifications = memoryStore.notifications.filter(n => n.referenceId !== breakId);
    saveStore();
  }

  if (getStatus()) {
    try {
      await BreakTime.deleteOne(buildIdQuery(breakId));
      await Notification.deleteMany({ referenceId: breakId });
    } catch (e) {
      console.warn('Mongo deleteBreak error:', e.message);
    }
  }

  return deleted;
};

// --- Helper: Find Appropriate Manager for Receiver Person ---
const findManagerForReceiver = (receiverUser, receiverMember) => {
  const teamId = receiverMember?.teamId || receiverUser?.teamId || receiverUser?.team;
  const deptId = receiverMember?.departmentId || receiverUser?.departmentId || receiverUser?.department;

  // 1. Look for manager in same team
  const teamManager = (memoryStore.users || []).find(u => {
    if (u.role !== 'manager') return false;
    if (teamId && (u.teamId === teamId || u.team === teamId)) return true;
    return false;
  });
  if (teamManager) return teamManager;

  // 2. Look for manager in same department
  const deptManager = (memoryStore.users || []).find(u => {
    if (u.role !== 'manager') return false;
    if (deptId && (u.departmentId === deptId || u.department === deptId)) return true;
    return false;
  });
  if (deptManager) return deptManager;

  // 3. Fallback to any user with role 'manager'
  const anyManager = (memoryStore.users || []).find(u => u.role === 'manager');
  if (anyManager) return anyManager;

  // 4. Default to admin/operations supervisor
  const admin = (memoryStore.users || []).find(u => u.role === 'admin') || (memoryStore.admins || [])[0];
  return admin || { id: 'admin-1', name: 'Operations Manager', email: 'admin@bgshealth.com', role: 'manager' };
};

// --- Work Request (External Person Assigns Extra Work) ---
const createWorkRequest = async (data) => {
  const senderName = (data.senderName || '').trim();
  const senderEmail = (data.senderEmail || '').trim().toLowerCase();
  const senderNumber = (data.senderNumber || '').trim();
  const receiverEmail = (data.receiverEmail || '').trim().toLowerCase();
  const title = (data.title || '').trim();
  const description = (data.description || '').trim();
  const priority = data.priority || 'High';
  const dueDate = data.dueDate || '';

  if (!senderName || !senderEmail) {
    throw new Error('Sender name and email are required');
  }
  if (!receiverEmail) {
    throw new Error('Receiver email is required');
  }
  if (!title) {
    throw new Error('Work title is required');
  }

  // 1. Verify receiver exists in registered users
  const receiverVerification = await verifyReceiverEmail(receiverEmail);
  if (!receiverVerification.exists || !receiverVerification.user) {
    throw new Error('Invalid receiver email: user is not registered in the system.');
  }

  const recUser = receiverVerification.user;
  const recMember = (memoryStore.members || []).find(m =>
    (m.email && m.email.toLowerCase() === receiverEmail) ||
    (recUser.id && (m.id === recUser.id || m.userId === recUser.id))
  );

  const manager = findManagerForReceiver(recUser, recMember);

  const referenceId = `WRK-REQ-${Math.floor(100000 + Math.random() * 900000)}`;
  const customId = `workreq-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;

  const workReq = {
    id: customId,
    customId,
    referenceId,
    formType: 'Extra Work Assignment',
    title,
    description,
    priority,
    dueDate,
    senderName,
    senderEmail,
    senderNumber,
    receiverId: recUser.id || recMember?.id || 'usr-receiver',
    receiverName: recUser.name || recMember?.name || 'Receiver',
    receiverEmail: receiverEmail,
    receiverRole: recUser.role || recMember?.role || 'Team Member',
    teamId: recMember?.teamId || recUser.teamId || '',
    teamName: recUser.team || recMember?.role || 'Assigned Team',
    departmentId: recMember?.departmentId || recUser.departmentId || '',
    departmentName: recUser.department || 'Operations',
    managerId: manager.id || manager.customId || 'mgr-1',
    managerName: manager.name || 'Manager',
    managerEmail: manager.email || '',
    status: 'Pending Manager Approval',
    createdAt: new Date().toISOString()
  };

  if (!memoryStore.workRequests) memoryStore.workRequests = [];
  memoryStore.workRequests.unshift(workReq);
  saveStore();

  if (getStatus()) {
    try {
      await WorkRequest.create(workReq);
    } catch (e) {
      console.warn('Mongo WorkRequest create error:', e.message);
    }
  }

  // 2. Notify Receiver Person (Status: Pending Manager Approval)
  try {
    createNotification({
      recipientRole: recUser.role || 'user',
      recipientUserId: workReq.receiverId,
      recipientEmail: workReq.receiverEmail,
      referenceId: workReq.referenceId,
      title: `📋 Incoming Extra Work Request: "${workReq.title}"`,
      message: `${workReq.senderName} (${workReq.senderEmail}) sent you an external work request. Status: Pending Manager Approval.`,
      link: 'my-work'
    });
  } catch (err) {
    console.warn('Receiver notification error:', err.message);
  }

  // 3. Notify Manager Dashboard (Manager Approval Required)
  try {
    createNotification({
      recipientRole: manager.role || 'manager',
      recipientUserId: workReq.managerId,
      recipientEmail: workReq.managerEmail,
      referenceId: workReq.referenceId,
      title: `⚠️ External Work Request Awaiting Approval`,
      message: `New external work request "${workReq.title}" for ${workReq.receiverName} from ${workReq.senderName}. Manager approval required.`,
      link: 'manager-dashboard'
    });
  } catch (err) {
    console.warn('Manager notification error:', err.message);
  }

  return workReq;
};

const getWorkRequests = async ({ userId, userEmail, userRole, status, managerId } = {}) => {
  if (!memoryStore.workRequests) memoryStore.workRequests = [];
  let list = memoryStore.workRequests;

  const cleanEmail = (userEmail || '').trim().toLowerCase();
  const cleanUserId = (userId || '').trim();

  // Scoped views:
  if (userRole === 'user' && (cleanEmail || cleanUserId)) {
    list = list.filter(w =>
      (cleanUserId && (w.receiverId === cleanUserId || w.senderEmail === cleanEmail)) ||
      (cleanEmail && (w.receiverEmail.toLowerCase() === cleanEmail || w.senderEmail === cleanEmail))
    );
  } else if (userRole === 'manager' && (cleanEmail || cleanUserId)) {
    list = list.filter(w =>
      (cleanUserId && w.managerId === cleanUserId) ||
      (cleanEmail && w.managerEmail?.toLowerCase() === cleanEmail) ||
      w.status === 'Pending Manager Approval'
    );
  }

  if (status && status !== 'All') {
    list = list.filter(w => w.status === status);
  }

  return list;
};

const approveWorkRequest = async (id, { managerId, managerName, managerEmail } = {}) => {
  if (!memoryStore.workRequests) memoryStore.workRequests = [];
  const req = memoryStore.workRequests.find(w => w.id === id || w.customId === id || w.referenceId === id);
  if (!req) {
    throw new Error('Work request not found');
  }

  if (req.status === 'Approved') {
    return { success: true, message: 'Work request already approved', workRequest: req };
  }

  req.status = 'Approved';
  req.approvedAt = new Date().toISOString();
  req.approvedBy = managerName || 'Manager';
  if (managerId) req.managerId = managerId;
  if (managerName) req.managerName = managerName;
  if (managerEmail) req.managerEmail = managerEmail;

  // AUTOMATIC ASSIGNMENT: Turn approved work request into active assignment for receiver!
  let createdAssign = null;
  try {
    createdAssign = await createAssignment({
      workTitle: req.title,
      workDescription: `${req.description || ''}\n\n[External Work Request Details]\nSender: ${req.senderName} (${req.senderEmail}${req.senderNumber ? ` • ${req.senderNumber}` : ''})\nApproved by Manager: ${req.approvedBy}\nReference ID: ${req.referenceId}`,
      priority: req.priority || 'High',
      dueDate: req.dueDate || new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      status: 'In Progress',
      assignerId: req.managerId || managerId || 'manager',
      assignerName: req.approvedBy,
      assignerRole: 'manager',
      assignerEmail: req.managerEmail,
      assigneeId: req.receiverId,
      assigneeName: req.receiverName,
      assigneeEmail: req.receiverEmail,
      memberId: req.receiverId,
      teamId: req.teamId || '',
      teamName: req.teamName || '',
      departmentId: req.departmentId || '',
      departmentName: req.departmentName || '',
      assignmentType: 'manager_to_user'
    });

    if (createdAssign && createdAssign.id) {
      req.assignedTaskId = createdAssign.id;
    }
  } catch (err) {
    console.error('Automatic assignment creation error during approval:', err);
  }

  saveStore();

  if (getStatus()) {
    try {
      await WorkRequest.findOneAndUpdate(
        { $or: [{ customId: req.id }, { referenceId: req.referenceId }] },
        {
          $set: {
            status: 'Approved',
            approvedAt: req.approvedAt,
            approvedBy: req.approvedBy,
            assignedTaskId: req.assignedTaskId
          }
        }
      );
    } catch (e) {
      console.warn('Mongo WorkRequest approve error:', e.message);
    }
  }

  // Notify Receiver Person: Manager Approved & Assigned the Work
  try {
    createNotification({
      recipientRole: req.receiverRole || 'user',
      recipientUserId: req.receiverId,
      recipientEmail: req.receiverEmail,
      referenceId: req.referenceId,
      title: `🎉 External Work Request Approved & Assigned`,
      message: `Manager ${req.approvedBy} approved "${req.title}" from ${req.senderName}. It is now in your active assigned work!`,
      link: 'my-work'
    });
  } catch (err) {
    console.warn('Receiver approval notification error:', err.message);
  }

  return { success: true, workRequest: req, assignment: createdAssign };
};

const rejectWorkRequest = async (id, { managerId, managerName, reason } = {}) => {
  if (!memoryStore.workRequests) memoryStore.workRequests = [];
  const req = memoryStore.workRequests.find(w => w.id === id || w.customId === id || w.referenceId === id);
  if (!req) {
    throw new Error('Work request not found');
  }

  req.status = 'Rejected';
  req.rejectedAt = new Date().toISOString();
  req.rejectedBy = managerName || 'Manager';
  req.rejectionReason = reason || 'Work request rejected by manager';

  saveStore();

  if (getStatus()) {
    try {
      await WorkRequest.findOneAndUpdate(
        { $or: [{ customId: req.id }, { referenceId: req.referenceId }] },
        {
          $set: {
            status: 'Rejected',
            rejectedAt: req.rejectedAt,
            rejectedBy: req.rejectedBy,
            rejectionReason: req.rejectionReason
          }
        }
      );
    } catch (e) {
      console.warn('Mongo WorkRequest reject error:', e.message);
    }
  }

  // Notify Receiver Person: Work Request Declined
  try {
    createNotification({
      recipientRole: req.receiverRole || 'user',
      recipientUserId: req.receiverId,
      recipientEmail: req.receiverEmail,
      referenceId: req.referenceId,
      title: `❌ Work Request Declined by Manager`,
      message: `The external work request "${req.title}" from ${req.senderName} was declined by Manager ${req.rejectedBy}.`,
      link: 'my-work'
    });
  } catch (err) {
    console.warn('Receiver rejection notification error:', err.message);
  }

  return { success: true, workRequest: req };
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
  validateSession,
  checkEmail,
  verifyReceiverEmail,
  createPassword,
  getUsers,
  updateUser,
  deleteUser,
  updateAdminProfile,
  updateUserProfile,
  getAdmins,
  createAdmin,
  deleteAdmin,
  verifyAdminAccess,
  getNotifications,
  createNotification,
  markNotificationRead,
  markAllNotificationsRead,
  getAppointments,
  createAppointment,
  updateAppointment,
  deleteAppointment,
  getAppointmentStats,
  // Real-Time Messaging Exports
  getEligibleUsers,
  findOrCreateConversation,
  createGroupConversation,
  getConversationsForUser,
  getMessagesForConversation,
  createMessage,
  markConversationAsRead,
  getTotalUnreadMessagesCount,
  // Video Meeting Exports
  createMeeting,
  endMeeting,
  issueMeetingInvitation,
  approveMeeting,
  getMeetingById,
  getMeetingsForUser,
  verifyMeetingAccess,
  getTurnCredentials,
  // Assignment & Task Time Tracking
  editAssignment,
  getTodayAttendance,
  getAttendanceRecords,
  recordPunchIn,
  recordPunchOut,
  checkAndApplyAutoMidnightPunchOut,
  startTaskTimer,
  pauseTaskTimer,
  resumeTaskTimer,
  finishTaskTimer,
  // Manager Timeline & Reports
  getManagerTimeline,
  getReports,
  updateReportEntry,
  deleteReportEntry,
  // Break Time Management
  getActiveBreaks,
  getTodayBreaks,
  recordBreak,
  updateBreak,
  endBreakEarly,
  deleteBreak,
  // External Work Requests (Assign Extra Work)
  createWorkRequest,
  getWorkRequests,
  approveWorkRequest,
  rejectWorkRequest
};
