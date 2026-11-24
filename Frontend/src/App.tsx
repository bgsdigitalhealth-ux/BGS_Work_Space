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

// User Portal Components
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

export const App: React.FC = () => {
  const { currentUser, userNav, adminNav, portalMode } = useApp();
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

  // When user logs out (currentUser becomes null), redirect immediately to the starting face interface
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

  if (portalMode === 'user' || currentUser.role === 'user') {
    return (
      <div className="min-h-screen flex bg-[#f7f8fc] font-sans antialiased relative overflow-x-hidden">
        {/* WorkHub Sidebar */}
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
  }

  // Admin Dashboard Mode
  return (
    <div className="min-h-screen flex bg-[#f3f4fa] font-sans antialiased relative overflow-x-hidden">
      {/* Dark Navy Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 pt-6 px-4 sm:pt-8 sm:px-6 lg:px-8 pb-8 overflow-y-auto w-full">
        <Header />

        {adminNav === 'appointments' ? (
          /* Admin Side - Appointment Management */
          <AdminAppointments />
        ) : adminNav === 'messages' ? (
          /* Admin Side - Real-Time WhatsApp Style Messaging */
          <MessagesView />
        ) : adminNav === 'settings' ? (
          /* Admin Side - Settings & Personnel Management */
          <AdminSettings />
        ) : adminNav === 'timeline' ? (
          /* Admin Side - Manager's Daily Timeline */
          <ManagerTimelineView />
        ) : adminNav === 'reports' ? (
          /* Admin Side - Activity & Completion Reports */
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
};

export default App;
