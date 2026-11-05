import React, { useState } from 'react';
import { Bell, ChevronDown, ArrowLeft, ArrowRightLeft, User } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const UserHeader: React.FC = () => {
  const { userNav, setUserNav, setPortalMode } = useApp();
  const [showDropdown, setShowDropdown] = useState(false);

  return (
    <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      {/* Dynamic Title / Breadcrumb */}
      <div>
        {userNav === 'dashboard' && (
          <div>
            <h1 className="text-2xl lg:text-3xl font-extrabold text-[#111827] tracking-tight flex items-center gap-2">
              Hello, Rahul Sharma <span className="animate-pulse">👋</span>
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
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3 relative">
        {/* Portal Switcher Button */}
        <button
          onClick={() => setPortalMode('admin')}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-50 border border-indigo-200 text-[#5a36e6] hover:bg-indigo-100 text-xs font-semibold transition shadow-sm"
        >
          <ArrowRightLeft className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Switch to</span> Admin Dashboard
        </button>

        {/* Notification Bell */}
        <button className="relative p-2.5 rounded-xl bg-white border border-gray-200/80 text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition shadow-sm">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#ef4444] ring-2 ring-white animate-pulse" />
        </button>

        {/* User Pill */}
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-3 bg-white border border-gray-200/80 px-3.5 py-2 rounded-xl shadow-sm hover:border-gray-300 transition"
          >
            <div className="w-8 h-8 rounded-full bg-[#5a36e6] text-white flex items-center justify-center font-bold text-xs tracking-wider shadow-sm">
              RS
            </div>
            <div className="text-left hidden sm:block">
              <div className="text-xs font-bold text-gray-900 leading-tight">Rahul Sharma</div>
              <div className="text-[10px] text-gray-500 font-medium">Team Member</div>
            </div>
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </button>

          {/* Dropdown Menu */}
          {showDropdown && (
            <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-4 py-2 border-b border-gray-100">
                <p className="text-xs font-bold text-gray-900">Rahul Sharma</p>
                <p className="text-[11px] text-gray-500">rahul@company.com</p>
              </div>
              <button
                onClick={() => {
                  setUserNav('dashboard');
                  setShowDropdown(false);
                }}
                className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2"
              >
                <User className="w-3.5 h-3.5 text-gray-400" /> My Profile
              </button>
              <button
                onClick={() => {
                  setPortalMode('admin');
                  setShowDropdown(false);
                }}
                className="w-full text-left px-4 py-2 text-xs text-[#5a36e6] font-semibold hover:bg-indigo-50 flex items-center gap-2"
              >
                <ArrowRightLeft className="w-3.5 h-3.5" /> Switch to Admin Portal
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
