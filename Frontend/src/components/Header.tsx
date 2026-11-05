import React from 'react';
import { Bell, ChevronDown, RefreshCw } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const Header: React.FC = () => {
  const { refreshAll } = useApp();

  return (
    <header className="flex items-center justify-between pb-6 pt-2">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          Welcome, Admin <span className="inline-block animate-pulse">👋</span>
        </h2>
        <p className="text-sm text-slate-500 mt-0.5">
          Manage departments, teams, members, roles and daily work.
        </p>
      </div>

      <div className="flex items-center gap-4">
        {/* Refresh button */}
        <button
          onClick={() => refreshAll()}
          title="Refresh Data"
          className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-white transition-all shadow-sm border border-slate-200/70"
        >
          <RefreshCw className="w-4 h-4" />
        </button>

        {/* Notifications */}
        <button className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-white transition-all shadow-sm border border-slate-200/70">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white"></span>
        </button>

        {/* User Profile */}
        <div className="flex items-center gap-2.5 bg-white pl-1.5 pr-3 py-1.5 rounded-full border border-slate-200/70 shadow-sm cursor-pointer hover:bg-slate-50 transition-all">
          <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
            A
          </div>
          <span className="text-sm font-semibold text-slate-800">Admin</span>
          <ChevronDown className="w-4 h-4 text-slate-400 ml-0.5" />
        </div>
      </div>
    </header>
  );
};
