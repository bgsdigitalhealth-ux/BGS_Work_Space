import React from 'react';
import { Building2, Users, UserCheck, ClipboardList, CheckCircle2, ArrowUpRight } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const StatsOverview: React.FC = () => {
  const { 
    stats, 
    departments, 
    teams, 
    members, 
    tasks, 
    workDone, 
    setActiveTab, 
    setTeamSubTab, 
    scrollToSection 
  } = useApp();

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
        setTeamSubTab('Members');
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
        setActiveTab('Teams');
        setTeamSubTab('Tasks');
        scrollToSection('department-detail');
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
        setActiveTab('Teams');
        setTeamSubTab('WorkDone');
        scrollToSection('department-detail');
      },
      hint: 'Jump to Completed Work'
    },
  ];

  return (
    <div id="stats-overview" className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3 mb-4">
      {cards.map((card, idx) => {
        const IconComponent = card.icon;
        return (
          <button
            key={idx}
            onClick={card.action}
            title={card.hint}
            className="group bg-white rounded-xl py-2.5 px-3 border border-slate-200/70 shadow-2xs flex items-center justify-between text-left hover:border-indigo-300 hover:shadow-xs transition-all cursor-pointer"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className={`w-8 h-8 rounded-lg ${card.bgColor} flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform`}>
                <IconComponent className={`w-4 h-4 ${card.iconColor}`} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider truncate group-hover:text-indigo-600 transition-colors">
                  {card.title}
                </p>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                  {card.value}
                </h3>
              </div>
            </div>
            <ArrowUpRight className="w-3.5 h-3.5 text-slate-300 opacity-0 group-hover:opacity-100 group-hover:text-indigo-600 transition-all shrink-0 ml-1" />
          </button>
        );
      })}
    </div>
  );
};
