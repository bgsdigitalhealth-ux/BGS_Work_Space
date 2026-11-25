import React from 'react';
import {
  Shield,
  LayoutDashboard,
  Briefcase,
  CalendarCheck,
  Coffee,
  ClipboardList,
  Send,
  History,
  Users,
  FileText,
  Clock,
  LogOut,
  MessageSquare,
  Settings,
  X
} from 'lucide-react';
import { useApp, isUserManager, isTaskAssignedToUser } from '../../context/AppContext';

export const UserSidebar: React.FC = () => {
  const {
    userNav,
    setUserNav,
    logout,
    openSubmitWorkDrawer,
    userWorkspace,
    currentUser,
    unreadMessagesCount,
    mobileSidebarOpen,
    setMobileSidebarOpen,
    members,
    todayAttendance,
    isAttendanceLoading,
    notify
  } = useApp();

  const isPunchedIn = todayAttendance?.status === 'punched_in';

  const myMember = (members || []).find(m =>
    (currentUser?.id && (m.id === currentUser.id || (m as any).userId === currentUser.id)) ||
    (currentUser?.email && m.email && m.email.toLowerCase() === currentUser.email.toLowerCase())
  );
  const isManager = isUserManager(currentUser, myMember) || currentUser?.role === 'manager' || currentUser?.role === 'admin';

  const rawAssigned = userWorkspace?.assignedWork || [];
  const myAssignedCount = rawAssigned.filter(t => isTaskAssignedToUser(t, currentUser, myMember)).length;
  const assignedCount = currentUser?.role === 'user' ? myAssignedCount : (isManager ? rawAssigned.length : myAssignedCount);

  const navItems = [
    { id: 'dashboard', label: 'My Dashboard', icon: LayoutDashboard },
    { id: 'record', label: 'Record', icon: CalendarCheck },
    { id: 'break-time', label: 'Break Time', icon: Coffee },
    { id: 'my-work', label: 'My Work', icon: Briefcase },
    { id: 'messages', label: 'Messages', icon: MessageSquare, badge: unreadMessagesCount > 0 ? unreadMessagesCount : undefined },
    { id: 'appointments', label: 'Appointments & Schedule', icon: CalendarCheck },
    { id: 'assigned-work', label: 'Assigned Work', icon: ClipboardList, badge: assignedCount > 0 ? assignedCount : undefined },
    { id: 'assign-work', label: 'Assign Work', icon: Send },
    ...(!isManager ? [{ id: 'submit-work', label: 'Submit Work', icon: Send, isAction: true }] : []),
    { id: 'work-history', label: 'Work History', icon: History },
    { id: 'team', label: 'Team', icon: Users },
    { id: 'timeline', label: 'Daily Timeline', icon: Clock },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const handleNavClick = (item: typeof navItems[0]) => {
    setMobileSidebarOpen(false);
    if (!isPunchedIn && !isAttendanceLoading && item.id !== 'dashboard' && item.id !== 'record' && item.id !== 'settings') {
      setUserNav('dashboard');
      notify('Please Punch In first to start your work session and access your workspace!', 'warning', 'Punch In Required');
      return;
    }
    if (item.isAction) {
      if (!isPunchedIn && !isAttendanceLoading) {
        setUserNav('dashboard');
        notify('Please Punch In first before submitting work!', 'warning', 'Punch In Required');
        return;
      }
      openSubmitWorkDrawer();
    } else {
      setUserNav(item.id);
    }
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
              onClick={() => {
                setUserNav('dashboard');
                setMobileSidebarOpen(false);
              }}
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#704fe6] to-[#4f32c2] flex items-center justify-center shadow-lg shadow-indigo-900/50 shrink-0">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-xl font-bold tracking-wide text-white leading-none truncate font-formal">WorkHub</h1>
                <p className="text-xs text-[#9d9bb9] font-medium tracking-wide mt-1 truncate">Team Workspace</p>
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
              const isActive = userNav === item.id ||
                (item.id === 'assigned-work' && userNav === 'details') ||
                (item.id === 'appointments' && userNav === 'my-schedule');

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNavClick(item)}
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
                    <span className="ml-2 px-2 py-0.5 text-xs font-semibold rounded-full bg-[#704fe6] text-white shrink-0">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom User Card */}
        <div className="p-3.5 relative z-10 shrink-0">
          <div className="bg-[#1f1b45] border border-white/10 rounded-2xl p-3 shadow-lg flex items-center justify-between gap-3">
            <div
              onClick={() => setUserNav('settings')}
              className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer group"
              title="Open Account Settings"
            >
              {currentUser?.avatar?.startsWith('data:') || currentUser?.avatar?.startsWith('http') ? (
                <img src={currentUser.avatar} alt={currentUser.name} className="w-8 h-8 rounded-full object-cover shrink-0 ring-1 ring-white/20" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-[#5a36e6] text-white flex items-center justify-center font-bold text-xs shrink-0">
                  {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-xs text-white font-bold truncate group-hover:text-[#a58df8] transition-colors">{currentUser?.name || 'Team Member'}</p>
                <p className="text-xs text-indigo-200/90 font-normal truncate mt-0.5">{currentUser?.email || 'User'}</p>
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
