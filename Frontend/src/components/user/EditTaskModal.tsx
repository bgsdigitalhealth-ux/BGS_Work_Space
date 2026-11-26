import React, { useState, useEffect } from 'react';
import { X, Edit3, CheckCircle2, Calendar, UserCheck, Tag, Building2, Users, Trash2 } from 'lucide-react';
import { useApp, formatTaskDueDate } from '../../context/AppContext';
import { UserAssignedWork } from '../../types';

interface EditTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: UserAssignedWork | null;
}

export const EditTaskModal: React.FC<EditTaskModalProps> = ({
  isOpen,
  onClose,
  task
}) => {
  const { departments, teams, members, handleEditAssignment, handleDeleteAssignment } = useApp();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [teamId, setTeamId] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<'High' | 'Medium' | 'Low'>('Medium');
  const [status, setStatus] = useState<string>('In Progress');
  const [progress, setProgress] = useState<number>(60);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (task) {
      setTitle(task.title || '');
      setDescription(task.description || '');
      setDepartmentId(task.departmentId || '');
      setTeamId(task.teamId || '');
      setAssigneeId(task.assigneeId || task.userId || '');
      const toISODate = (val?: string) => {
        if (!val || val.trim().toLowerCase() === 'today') return new Date().toISOString().split('T')[0];
        if (/^\d{4}-\d{2}-\d{2}$/.test(val.trim())) return val.trim();
        try {
          const d = new Date(val);
          if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
        } catch {}
        return new Date().toISOString().split('T')[0];
      };
      setDueDate(toISODate(task.dueDate));
      setPriority(task.priority || 'Medium');
      setStatus(task.status || 'In Progress');
      setProgress(task.progress !== undefined ? task.progress : (task.status === 'Completed' ? 100 : 60));
    }
  }, [task]);

  if (!isOpen || !task) return null;

  // Filter teams by department
  const filteredTeams = departmentId
    ? teams.filter(t => t.departmentId === departmentId)
    : teams;

  // Filter members by team
  const filteredMembers = teamId
    ? members.filter(m => m.teamId === teamId)
    : members;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    try {
      const selectedMember = members.find(m => m.id === assigneeId);
      const selectedTeam = teams.find(t => t.id === teamId);
      const selectedDept = departments.find(d => d.id === departmentId);

      await handleEditAssignment(task.id, {
        title: title.trim(),
        workTitle: title.trim(),
        description: description.trim(),
        workDescription: description.trim(),
        departmentId,
        department: selectedDept ? selectedDept.name : task.department,
        teamId,
        team: selectedTeam ? selectedTeam.name : task.team,
        assigneeId,
        assigneeName: selectedMember ? selectedMember.name : task.assigneeName,
        assigneeEmail: selectedMember ? selectedMember.email : task.assigneeEmail,
        dueDate: formatTaskDueDate(dueDate) || dueDate,
        priority,
        status,
        progress: Number(progress)
      });
      onClose();
    } catch (e: any) {
      console.warn('Error saving assignment edit:', e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
      <div 
        className="bg-white rounded-2xl sm:rounded-3xl max-w-xl w-full max-h-[92dvh] flex flex-col shadow-2xl border border-gray-100 my-auto overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-indigo-50 to-purple-50 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#5a36e6] text-white flex items-center justify-center font-bold shadow-md shadow-indigo-600/20 shrink-0">
              <Edit3 className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold text-gray-900 truncate">Edit Assigned Work</h3>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-100 text-indigo-700 shrink-0">
                  {task.taskId || task.id}
                </span>
              </div>
              <p className="text-xs text-gray-500 font-medium truncate">Assignment & Task Editor</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="touch-target p-2 rounded-full hover:bg-gray-200/60 flex items-center justify-center text-gray-400 hover:text-gray-600 transition shrink-0 cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
          {/* Work Title */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Work Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5a36e6] focus:bg-white font-semibold text-gray-900"
              placeholder="e.g. Prepare event poster for CME"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Instructions & Deliverables
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5a36e6] focus:bg-white text-gray-700 leading-relaxed"
              placeholder="Detailed assignment brief..."
            />
          </div>

          {/* Department & Team Dropdowns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-[#5a36e6]" />
                <span>Department</span>
              </label>
              <select
                value={departmentId}
                onChange={(e) => {
                  setDepartmentId(e.target.value);
                  setTeamId('');
                }}
                className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5a36e6] font-medium text-gray-800"
              >
                <option value="">Select Department</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-[#5a36e6]" />
                <span>Team</span>
              </label>
              <select
                value={teamId}
                onChange={(e) => setTeamId(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5a36e6] font-medium text-gray-800"
              >
                <option value="">Select Team</option>
                {filteredTeams.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Assignee & Due Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Assignee (Member)</span>
              </label>
              <select
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5a36e6] font-medium text-gray-800"
              >
                <option value="">Select Assignee</option>
                {filteredMembers.map((m) => (
                  <option key={m.id} value={m.id}>{m.name} ({m.role || 'Member'})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                <span>Deadline (Due Date)</span>
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3.5 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5a36e6] font-medium text-gray-800 cursor-pointer"
                required
              />
            </div>
          </div>

          {/* Priority & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-rose-500" />
                <span>Priority</span>
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5a36e6] font-bold text-gray-800"
              >
                <option value="High">High Priority</option>
                <option value="Medium">Medium Priority</option>
                <option value="Low">Low Priority</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                <span>Status</span>
              </label>
              <select
                value={status}
                onChange={(e) => {
                  const newSt = e.target.value;
                  setStatus(newSt);
                  if (newSt === 'Completed') setProgress(100);
                  else if (newSt === 'To Do') setProgress(0);
                }}
                className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5a36e6] font-bold text-gray-800"
              >
                <option value="To Do">To Do</option>
                <option value="In Progress">In Progress</option>
                <option value="Under Review">Under Review</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between gap-2.5 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={async () => {
                await handleDeleteAssignment(task.id);
                onClose();
              }}
              disabled={isSubmitting}
              className="px-3.5 py-2.5 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 border border-rose-200 transition cursor-pointer flex items-center gap-1.5"
              title="Delete Assignment"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete Assignment</span>
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl bg-[#5a36e6] hover:bg-[#4828c4] text-white text-xs font-bold transition shadow-md shadow-indigo-600/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isSubmitting ? 'Saving Changes...' : 'Save & Audit Changes'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
