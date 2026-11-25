import React, { useState } from 'react';
import { Bell, ChevronDown, ArrowLeft, LogOut, Settings, Menu, X, ArrowRight } from 'lucide-react';
import { useApp, isTaskAssignedToUser } from '../../context/AppContext';
import { NotificationDropdown } from '../NotificationDropdown';

export const UserHeader: React.FC = () => {
  const {
    userNav,
    setUserNav,
    managerNav,
    setManagerNav,
    currentUser,
    logout,
    unreadNotificationCount,
    setMobileSidebarOpen,
    userToast,
    setUserToast,
    userWorkspace,
    members
  } = useApp();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);

  const isManagerRole = currentUser?.role === 'manager';

  const myMember = (members || []).find(m =>
    (currentUser?.id && (m.id === currentUser.id || (m as any).userId === currentUser.id)) ||
    (currentUser?.email && m.email && m.email.toLowerCase() === currentUser.email.toLowerCase())
  );

  const rawAssigned = userWorkspace?.assignedWork || [];
  const myAssignedCount = rawAssigned.filter(t => isTaskAssignedToUser(t, currentUser, myMember)).length;
  const displayTaskCount = isManagerRole ? rawAssigned.length : myAssignedCount;

  // Compute Active Title and Subtitle based on active role navigation
  const getHeaderInfo = () => {
    if (isManagerRole) {
      switch (managerNav) {
        case 'dashboard':
          return { title: `Hello, ${currentUser?.name || 'Manager'} 👋`, desc: 'Supervise team workload, deadlines, and submissions.' };
        case 'team':
          return { title: 'Team Management', desc: 'View and coordinate assigned members in your division.' };
        case 'assign-work':
          return { title: 'Assign Team Work', desc: 'Delegate tasks and responsibilities to team members.' };
        case 'my-work':
          return { title: 'My Work', desc: 'Tasks assigned to you by administrators.' };
        case 'review-work':
          return { title: 'Review Submitted Work', desc: 'Inspect deliverables, approve completions, or request rework.' };
        case 'appointments':
        case 'my-schedule':
          return { title: 'Meetings & Appointments', desc: 'Manage schedule, join calls, and coordinate team sessions.' };
        case 'messages':
          return { title: 'Messages & Channels', desc: 'Communicate with administrators and team members.' };
        case 'timeline':
          return { title: 'Team Daily Timeline', desc: 'Audit real-time activities and milestones.' };
        case 'reports':
          return { title: 'Team Performance Reports', desc: 'Monitor completed and ongoing work statistics.' };
        case 'settings':
          return { title: 'Manager Settings', desc: 'Manage your profile and credentials.' };
        default:
          return { title: 'Manager Workspace', desc: 'Manage team operations and productivity.' };
      }
    } else {
      switch (userNav) {
        case 'dashboard':
          return { title: `Hello, ${currentUser?.name || 'Team Member'} 👋`, desc: 'Here is your assigned work and progress.' };
        case 'record':
        case 'records':
          return { title: 'Work & Attendance Punch', desc: 'Log attendance, track active work time, and review daily punch history.' };
        case 'messages':
          return { title: 'Messages & Communications', desc: 'Communicate with team colleagues and management.' };
        case 'appointments':
        case 'my-schedule':
          return { title: 'My Appointments & Schedule', desc: 'View appointments, schedule meetings, and inspect calendar.' };
        case 'my-work':
        case 'assigned-work':
          return { title: 'My Assigned Work', desc: 'Card view of all assigned tasks and work orders.' };
        case 'assign-work':
          return { title: 'Delegate Work', desc: 'Assign authorized subtasks to team members.' };
        case 'work-history':
          return { title: 'Work & Submission History', desc: 'Inspect past submitted deliverables and approval audit trail.' };
        case 'team':
          return { title: 'My Team & Division', desc: 'Connected team members working together in your division.' };
        case 'timeline':
          return { title: 'Daily Timeline', desc: 'Review chronological log of today\'s activities.' };
        case 'reports':
          return { title: 'My Performance Reports', desc: 'Personal work summaries and attendance statistics.' };
        case 'settings':
          return { title: 'Account Settings', desc: 'Manage your profile and preferences.' };
        default:
          return { title: 'User Workspace', desc: 'Welcome to your daily workspace.' };
      }
    }
  };

  const headerInfo = getHeaderInfo();

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

      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-200/80 px-3.5 sm:px-6 lg:px-8 py-2.5 sm:py-3.5 flex items-center justify-between gap-3 shadow-2xs shrink-0">
        {/* Dynamic Title / Breadcrumb with Mobile Menu Toggle */}
        <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0 flex-1">
          <button
            type="button"
            onClick={() => setMobileSidebarOpen(true)}
            className="touch-target p-2 rounded-xl text-gray-700 bg-white border border-gray-200/80 hover:bg-gray-50 lg:hidden shadow-2xs shrink-0 cursor-pointer"
            title="Open Menu"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="min-w-0 flex-1">
            {(!isManagerRole && userNav === 'details') ? (
              <button
                type="button"
                onClick={() => setUserNav('assigned-work')}
                className="flex items-center gap-2 text-base sm:text-lg lg:text-xl font-bold text-[#111827] hover:text-[#5a36e6] transition cursor-pointer truncate"
              >
                <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700 shrink-0" />
                <span className="truncate">Assigned Work Details</span>
              </button>
            ) : (!isManagerRole && (userNav === 'assigned-work' || userNav === 'my-work')) ? (
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <button
                  onClick={() => setUserNav('dashboard')}
                  className="touch-target p-1.5 sm:p-2 rounded-xl bg-white border border-gray-200 text-gray-600 hover:text-[#5a36e6] hover:border-[#5a36e6]/30 transition shadow-2xs cursor-pointer shrink-0"
                  title="Back to Dashboard"
                >
                  <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
                <div className="min-w-0">
                  <h1 className="text-base sm:text-xl font-extrabold text-[#111827] tracking-tight flex items-center gap-2 truncate">
                    <span className="truncate">{headerInfo.title}</span>
                    {displayTaskCount > 0 ? (
                      <span className="text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full bg-purple-50 text-[#5a36e6] border border-purple-200 shrink-0">
                        {displayTaskCount}
                      </span>
                    ) : null}
                  </h1>
                  <p className="text-[11px] sm:text-xs text-[#6b7280] font-medium truncate hidden sm:block">
                    {headerInfo.desc}
                  </p>
                </div>
              </div>
            ) : (
              <div className="min-w-0">
                <h1 className="text-base sm:text-xl lg:text-2xl font-extrabold text-[#111827] tracking-tight truncate flex items-center gap-2">
                  <span className="truncate">{headerInfo.title}</span>
                </h1>
                <p className="text-[11px] sm:text-xs text-[#6b7280] font-medium truncate hidden sm:block mt-0.5">
                  {headerInfo.desc}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0 relative">

          {/* Notification Bell */}
          <div className="relative">
            <button
              onClick={() => setShowNotifs(!showNotifs)}
              className="touch-target relative p-2 sm:p-2.5 rounded-xl bg-white border border-gray-200/80 text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition shadow-2xs cursor-pointer"
              aria-label="View notifications"
            >
              <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
              {unreadNotificationCount > 0 && (
                <span className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 w-2 h-2 rounded-full bg-[#ef4444] ring-2 ring-white animate-pulse" />
              )}
            </button>
            <NotificationDropdown isOpen={showNotifs} onClose={() => setShowNotifs(false)} />
          </div>

          {/* User Pill */}
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="touch-target flex items-center gap-2 sm:gap-2.5 bg-white border border-gray-200/80 px-2 sm:px-3 py-1.5 rounded-xl shadow-2xs hover:border-gray-300 transition cursor-pointer"
              aria-label="User profile menu"
            >
              {currentUser?.avatar?.startsWith('data:') || currentUser?.avatar?.startsWith('http') ? (
                <img src={currentUser.avatar} alt={currentUser.name} className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover ring-1 ring-purple-100 shadow-2xs shrink-0" />
              ) : (
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#5a36e6] text-white flex items-center justify-center font-bold text-xs tracking-wider shadow-2xs uppercase shrink-0">
                  {currentUser?.avatar || (currentUser?.name ? currentUser.name.substring(0, 2).toUpperCase() : 'TM')}
                </div>
              )}
              <div className="text-left hidden md:block max-w-[120px] lg:max-w-[160px]">
                <div className="text-xs font-bold text-gray-900 leading-tight truncate">{currentUser?.name || 'Team Member'}</div>
                <div className="text-[10px] text-gray-500 font-medium truncate">
                  {currentUser?.teamRole || currentUser?.title || (currentUser?.role === 'admin' ? 'Administrator' : 'Team Member')}
                  {currentUser?.team ? ` • ${currentUser.team}` : ''}
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400 hidden sm:block shrink-0" />
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
                    if (currentUser?.role === 'manager') {
                      setManagerNav('settings');
                    } else {
                      setUserNav('settings');
                    }
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
