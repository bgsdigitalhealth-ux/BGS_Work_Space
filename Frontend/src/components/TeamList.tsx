import React from 'react';
import { Plus, Users } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const TeamList: React.FC = () => {
  const { teams, selectedTeam, setSelectedTeam, selectedDepartment, setIsAddTeamOpen, setEditingTeam, members } = useApp();

  const getTeamMemberCount = (teamId: string) => {
    const count = members.filter(m => m.teamId === teamId).length;
    return `${count} ${count === 1 ? 'member' : 'members'}`;
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/60 p-4 shadow-xs w-full lg:w-64 shrink-0">
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-bold text-slate-900 text-sm">
          Teams in {selectedDepartment?.name || 'Department'}
        </h4>
        <button
          onClick={() => {
            setEditingTeam(null);
            setIsAddTeamOpen(true);
          }}
          className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1 transition-colors shadow-sm cursor-pointer"
        >
          <Plus className="w-3 h-3" />
          <span>Add Team</span>
        </button>
      </div>

      <div className="space-y-1.5">
        {teams.length === 0 ? (
          <div className="text-center py-6 text-slate-400 text-xs">
            No teams created yet. Click "+ Add Team" above!
          </div>
        ) : (
          teams.map((team) => {
            const isSelected = selectedTeam?.id === team.id;
            return (
              <button
                key={team.id}
                onClick={() => setSelectedTeam(team)}
                className={`w-full flex items-start gap-3 p-3 rounded-xl text-left text-sm transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-50/90 text-indigo-950 border border-indigo-200/80 shadow-2xs'
                    : 'text-slate-700 hover:bg-slate-50 border border-transparent'
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${isSelected ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500'}`}>
                  <Users className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold truncate">{team.name}</p>
                  <p className={`text-xs mt-0.5 ${isSelected ? 'text-indigo-600 font-medium' : 'text-slate-400'}`}>
                    {getTeamMemberCount(team.id)}
                  </p>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};
