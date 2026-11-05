import React, { useState } from 'react';
import { Bell, ChevronDown, ArrowLeft, LogOut, Settings, Menu } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { NotificationDropdown } from '../NotificationDropdown';

export const UserHeader: React.FC = () => {
  const { userNav, setUserNav, currentUser, logout, unreadNotificationCount, setMobileSidebarOpen } = useApp();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);

  return (
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

        {(userNav === 'my-work' || userNav === 'details') && (
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
                Assigned Work - Details
              </h1>
              <p className="text-xs text-[#6b7280] font-medium mt-0.5">
                Manage task status, deliverables, and updates
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
  );
};
