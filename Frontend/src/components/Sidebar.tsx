import React, { useState } from 'react';
import {
  Shield,
  LayoutDashboard,
  Building2,
  Users,
  UserCheck,
  CheckSquare,
  Calendar as CalendarIcon,
  ClipboardCheck,
  FileBarChart,
  ChevronDown,
  ChevronRight,
  Database,
  Settings,
  MessageSquare,
  LogOut,
  X
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
    unreadMessagesCount,
    currentUser,
    logout,
    mobileSidebarOpen,
    setMobileSidebarOpen
  } = useApp();

  const [orgOpen, setOrgOpen] = useState(true);
  const [workOpen, setWorkOpen] = useState(true);

  const handleNavAction = (action: () => void) => {
    action();
    setMobileSidebarOpen(false);
  };

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {mobileSidebarOpen && (
        <div
          onClick={() => setMobileSidebarOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 lg:hidden transition-opacity"
          aria-hidden="true"
        />
      )}

      <aside className={`fixed lg:static top-0 bottom-0 left-0 z-50 w-64 bg-[#121139] text-slate-300 flex flex-col shrink-0 min-h-screen transition-transform duration-300 ease-in-out ${mobileSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'
        }`}>
        {/* Brand Header */}
        <div className="p-5 flex items-center justify-between border-b border-indigo-950/60">
          <div
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => handleNavAction(() => setAdminNav('dashboard'))}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-900/30">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-white font-bold text-base leading-tight">WorkHub</h1>
              <span className="text-[11px] font-semibold tracking-wider text-indigo-300 uppercase">Admin Panel</span>
            </div>
          </div>

          {/* Mobile Close Button */}
          <button
            type="button"
            onClick={() => setMobileSidebarOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Close navigation"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
          {/* Dashboard Link */}
          <button
            onClick={() => handleNavAction(() => {
              setAdminNav('dashboard');
              setActiveTab('Teams');
              setTeamSubTab('Members');
              scrollToSection('stats-overview');
            })}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all text-left cursor-pointer ${adminNav === 'dashboard' && activeTab === 'Teams' && teamSubTab === 'Members'
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
                  onClick={() => handleNavAction(() => {
                    setAdminNav('dashboard');
                    scrollToSection('departments-section');
                  })}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-slate-300 hover:text-white hover:bg-white/5 transition-colors text-left cursor-pointer"
                >
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  <span>Departments</span>
                </button>
                <button
                  onClick={() => handleNavAction(() => {
                    setAdminNav('dashboard');
                    setActiveTab('Teams');
                    setTeamSubTab('Members');
                    scrollToSection('department-detail');
                  })}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-slate-300 hover:text-white hover:bg-white/5 transition-colors text-left cursor-pointer"
                >
                  <Users className="w-3.5 h-3.5 text-slate-400" />
                  <span>Teams</span>
                </button>
                <button
                  onClick={() => handleNavAction(() => {
                    setAdminNav('dashboard');
                    setActiveTab('Members');
                    scrollToSection('department-detail');
                  })}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors text-left cursor-pointer ${activeTab === 'Members' ? 'text-white font-bold bg-white/10' : 'text-slate-300 hover:text-white hover:bg-white/5'
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
                  onClick={() => handleNavAction(() => {
                    setAdminNav('appointments');
                  })}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors text-left cursor-pointer ${adminNav === 'appointments' ? 'text-white font-bold bg-indigo-600 shadow-sm' : 'text-slate-300 hover:text-white hover:bg-white/5'
                    }`}
                >
                  <CalendarIcon className="w-3.5 h-3.5" />
                  <span>Appointments</span>
                </button>

                <button
                  onClick={() => handleNavAction(() => {
                    setAdminNav('dashboard');
                    setActiveTab('Teams');
                    setTeamSubTab('Tasks');
                    scrollToSection('department-detail');
                  })}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors text-left cursor-pointer ${adminNav === 'dashboard' && teamSubTab === 'Tasks' ? 'text-white font-bold bg-white/10' : 'text-slate-300 hover:text-white hover:bg-white/5'
                    }`}
                >
                  <CheckSquare className="w-3.5 h-3.5 text-slate-400" />
                  <span>Today's Tasks</span>
                </button>

                <button
                  onClick={() => handleNavAction(() => {
                    setAdminNav('dashboard');
                    setActiveTab('Teams');
                    setTeamSubTab('WorkDone');
                    scrollToSection('department-detail');
                  })}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors text-left cursor-pointer ${adminNav === 'dashboard' && teamSubTab === 'WorkDone' ? 'text-white font-bold bg-white/10' : 'text-slate-300 hover:text-white hover:bg-white/5'
                    }`}
                >
                  <ClipboardCheck className="w-3.5 h-3.5 text-slate-400" />
                  <span>Today's Work Done</span>
                </button>
              </div>
            )}
          </div>

          {/* Appointments Direct Nav Item */}
          <button
            onClick={() => handleNavAction(() => {
              setAdminNav('appointments');
            })}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-colors text-left cursor-pointer ${adminNav === 'appointments' ? 'text-white bg-indigo-600 shadow-sm' : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
          >
            <CalendarIcon className="w-4 h-4 text-slate-400" />
            <span>Appointments</span>
          </button>

          {/* Messages Link Matching Screenshot */}
          <button
            onClick={() => handleNavAction(() => setAdminNav('messages'))}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all text-left cursor-pointer ${adminNav === 'messages'
              ? 'text-white bg-[#15803d] shadow-md shadow-emerald-900/30'
              : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
          >
            <div className="flex items-center gap-3">
              <MessageSquare className={`w-4 h-4 ${adminNav === 'messages' ? 'text-white' : 'text-slate-400'}`} />
              <span>Messages</span>
            </div>
            {unreadMessagesCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-red-500 text-white text-[11px] font-bold flex items-center justify-center shrink-0">
                {unreadMessagesCount}
              </span>
            )}
          </button>

          {/* Reports */}
          <button
            onClick={() => handleNavAction(() => {
              setAdminNav('dashboard');
              setActiveTab('Teams');
              setTeamSubTab('Roles');
              scrollToSection('department-detail');
            })}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-colors text-left cursor-pointer ${teamSubTab === 'Roles' && adminNav === 'dashboard' ? 'text-white bg-indigo-600/80' : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
          >
            <FileBarChart className="w-4 h-4 text-slate-400" />
            <span>Reports</span>
          </button>

          {/* Settings */}
          <button
            onClick={() => handleNavAction(() => setAdminNav('settings'))}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-colors text-left cursor-pointer ${adminNav === 'settings' ? 'text-white bg-indigo-600/80 shadow-sm' : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
          >
            <Settings className="w-4 h-4 text-slate-400" />
            <span>Settings</span>
          </button>
        </nav>

        {/* Bottom Admin User Card with Sign Out */}
        <div className="p-4 border-t border-indigo-950/60">
          <div className="bg-[#1f1b45] border border-white/10 rounded-xl p-3 flex items-center justify-between gap-2.5">
            <div className="min-w-0 flex-1">
              <p className="text-xs text-white font-bold truncate">{currentUser?.name || 'Administrator'}</p>
              <p className="text-[11px] text-[#a2a0c4] truncate">{currentUser?.email || 'admin'}</p>
            </div>
            <button
              onClick={logout}
              className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 transition shrink-0 cursor-pointer"
              title="Sign Out to Interface"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center gap-2 text-indigo-300/80 text-[11px] mt-2.5 px-1">
            <Database className="w-3 h-3 text-emerald-400" />
            <span className="font-medium truncate">{stats?.databaseMode || 'MongoDB Ready'}</span>
          </div>
        </div>
      </aside>
    </>
  );
};
