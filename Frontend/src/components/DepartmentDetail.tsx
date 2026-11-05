import React, { useState } from 'react';
import { 
  Code2, 
  Palette, 
  Megaphone, 
  Layers, 
  Edit3, 
  Trash2, 
  Users, 
  UserCheck, 
  Send, 
  ClipboardList, 
  CheckCircle2,
  Search,
  Plus
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { TeamList } from './TeamList';
import { MembersTable } from './MembersTable';
import { AssignWorkForm } from './AssignWorkForm';
import { AssignedWorkSummary } from './AssignedWorkSummary';
import { Member } from '../types';

export const DepartmentDetail: React.FC = () => {
  const { 
    selectedDepartment, 
    activeTab, 
    setActiveTab, 
    openEditDepartment, 
    handleDeleteDepartment,
    members,
    teams,
    openEditMember,
    handleDeleteMember,
    setIsAddMemberOpen
  } = useApp();

  const [memberSearch, setMemberSearch] = useState('');

  if (!selectedDepartment) {
    return (
      <div id="department-detail" className="bg-white rounded-2xl border border-slate-200/60 p-8 text-center text-slate-500 shadow-sm flex-1">
        Please select a department from the left panel.
      </div>
    );
  }

  const getDeptIcon = (iconName: string) => {
    switch (iconName.toLowerCase()) {
      case 'code':
        return <Code2 className="w-5 h-5 text-indigo-600" />;
      case 'palette':
        return <Palette className="w-5 h-5 text-purple-600" />;
      case 'megaphone':
        return <Megaphone className="w-5 h-5 text-blue-600" />;
      case 'layers':
      default:
        return <Layers className="w-5 h-5 text-emerald-600" />;
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role.toLowerCase()) {
      case 'team lead':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700">Team Lead</span>;
      case 'developer':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">Developer</span>;
      case 'tester':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">Tester</span>;
      case 'designer':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-pink-100 text-pink-700">Designer</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">{role}</span>;
    }
  };

  const tabs = [
    { id: 'Teams', label: 'Teams', icon: Users },
    { id: 'Members', label: 'Members', icon: UserCheck },
    { id: 'Assign Work', label: 'Assign Work', icon: Send },
    { id: "Today's Work", label: "Today's Work", icon: ClipboardList },
    { id: "Today's Work Done", label: "Today's Work Done", icon: CheckCircle2 },
  ];

  const filteredMembers = members.filter(m => 
    m.name.toLowerCase().includes(memberSearch.toLowerCase()) ||
    m.email.toLowerCase().includes(memberSearch.toLowerCase()) ||
    m.role.toLowerCase().includes(memberSearch.toLowerCase())
  );

  return (
    <div id="department-detail" className="flex-1 flex flex-col space-y-4">
      {/* Top Department Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              {getDeptIcon(selectedDepartment.icon || selectedDepartment.name)}
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 leading-tight">
                {selectedDepartment.name} Department
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {selectedDepartment.description || 'Manage teams, members, roles and work.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button 
              onClick={() => openEditDepartment(selectedDepartment)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-colors shadow-2xs"
            >
              <Edit3 className="w-3.5 h-3.5 text-slate-500" />
              <span>Edit Department</span>
            </button>
            <button
              onClick={() => handleDeleteDepartment(selectedDepartment.id)}
              title="Delete Department"
              className="p-2 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 transition-colors shadow-2xs"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-6 mt-6 border-b border-slate-100 text-xs font-bold text-slate-500">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`pb-3 flex items-center gap-2 transition-colors relative cursor-pointer ${
                  isActive ? 'text-indigo-600 font-bold' : 'hover:text-slate-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-full" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content Display */}
      {activeTab === 'Teams' && (
        <div className="flex flex-col lg:flex-row gap-4 items-stretch flex-1">
          <TeamList />
          <MembersTable />
        </div>
      )}

      {activeTab === 'Assign Work' && (
        <div className="flex flex-col lg:flex-row gap-4 items-stretch flex-1">
          <AssignWorkForm />
          <AssignedWorkSummary />
        </div>
      )}

      {activeTab === 'Members' && (
        <div className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-xs flex-1 flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                Department Directory ({filteredMembers.length} Members)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                All team members across {selectedDepartment.name} teams.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={memberSearch}
                  onChange={(e) => setMemberSearch(e.target.value)}
                  placeholder="Search members..."
                  className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <button
                onClick={() => setIsAddMemberOpen(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors shadow-sm shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Member</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="py-2.5 px-3 w-8">#</th>
                  <th className="py-2.5 px-3">Member Name</th>
                  <th className="py-2.5 px-3">Team</th>
                  <th className="py-2.5 px-3">Email ID</th>
                  <th className="py-2.5 px-3">Phone</th>
                  <th className="py-2.5 px-3">Role</th>
                  <th className="py-2.5 px-3">Assigned Work</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/80 text-slate-700 font-medium">
                {filteredMembers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-6 text-center text-slate-400">
                      No members match the search.
                    </td>
                  </tr>
                ) : (
                  filteredMembers.map((member: Member, idx: number) => {
                    const team = teams.find(t => t.id === member.teamId);
                    return (
                      <tr key={member.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-3 text-slate-400 font-semibold">{idx + 1}</td>
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs ring-1 ring-indigo-200">
                              {member.name.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-semibold text-slate-900">{member.name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-slate-600 font-semibold">
                          {team?.name || 'Assigned Team'}
                        </td>
                        <td className="py-3 px-3 text-slate-600">{member.email}</td>
                        <td className="py-3 px-3 text-slate-600">{member.phone || '+91 98765 43210'}</td>
                        <td className="py-3 px-3">{getRoleBadge(member.role)}</td>
                        <td className="py-3 px-3 text-slate-600 max-w-xs truncate">{member.assignedWork || 'General responsibilities'}</td>
                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => openEditMember(member)}
                              title="Edit Member"
                              className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteMember(member.id)}
                              title="Delete Member"
                              className="p-1 rounded text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "Today's Work" && (
        <div className="bg-white rounded-2xl border border-slate-200/60 p-6 shadow-xs">
          <h3 className="font-bold text-slate-900 text-base mb-2">Today's Active Tasks</h3>
          <p className="text-xs text-slate-500 mb-4">
            Manage and check off today's priority deliverables.
          </p>
          <div className="max-w-xl">
            {/* Embedded tasks view */}
            <p className="text-xs text-slate-600">
              Scroll down to the <strong>Today's Tasks</strong> checklist below to interactively mark items completed or add new tasks.
            </p>
          </div>
        </div>
      )}

      {activeTab === "Today's Work Done" && (
        <div className="bg-white rounded-2xl border border-slate-200/60 p-6 shadow-xs">
          <h3 className="font-bold text-slate-900 text-base mb-2">Today's Completed Accomplishments</h3>
          <p className="text-xs text-slate-500 mb-4">
            Completed tasks and delivered PRs for today.
          </p>
          <div className="max-w-xl">
            <p className="text-xs text-slate-600">
              Scroll down to the <strong>Today's Work Done</strong> section below to review accomplishments or log new completed work.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
