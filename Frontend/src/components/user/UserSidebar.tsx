import React from 'react';
import { 
  Shield, 
  LayoutDashboard, 
  Briefcase, 
  Calendar as CalendarIcon,
  CalendarCheck,
  ClipboardList, 
  Send, 
  History, 
  Users, 
  FileText,
  ArrowRightLeft
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const UserSidebar: React.FC = () => {
  const { userNav, setUserNav, setPortalMode, openSubmitWorkDrawer, userWorkspace, currentUser } = useApp();

  const assignedCount = userWorkspace?.assignedWork?.length || 0;

  const navItems = [
    { id: 'dashboard', label: 'My Dashboard', icon: LayoutDashboard },
    { id: 'my-work', label: 'My Work', icon: Briefcase },
    { id: 'appointments', label: 'Appointments', icon: CalendarIcon },
    { id: 'my-schedule', label: 'My Schedule', icon: CalendarCheck },
    { id: 'assigned-work', label: 'Assigned Work', icon: ClipboardList, badge: assignedCount > 0 ? assignedCount : undefined },
    { id: 'submit-work', label: 'Submit Work', icon: Send, isAction: true },
    { id: 'work-history', label: 'Work History', icon: History },
    { id: 'team', label: 'Team', icon: Users },
    { id: 'reports', label: 'Reports', icon: FileText },
  ];

  const handleNavClick = (item: typeof navItems[0]) => {
    if (item.isAction) {
      openSubmitWorkDrawer();
    } else {
      setUserNav(item.id);
    }
  };

  return (
    <aside className="w-64 bg-[#14122d] text-white flex flex-col justify-between shrink-0 min-h-screen relative overflow-hidden shadow-2xl">
      {/* Top Section */}
      <div className="p-6 relative z-10">
        {/* Brand Header */}
        <div className="flex items-center gap-3 mb-8 cursor-pointer" onClick={() => setUserNav('dashboard')}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#704fe6] to-[#4f32c2] flex items-center justify-center shadow-lg shadow-indigo-900/50">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white leading-none">WorkHub</h1>
            <p className="text-xs text-[#9d9bb9] font-medium tracking-wide mt-1">Team Workspace</p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = userNav === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200 group ${
                  isActive
                    ? 'bg-[#5a36e6] text-white shadow-lg shadow-indigo-600/30'
                    : 'text-[#9d9bb9] hover:text-white hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <Icon className={`w-5 h-5 transition-colors ${isActive ? 'text-white' : 'text-[#7e7b9e] group-hover:text-white'}`} />
                  <span>{item.label}</span>
                </div>

                {item.badge !== undefined && (
                  <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-[#704fe6] text-white">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Switcher Card & Wave Graphics */}
      <div className="p-5 relative z-10">
        <div className="bg-[#1f1b45] border border-white/10 rounded-2xl p-4 text-center shadow-lg">
          <p className="text-xs text-[#a2a0c4] mb-2 font-medium">Logged in as {currentUser?.name || 'Rahul Sharma'}</p>
          <button
            onClick={() => setPortalMode('admin')}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-[#2e2960] hover:bg-[#3d367d] text-white text-xs font-semibold transition border border-white/10 shadow-sm"
          >
            <ArrowRightLeft className="w-3.5 h-3.5 text-[#a855f7]" />
            Switch to Admin Dashboard
          </button>
        </div>
      </div>

      {/* Decorative Gradient Wave Glow at bottom */}
      <div className="absolute -bottom-16 -left-16 w-64 h-64 rounded-full bg-gradient-to-tr from-[#6d28d9]/40 via-[#4f46e5]/20 to-transparent blur-2xl pointer-events-none" />
      <div className="absolute bottom-10 -right-10 w-48 h-48 rounded-full bg-gradient-to-tl from-[#9333ea]/30 via-[#6366f1]/10 to-transparent blur-xl pointer-events-none" />
    </aside>
  );
};
