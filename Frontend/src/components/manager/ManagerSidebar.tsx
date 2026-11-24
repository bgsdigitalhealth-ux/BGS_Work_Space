import React from 'react';
import {
  Shield,
  LayoutDashboard,
  Briefcase,
  CalendarCheck,
  ClipboardCheck,
  Send,
  Users,
  FileText,
  Clock,
  LogOut,
  MessageSquare,
  Settings,
  X
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const ManagerSidebar: React.FC = () => {
  const {
    managerNav,
    setManagerNav,
    logout,
    currentUser,
    unreadMessagesCount,
    mobileSidebarOpen,
    setMobileSidebarOpen,
    userWorkspace
  } = useApp();

  // Count submissions waiting for manager review (Under Review)
  const pendingReviewCount = (userWorkspace?.assignedWork || []).filter(
    t => t.status === 'Under Review' || (t.status as any) === 'In Review'
  ).length;

  const navItems = [
    { id: 'dashboard', label: 'Team Dashboard', icon: LayoutDashboard },
    { id: 'team', label: 'Team Management', icon: Users },
    { id: 'assign-work', label: 'Assign Work', icon: Send },
    { id: 'my-work', label: 'My Work', icon: Briefcase },
    { id: 'review-work', label: 'Review Submissions', icon: ClipboardCheck, badge: pendingReviewCount > 0 ? pendingReviewCount : undefined },
    { id: 'appointments', label: 'Appointments & Schedule', icon: CalendarCheck },
    { id: 'messages', label: 'Messages', icon: MessageSquare, badge: unreadMessagesCount > 0 ? unreadMessagesCount : undefined },
    { id: 'timeline', label: 'Daily Timeline', icon: Clock },
    { id: 'reports', label: 'Team Reports', icon: FileText },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const handleNavClick = (id: string) => {
    setMobileSidebarOpen(false);
    setManagerNav(id);
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

      <aside className={`fixed lg:sticky top-0 bottom-0 left-0 z-50 lg:z-30 w-72 max-w-[85vw] lg:max-w-none h-screen bg-[#14122d] text-white flex flex-col justify-between shrink-0 overflow-hidden transition-transform duration-300 ease-in-out relative shadow-2xl ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}>
        {/* Top & Navigation Section */}
        <div className="flex flex-col flex-1 min-h-0 relative z-10">
          {/* Brand Header */}
          <div className="px-5 pt-6 pb-4 flex items-center justify-between shrink-0">
            <div
              className="flex items-center gap-3 cursor-pointer select-none"
              onClick={() => handleNavClick('dashboard')}
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#704fe6] to-[#4f32c2] flex items-center justify-center shadow-lg shadow-indigo-900/50 shrink-0">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-xl font-bold tracking-wide text-white leading-none truncate font-formal">WorkHub</h1>
                <p className="text-xs text-indigo-300 font-medium tracking-wide mt-1 truncate">Manager Workspace</p>
              </div>
            </div>

            {/* Mobile Close Button */}
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(false)}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 px-3.5 py-2 space-y-1.5 overflow-y-auto no-scrollbar">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = managerNav === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full h-11 flex items-center justify-between px-3.5 rounded-xl font-medium text-sm transition-all duration-150 text-left group cursor-pointer ${isActive
                    ? 'bg-[#5a36e6] text-white shadow-lg shadow-indigo-600/30'
                    : 'text-[#9d9bb9] hover:text-white hover:bg-white/5'
                    }`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-5 h-5 flex items-center justify-center shrink-0">
                      <Icon className={`w-5 h-5 shrink-0 transition-colors ${isActive ? 'text-white' : 'text-[#7e7b9e] group-hover:text-white'}`} />
                    </div>
                    <span className="truncate text-left text-sm font-medium whitespace-nowrap leading-none">{item.label}</span>
                  </div>

                  {item.badge !== undefined && (
                    <span className={`ml-2 px-2 py-0.5 text-xs font-semibold rounded-full shrink-0 ${item.id === 'review-work'
                      ? 'bg-amber-500 text-white font-bold'
                      : 'bg-[#704fe6] text-white'
                      }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Manager User Card */}
        <div className="p-3.5 relative z-10 shrink-0">
          <div className="bg-[#1f1b45] border border-white/10 rounded-2xl p-3 shadow-lg flex items-center justify-between gap-3">
            <div
              onClick={() => handleNavClick('settings')}
              className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer group"
              title="Open Account Settings"
            >
              {currentUser?.avatar?.startsWith('data:') || currentUser?.avatar?.startsWith('http') ? (
                <img src={currentUser.avatar} alt={currentUser.name} className="w-8 h-8 rounded-full object-cover shrink-0 ring-1 ring-white/20" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-[#5a36e6] text-white flex items-center justify-center font-bold text-xs shrink-0">
                  {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'M'}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-xs text-white font-bold truncate group-hover:text-[#a58df8] transition-colors">
                  {currentUser?.name || 'Manager'}
                </p>
                <p className="text-xs text-indigo-200/90 font-normal truncate mt-0.5">
                  {currentUser?.team || currentUser?.title || 'Team Manager'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={logout}
              className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 transition shrink-0 cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Decorative Gradient Wave Glow at bottom */}
        <div className="absolute -bottom-16 -left-16 w-64 h-64 rounded-full bg-gradient-to-tr from-[#6d28d9]/40 via-[#4f46e5]/20 to-transparent blur-2xl pointer-events-none" />
        <div className="absolute bottom-10 -right-10 w-48 h-48 rounded-full bg-gradient-to-tl from-[#9333ea]/30 via-[#6366f1]/10 to-transparent blur-xl pointer-events-none" />
      </aside>
    </>
  );
};
