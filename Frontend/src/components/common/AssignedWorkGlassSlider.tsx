import React, { useState, useEffect, useRef } from 'react';
import { 
  User as UserIcon, 
  Briefcase, 
  Clock, 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Play, 
  Pause, 
  Sparkles,
  Building2
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export interface AssignedWorkItem {
  id: string;
  userName: string;
  userEmail?: string;
  userRole?: string;
  userDepartment?: string;
  userTeam?: string;
  assignedWork: string;
  workDescription?: string;
  timeFrom: string;
  timeTo: string;
  date: string;
  priority: 'High' | 'Medium' | 'Low';
  status: string;
  assignmentType?: string;
}

interface AssignedWorkGlassSliderProps {
  className?: string;
  onItemClick?: (item: AssignedWorkItem) => void;
  title?: string;
}

export const AssignedWorkGlassSlider: React.FC<AssignedWorkGlassSliderProps> = ({
  className = '',
  onItemClick,
  title = 'Active Assigned Work'
}) => {
  const { assignments, members, userWorkspace } = useApp();
  const [items, setItems] = useState<AssignedWorkItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [slideDirection, setSlideDirection] = useState<'right' | 'left'>('right');
  const [isAnimating, setIsAnimating] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Default institutional work items with realistic duty timings
  const defaultItems: AssignedWorkItem[] = [
    {
      id: 'item-1',
      userName: 'Rahul Sharma',
      userEmail: 'rahul.sharma@hospital.org',
      userRole: 'Team Member',
      userDepartment: 'Events & Media',
      userTeam: 'Design Team',
      assignedWork: 'Prepare event poster for CME',
      workDescription: 'Design an event poster for upcoming CME on Anaesthesia Awareness Programme with institutional branding.',
      timeFrom: '09:30 AM',
      timeTo: '05:30 PM',
      date: 'Today, 14 Nov 2026',
      priority: 'High',
      status: 'In Progress',
      assignmentType: 'admin_to_user'
    },
    {
      id: 'item-2',
      userName: 'Priya Verma',
      userEmail: 'priya.verma@hospital.org',
      userRole: 'Lead Engineer',
      userDepartment: 'Digital AI',
      userTeam: 'Backend Team',
      assignedWork: 'Oversee backend development & API integration',
      workDescription: 'Review API endpoints, database synchronization, and multi-tenant hospital routing protocols.',
      timeFrom: '10:00 AM',
      timeTo: '06:00 PM',
      date: '14 Nov 2026',
      priority: 'High',
      status: 'In Progress',
      assignmentType: 'user_to_user'
    },
    {
      id: 'item-3',
      userName: 'Amit Singh',
      userEmail: 'amit.singh@hospital.org',
      userRole: 'QA Specialist',
      userDepartment: 'Health Informatics',
      userTeam: 'QA Team',
      assignedWork: 'Test APIs & report bugs for verification',
      workDescription: 'Conduct end-to-end load testing and verify automated WhatsApp receipt delivery hooks.',
      timeFrom: '08:30 AM',
      timeTo: '04:30 PM',
      date: 'Today, 14 Nov 2026',
      priority: 'Medium',
      status: 'In Progress',
      assignmentType: 'user_to_user'
    },
    {
      id: 'item-4',
      userName: 'Sneha Mehta',
      userEmail: 'sneha.mehta@hospital.org',
      userRole: 'UI/UX Designer',
      userDepartment: 'Operations & Media',
      userTeam: 'Creative Team',
      assignedWork: 'Design API documentation UI & Wireframes',
      workDescription: 'Develop responsive glassmorphism components and interactive schedule timetable interfaces.',
      timeFrom: '11:00 AM',
      timeTo: '07:00 PM',
      date: '15 Nov 2026',
      priority: 'Medium',
      status: 'To Do',
      assignmentType: 'admin_to_user'
    },
    {
      id: 'item-5',
      userName: 'Ranjan Kumar',
      userEmail: 'ranjan.kumar@hospital.org',
      userRole: 'Systems Admin',
      userDepartment: 'Digital AI',
      userTeam: 'DevOps & Infrastructure',
      assignedWork: 'Hospital portal deployment & security hardening',
      workDescription: 'Execute production build verification, SSL certification check, and MongoDB Atlas replication monitor.',
      timeFrom: '09:00 AM',
      timeTo: '05:00 PM',
      date: 'Today, 14 Nov 2026',
      priority: 'High',
      status: 'In Progress',
      assignmentType: 'user_to_self'
    }
  ];

  // Merge live database assignments with fallback items
  useEffect(() => {
    const combined: AssignedWorkItem[] = [];

    // 1. From live assignments
    if (assignments && assignments.length > 0) {
      assignments.forEach((a, idx) => {
        if (!a.workTitle) return;
        const fallback = defaultItems[idx % defaultItems.length];
        combined.push({
          id: a.id || `asg-${idx}`,
          userName: a.assigneeName || a.role || 'Assigned User',
          userEmail: a.assigneeEmail || '',
          userRole: a.role || 'Team Member',
          userDepartment: a.departmentName || fallback.userDepartment,
          userTeam: a.teamName || fallback.userTeam,
          assignedWork: a.workTitle,
          workDescription: a.workDescription || fallback.workDescription,
          timeFrom: (a as any).timeFrom || fallback.timeFrom,
          timeTo: (a as any).timeTo || fallback.timeTo,
          date: a.dueDate || 'Today, 14 Nov 2026',
          priority: a.priority || 'High',
          status: a.status || 'In Progress',
          assignmentType: a.assignmentType || 'admin_to_user'
        });
      });
    }

    // 2. From user workspace assigned work
    if (userWorkspace?.assignedWork && userWorkspace.assignedWork.length > 0) {
      userWorkspace.assignedWork.forEach((w, idx) => {
        if (!w.title) return;
        // avoid exact duplicates by title
        if (combined.some(c => c.assignedWork.toLowerCase() === w.title.toLowerCase())) return;
        const fallback = defaultItems[(idx + 2) % defaultItems.length];
        combined.push({
          id: w.id || `uw-${idx}`,
          userName: (w as any).assigneeName || fallback.userName,
          userEmail: (w as any).assigneeEmail || fallback.userEmail,
          userRole: 'Team Member',
          userDepartment: w.department || fallback.userDepartment,
          userTeam: w.team || fallback.userTeam,
          assignedWork: w.title,
          workDescription: w.description || fallback.workDescription,
          timeFrom: (w as any).timeFrom || fallback.timeFrom,
          timeTo: (w as any).timeTo || fallback.timeTo,
          date: w.dueDate || w.assignedOn || 'Today, 14 Nov 2026',
          priority: w.priority || 'High',
          status: w.status || 'In Progress',
          assignmentType: (w as any).assignmentType || 'admin_to_user'
        });
      });
    }

    // 3. From members who have assigned work
    if (members && members.length > 0) {
      members.forEach((m, idx) => {
        if (!m.assignedWork || m.assignedWork.trim() === '') return;
        if (combined.some(c => c.assignedWork.toLowerCase() === m.assignedWork?.toLowerCase())) return;
        const fallback = defaultItems[(idx + 1) % defaultItems.length];
        combined.push({
          id: m.id || `m-${idx}`,
          userName: m.name,
          userEmail: m.email,
          userRole: m.role || 'Member',
          userDepartment: fallback.userDepartment,
          userTeam: fallback.userTeam,
          assignedWork: m.assignedWork,
          workDescription: fallback.workDescription,
          timeFrom: fallback.timeFrom,
          timeTo: fallback.timeTo,
          date: 'Today, 14 Nov 2026',
          priority: 'High',
          status: 'In Progress',
          assignmentType: 'admin_to_user'
        });
      });
    }

    // 4. If none found, use default realistic items
    if (combined.length === 0) {
      setItems(defaultItems);
    } else {
      // Keep up to 8 active items
      setItems(combined.slice(0, 8));
    }
  }, [assignments, members, userWorkspace]);

  // Autoplay slider logic: advance one-by-one every 4 seconds
  useEffect(() => {
    if (!isPlaying || items.length <= 1) return;

    timerRef.current = setInterval(() => {
      handleNext();
    }, 4000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, items.length, currentIndex]);

  const handleNext = () => {
    if (items.length <= 1) return;
    setSlideDirection('right');
    setIsAnimating(true);
    setCurrentIndex((prev) => (prev + 1) % items.length);
    setTimeout(() => setIsAnimating(false), 500);
  };

  const handlePrev = () => {
    if (items.length <= 1) return;
    setSlideDirection('left');
    setIsAnimating(true);
    setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);
    setTimeout(() => setIsAnimating(false), 500);
  };

  const currentItem = items[currentIndex] || defaultItems[0];

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'High':
        return 'bg-rose-500/15 text-rose-700 border-rose-300/40';
      case 'Medium':
        return 'bg-amber-500/15 text-amber-700 border-amber-300/40';
      default:
        return 'bg-emerald-500/15 text-emerald-700 border-emerald-300/40';
    }
  };

  return (
    <div 
      className={`relative rounded-3xl bg-white/40 hover:bg-white/45 backdrop-blur-2xl backdrop-saturate-150 border border-white/70 shadow-[0_20px_50px_rgba(0,0,0,0.12),inset_0_1px_2px_rgba(255,255,255,0.95)] p-5 sm:p-7 transition-all duration-300 group overflow-hidden ${className}`}
      onMouseEnter={() => setIsPlaying(false)}
      onMouseLeave={() => setIsPlaying(true)}
    >
      {/* Ambient background glow & glass highlights */}
      <div className="absolute -top-16 -right-16 w-44 h-44 rounded-full bg-gradient-to-br from-[#5a36e6]/25 to-purple-400/10 blur-2xl pointer-events-none" />
      <div className="absolute -bottom-16 -left-16 w-44 h-44 rounded-full bg-gradient-to-tr from-emerald-400/20 to-teal-400/10 blur-2xl pointer-events-none" />

      {/* Header Row: Live Badge + Slide Nav Controls */}
      <div className="relative z-10 flex items-center justify-between gap-3 mb-4 pb-3 border-b border-white/50">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-xs shadow-emerald-500/50" />
          <h3 className="font-['Plus_Jakarta_Sans',sans-serif] text-xs sm:text-sm font-black text-gray-950 uppercase tracking-wider flex items-center gap-1.5">
            <span>{title}</span>
            <Sparkles className="w-3.5 h-3.5 text-[#5a36e6]" />
          </h3>
        </div>

        {/* Controls: Play/Pause, Counter, Arrows */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <span className="text-[11px] font-bold text-gray-700 bg-white/60 px-2 py-0.5 rounded-full border border-white/80">
            {currentIndex + 1} / {items.length || 1}
          </span>

          <button
            type="button"
            onClick={() => setIsPlaying(!isPlaying)}
            title={isPlaying ? 'Pause auto-sliding' : 'Resume auto-sliding'}
            className="w-7 h-7 rounded-xl bg-white/70 hover:bg-white text-gray-700 flex items-center justify-center transition shadow-2xs border border-white/80 cursor-pointer"
          >
            {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3 ml-0.5" />}
          </button>

          <button
            type="button"
            onClick={handlePrev}
            title="Previous assigned work"
            className="w-7 h-7 rounded-xl bg-white/70 hover:bg-white text-gray-700 flex items-center justify-center transition shadow-2xs border border-white/80 cursor-pointer hover:-translate-x-0.5"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={handleNext}
            title="Next assigned work"
            className="w-7 h-7 rounded-xl bg-white/70 hover:bg-white text-gray-700 flex items-center justify-center transition shadow-2xs border border-white/80 cursor-pointer hover:translate-x-0.5"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Slide Card: "One-by-One" Horizontal Slide with Upward Motion */}
      <div 
        className={`relative z-10 min-h-[220px] flex flex-col justify-between ${onItemClick ? 'cursor-pointer' : ''}`}
        onClick={() => onItemClick && onItemClick(currentItem)}
      >
        <div 
          key={currentItem.id}
          className={`space-y-3.5 transition-all duration-500 ease-out transform ${
            isAnimating 
              ? slideDirection === 'right' 
                ? 'opacity-0 translate-x-4 translate-y-3 scale-[0.98]' 
                : 'opacity-0 -translate-x-4 translate-y-3 scale-[0.98]'
              : 'opacity-100 translate-x-0 translate-y-0 scale-100'
          }`}
        >
          {/* User Name & Department Row */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#5a36e6] to-[#7b57f7] text-white flex items-center justify-center font-black text-sm shadow-md shadow-indigo-600/30 shrink-0">
                {currentItem.userName.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-['Plus_Jakarta_Sans',sans-serif] font-black text-sm sm:text-base text-gray-950 tracking-tight">
                    {currentItem.userName}
                  </h4>
                  {currentItem.assignmentType && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#5a36e6]/10 text-[#5a36e6] border border-[#5a36e6]/20">
                      {currentItem.assignmentType === 'user_to_self' ? 'Self Assign' :
                       currentItem.assignmentType === 'user_to_user' ? 'User → User' :
                       currentItem.assignmentType === 'user_to_admin' ? 'User → Admin' : 'Admin → User'}
                    </span>
                  )}
                </div>
                <p className="text-[11px] font-medium text-gray-600 flex items-center gap-1.5 mt-0.5">
                  <span className="inline-flex items-center gap-1">
                    <UserIcon className="w-3 h-3 text-[#5a36e6]" />
                    <span>{currentItem.userRole || 'Team Member'}</span>
                  </span>
                  <span>&bull;</span>
                  <span className="inline-flex items-center gap-1 text-gray-700 font-semibold">
                    <Building2 className="w-3 h-3 text-gray-500" />
                    <span>{currentItem.userDepartment}</span>
                  </span>
                </p>
              </div>
            </div>

            {/* Priority & Status Pill */}
            <div className="flex items-center gap-1.5">
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${getPriorityBadge(currentItem.priority)}`}>
                {currentItem.priority}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-500/15 text-blue-700 border border-blue-300/40 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
                <span>{currentItem.status}</span>
              </span>
            </div>
          </div>

          {/* User Assigned Work Title & Description */}
          <div className="p-3.5 rounded-2xl bg-white/75 border border-white/90 shadow-xs">
            <div className="flex items-start gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-indigo-50 text-[#5a36e6] flex items-center justify-center shrink-0 mt-0.5">
                <Briefcase className="w-3.5 h-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] uppercase font-bold tracking-wider text-gray-400 mb-0.5">
                  Assigned Work
                </p>
                <h5 className="font-['Plus_Jakarta_Sans',sans-serif] font-bold text-xs sm:text-sm text-gray-900 leading-snug line-clamp-2">
                  {currentItem.assignedWork}
                </h5>
                {currentItem.workDescription && (
                  <p className="text-[11px] text-gray-600 mt-1 line-clamp-2 leading-relaxed">
                    {currentItem.workDescription}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Time (From - To) and Date Glass Box */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* Time: From - To */}
            <div className="p-3 rounded-2xl bg-white/70 border border-white/80 shadow-xs flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-purple-100 text-[#5a36e6] flex items-center justify-center shrink-0 shadow-2xs">
                <Clock className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] uppercase font-extrabold tracking-wider text-purple-700">
                  Time (From - To)
                </p>
                <p className="text-xs font-black text-gray-950 truncate">
                  {currentItem.timeFrom} <span className="text-[#5a36e6] font-extrabold">&rarr;</span> {currentItem.timeTo}
                </p>
              </div>
            </div>

            {/* Date */}
            <div className="p-3 rounded-2xl bg-white/70 border border-white/80 shadow-xs flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 shadow-2xs">
                <Calendar className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] uppercase font-extrabold tracking-wider text-emerald-700">
                  Assignment Date
                </p>
                <p className="text-xs font-black text-gray-950 truncate">
                  {currentItem.date}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer: Pagination Dots & Quick Slide Stepper */}
        <div className="pt-3.5 mt-3 border-t border-white/50 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            {items.map((it, idx) => (
              <button
                key={it.id}
                type="button"
                onClick={() => {
                  setSlideDirection(idx > currentIndex ? 'right' : 'left');
                  setIsAnimating(true);
                  setCurrentIndex(idx);
                  setTimeout(() => setIsAnimating(false), 500);
                }}
                title={`Go to ${it.userName}'s assigned work`}
                className={`transition-all duration-300 rounded-full cursor-pointer ${
                  idx === currentIndex 
                    ? 'w-6 h-2 bg-[#5a36e6]' 
                    : 'w-2 h-2 bg-gray-400/50 hover:bg-gray-600'
                }`}
              />
            ))}
          </div>

          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
            <span>Live Sync</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          </span>
        </div>
      </div>
    </div>
  );
};
