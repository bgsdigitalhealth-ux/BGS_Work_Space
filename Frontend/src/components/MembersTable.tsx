import React from 'react';
import { Users, Edit3, Trash2, Plus, Phone, Mail } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Member } from '../types';

export const MembersTable: React.FC = () => {
  const { 
    selectedTeam, 
    members, 
    teamSubTab, 
    setTeamSubTab, 
    setIsAddMemberOpen, 
    handleDeleteMember, 
    handleDeleteTeam 
  } = useApp();

  if (!selectedTeam) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/60 p-8 text-center text-slate-500 shadow-sm flex-1">
        Please select a team to view details and members.
      </div>
    );
  }

  const getRoleBadge = (role: string) => {
    switch (role.toLowerCase()) {
      case 'team lead':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700">
            Team Lead
          </span>
        );
      case 'developer':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
            Developer
          </span>
        );
      case 'tester':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
            Tester
          </span>
        );
      case 'designer':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-700">
            Designer
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
            {role}
          </span>
        );
    }
  };

  const getAvatarColor = (name: string) => {
    const char = (name || 'A').charAt(0).toUpperCase();
    if (['R', 'V'].includes(char)) return 'bg-purple-100 text-purple-700 ring-purple-200';
    if (['P', 'K'].includes(char)) return 'bg-blue-100 text-blue-700 ring-blue-200';
    if (['A'].includes(char)) return 'bg-emerald-100 text-emerald-700 ring-emerald-200';
    return 'bg-pink-100 text-pink-700 ring-pink-200';
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-sm flex-1 flex flex-col">
      {/* Team Info Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-lg leading-tight">
              {selectedTeam.name}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {selectedTeam.description || 'Develops and maintains services.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <Edit3 className="w-3.5 h-3.5 text-slate-500" />
            <span>Edit Team</span>
          </button>
          <button 
            onClick={() => handleDeleteTeam(selectedTeam.id)}
            title="Delete Team"
            className="p-2 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="flex items-center gap-6 mt-4 border-b border-slate-100 text-xs font-bold text-slate-500">
        <button
          onClick={() => setTeamSubTab('Members')}
          className={`pb-2.5 flex items-center gap-1.5 transition-colors relative ${
            teamSubTab === 'Members' ? 'text-indigo-600' : 'hover:text-slate-800'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Members</span>
          {teamSubTab === 'Members' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-full" />
          )}
        </button>

        <button
          onClick={() => setTeamSubTab('Roles')}
          className={`pb-2.5 flex items-center gap-1.5 transition-colors relative ${
            teamSubTab === 'Roles' ? 'text-indigo-600' : 'hover:text-slate-800'
          }`}
        >
          <span>+ Roles & Work</span>
          {teamSubTab === 'Roles' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-full" />
          )}
        </button>

        <button
          onClick={() => setTeamSubTab('Tasks')}
          className={`pb-2.5 flex items-center gap-1.5 transition-colors relative ${
            teamSubTab === 'Tasks' ? 'text-indigo-600' : 'hover:text-slate-800'
          }`}
        >
          <span>Today's Tasks</span>
          {teamSubTab === 'Tasks' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-full" />
          )}
        </button>

        <button
          onClick={() => setTeamSubTab('WorkDone')}
          className={`pb-2.5 flex items-center gap-1.5 transition-colors relative ${
            teamSubTab === 'WorkDone' ? 'text-indigo-600' : 'hover:text-slate-800'
          }`}
        >
          <span>Today's Work Done</span>
          {teamSubTab === 'WorkDone' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-full" />
          )}
        </button>
      </div>

      {/* Table Section Header */}
      <div className="flex items-center justify-between mt-4 mb-3">
        <h4 className="font-bold text-slate-800 text-sm">
          Team Members ({members.length})
        </h4>
        <button
          onClick={() => setIsAddMemberOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Member</span>
        </button>
      </div>

      {/* Members Table */}
      <div className="overflow-x-auto flex-1">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider">
              <th className="py-2.5 px-3 w-8">#</th>
              <th className="py-2.5 px-3">Member Name</th>
              <th className="py-2.5 px-3">Email ID</th>
              <th className="py-2.5 px-3">Number</th>
              <th className="py-2.5 px-3">Role</th>
              <th className="py-2.5 px-3">Assigned Work</th>
              <th className="py-2.5 px-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100/80 text-slate-700 font-medium">
            {members.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-6 text-center text-slate-400">
                  No members added to this team yet. Click "+ Add Member" to add one!
                </td>
              </tr>
            ) : (
              members.map((member: Member, idx: number) => (
                <tr key={member.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-3 text-slate-400 font-semibold">{idx + 1}</td>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ring-1 ${getAvatarColor(member.name)}`}>
                        {member.avatar || member.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-semibold text-slate-900">{member.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <Mail className="w-3 h-3 text-slate-400" />
                      <span>{member.email}</span>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3 h-3 text-slate-400" />
                      <span>{member.phone || '+91 98765 43210'}</span>
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    {getRoleBadge(member.role)}
                  </td>
                  <td className="py-3 px-3 text-slate-600 max-w-xs truncate">
                    {member.assignedWork || 'General team responsibilities'}
                  </td>
                  <td className="py-3 px-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button 
                        title="Edit member"
                        className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={() => handleDeleteMember(member.id)}
                        title="Delete member"
                        className="p-1 rounded text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
