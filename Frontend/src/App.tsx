import React from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { StatsOverview } from './components/StatsOverview';
import { DepartmentList } from './components/DepartmentList';
import { DepartmentDetail } from './components/DepartmentDetail';
import { TodayTasks } from './components/TodayTasks';
import { TodayWorkDone } from './components/TodayWorkDone';
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

        {/* Central Departments + Department Detail (Teams/Members/Assign Work) */}
        <div className="flex flex-col lg:flex-row gap-5 items-stretch mb-6">
          <DepartmentList />
          <DepartmentDetail />
        </div>

        {/* Bottom Row: Today's Tasks & Today's Work Done */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-auto">
          <TodayTasks />
          <TodayWorkDone />
        </div>

        {/* Global Modals for Add/Create Actions */}
        <Modals />
      </main>
    </div>
  );
};

export default App;

