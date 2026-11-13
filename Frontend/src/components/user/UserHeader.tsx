import React, { useState } from 'react';
import { Bell, ChevronDown, ArrowLeft, LogOut, Settings, Menu, X, ArrowRight } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { NotificationDropdown } from '../NotificationDropdown';

export const UserHeader: React.FC = () => {
  const {
    userNav,
    setUserNav,
    currentUser,
    logout,
    unreadNotificationCount,
    setMobileSidebarOpen,
    userToast,
    setUserToast,
    userWorkspace,
    selectedUserTask
  } = useApp();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);

  return (
    <>
      {/* Real-time Floating Receiver Notification Toast Banner */}
      {userToast && (
        <div className="fixed top-5 right-5 z-50 max-w-md w-full animate-in slide-in-from-top-4 fade-in duration-300">
          <div className="bg-white/95 backdrop-blur-md rounded-2xl p-4 border border-emerald-200 shadow-2xl shadow-emerald-900/15 flex items-start gap-3.5 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-500 animate-pulse" />
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
              <Bell className="w-5 h-5 animate-bounce" />
            </div>
            <div className="flex-1 min-w-0 pr-6">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                  New Request
                </span>
                <span className="text-[11px] text-slate-400">Just now</span>
              </div>
              <h4 className="text-xs font-bold text-slate-900 mt-1 leading-snug">
                {userToast.title}
              </h4>
              <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                {userToast.message}
              </p>
              <div className="mt-2.5 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setUserToast(null);
                    setUserNav('appointments');
                  }}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <span>View in Appointments</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setUserToast(null)}
                  className="px-2.5 py-1.5 rounded-lg text-slate-500 hover:text-slate-800 text-xs font-semibold hover:bg-slate-100 transition cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setUserToast(null)}
              className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      {/* Dynamic Title / Breadcrumb with Mobile Menu Toggle */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setMobileSidebarOpen(true)}
          className="p-2 rounded-xl text-gray-700 bg-white border border-gray-200/80 hover:bg-gray-50 lg:hidden shadow-xs shrink-0 cursor-pointer"
          title="Open Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="min-w-0">
        {userNav === 'dashboard' && (
          <div>
            <h1 className="text-2xl lg:text-3xl font-extrabold text-[#111827] tracking-tight flex items-center gap-2">
              Hello, {currentUser?.name || 'Team Member'} <span className="animate-pulse">👋</span>
            </h1>
            <p className="text-sm text-[#6b7280] font-medium mt-1">
              Here is your assigned work and progress.
            </p>
          </div>
        )}

        {(userNav === 'appointments' || userNav === 'my-schedule') && (
          <div>
            <h1 className="text-2xl lg:text-3xl font-extrabold text-[#111827] tracking-tight">
              My Appointments
            </h1>
            <p className="text-sm text-[#6b7280] font-medium mt-1">
              View, schedule and manage your appointments.
            </p>
          </div>
        )}

        {(userNav === 'assigned-work' || userNav === 'my-work') && (
          <div className="flex items-center gap-3">
            <button
              onClick={() => setUserNav('dashboard')}
              className="p-2 rounded-xl bg-white border border-gray-200 text-gray-600 hover:text-[#5a36e6] hover:border-[#5a36e6]/30 transition shadow-sm cursor-pointer"
              title="Back to Dashboard"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-extrabold text-[#111827] tracking-tight flex items-center gap-2">
                Assigned Work
                {userWorkspace?.assignedWork?.length ? (
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-purple-50 text-[#5a36e6] border border-purple-200">
                    {userWorkspace.assignedWork.length} Tasks
                  </span>
                ) : null}
              </h1>
              <p className="text-xs text-[#6b7280] font-medium mt-0.5">
                Card view of all assigned tasks and work orders
              </p>
            </div>
          </div>
        )}

        {userNav === 'details' && (
          <div className="flex items-center gap-3">
            <button
              onClick={() => setUserNav('assigned-work')}
              className="p-2 rounded-xl bg-white border border-gray-200 text-gray-600 hover:text-[#5a36e6] hover:border-[#5a36e6]/30 transition shadow-sm cursor-pointer"
              title="Back to Assigned Work Cards"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-extrabold text-[#111827] tracking-tight">
                Work Details
              </h1>
              <p className="text-xs text-[#6b7280] font-medium mt-0.5">
                {selectedUserTask?.title ? `${selectedUserTask.title} • Task ID: ${selectedUserTask.taskId || selectedUserTask.id}` : 'Manage task status, deliverables, and updates'}
              </p>
            </div>
          </div>
        )}

        {userNav === 'work-history' && (
          <div className="flex items-center gap-3">
            <button
              onClick={() => setUserNav('dashboard')}
              className="p-2 rounded-xl bg-white border border-gray-200 text-gray-600 hover:text-[#5a36e6] hover:border-[#5a36e6]/30 transition shadow-sm"
              title="Back to Dashboard"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-extrabold text-[#111827] tracking-tight">
                Work History
              </h1>
              <p className="text-xs text-[#6b7280] font-medium mt-0.5">
                Past submissions, reviews and feedback records
              </p>
            </div>
          </div>
        )}

        {userNav === 'assign-work' && (
          <div className="flex items-center gap-3">
            <button
              onClick={() => setUserNav('dashboard')}
              className="p-2 rounded-xl bg-white border border-gray-200 text-gray-600 hover:text-[#5a36e6] hover:border-[#5a36e6]/30 transition shadow-sm cursor-pointer"
              title="Back to Dashboard"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-extrabold text-[#111827] tracking-tight">
                Assign & Delegate Work
              </h1>
              <p className="text-xs text-[#6b7280] font-medium mt-0.5">
                Assign tasks to teammates (User → User) or request work from Admins (User → Admin)
              </p>
            </div>
          </div>
        )}

        {userNav === 'team' && (
          <div>
            <h1 className="text-2xl font-extrabold text-[#111827] tracking-tight">
              My Team Workspace
            </h1>
            <p className="text-xs text-[#6b7280] font-medium mt-0.5">
              Collaborate with colleagues and team leads
            </p>
          </div>
        )}

        {userNav === 'reports' && (
          <div>
            <h1 className="text-2xl font-extrabold text-[#111827] tracking-tight">
              Work & Productivity Reports
            </h1>
            <p className="text-xs text-[#6b7280] font-medium mt-0.5">
              Weekly deliverables, sprint velocity and attendance
            </p>
          </div>
        )}

        {userNav === 'settings' && (
          <div>
            <h1 className="text-2xl font-extrabold text-[#111827] tracking-tight">
              Account Settings
            </h1>
            <p className="text-xs text-[#6b7280] font-medium mt-0.5">
              Personalize your name, photo, and account security
            </p>
          </div>
        )}
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3 relative">
        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifs(!showNotifs)}
            className="relative p-2.5 rounded-xl bg-white border border-gray-200/80 text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition shadow-sm"
          >
            <Bell className="w-5 h-5" />
            {unreadNotificationCount > 0 && (
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#ef4444] ring-2 ring-white animate-pulse" />
            )}
          </button>
          <NotificationDropdown isOpen={showNotifs} onClose={() => setShowNotifs(false)} />
        </div>

        {/* User Pill */}
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-3 bg-white border border-gray-200/80 px-3.5 py-2 rounded-xl shadow-sm hover:border-gray-300 transition cursor-pointer"
          >
            {currentUser?.avatar?.startsWith('data:') || currentUser?.avatar?.startsWith('http') ? (
              <img src={currentUser.avatar} alt={currentUser.name} className="w-8 h-8 rounded-full object-cover ring-1 ring-purple-100 shadow-xs" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-[#5a36e6] text-white flex items-center justify-center font-bold text-xs tracking-wider shadow-sm uppercase">
                {currentUser?.avatar || (currentUser?.name ? currentUser.name.substring(0, 2).toUpperCase() : 'TM')}
              </div>
            )}
            <div className="text-left hidden sm:block">
              <div className="text-xs font-bold text-gray-900 leading-tight">{currentUser?.name || 'Team Member'}</div>
              <div className="text-[10px] text-gray-500 font-medium">Team Member</div>
            </div>
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </button>

          {/* Dropdown Menu */}
          {showDropdown && (
            <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-4 py-2 border-b border-gray-100">
                <p className="text-xs font-bold text-gray-900 truncate">{currentUser?.name || 'Team Member'}</p>
                <p className="text-[11px] text-gray-500 truncate">{currentUser?.email || ''}</p>
              </div>
              <button
                onClick={() => {
                  setUserNav('settings');
                  setShowDropdown(false);
                }}
                className="w-full text-left px-4 py-2.5 text-xs text-gray-700 hover:bg-purple-50 hover:text-[#5a36e6] flex items-center gap-2 transition-colors cursor-pointer"
              >
                <Settings className="w-3.5 h-3.5 text-gray-400" />
                <span>Account Settings</span>
              </button>
              <button
                onClick={() => {
                  setShowDropdown(false);
                  logout();
                }}
                className="w-full text-left px-4 py-2.5 text-xs text-red-600 font-semibold hover:bg-red-50 flex items-center gap-2 border-t border-gray-100 mt-1 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
    </>
  );
};
