import React, { useState } from 'react';
import {
  LayoutDashboard,
  Building2,
  Users,
  UserCheck,
  CheckSquare,
  Calendar as CalendarIcon,
  CalendarCheck,
  Coffee,
  ClipboardCheck,
  FileBarChart,
  Clock,
  ChevronDown,
  ChevronRight,
  Database,
  Settings,
  MessageSquare,
  LogOut,
  X
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { AcuLogo } from './common/AcuLogo';

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

      <aside className={`fixed lg:sticky top-0 bottom-0 left-0 z-50 lg:z-30 w-72 max-w-[85vw] lg:max-w-none h-screen h-dvh bg-[#121139] text-slate-300 flex flex-col justify-between shrink-0 overflow-hidden transition-transform duration-300 ease-in-out shadow-2xl pt-safe pb-safe ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}>
        {/* Brand Header */}
        <div className="p-4 sm:p-5 flex items-center justify-between border-b border-indigo-950/60 shrink-0">
          <div
            className="flex items-center gap-3 cursor-pointer select-none"
            onClick={() => handleNavAction(() => setAdminNav('dashboard'))}
          >
            <AcuLogo size="md" />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-white font-bold text-2xl font-calligraphy tracking-wide leading-tight truncate">
                  ACU
                </span>
                <span className="text-white font-extrabold text-sm leading-tight truncate tracking-tight">
                  Workspace
                </span>
              </div>
              <span className="text-[10px] font-semibold tracking-wider text-indigo-300 uppercase truncate block mt-0.5">
                {currentUser?.role === 'manager' ? 'Manager Panel' : 'Executive Panel'}
              </span>
            </div>
          </div>

          {/* Mobile Close Button */}
          <button
            type="button"
            onClick={() => setMobileSidebarOpen(false)}
            className="lg:hidden touch-target p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Close navigation"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3.5 py-2 space-y-1.5 overflow-y-auto no-scrollbar">
          {/* Dashboard Link */}
          <button
            type="button"
            onClick={() => handleNavAction(() => {
              setAdminNav('dashboard');
              setActiveTab('Teams');
              setTeamSubTab('Members');
              scrollToSection('stats-overview');
            })}
            className={`w-full h-11 flex items-center gap-3 px-3.5 rounded-xl text-sm font-medium transition-all text-left cursor-pointer group ${adminNav === 'dashboard'
              ? 'text-white bg-indigo-600 shadow-sm'
              : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
          >
            <div className="w-5 h-5 flex items-center justify-center shrink-0">
              <LayoutDashboard className="w-4 h-4 shrink-0" />
            </div>
            <span className="truncate text-left whitespace-nowrap">Dashboard</span>
          </button>

          {/* Manager & Admin Attendance Record */}
          <button
            onClick={() => handleNavAction(() => setAdminNav('record'))}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all text-left cursor-pointer ${adminNav === 'record' || adminNav === 'records'
              ? 'text-white bg-indigo-600 shadow-sm'
              : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            title="View Attendance Records & Punch History"
          >
            <CalendarCheck className="w-4 h-4 text-emerald-400" />
            <span>Attendance Record</span>
          </button>

          {/* Break Time */}
          <button
            onClick={() => handleNavAction(() => setAdminNav('break-time'))}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all text-left cursor-pointer ${adminNav === 'break-time'
              ? 'text-white bg-indigo-600 shadow-sm'
              : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            title="Team Break Time & Schedule"
          >
            <Coffee className="w-4 h-4 text-amber-400" />
            <span>Break Time</span>
          </button>

          {/* Organization Group */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setOrgOpen(!orgOpen)}
              className="w-full h-10 flex items-center justify-between px-3 text-xs font-semibold uppercase tracking-wider text-slate-400 hover:text-white transition-colors cursor-pointer rounded-xl hover:bg-white/5"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-5 h-5 flex items-center justify-center shrink-0">
                  <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
                </div>
                <span className="truncate text-left">Organization</span>
              </div>
              {orgOpen ? <ChevronDown className="w-3.5 h-3.5 shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 shrink-0" />}
            </button>

            {orgOpen && (
              <div className="mt-1 ml-4 pl-3 border-l border-indigo-950/70 space-y-1">
                <button
                  type="button"
                  onClick={() => handleNavAction(() => {
                    setAdminNav('dashboard');
                    scrollToSection('departments-section');
                  })}
                  className="w-full h-9 flex items-center gap-2.5 px-3 rounded-lg text-sm text-slate-300 hover:text-white hover:bg-white/5 transition-colors text-left cursor-pointer"
                >
                  <div className="w-4 h-4 flex items-center justify-center shrink-0">
                    <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  </div>
                  <span className="truncate">Departments</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleNavAction(() => {
                    setAdminNav('dashboard');
                    setActiveTab('Teams');
                    setTeamSubTab('Members');
                    scrollToSection('department-detail');
                  })}
                  className="w-full h-9 flex items-center gap-2.5 px-3 rounded-lg text-sm text-slate-300 hover:text-white hover:bg-white/5 transition-colors text-left cursor-pointer"
                >
                  <div className="w-4 h-4 flex items-center justify-center shrink-0">
                    <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  </div>
                  <span className="truncate">Teams</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleNavAction(() => {
                    setAdminNav('dashboard');
                    setActiveTab('Members');
                    scrollToSection('department-detail');
                  })}
                  className={`w-full h-9 flex items-center gap-2.5 px-3 rounded-lg text-sm transition-colors text-left cursor-pointer ${activeTab === 'Members' ? 'text-white font-bold bg-white/10' : 'text-slate-300 hover:text-white hover:bg-white/5'
                    }`}
                >
                  <div className="w-4 h-4 flex items-center justify-center shrink-0">
                    <UserCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  </div>
                  <span className="truncate">Members</span>
                </button>
              </div>
            )}
          </div>

          {/* Work Management Group */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setWorkOpen(!workOpen)}
              className="w-full h-10 flex items-center justify-between px-3 text-xs font-semibold uppercase tracking-wider text-slate-400 hover:text-white transition-colors cursor-pointer rounded-xl hover:bg-white/5"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-5 h-5 flex items-center justify-center shrink-0">
                  <CheckSquare className="w-4 h-4 text-slate-400 shrink-0" />
                </div>
                <span className="truncate text-left">Work Management</span>
              </div>
              {workOpen ? <ChevronDown className="w-3.5 h-3.5 shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 shrink-0" />}
            </button>

            {workOpen && (
              <div className="mt-1 ml-4 pl-3 border-l border-indigo-950/70 space-y-1">
                {/* Appointments */}
                <button
                  type="button"
                  onClick={() => handleNavAction(() => {
                    setAdminNav('appointments');
                  })}
                  className={`w-full h-9 flex items-center gap-2.5 px-3 rounded-lg text-sm transition-colors text-left cursor-pointer ${adminNav === 'appointments' ? 'text-white font-bold bg-indigo-600 shadow-sm' : 'text-slate-300 hover:text-white hover:bg-white/5'
                    }`}
                >
                  <div className="w-4 h-4 flex items-center justify-center shrink-0">
                    <CalendarIcon className="w-3.5 h-3.5 shrink-0" />
                  </div>
                  <span className="truncate">Appointments</span>
                </button>


                <button
                  type="button"
                  onClick={() => handleNavAction(() => {
                    setAdminNav('dashboard');
                    setActiveTab('Teams');
                    setTeamSubTab('Tasks');
                    scrollToSection('department-detail');
                  })}
                  className={`w-full h-9 flex items-center gap-2.5 px-3 rounded-lg text-sm transition-colors text-left cursor-pointer ${adminNav === 'dashboard' && teamSubTab === 'Tasks' ? 'text-white font-bold bg-white/10' : 'text-slate-300 hover:text-white hover:bg-white/5'
                    }`}
                >
                  <div className="w-4 h-4 flex items-center justify-center shrink-0">
                    <CheckSquare className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  </div>
                  <span className="truncate">Today's Tasks</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleNavAction(() => {
                    setAdminNav('dashboard');
                    setActiveTab('Teams');
                    setTeamSubTab('WorkDone');
                    scrollToSection('department-detail');
                  })}
                  className={`w-full h-9 flex items-center gap-2.5 px-3 rounded-lg text-sm transition-colors text-left cursor-pointer ${adminNav === 'dashboard' && teamSubTab === 'WorkDone' ? 'text-white font-bold bg-white/10' : 'text-slate-300 hover:text-white hover:bg-white/5'
                    }`}
                >
                  <div className="w-4 h-4 flex items-center justify-center shrink-0">
                    <ClipboardCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  </div>
                  <span className="truncate">Today's Work Done</span>
                </button>
              </div>
            )}
          </div>

          {/* Messages Link */}
          <button
            type="button"
            onClick={() => handleNavAction(() => setAdminNav('messages'))}
            className={`w-full h-11 flex items-center justify-between px-3.5 rounded-xl font-medium text-sm transition-all text-left cursor-pointer group ${adminNav === 'messages'
              ? 'text-white bg-[#15803d] shadow-md shadow-emerald-900/30'
              : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
          >
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-5 h-5 flex items-center justify-center shrink-0">
                <MessageSquare className={`w-4 h-4 shrink-0 ${adminNav === 'messages' ? 'text-white' : 'text-slate-400'}`} />
              </div>
              <span className="truncate text-left whitespace-nowrap">Messages</span>
            </div>
            {unreadMessagesCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-red-500 text-white text-[11px] font-bold flex items-center justify-center shrink-0 ml-2">
                {unreadMessagesCount}
              </span>
            )}
          </button>

          {/* Daily Timeline */}
          <button
            type="button"
            onClick={() => handleNavAction(() => setAdminNav('timeline'))}
            className={`w-full h-11 flex items-center gap-3 px-3.5 rounded-xl font-medium text-sm transition-colors text-left cursor-pointer group ${adminNav === 'timeline' ? 'text-white bg-indigo-600 shadow-sm' : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
          >
            <div className="w-5 h-5 flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4 text-slate-400 shrink-0" />
            </div>
            <span className="truncate text-left whitespace-nowrap">Daily Timeline</span>
          </button>

          {/* Reports */}
          <button
            type="button"
            onClick={() => handleNavAction(() => {
              setAdminNav('reports');
            })}
            className={`w-full h-11 flex items-center gap-3 px-3.5 rounded-xl font-medium text-sm transition-colors text-left cursor-pointer group ${adminNav === 'reports' ? 'text-white bg-indigo-600 shadow-sm' : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
          >
            <div className="w-5 h-5 flex items-center justify-center shrink-0">
              <FileBarChart className="w-4 h-4 text-slate-400 shrink-0" />
            </div>
            <span className="truncate text-left whitespace-nowrap">Reports</span>
          </button>

          {/* Settings */}
          <button
            type="button"
            onClick={() => handleNavAction(() => setAdminNav('settings'))}
            className={`w-full h-11 flex items-center gap-3 px-3.5 rounded-xl font-medium text-sm transition-colors text-left cursor-pointer group ${adminNav === 'settings' ? 'text-white bg-indigo-600/80 shadow-sm' : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
          >
            <div className="w-5 h-5 flex items-center justify-center shrink-0">
              <Settings className="w-4 h-4 text-slate-400 shrink-0" />
            </div>
            <span className="truncate text-left whitespace-nowrap">Settings</span>
          </button>
        </nav>

        {/* Bottom Admin User Card with Sign Out */}
        <div className="p-4 border-t border-indigo-950/60">
          <div className="bg-[#1f1b45] border border-white/10 rounded-xl p-3 flex items-center justify-between gap-2.5">
            <div className="min-w-0 flex-1">
              <p className="text-xs text-white font-bold truncate">{currentUser?.name || 'Administrator'}</p>
              <p className="text-xs text-indigo-200/90 truncate font-normal mt-0.5">{currentUser?.email || 'admin'}</p>
            </div>
            <button
              onClick={logout}
              className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 transition shrink-0 cursor-pointer"
              title="Sign Out to Interface"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center gap-2 text-indigo-200 text-xs mt-2.5 px-1">
            <Database className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="font-medium truncate">{stats?.databaseMode || 'MongoDB Ready'}</span>
          </div>
        </div>
      </aside>
    </>
  );
};
