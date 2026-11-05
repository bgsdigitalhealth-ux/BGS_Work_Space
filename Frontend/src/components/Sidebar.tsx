import React, { useState } from 'react';
import { 
  Shield, 
  LayoutDashboard, 
  Building2, 
  Users, 
  UserCheck, 
  CheckSquare, 
  ClipboardCheck, 
  FileBarChart, 
  ChevronDown, 
  ChevronRight,
  Database
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const Sidebar: React.FC = () => {
  const { stats, setActiveTab } = useApp();
  const [orgOpen, setOrgOpen] = useState(true);
  const [workOpen, setWorkOpen] = useState(true);

  return (
    <aside className="w-64 bg-[#121139] text-slate-300 flex flex-col shrink-0 min-h-screen">
      {/* Brand Header */}
      <div className="p-5 flex items-center gap-3 border-b border-indigo-950/60">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-900/30">
          <Shield className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-white font-bold text-base leading-tight">Admin Dashboard</h1>
          <span className="text-[11px] font-semibold tracking-wider text-indigo-300 uppercase">ADMIN</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
        {/* Dashboard Active */}
        <button 
          onClick={() => setActiveTab('Teams')}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-white bg-indigo-600/90 shadow-sm font-medium text-sm transition-colors text-left"
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>Dashboard</span>
        </button>

        {/* Organization Group */}
        <div className="pt-2">
          <button
            onClick={() => setOrgOpen(!orgOpen)}
            className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold uppercase tracking-wider text-slate-400 hover:text-white transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <Building2 className="w-4 h-4 text-slate-400" />
              <span>Organization</span>
            </div>
            {orgOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </button>
          
          {orgOpen && (
            <div className="mt-1 ml-4 pl-3 border-l border-indigo-950/70 space-y-1">
              <button 
                onClick={() => setActiveTab('Teams')}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-slate-300 hover:text-white hover:bg-white/5 transition-colors text-left"
              >
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                <span>Departments</span>
              </button>
              <button 
                onClick={() => setActiveTab('Teams')}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-slate-300 hover:text-white hover:bg-white/5 transition-colors text-left"
              >
                <Users className="w-3.5 h-3.5 text-slate-400" />
                <span>Teams</span>
              </button>
              <button 
                onClick={() => setActiveTab('Members')}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-slate-300 hover:text-white hover:bg-white/5 transition-colors text-left"
              >
                <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                <span>Members</span>
              </button>
            </div>
          )}
        </div>

        {/* Work Management Group */}
        <div className="pt-2">
          <button
            onClick={() => setWorkOpen(!workOpen)}
            className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold uppercase tracking-wider text-slate-400 hover:text-white transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <CheckSquare className="w-4 h-4 text-slate-400" />
              <span>Work Management</span>
            </div>
            {workOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </button>
          
          {workOpen && (
            <div className="mt-1 ml-4 pl-3 border-l border-indigo-950/70 space-y-1">
              <button 
                onClick={() => setActiveTab("Today's Work")}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-slate-300 hover:text-white hover:bg-white/5 transition-colors text-left"
              >
                <CheckSquare className="w-3.5 h-3.5 text-slate-400" />
                <span>Today's Tasks</span>
              </button>
              <button 
                onClick={() => setActiveTab("Today's Work Done")}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-slate-300 hover:text-white hover:bg-white/5 transition-colors text-left"
              >
                <ClipboardCheck className="w-3.5 h-3.5 text-slate-400" />
                <span>Today's Work Done</span>
              </button>
            </div>
          )}
        </div>

        {/* Reports */}
        <button 
          onClick={() => setActiveTab('Assign Work')}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/5 font-medium text-sm transition-colors text-left"
        >
          <FileBarChart className="w-4 h-4 text-slate-400" />
          <span>Reports</span>
        </button>
      </nav>

      {/* Database Mode pill at bottom */}
      <div className="p-4 border-t border-indigo-950/60 text-xs">
        <div className="flex items-center gap-2 text-indigo-300">
          <Database className="w-3.5 h-3.5 text-emerald-400" />
          <span className="font-medium truncate">{stats?.databaseMode || 'MongoDB Ready'}</span>
        </div>
      </div>
    </aside>
  );
};
