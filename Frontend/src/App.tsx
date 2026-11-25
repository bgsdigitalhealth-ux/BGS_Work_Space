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
import { AttendanceWidget } from './components/user/AttendanceWidget';
import { BreakTimeView } from './components/break/BreakTimeView';
import { LoginPage } from './components/auth/LoginPage';
import { LandingPage } from './components/landing/LandingPage';
import { MeetingRoom } from './components/meet/MeetingRoom';
import { useApp } from './context/AppContext';
import { ToastContainer } from './components/common/ToastContainer';
import { ConfirmModal } from './components/common/ConfirmModal';

export const App: React.FC = () => {
  const { 
    currentUser, 
    userNav, 
    managerNav, 
    adminNav, 
    toasts,
    dismissToast,
    confirmModal,
    closeConfirmModal 
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

  // 1. ADMIN WORKSPACE (Strictly for role: 'admin')
  if (currentUser.role === 'admin') {
    return (
      <div className="h-screen w-screen overflow-hidden flex bg-[#f3f4fa] font-sans antialiased relative">
        <ToastContainer toasts={toasts} onDismiss={dismissToast} />
        {confirmModal && (
          <ConfirmModal
            {...confirmModal}
            onCancel={confirmModal.onCancel || closeConfirmModal}
          />
        )}
        {/* Fixed Viewport Left Sidebar */}
        <Sidebar />

        {/* Independently Scrollable Main Content Area */}
        <div className="flex-1 h-screen overflow-y-auto flex flex-col min-w-0">
          <Header />

          <main className="p-4 sm:p-6 lg:p-8 flex-1 w-full max-w-[1700px] mx-auto space-y-6">
            <AttendanceWidget />
            {(adminNav === 'record' || adminNav === 'records') ? (
              <UserAttendanceRecords />
            ) : adminNav === 'break-time' ? (
              <BreakTimeView />
            ) : adminNav === 'appointments' ? (
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
      </div>
    );
  }

  // 2. MANAGER WORKSPACE (Strictly for role: 'manager')
  if (currentUser.role === 'manager') {
    return (
      <div className="h-screen w-screen overflow-hidden flex bg-[#f7f8fc] font-sans antialiased relative">
        <ToastContainer toasts={toasts} onDismiss={dismissToast} />
        {confirmModal && (
          <ConfirmModal
            {...confirmModal}
            onCancel={confirmModal.onCancel || closeConfirmModal}
          />
        )}
        {/* Dedicated Fixed Left Manager Sidebar */}
        <ManagerSidebar />

        {/* Independently Scrollable Manager Content Area */}
        <div className="flex-1 h-screen overflow-y-auto flex flex-col min-w-0">
          <UserHeader />

          <main className="p-3.5 sm:p-6 lg:p-8 flex-1 max-w-[1600px] mx-auto w-full space-y-6">
            <AttendanceWidget />
            {/* Conditional View by managerNav */}
            {(managerNav === 'record' || managerNav === 'records') && <UserAttendanceRecords />}
            {managerNav === 'break-time' && <BreakTimeView />}
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
        </div>

        {/* Global Submit Work Drawer */}
        <SubmitWorkDrawer />
      </div>
    );
  }

  // 3. USER WORKSPACE (Strictly for role: 'user')
  return (
    <div className="h-screen w-screen overflow-hidden flex bg-[#f7f8fc] font-sans antialiased relative">
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      {confirmModal && (
        <ConfirmModal
          {...confirmModal}
          onCancel={confirmModal.onCancel || closeConfirmModal}
        />
      )}
      {/* WorkHub Fixed Left User Sidebar */}
      <UserSidebar />

      {/* Independently Scrollable User Content Area */}
      <div className="flex-1 h-screen overflow-y-auto flex flex-col min-w-0">
        <UserHeader />

        <main className="p-3.5 sm:p-6 lg:p-8 flex-1 max-w-[1600px] mx-auto w-full space-y-6">
          {/* Conditional View by userNav */}
          {userNav === 'dashboard' && <UserDashboard />}
          {(userNav === 'record' || userNav === 'records') && <UserAttendanceRecords />}
          {userNav === 'break-time' && <BreakTimeView />}
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
      </div>

      {/* Global Submit Work Drawer for Worker Mode */}
      <SubmitWorkDrawer />
    </div>
  );
};

export default App;
