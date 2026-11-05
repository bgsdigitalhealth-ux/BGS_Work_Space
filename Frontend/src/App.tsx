import React from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { StatsOverview } from './components/StatsOverview';
import { DepartmentList } from './components/DepartmentList';
import { DepartmentDetail } from './components/DepartmentDetail';
import { Modals } from './components/Modals';

export const App: React.FC = () => {
  return (
    <div className="min-h-screen flex bg-[#f3f4fa]">
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
