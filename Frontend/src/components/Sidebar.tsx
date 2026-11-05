import React, { useState } from 'react';
import { 
  Shield, 
  LayoutDashboard, 
  Building2, 
  Users, 
  UserCheck, 
  CheckSquare, 
  ClipboardCheck, 
  Calendar as CalendarIcon,
  FileBarChart, 
  ChevronDown, 
  ChevronRight,
  Database,
  ArrowRightLeft,
  Settings
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const Sidebar: React.FC = () => {
  const { 
    stats, 
    activeTab, 
    setActiveTab, 
    teamSubTab, 
    setTeamSubTab, 
    scrollToSection, 
    adminNav, 
    setAdminNav,
    setPortalMode 
  } = useApp();

  const [orgOpen, setOrgOpen] = useState(true);
  const [workOpen, setWorkOpen] = useState(true);

  return (
    <aside className="w-64 bg-[#121139] text-slate-300 flex flex-col shrink-0 min-h-screen">
      {/* Brand Header */}
      <div className="p-5 flex items-center gap-3 border-b border-indigo-950/60 cursor-pointer" onClick={() => setAdminNav('dashboard')}>
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-900/30">
          <Shield className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-white font-bold text-base leading-tight">WorkHub</h1>
          <span className="text-[11px] font-semibold tracking-wider text-indigo-300 uppercase">Admin Panel</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
        {/* Dashboard Link */}
        <button 
          onClick={() => {
            setAdminNav('dashboard');
            setActiveTab('Teams');
            setTeamSubTab('Members');
            scrollToSection('stats-overview');
          }}
          className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all text-left cursor-pointer ${
            adminNav === 'dashboard' && activeTab === 'Teams' && teamSubTab === 'Members'
              ? 'text-white bg-indigo-600 shadow-sm'
              : 'text-slate-300 hover:text-white hover:bg-white/5'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>Dashboard</span>
        </button>

        {/* Organization Group */}
        <div className="pt-2">
          <button
            onClick={() => setOrgOpen(!orgOpen)}
            className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold uppercase tracking-wider text-slate-400 hover:text-white transition-colors cursor-pointer"
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
                onClick={() => {
                  setAdminNav('dashboard');
                  scrollToSection('departments-section');
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-slate-300 hover:text-white hover:bg-white/5 transition-colors text-left cursor-pointer"
              >
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                <span>Departments</span>
              </button>
              <button 
                onClick={() => {
                  setAdminNav('dashboard');
                  setActiveTab('Teams');
                  setTeamSubTab('Members');
                  scrollToSection('department-detail');
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-slate-300 hover:text-white hover:bg-white/5 transition-colors text-left cursor-pointer"
              >
                <Users className="w-3.5 h-3.5 text-slate-400" />
                <span>Teams</span>
              </button>
              <button 
                onClick={() => {
                  setAdminNav('dashboard');
                  setActiveTab('Members');
                  scrollToSection('department-detail');
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors text-left cursor-pointer ${
                  activeTab === 'Members' ? 'text-white font-bold bg-white/10' : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
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
            className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold uppercase tracking-wider text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <CheckSquare className="w-4 h-4 text-slate-400" />
              <span>Work Management</span>
            </div>
            {workOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </button>
          
          {workOpen && (
            <div className="mt-1 ml-4 pl-3 border-l border-indigo-950/70 space-y-1">
              {/* Appointments (Active link matching screenshot!) */}
              <button 
                onClick={() => {
                  setAdminNav('appointments');
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors text-left cursor-pointer ${
                  adminNav === 'appointments' ? 'text-white font-bold bg-indigo-600 shadow-sm' : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <CalendarIcon className="w-3.5 h-3.5" />
                <span>Appointments</span>
              </button>

              <button 
                onClick={() => {
                  setAdminNav('dashboard');
                  setActiveTab('Teams');
                  setTeamSubTab('Tasks');
                  scrollToSection('department-detail');
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors text-left cursor-pointer ${
                  adminNav === 'dashboard' && teamSubTab === 'Tasks' ? 'text-white font-bold bg-white/10' : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <CheckSquare className="w-3.5 h-3.5 text-slate-400" />
                <span>Today's Tasks</span>
              </button>

              <button 
                onClick={() => {
                  setAdminNav('dashboard');
                  setActiveTab('Teams');
                  setTeamSubTab('WorkDone');
                  scrollToSection('department-detail');
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors text-left cursor-pointer ${
                  adminNav === 'dashboard' && teamSubTab === 'WorkDone' ? 'text-white font-bold bg-white/10' : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <ClipboardCheck className="w-3.5 h-3.5 text-slate-400" />
                <span>Today's Work Done</span>
              </button>
            </div>
          )}
        </div>

        {/* Roles & Assignments */}
        <button 
          onClick={() => {
            setAdminNav('dashboard');
            setActiveTab('Teams');
            setTeamSubTab('Roles');
            scrollToSection('department-detail');
          }}
          className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-colors text-left cursor-pointer ${
            teamSubTab === 'Roles' && adminNav === 'dashboard' ? 'text-white bg-indigo-600/80' : 'text-slate-300 hover:text-white hover:bg-white/5'
          }`}
        >
          <FileBarChart className="w-4 h-4 text-slate-400" />
          <span>Reports</span>
        </button>

        {/* Settings */}
        <button 
          onClick={() => alert('Settings panel')}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm text-slate-300 hover:text-white hover:bg-white/5 transition-colors text-left cursor-pointer"
        >
          <Settings className="w-4 h-4 text-slate-400" />
          <span>Settings</span>
        </button>
      </nav>

      {/* Switch to User Portal Button */}
      <div className="p-3 border-t border-indigo-950/60">
        <button
          onClick={() => setPortalMode('user')}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-indigo-900/50 hover:bg-indigo-900 text-indigo-200 hover:text-white text-xs font-semibold transition border border-indigo-800/40"
        >
          <ArrowRightLeft className="w-3.5 h-3.5 text-purple-400" />
          <span>User Portal (WorkHub)</span>
        </button>
      </div>

      {/* Database Mode pill at bottom */}
      <div className="px-4 py-3 border-t border-indigo-950/60 text-xs">
        <div className="flex items-center gap-2 text-indigo-300">
          <Database className="w-3.5 h-3.5 text-emerald-400" />
          <span className="font-medium truncate">{stats?.databaseMode || 'MongoDB Ready'}</span>
        </div>
      </div>
    </aside>
  );
};
