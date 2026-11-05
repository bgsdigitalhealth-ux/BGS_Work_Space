import React from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { StatsOverview } from './components/StatsOverview';
import { DepartmentList } from './components/DepartmentList';
import { DepartmentDetail } from './components/DepartmentDetail';
import { Modals } from './components/Modals';

// Admin Views
import { AdminAppointments } from './components/admin/AdminAppointments';

// User Portal Components
import { UserSidebar } from './components/user/UserSidebar';
import { UserHeader } from './components/user/UserHeader';
import { UserDashboard } from './components/user/UserDashboard';
import { UserWorkDetails } from './components/user/UserWorkDetails';
import { UserWorkHistory } from './components/user/UserWorkHistory';
import { UserAppointments } from './components/user/UserAppointments';
import { LoginPage } from './components/auth/LoginPage';
import { useApp } from './context/AppContext';

export const App: React.FC = () => {
  const { currentUser, userNav, adminNav, members, userWorkspace } = useApp();

  // If no user is logged in, show Common Login Page (ONLY TWO ROLES: admin, user)
  if (!currentUser) {
    return <LoginPage />;
  }

  if (currentUser.role === 'user') {
    return (
      <div className="min-h-screen flex bg-[#f7f8fc] font-sans antialiased">
        {/* WorkHub Sidebar */}
        <UserSidebar />

        {/* User Content Area */}
        <main className="flex-1 flex flex-col min-w-0 p-6 lg:p-8 overflow-y-auto max-w-[1600px] mx-auto w-full">
          <UserHeader />

          {/* Conditional View by userNav */}
          {userNav === 'dashboard' && <UserDashboard />}
          {(userNav === 'appointments' || userNav === 'my-schedule') && <UserAppointments />}
          {(userNav === 'my-work' || userNav === 'details' || userNav === 'assigned-work') && <UserWorkDetails />}
          {userNav === 'work-history' && <UserWorkHistory />}
          {userNav === 'team' && (
            <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm text-center">
              <h3 className="text-xl font-bold text-gray-900 mb-2">My Department & Team</h3>
              <p className="text-sm text-gray-500 max-w-md mx-auto mb-6">
                Connected team members in your department.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
                {members.slice(0, 4).map((m) => (
                  <div key={m.id} className="p-4 rounded-xl bg-purple-50/50 border border-purple-100 text-center">
                    <div className="w-12 h-12 rounded-full bg-[#5a36e6] text-white flex items-center justify-center font-bold text-sm mx-auto mb-2">
                      {m.avatar || m.name.charAt(0)}
                    </div>
                    <h4 className="font-bold text-sm text-gray-900">{m.name}</h4>
                    <p className="text-xs text-gray-500">{m.role}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          {userNav === 'reports' && (
            <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm text-center">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Performance & Work Reports</h3>
              <p className="text-sm text-gray-500 max-w-md mx-auto mb-6">
                All sprint deliverables tracked against live database records. {userWorkspace?.stats?.completionPercentage ?? 0}% task completion on schedule.
              </p>
            </div>
          )}
        </main>
      </div>
    );
  }

  // Admin Dashboard Mode
  return (
    <div className="min-h-screen flex bg-[#f3f4fa] font-sans antialiased">
      {/* Dark Navy Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 p-6 lg:p-8 overflow-y-auto">
        <Header />
        
        {adminNav === 'appointments' ? (
          /* Admin Side - Appointment Management */
          <AdminAppointments />
        ) : (
          <>
            {/* Top 5 KPI Stats Cards */}
            <StatsOverview />

            {/* Central Departments + Unified Department Detail (Teams, Members, Roles, Tasks, Work Done) */}
            <div className="flex flex-col lg:flex-row gap-5 items-stretch flex-1">
              <DepartmentList />
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
