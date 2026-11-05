import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';

export const Modals: React.FC = () => {
  const {
    isAddDeptOpen,
    setIsAddDeptOpen,
    editingDept,
    setEditingDept,

    isAddTeamOpen,
    setIsAddTeamOpen,
    editingTeam,
    setEditingTeam,

    isAddMemberOpen,
    setIsAddMemberOpen,
    editingMember,
    setEditingMember,

    isAddTaskOpen,
    setIsAddTaskOpen,
    isAddWorkDoneOpen,
    setIsAddWorkDoneOpen,

    selectedDepartment,
    selectedTeam,
    refreshAll
  } = useApp();

  // Add / Edit Department State
  const [deptName, setDeptName] = useState('');
  const [deptIcon, setDeptIcon] = useState('code');
  const [deptDesc, setDeptDesc] = useState('');

  useEffect(() => {
    if (editingDept) {
      setDeptName(editingDept.name);
      setDeptIcon(editingDept.icon || 'code');
      setDeptDesc(editingDept.description || '');
    } else {
      setDeptName('');
      setDeptIcon('code');
      setDeptDesc('');
    }
  }, [editingDept, isAddDeptOpen]);

  // Add / Edit Team State
  const [teamName, setTeamName] = useState('');
  const [teamDesc, setTeamDesc] = useState('');

  useEffect(() => {
    if (editingTeam) {
      setTeamName(editingTeam.name);
      setTeamDesc(editingTeam.description || '');
    } else {
      setTeamName('');
      setTeamDesc('');
    }
  }, [editingTeam, isAddTeamOpen]);

  // Add / Edit Member State
  const [memName, setMemName] = useState('');
  const [memEmail, setMemEmail] = useState('');
  const [memPhone, setMemPhone] = useState('+91 98765 43210');
  const [memRole, setMemRole] = useState('Developer');
  const [memWork, setMemWork] = useState('');

  useEffect(() => {
    if (editingMember) {
      setMemName(editingMember.name);
      setMemEmail(editingMember.email);
      setMemPhone(editingMember.phone || '+91 98765 43210');
      setMemRole(editingMember.role || 'Developer');
      setMemWork(editingMember.assignedWork || '');
    } else {
      setMemName('');
      setMemEmail('');
      setMemPhone('+91 98765 43210');
      setMemRole('Developer');
      setMemWork('');
    }
  }, [editingMember, isAddMemberOpen]);

  // Add Task State
  const [taskTitle, setTaskTitle] = useState('');
  const [taskPriority, setTaskPriority] = useState<'High' | 'Medium' | 'Low'>('Medium');

  // Add Work Done State
  const [workDoneTitle, setWorkDoneTitle] = useState('');
  const [workDoneDetails, setWorkDoneDetails] = useState('');

  // Handlers
  const handleSaveDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deptName) return;
    try {
      if (editingDept) {
        await api.updateDepartment(editingDept.id, {
          name: deptName,
          icon: deptIcon,
          description: deptDesc
        });
      } else {
        await api.createDepartment({
          name: deptName,
          icon: deptIcon,
          description: deptDesc
        });
      }
      setIsAddDeptOpen(false);
      setEditingDept(null);
      await refreshAll();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName || !selectedDepartment) return;
    try {
      if (editingTeam) {
        await api.updateTeam(editingTeam.id, {
          name: teamName,
          description: teamDesc
        });
      } else {
        await api.createTeam({
          name: teamName,
          departmentId: selectedDepartment.id,
          description: teamDesc
        });
      }
      setIsAddTeamOpen(false);
      setEditingTeam(null);
      await refreshAll();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memName || !memEmail || !selectedTeam || !selectedDepartment) return;
    try {
      if (editingMember) {
        await api.updateMember(editingMember.id, {
          name: memName,
          email: memEmail,
          phone: memPhone,
          role: memRole,
          assignedWork: memWork
        });
      } else {
        await api.createMember({
          name: memName,
          email: memEmail,
          phone: memPhone,
          role: memRole,
          assignedWork: memWork,
          teamId: selectedTeam.id,
          departmentId: selectedDepartment.id
        });
      }
      setIsAddMemberOpen(false);
      setEditingMember(null);
      await refreshAll();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle || !selectedTeam) return;
    try {
      await api.createTask({
        teamId: selectedTeam.id,
        title: taskTitle,
        priority: taskPriority
      });
      setIsAddTaskOpen(false);
      setTaskTitle('');
      await refreshAll();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateWorkDone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workDoneTitle || !selectedTeam) return;
    try {
      await api.createWorkDone({
        teamId: selectedTeam.id,
        title: workDoneTitle,
        details: workDoneDetails
      });
      setIsAddWorkDoneOpen(false);
      setWorkDoneTitle('');
      setWorkDoneDetails('');
      await refreshAll();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <>
      {/* Department Modal (Add or Edit) */}
      {isAddDeptOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">
                {editingDept ? 'Edit Department' : 'Add New Department'}
              </h3>
              <button 
                onClick={() => {
                  setIsAddDeptOpen(false);
                  setEditingDept(null);
                }} 
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveDepartment} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Department Name *</label>
                <input
                  type="text"
                  required
                  value={deptName}
                  onChange={(e) => setDeptName(e.target.value)}
                  placeholder="e.g. Research & Development"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Icon Style</label>
                <select
                  value={deptIcon}
                  onChange={(e) => setDeptIcon(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                >
                  <option value="code">Code (&lt;/&gt; - Engineering)</option>
                  <option value="palette">Palette (Design)</option>
                  <option value="megaphone">Megaphone (Marketing)</option>
                  <option value="layers">Layers (Operations)</option>
                </select>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={deptDesc}
                  onChange={(e) => setDeptDesc(e.target.value)}
                  placeholder="Department scope and purpose..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddDeptOpen(false);
                    setEditingDept(null);
                  }}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 cursor-pointer"
                >
                  {editingDept ? 'Save Changes' : 'Create Department'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Team Modal (Add or Edit) */}
      {isAddTeamOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">
                {editingTeam ? 'Edit Team' : 'Add New Team'}
              </h3>
              <button 
                onClick={() => {
                  setIsAddTeamOpen(false);
                  setEditingTeam(null);
                }} 
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveTeam} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Team Name *</label>
                <input
                  type="text"
                  required
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  placeholder="e.g. Mobile Apps Team"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={teamDesc}
                  onChange={(e) => setTeamDesc(e.target.value)}
                  placeholder="Focus areas and responsibilities..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddTeamOpen(false);
                    setEditingTeam(null);
                  }}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 cursor-pointer"
                >
                  {editingTeam ? 'Save Changes' : 'Create Team'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Member Modal (Add or Edit) */}
      {isAddMemberOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">
                {editingMember ? 'Edit Team Member' : 'Add Team Member'}
              </h3>
              <button 
                onClick={() => {
                  setIsAddMemberOpen(false);
                  setEditingMember(null);
                }} 
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveMember} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Member Name *</label>
                <input
                  type="text"
                  required
                  value={memName}
                  onChange={(e) => setMemName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Email ID *</label>
                <input
                  type="email"
                  required
                  value={memEmail}
                  onChange={(e) => setMemEmail(e.target.value)}
                  placeholder="e.g. john@company.com"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={memPhone}
                  onChange={(e) => setMemPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Role</label>
                <select
                  value={memRole}
                  onChange={(e) => setMemRole(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                >
                  <option value="Team Lead">Team Lead</option>
                  <option value="Developer">Developer</option>
                  <option value="Tester">Tester</option>
                  <option value="Designer">Designer</option>
                </select>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Assigned Work</label>
                <input
                  type="text"
                  value={memWork}
                  onChange={(e) => setMemWork(e.target.value)}
                  placeholder="e.g. Build authentication endpoints"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddMemberOpen(false);
                    setEditingMember(null);
                  }}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 cursor-pointer"
                >
                  {editingMember ? 'Save Changes' : 'Add Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Task Modal */}
      {isAddTaskOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">Add Today's Task</h3>
              <button onClick={() => setIsAddTaskOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateTask} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Task Title *</label>
                <input
                  type="text"
                  required
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="e.g. Write integration tests for payment module"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Priority</label>
                <select
                  value={taskPriority}
                  onChange={(e) => setTaskPriority(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                >
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddTaskOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 cursor-pointer"
                >
                  Add Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Work Done Modal */}
      {isAddWorkDoneOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">Log Completed Work</h3>
              <button onClick={() => setIsAddWorkDoneOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateWorkDone} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Work Done Title *</label>
                <input
                  type="text"
                  required
                  value={workDoneTitle}
                  onChange={(e) => setWorkDoneTitle(e.target.value)}
                  placeholder="e.g. Database schema migration executed"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Details (Optional)</label>
                <textarea
                  rows={2}
                  value={workDoneDetails}
                  onChange={(e) => setWorkDoneDetails(e.target.value)}
                  placeholder="Outcome, commit or PR links..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddWorkDoneOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 cursor-pointer"
                >
                  Log Work
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
