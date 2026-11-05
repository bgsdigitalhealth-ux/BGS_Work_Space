import React from 'react';
import { Plus, Code2, Palette, Megaphone, Layers } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Department } from '../types';

export const DepartmentList: React.FC = () => {
  const { departments, selectedDepartment, setSelectedDepartment, setIsAddDeptOpen, setEditingDept, teams } = useApp();

  const getIcon = (iconName: string) => {
    switch (iconName.toLowerCase()) {
      case 'code':
        return <Code2 className="w-4 h-4 text-indigo-600" />;
      case 'palette':
        return <Palette className="w-4 h-4 text-purple-600" />;
      case 'megaphone':
        return <Megaphone className="w-4 h-4 text-blue-600" />;
      case 'layers':
      default:
        return <Layers className="w-4 h-4 text-emerald-600" />;
    }
  };

  const getTeamCountText = (dept: Department) => {
    const deptTeams = teams.filter(t => t.departmentId === dept.id);
    return `(${deptTeams.length} ${deptTeams.length === 1 ? 'team' : 'teams'})`;
  };

  return (
    <div id="departments-section" className="bg-white rounded-2xl border border-slate-200/60 p-4 shadow-xs w-full lg:w-72 shrink-0">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-slate-900 text-base">Departments</h3>
        <button
          onClick={() => {
            setEditingDept(null);
            setIsAddDeptOpen(true);
          }}
          className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors shadow-sm cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Department</span>
        </button>
      </div>

      <div className="space-y-1.5">
        {departments.length === 0 ? (
          <div className="text-center py-6 px-3 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-slate-400 text-xs">
            No departments created yet. Click <span className="font-semibold text-indigo-600">+ Add Department</span> above!
          </div>
        ) : (
          departments.map((dept) => {
          const isSelected = selectedDepartment?.id === dept.id;
          return (
            <button
              key={dept.id}
              onClick={() => setSelectedDepartment(dept)}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-left text-sm font-semibold transition-all cursor-pointer ${
                isSelected
                  ? 'bg-indigo-50/90 text-indigo-900 border border-indigo-200/80 shadow-2xs'
                  : 'text-slate-700 hover:bg-slate-50 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-3 truncate">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isSelected ? 'bg-white shadow-2xs' : 'bg-slate-100'}`}>
                  {getIcon(dept.icon || dept.name)}
                </div>
                <span className="truncate">{dept.name}</span>
              </div>
              <span className={`text-xs font-normal shrink-0 ${isSelected ? 'text-indigo-600 font-medium' : 'text-slate-400'}`}>
                {getTeamCountText(dept)}
              </span>
            </button>
          );
        })
        )}
      </div>
    </div>
  );
};
