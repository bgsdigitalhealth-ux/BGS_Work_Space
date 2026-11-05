import React, { useState } from 'react';
import { Bell, ChevronDown, RefreshCw, LogOut, Menu } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { NotificationDropdown } from './NotificationDropdown';

export const Header: React.FC = () => {
  const { refreshAll, currentUser, logout, unreadNotificationCount, setMobileSidebarOpen } = useApp();
  const [showNotifs, setShowNotifs] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  return (
    <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 pt-2">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setMobileSidebarOpen(true)}
          className="p-2 rounded-xl text-slate-700 bg-white border border-slate-200/80 hover:bg-slate-50 lg:hidden shadow-xs shrink-0 cursor-pointer"
          title="Open Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            Welcome, {currentUser?.name || 'Admin'} <span className="inline-block animate-pulse">👋</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Manage departments, teams, members, roles and daily work.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 relative">
        {/* Refresh button */}
        <button
          onClick={() => refreshAll()}
          title="Refresh Data"
          className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-white transition-all shadow-sm border border-slate-200/70"
        >
          <RefreshCw className="w-4 h-4" />
        </button>

        {/* Notifications Bell */}
        <div className="relative">
          <button 
            onClick={() => setShowNotifs(!showNotifs)}
            className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-white transition-all shadow-sm border border-slate-200/70"
          >
            <Bell className="w-5 h-5" />
            {unreadNotificationCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-white animate-pulse" />
            )}
          </button>
          <NotificationDropdown isOpen={showNotifs} onClose={() => setShowNotifs(false)} />
        </div>

        {/* User Profile */}
        <div className="relative">
          <div 
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2.5 bg-white pl-1.5 pr-3 py-1.5 rounded-full border border-slate-200/70 shadow-sm cursor-pointer hover:bg-slate-50 transition-all"
          >
            <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
              {currentUser?.avatar || 'A'}
            </div>
            <div className="text-left hidden sm:block">
              <span className="text-xs font-semibold text-slate-800 block leading-tight">{currentUser?.name || 'Admin'}</span>
              <span className="text-[10px] text-slate-400 font-medium block">Admin Role</span>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400 ml-0.5" />
          </div>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-1.5 z-50">
              <div className="px-3 py-2 border-b border-gray-100">
                <p className="text-xs font-bold text-gray-900">{currentUser?.name || 'Admin'}</p>
                <p className="text-[11px] text-gray-500">{currentUser?.email || 'dynamicsajjan@gamil.com'}</p>
              </div>
              <button
                onClick={() => {
                  setShowProfileMenu(false);
                  logout();
                }}
                className="w-full text-left px-3 py-2 text-xs text-red-600 font-semibold hover:bg-red-50 flex items-center gap-2"
              >
                <LogOut className="w-3.5 h-3.5" /> Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
