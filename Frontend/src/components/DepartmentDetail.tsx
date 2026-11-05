import React from 'react';
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
  CheckCircle2 
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { TeamList } from './TeamList';
import { MembersTable } from './MembersTable';
import { AssignWorkForm } from './AssignWorkForm';
import { AssignedWorkSummary } from './AssignedWorkSummary';

export const DepartmentDetail: React.FC = () => {
  const { 
    selectedDepartment, 
    activeTab, 
    setActiveTab, 
    handleDeleteDepartment 
  } = useApp();

  if (!selectedDepartment) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/60 p-8 text-center text-slate-500 shadow-sm flex-1">
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

  const tabs = [
    { id: 'Teams', label: 'Teams', icon: Users },
    { id: 'Members', label: 'Members', icon: UserCheck },
    { id: 'Assign Work', label: 'Assign Work', icon: Send },
    { id: "Today's Work", label: "Today's Work", icon: ClipboardList },
    { id: "Today's Work Done", label: "Today's Work Done", icon: CheckCircle2 },
  ];

  return (
    <div className="flex-1 flex flex-col space-y-4">
      {/* Top Department Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
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
            <button className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors">
              <Edit3 className="w-3.5 h-3.5 text-slate-500" />
              <span>Edit Department</span>
            </button>
            <button
              onClick={() => handleDeleteDepartment(selectedDepartment.id)}
              title="Delete Department"
              className="p-2 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
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
                className={`pb-3 flex items-center gap-2 transition-colors relative ${
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
        <div className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-sm">
          <MembersTable />
        </div>
      )}

      {activeTab === "Today's Work" && (
        <div className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-sm">
          <div className="text-center py-4 text-slate-600 text-sm">
            Check the "Today's Tasks" section below or select a specific team to manage daily checklists.
          </div>
        </div>
      )}

      {activeTab === "Today's Work Done" && (
        <div className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-sm">
          <div className="text-center py-4 text-slate-600 text-sm">
            Check the "Today's Work Done" section below to log and review accomplishments.
          </div>
        </div>
      )}
    </div>
  );
};
