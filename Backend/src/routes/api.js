const express = require('express');
const router = express.Router();
const dataService = require('../seed/dataService');

// --- Real-Time Server-Sent Events (SSE) Engine ---
let sseClients = [];

router.get('/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const clientId = Date.now();
  const client = { id: clientId, res };
  sseClients.push(client);

  res.write(`data: ${JSON.stringify({ type: 'CONNECTED', clientId })}\n\n`);

  req.on('close', () => {
    sseClients = sseClients.filter(c => c.id !== clientId);
  });
});

const broadcast = (type, payload = {}) => {
  const data = JSON.stringify({ type, payload, timestamp: Date.now() });
  sseClients.forEach(c => {
    try {
      c.res.write(`data: ${data}\n\n`);
    } catch (e) {
      // stale connection
    }
  });
};

// --- Authentication (ONLY TWO ROLES: admin and user) ---
router.post('/auth/check-email', async (req, res) => {
  try {
    const { email } = req.body;
    const result = await dataService.checkEmail(email);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/auth/create-password', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    const result = await dataService.createPassword(email, password);
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    broadcast('USER_PASSWORD_SET', { email });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    const result = await dataService.loginUser(email, password);
    if (!result.success) {
      if (result.requiresPasswordSetup) {
        return res.status(200).json(result);
      }
      return res.status(401).json({ error: result.error, requiresPasswordSetup: false });
    }
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/auth/users', async (req, res) => {
  try {
    const users = await dataService.getUsers();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Admin Profile & Personnel Settings ---
router.put('/auth/profile', async (req, res) => {
  try {
    const { identifier, name, email, newPassword } = req.body;
    const target = identifier || email;
    if (!target) {
      return res.status(400).json({ error: 'User identifier or email is required' });
    }
    const result = await dataService.updateAdminProfile(target, { name, email, newPassword });
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    broadcast('ADMIN_PROFILE_UPDATED', { user: result.user });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/auth/admins', async (req, res) => {
  try {
    const admins = await dataService.getAdmins();
    res.json(admins);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/auth/admins', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }
    const result = await dataService.createAdmin({ name, email, password });
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    broadcast('ADMIN_CREATED', { admin: result.user });
    res.status(201).json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/auth/admins/:id', async (req, res) => {
  try {
    const result = await dataService.deleteAdmin(req.params.id);
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    broadcast('ADMIN_DELETED', { id: req.params.id });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Notifications Engine ---
router.get('/notifications', async (req, res) => {
  try {
    const { role, userId } = req.query;
    const list = await dataService.getNotifications(role, userId);
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/notifications/:id/read', async (req, res) => {
  try {
    const updated = await dataService.markNotificationRead(req.params.id);
    broadcast('NOTIFICATION_READ', { id: req.params.id });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/notifications/mark-all-read', async (req, res) => {
  try {
    const { role } = req.body;
    await dataService.markAllNotificationsRead(role);
    broadcast('NOTIFICATIONS_ALL_READ', { role });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Stats ---
router.get('/stats', async (req, res) => {
  try {
    const stats = await dataService.getStats();
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Departments ---
router.get('/departments', async (req, res) => {
  try {
    const departments = await dataService.getDepartments();
    res.json(departments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/departments', async (req, res) => {
  try {
    const { name, icon, description } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });
    const created = await dataService.createDepartment({ name, icon, description });
    broadcast('ORG_CHANGED', { entity: 'department', action: 'create', data: created });
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/departments/:id', async (req, res) => {
  try {
    const updated = await dataService.updateDepartment(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Department not found' });
    broadcast('ORG_CHANGED', { entity: 'department', action: 'update', data: updated });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/departments/:id', async (req, res) => {
  try {
    await dataService.deleteDepartment(req.params.id);
    broadcast('ORG_CHANGED', { entity: 'department', action: 'delete', id: req.params.id });
    res.json({ success: true, message: 'Department deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Teams ---
router.get('/teams', async (req, res) => {
  try {
    const { departmentId } = req.query;
    const teams = await dataService.getTeams(departmentId);
    res.json(teams);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/teams', async (req, res) => {
  try {
    const { name, departmentId, description } = req.body;
    if (!name || !departmentId) return res.status(400).json({ error: 'Name and departmentId are required' });
    const created = await dataService.createTeam({ name, departmentId, description });
    broadcast('ORG_CHANGED', { entity: 'team', action: 'create', data: created });
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/teams/:id', async (req, res) => {
  try {
    const updated = await dataService.updateTeam(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Team not found' });
    broadcast('ORG_CHANGED', { entity: 'team', action: 'update', data: updated });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/teams/:id', async (req, res) => {
  try {
    await dataService.deleteTeam(req.params.id);
    broadcast('ORG_CHANGED', { entity: 'team', action: 'delete', id: req.params.id });
    res.json({ success: true, message: 'Team deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Members ---
router.get('/members', async (req, res) => {
  try {
    const { teamId, departmentId } = req.query;
    const members = await dataService.getMembers(teamId, departmentId);
    res.json(members);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/members', async (req, res) => {
  try {
    const { name, email, phone, role, teamId, departmentId, assignedWork } = req.body;
    if (!name || !email) return res.status(400).json({ error: 'Name and email are required' });
    const created = await dataService.createMember({
      name,
      email,
      phone,
      role: role || 'Developer',
      teamId,
      departmentId,
      assignedWork
    });
    broadcast('ORG_CHANGED', { entity: 'member', action: 'create', data: created });
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/members/:id', async (req, res) => {
  try {
    const updated = await dataService.updateMember(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Member not found' });
    broadcast('ORG_CHANGED', { entity: 'member', action: 'update', data: updated });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/members/:id', async (req, res) => {
  try {
    await dataService.deleteMember(req.params.id);
    broadcast('ORG_CHANGED', { entity: 'member', action: 'delete', id: req.params.id });
    res.json({ success: true, message: 'Member deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Assignments (Any-to-Any: user_to_user, admin_to_admin, user_to_admin, admin_to_user) ---
router.get('/assignments', async (req, res) => {
  try {
    const { teamId, userId, assignerId, assigneeId, type } = req.query;
    const assignments = await dataService.getAssignments({ teamId, userId, assignerId, assigneeId, type });
    res.json(assignments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/assignments', async (req, res) => {
  try {
    const { workTitle } = req.body;
    if (!workTitle) return res.status(400).json({ error: 'Work title is required' });
    const created = await dataService.createAssignment(req.body);
    broadcast('WORK_ASSIGNED', created);
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/assignments/:id', async (req, res) => {
  try {
    await dataService.deleteAssignment(req.params.id);
    broadcast('ASSIGNMENT_DELETED', { id: req.params.id });
    res.json({ success: true, message: 'Assignment deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Admin Work Review (Approve / Rework) ---
router.post('/work/:id/approve', async (req, res) => {
  try {
    const { comment } = req.body;
    const result = await dataService.approveWork(req.params.id, comment);
    broadcast('WORK_APPROVED', result);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/work/:id/rework', async (req, res) => {
  try {
    const { feedback } = req.body;
    const result = await dataService.requestRework(req.params.id, feedback);
    broadcast('REWORK_REQUESTED', result);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Tasks ---
router.get('/tasks', async (req, res) => {
  try {
    const { teamId } = req.query;
    const tasks = await dataService.getTasks(teamId);
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/tasks', async (req, res) => {
  try {
    const { teamId, title, priority, date } = req.body;
    if (!title) return res.status(400).json({ error: 'Title is required' });
    const created = await dataService.createTask({ teamId, title, priority, date });
    broadcast('TASK_CHANGED', { action: 'create', data: created });
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/tasks/:id', async (req, res) => {
  try {
    const updated = await dataService.updateTask(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Task not found' });
    broadcast('TASK_CHANGED', { action: 'update', data: updated });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/tasks/:id/toggle', async (req, res) => {
  try {
    const updated = await dataService.toggleTask(req.params.id);
    if (!updated) return res.status(404).json({ error: 'Task not found' });
    broadcast('TASK_CHANGED', { action: 'toggle', data: updated });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/tasks/:id', async (req, res) => {
  try {
    await dataService.deleteTask(req.params.id);
    broadcast('TASK_CHANGED', { action: 'delete', id: req.params.id });
    res.json({ success: true, message: 'Task deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Work Done ---
router.get('/work-done', async (req, res) => {
  try {
    const { teamId } = req.query;
    const items = await dataService.getWorkDone(teamId);
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/work-done', async (req, res) => {
  try {
    const { teamId, title, details, date } = req.body;
    if (!title) return res.status(400).json({ error: 'Title is required' });
    const created = await dataService.createWorkDone({ teamId, title, details, date });
    broadcast('WORK_DONE_CHANGED', { action: 'create', data: created });
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/work-done/:id', async (req, res) => {
  try {
    await dataService.deleteWorkDone(req.params.id);
    broadcast('WORK_DONE_CHANGED', { action: 'delete', id: req.params.id });
    res.json({ success: true, message: 'Work done deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- User Workspace Routes ---
router.get('/user/workspace', async (req, res) => {
  try {
    const workspace = await dataService.getUserWorkspace();
    res.json(workspace);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/user/submit-work', async (req, res) => {
  try {
    const result = await dataService.submitUserWork(req.body);
    broadcast('WORK_SUBMITTED', result);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/user/comment', async (req, res) => {
  try {
    const { taskId, ...data } = req.body;
    if (!taskId) return res.status(400).json({ error: 'taskId is required' });
    const comment = await dataService.addUserComment(taskId, data);
    broadcast('COMMENT_ADDED', { taskId, comment });
    res.json(comment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/user/status/:id', async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) return res.status(400).json({ error: 'status is required' });
    const updated = await dataService.updateUserWorkStatus(req.params.id, status);
    if (!updated) return res.status(404).json({ error: 'Task not found' });
    broadcast('WORK_STATUS_CHANGED', updated);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Appointments Routes ---
router.get('/appointments/stats', async (req, res) => {
  try {
    const stats = await dataService.getAppointmentStats();
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/appointments', async (req, res) => {
  try {
    const { status, userId, date, search } = req.query;
    const list = await dataService.getAppointments({ status, userId, date, search });
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/appointments', async (req, res) => {
  try {
    const created = await dataService.createAppointment(req.body);
    broadcast('APPOINTMENT_CHANGED', { action: 'create', data: created });
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/appointments/:id', async (req, res) => {
  try {
    const updated = await dataService.updateAppointment(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Appointment not found' });
    broadcast('APPOINTMENT_CHANGED', { action: 'update', data: updated });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/appointments/:id', async (req, res) => {
  try {
    await dataService.deleteAppointment(req.params.id);
    broadcast('APPOINTMENT_CHANGED', { action: 'delete', id: req.params.id });
    res.json({ success: true, message: 'Appointment deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Purge & Reset All Dummy Data ---
router.post(['/reset-data', '/purge-all-data'], async (req, res) => {
  try {
    const result = await dataService.clearAllData();
    broadcast('DATA_RESET', { message: 'All dummy data purged completely' });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Real-Time Messaging Endpoints ---
const { getIO } = require('../socket');

router.get('/messages/eligible-users', async (req, res) => {
  try {
    const { currentUserId } = req.query;
    const users = await dataService.getEligibleUsers(currentUserId);
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/messages/conversations', async (req, res) => {
  try {
    const { userId, email } = req.query;
    if (!userId && !email) {
      return res.status(400).json({ error: 'userId or email is required' });
    }
    const conversations = await dataService.getConversationsForUser(userId, email);
    res.json(conversations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/messages/conversations/start', async (req, res) => {
  try {
    const { currentUserId, recipientEmail } = req.body;
    if (!currentUserId || !recipientEmail) {
      return res.status(400).json({ error: 'currentUserId and recipientEmail are required' });
    }
    const conversation = await dataService.findOrCreateConversation(currentUserId, recipientEmail);
    res.status(200).json(conversation);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/messages/history/:conversationId', async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { userId } = req.query;
    const messages = await dataService.getMessagesForConversation(conversationId, userId);
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/messages/send', async (req, res) => {
  try {
    const msg = await dataService.createMessage(req.body);
    const io = getIO();
    if (io) {
      io.to(`conv_${msg.conversationId}`).emit('new_message', msg);
      io.to(`user_${msg.recipientId}`).emit('conversation_updated', {
        conversationId: msg.conversationId,
        lastMessage: msg,
        recipientId: msg.recipientId
      });
      io.to(`user_${msg.recipientEmail}`).emit('conversation_updated', {
        conversationId: msg.conversationId,
        lastMessage: msg,
        recipientId: msg.recipientId
      });
      io.to(`user_${msg.senderId}`).emit('conversation_updated', {
        conversationId: msg.conversationId,
        lastMessage: msg,
        senderId: msg.senderId
      });
      io.to(`user_${msg.senderEmail}`).emit('conversation_updated', {
        conversationId: msg.conversationId,
        lastMessage: msg,
        senderId: msg.senderId
      });
    }
    broadcast('MESSAGES_UPDATED', { conversationId: msg.conversationId });
    res.status(201).json(msg);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/messages/read/:conversationId', async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { userId } = req.body;
    await dataService.markConversationAsRead(conversationId, userId);
    const io = getIO();
    if (io) {
      io.to(`conv_${conversationId}`).emit('messages_read', {
        conversationId,
        readerId: userId,
        readAt: new Date().toISOString()
      });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/messages/unread-count', async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }
    const count = await dataService.getTotalUnreadMessagesCount(userId);
    res.json({ count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
