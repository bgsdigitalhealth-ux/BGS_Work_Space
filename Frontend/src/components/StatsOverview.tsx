import React from 'react';
import { Building2, Users, UserCheck, ClipboardList, CheckCircle2 } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const StatsOverview: React.FC = () => {
  const { stats, departments, teams, members, tasks, workDone } = useApp();

  const cards = [
    {
      title: 'Departments',
      value: stats?.departmentsCount ?? departments.length,
      icon: Building2,
      bgColor: 'bg-indigo-50/80',
      iconColor: 'text-indigo-600',
    },
    {
      title: 'Teams',
      value: stats?.teamsCount ?? teams.length,
      icon: Users,
      bgColor: 'bg-blue-50/80',
      iconColor: 'text-blue-600',
    },
    {
      title: 'Members',
      value: stats?.membersCount ?? (members.length || 36),
      icon: UserCheck,
      bgColor: 'bg-sky-50/80',
      iconColor: 'text-sky-600',
    },
    {
      title: "Today's Tasks",
      value: stats?.todaysTasksCount ?? (tasks.length || 18),
      icon: ClipboardList,
      bgColor: 'bg-purple-50/80',
      iconColor: 'text-purple-600',
    },
    {
      title: 'Work Done Today',
      value: stats?.workDoneTodayCount ?? (workDone.length || 14),
      icon: CheckCircle2,
      bgColor: 'bg-emerald-50/80',
      iconColor: 'text-emerald-600',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
      {cards.map((card, idx) => {
        const IconComponent = card.icon;
        return (
          <div
            key={idx}
            className="bg-white rounded-2xl p-4 border border-slate-200/60 shadow-sm flex items-center gap-3.5 hover:shadow-md transition-shadow"
          >
            <div className={`w-12 h-12 rounded-xl ${card.bgColor} flex items-center justify-center shrink-0`}>
              <IconComponent className={`w-6 h-6 ${card.iconColor}`} />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                {card.title}
              </p>
              <h3 className="text-2xl font-bold text-slate-900 mt-0.5">
                {card.value}
              </h3>
            </div>
          </div>
        );
      })}
    </div>
  );
};
