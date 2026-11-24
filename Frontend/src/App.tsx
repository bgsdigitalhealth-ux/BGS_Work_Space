import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { StatsOverview } from './components/StatsOverview';
import { DepartmentList } from './components/DepartmentList';
import { TeamList } from './components/TeamList';
import { DepartmentDetail } from './components/DepartmentDetail';
import { Modals } from './components/Modals';

// Admin Views
import { AdminAppointments } from './components/admin/AdminAppointments';
import { AdminSettings } from './components/admin/AdminSettings';
import { MessagesView } from './components/messages/MessagesView';

// Manager Workspace Components
import { ManagerSidebar } from './components/manager/ManagerSidebar';
import { ManagerDashboard } from './components/manager/ManagerDashboard';
import { ManagerReviewWork } from './components/manager/ManagerReviewWork';

// User Workspace Components
import { UserSidebar } from './components/user/UserSidebar';
import { UserHeader } from './components/user/UserHeader';
import { UserDashboard } from './components/user/UserDashboard';
import { UserAssignedWork } from './components/user/UserAssignedWork';
import { UserTeamView } from './components/user/UserTeamView';
import { UserWorkHistory } from './components/user/UserWorkHistory';
import { UserAppointments } from './components/user/UserAppointments';
import { UserAssignWork } from './components/user/UserAssignWork';
import { UserSettings } from './components/user/UserSettings';
import { SubmitWorkDrawer } from './components/user/SubmitWorkDrawer';
import { ManagerTimelineView } from './components/user/ManagerTimelineView';
import { ReportsView } from './components/user/ReportsView';
import { UserAttendanceRecords } from './components/user/UserAttendanceRecords';
import { LoginPage } from './components/auth/LoginPage';
import { LandingPage } from './components/landing/LandingPage';
import { MeetingRoom } from './components/meet/MeetingRoom';
import { useApp } from './context/AppContext';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export const App: React.FC = () => {
  const { 
    currentUser, 
    userNav, 
    managerNav, 
    adminNav, 
    toastNotification, 
    clearNotification 
  } = useApp();
  const [authView, setAuthView] = useState<'landing' | 'login'>('landing');

  // Check if current route is a private video meeting route: /meet/<meeting-id>
  const pathname = window.location.pathname;
  const isMeetingRoute = pathname.startsWith('/meet/');
  const meetingId = isMeetingRoute ? pathname.replace('/meet/', '').split('/')[0].split('?')[0] : '';

  if (isMeetingRoute && meetingId) {
    return (
      <MeetingRoom
        meetingId={meetingId}
        onLeave={() => {
          window.history.pushState({}, '', '/');
          window.location.href = '/';
        }}
      />
    );
  }

  // When user logs out (currentUser becomes null), redirect immediately to the landing page
  React.useEffect(() => {
    if (!currentUser) {
      setAuthView('landing');
    }
  }, [currentUser]);

  // If no user is logged in, show the WorkHub Landing Page as the starting face
  if (!currentUser) {
    if (authView === 'login') {
      return <LoginPage onBack={() => setAuthView('landing')} />;
    }
    return (
      <LandingPage
        onLogin={() => setAuthView('login')}
        onAssignWork={() => { }}
      />
    );
  }

  // Common Toast Notification Component
  const ToastBanner = () => {
    if (!toastNotification) return null;
    const isError = toastNotification.type === 'error';
    const isInfo = toastNotification.type === 'info';

    return (
      <div className="fixed top-5 right-5 z-[100] max-w-md w-full animate-in slide-in-from-top-4 fade-in duration-300 pointer-events-auto">
        <div className={`rounded-2xl p-4 border shadow-2xl flex items-start gap-3.5 relative overflow-hidden backdrop-blur-md ${
          isError 
            ? 'bg-slate-900/95 text-white border-rose-500/40 shadow-rose-950/30' 
            : isInfo 
            ? 'bg-slate-900/95 text-white border-indigo-500/40 shadow-indigo-950/30' 
            : 'bg-slate-900/95 text-white border-emerald-500/40 shadow-emerald-950/30'
        }`}>
          <div className="mt-0.5 shrink-0">
            {isError ? (
              <AlertCircle className="w-5 h-5 text-rose-400" />
            ) : isInfo ? (
              <Info className="w-5 h-5 text-indigo-400" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            )}
          </div>
          <div className="flex-1 min-w-0 pr-2">
            {toastNotification.title && (
              <h4 className="text-xs font-bold text-white mb-0.5">{toastNotification.title}</h4>
            )}
            <p className="text-xs text-slate-200 leading-relaxed font-medium">{toastNotification.message}</p>
          </div>
          <button 
            type="button" 
            onClick={clearNotification}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition cursor-pointer shrink-0"
            title="Dismiss notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };

  // 1. ADMIN WORKSPACE (Strictly for role: 'admin')
  if (currentUser.role === 'admin') {
    return (
      <div className="min-h-screen flex bg-[#f3f4fa] font-sans antialiased relative overflow-x-hidden">
        <ToastBanner />
        {/* Dark Navy Sidebar */}
        <Sidebar />

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col min-w-0 pt-6 px-4 sm:pt-8 sm:px-6 lg:px-8 pb-8 overflow-y-auto w-full">
          <Header />

          {adminNav === 'appointments' ? (
            <AdminAppointments />
          ) : adminNav === 'messages' ? (
            <MessagesView />
          ) : adminNav === 'settings' ? (
            <AdminSettings />
          ) : adminNav === 'timeline' ? (
            <ManagerTimelineView />
          ) : adminNav === 'reports' ? (
            <ReportsView />
          ) : (
            <>
              {/* Top 5 KPI Stats Cards */}
              <StatsOverview />

              {/* Central Departments & Teams (Left) + Unified Department Detail (Right) */}
              <div className="flex flex-col lg:flex-row gap-5 items-stretch flex-1">
                <div className="w-full lg:w-80 shrink-0 space-y-5">
                  <DepartmentList />
                  <TeamList />
                </div>
                <DepartmentDetail />
              </div>
            </>
          )}

          {/* Global Modals for Add/Edit Actions */}
          <Modals />
        </main>
      </div>
    );
  }

  // 2. MANAGER WORKSPACE (Strictly for role: 'manager')
  if (currentUser.role === 'manager') {
    return (
      <div className="min-h-screen flex bg-[#f7f8fc] font-sans antialiased relative overflow-x-hidden">
        <ToastBanner />
        {/* Dedicated Manager Sidebar */}
        <ManagerSidebar />

        {/* Manager Content Area */}
        <main className="flex-1 flex flex-col min-w-0 p-3.5 sm:p-6 lg:p-8 overflow-y-auto max-w-[1600px] mx-auto w-full">
          <UserHeader />

          {/* Conditional View by managerNav */}
          {managerNav === 'dashboard' && <ManagerDashboard />}
          {managerNav === 'team' && <UserTeamView />}
          {managerNav === 'assign-work' && <UserAssignWork />}
          {managerNav === 'my-work' && <UserAssignedWork initialView="cards" title="My Work" />}
          {managerNav === 'review-work' && <ManagerReviewWork />}
          {(managerNav === 'appointments' || managerNav === 'my-schedule') && <UserAppointments />}
          {managerNav === 'messages' && <MessagesView />}
          {managerNav === 'timeline' && <ManagerTimelineView />}
          {managerNav === 'reports' && <ReportsView />}
          {managerNav === 'settings' && <UserSettings />}
        </main>

        {/* Global Submit Work Drawer */}
        <SubmitWorkDrawer />
      </div>
    );
  }

  // 3. USER WORKSPACE (Strictly for role: 'user')
  return (
    <div className="min-h-screen flex bg-[#f7f8fc] font-sans antialiased relative overflow-x-hidden">
      <ToastBanner />
      {/* WorkHub User Sidebar */}
      <UserSidebar />

      {/* User Content Area */}
      <main className="flex-1 flex flex-col min-w-0 p-3.5 sm:p-6 lg:p-8 overflow-y-auto max-w-[1600px] mx-auto w-full">
        <UserHeader />

        {/* Conditional View by userNav */}
        {userNav === 'dashboard' && <UserDashboard />}
        {(userNav === 'record' || userNav === 'records') && <UserAttendanceRecords />}
        {userNav === 'messages' && <MessagesView />}
        {(userNav === 'appointments' || userNav === 'my-schedule') && <UserAppointments />}
        {(userNav === 'my-work' || userNav === 'details' || userNav === 'assigned-work') && <UserAssignedWork />}
        {userNav === 'assign-work' && <UserAssignWork />}
        {userNav === 'work-history' && <UserWorkHistory />}
        {userNav === 'settings' && <UserSettings />}
        {userNav === 'team' && <UserTeamView />}
        {userNav === 'timeline' && <ManagerTimelineView />}
        {userNav === 'reports' && <ReportsView />}
      </main>

      {/* Global Submit Work Drawer for Worker Mode */}
      <SubmitWorkDrawer />
    </div>
  );
};

export default App;
