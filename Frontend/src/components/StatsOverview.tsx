import React from 'react';
import { Building2, Users, UserCheck, ClipboardList, CheckCircle2, ArrowUpRight } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const StatsOverview: React.FC = () => {
  const { stats, departments, teams, members, tasks, workDone, setActiveTab, scrollToSection } = useApp();

  const cards = [
    {
      title: 'Departments',
      value: stats?.departmentsCount ?? departments.length,
      icon: Building2,
      bgColor: 'bg-indigo-50/80',
      iconColor: 'text-indigo-600',
      action: () => {
        scrollToSection('departments-section');
      },
      hint: 'View Departments'
    },
    {
      title: 'Teams',
      value: stats?.teamsCount ?? teams.length,
      icon: Users,
      bgColor: 'bg-blue-50/80',
      iconColor: 'text-blue-600',
      action: () => {
        setActiveTab('Teams');
        scrollToSection('department-detail');
      },
      hint: 'Manage Teams'
    },
    {
      title: 'Members',
      value: stats?.membersCount ?? members.length,
      icon: UserCheck,
      bgColor: 'bg-sky-50/80',
      iconColor: 'text-sky-600',
      action: () => {
        setActiveTab('Members');
        scrollToSection('department-detail');
      },
      hint: 'View All Members'
    },
    {
      title: "Today's Tasks",
      value: stats?.todaysTasksCount ?? tasks.length,
      icon: ClipboardList,
      bgColor: 'bg-purple-50/80',
      iconColor: 'text-purple-600',
      action: () => {
        scrollToSection('todays-tasks-section');
      },
      hint: "Jump to Today's Tasks"
    },
    {
      title: 'Work Done Today',
      value: stats?.workDoneTodayCount ?? workDone.length,
      icon: CheckCircle2,
      bgColor: 'bg-emerald-50/80',
      iconColor: 'text-emerald-600',
      action: () => {
        scrollToSection('todays-workdone-section');
      },
      hint: 'Jump to Completed Work'
    },
  ];

  return (
    <div id="stats-overview" className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
      {cards.map((card, idx) => {
        const IconComponent = card.icon;
        return (
          <button
            key={idx}
            onClick={card.action}
            title={card.hint}
            className="group bg-white rounded-2xl p-4 border border-slate-200/60 shadow-xs flex items-center justify-between text-left hover:border-indigo-300 hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer"
          >
            <div className="flex items-center gap-3.5">
              <div className={`w-12 h-12 rounded-xl ${card.bgColor} flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform`}>
                <IconComponent className={`w-6 h-6 ${card.iconColor}`} />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider group-hover:text-indigo-600 transition-colors">
                  {card.title}
                </p>
                <h3 className="text-2xl font-bold text-slate-900 mt-0.5">
                  {card.value}
                </h3>
              </div>
            </div>
            <ArrowUpRight className="w-4 h-4 text-slate-300 opacity-0 group-hover:opacity-100 group-hover:text-indigo-600 transition-all shrink-0 -mr-1" />
          </button>
        );
      })}
    </div>
  );
};
