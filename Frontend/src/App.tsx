import React from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { StatsOverview } from './components/StatsOverview';
import { DepartmentList } from './components/DepartmentList';
import { DepartmentDetail } from './components/DepartmentDetail';
import { Modals } from './components/Modals';

// User Portal Components
import { UserSidebar } from './components/user/UserSidebar';
import { UserHeader } from './components/user/UserHeader';
import { UserDashboard } from './components/user/UserDashboard';
import { UserWorkDetails } from './components/user/UserWorkDetails';
import { UserWorkHistory } from './components/user/UserWorkHistory';
import { useApp } from './context/AppContext';

export const App: React.FC = () => {
  const { portalMode, userNav } = useApp();

  if (portalMode === 'user') {
    return (
      <div className="min-h-screen flex bg-[#f7f8fc] font-sans antialiased">
        {/* WorkHub Sidebar */}
        <UserSidebar />

        {/* User Content Area */}
        <main className="flex-1 flex flex-col min-w-0 p-6 lg:p-8 overflow-y-auto max-w-[1600px] mx-auto w-full">
          <UserHeader />

          {/* Conditional View by userNav */}
          {userNav === 'dashboard' && <UserDashboard />}
          {(userNav === 'my-work' || userNav === 'details' || userNav === 'assigned-work') && <UserWorkDetails />}
          {userNav === 'work-history' && <UserWorkHistory />}
          {userNav === 'team' && (
            <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm text-center">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Events & Design Team</h3>
              <p className="text-sm text-gray-500 max-w-md mx-auto mb-6">
                Connected to 4 active team members in Design & Creative Media.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
                <div className="p-4 rounded-xl bg-purple-50/50 border border-purple-100 text-center">
                  <div className="w-12 h-12 rounded-full bg-[#5a36e6] text-white flex items-center justify-center font-bold text-sm mx-auto mb-2">
                    PV
                  </div>
                  <h4 className="font-bold text-sm text-gray-900">Priya Verma</h4>
                  <p className="text-xs text-gray-500">Team Lead</p>
                </div>
                <div className="p-4 rounded-xl bg-purple-50/50 border border-purple-100 text-center">
                  <div className="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-sm mx-auto mb-2">
                    RS
                  </div>
                  <h4 className="font-bold text-sm text-gray-900">Rahul Sharma (You)</h4>
                  <p className="text-xs text-gray-500">Team Member</p>
                </div>
                <div className="p-4 rounded-xl bg-purple-50/50 border border-purple-100 text-center">
                  <div className="w-12 h-12 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-sm mx-auto mb-2">
                    AS
                  </div>
                  <h4 className="font-bold text-sm text-gray-900">Amit Singh</h4>
                  <p className="text-xs text-gray-500">UI Designer</p>
                </div>
                <div className="p-4 rounded-xl bg-purple-50/50 border border-purple-100 text-center">
                  <div className="w-12 h-12 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold text-sm mx-auto mb-2">
                    SM
                  </div>
                  <h4 className="font-bold text-sm text-gray-900">Sneha Mehta</h4>
                  <p className="text-xs text-gray-500">Content Specialist</p>
                </div>
              </div>
            </div>
          )}
          {userNav === 'reports' && (
            <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm text-center">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Performance & Sprint Velocity</h3>
              <p className="text-sm text-gray-500 max-w-md mx-auto mb-6">
                All sprint deliverables tracked against deadlines. 82% task completion on schedule.
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
        
        {/* Top 5 KPI Stats Cards */}
        <StatsOverview />

        {/* Central Departments + Unified Department Detail (Teams, Members, Roles, Tasks, Work Done) */}
        <div className="flex flex-col lg:flex-row gap-5 items-stretch flex-1">
          <DepartmentList />
          <DepartmentDetail />
        </div>

        {/* Global Modals for Add/Edit Actions */}
        <Modals />
      </main>
    </div>
  );
};

export default App;
