const express = require('express');
const router = express.Router();
const dataService = require('../seed/dataService');

// Stats
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
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/departments/:id', async (req, res) => {
  try {
    const updated = await dataService.updateDepartment(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Department not found' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/departments/:id', async (req, res) => {
  try {
    await dataService.deleteDepartment(req.params.id);
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
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/teams/:id', async (req, res) => {
  try {
    const updated = await dataService.updateTeam(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Team not found' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/teams/:id', async (req, res) => {
  try {
    await dataService.deleteTeam(req.params.id);
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
    const { name, email, phone, role, assignedWork, teamId, departmentId } = req.body;
    if (!name || !email) return res.status(400).json({ error: 'Name and email are required' });
    const created = await dataService.createMember({
      name,
      email,
      phone,
      role,
      assignedWork,
      teamId,
      departmentId
    });
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/members/:id', async (req, res) => {
  try {
    const updated = await dataService.updateMember(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Member not found' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/members/:id', async (req, res) => {
  try {
    await dataService.deleteMember(req.params.id);
    res.json({ success: true, message: 'Member deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Assignments ---
router.get('/assignments', async (req, res) => {
  try {
    const { teamId } = req.query;
    const assignments = await dataService.getAssignments(teamId);
    res.json(assignments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/assignments', async (req, res) => {
  try {
    const { memberId, teamId, workTitle, workDescription, role, priority, dueDate, status } = req.body;
    if (!memberId || !workTitle) return res.status(400).json({ error: 'Member and Work Title are required' });
    const created = await dataService.createAssignment({
      memberId,
      teamId,
      workTitle,
      workDescription,
      role,
      priority,
      dueDate,
      status
    });
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/assignments/:id', async (req, res) => {
  try {
    await dataService.deleteAssignment(req.params.id);
    res.json({ success: true, message: 'Assignment deleted' });
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
    if (!title) return res.status(400).json({ error: 'Task title is required' });
    const created = await dataService.createTask({ teamId, title, priority, date });
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/tasks/:id', async (req, res) => {
  try {
    const updated = await dataService.updateTask(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Task not found' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/tasks/:id/toggle', async (req, res) => {
  try {
    const updated = await dataService.toggleTask(req.params.id);
    if (!updated) return res.status(404).json({ error: 'Task not found' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/tasks/:id', async (req, res) => {
  try {
    await dataService.deleteTask(req.params.id);
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
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/work-done/:id', async (req, res) => {
  try {
    await dataService.deleteWorkDone(req.params.id);
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
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/appointments/:id', async (req, res) => {
  try {
    const updated = await dataService.updateAppointment(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Appointment not found' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/appointments/:id', async (req, res) => {
  try {
    await dataService.deleteAppointment(req.params.id);
    res.json({ success: true, message: 'Appointment deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
