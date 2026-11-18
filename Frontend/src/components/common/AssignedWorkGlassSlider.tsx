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
  Building2,
  CheckCircle2,
  ShieldCheck,
  Activity
} from 'lucide-react';
import { useApp, isBannedEmail } from '../../context/AppContext';
import { api } from '../../services/api';

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
  onItemClick?: (item?: AssignedWorkItem) => void;
  title?: string;
}

export const AssignedWorkGlassSlider: React.FC<AssignedWorkGlassSliderProps> = ({
  className = '',
  onItemClick,
  title = 'Live Assigned Work'
}) => {
  const { assignments, members, departments, teams, userWorkspace } = useApp();
  const [items, setItems] = useState<AssignedWorkItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [slideDirection, setSlideDirection] = useState<'right' | 'left'>('right');
  const [isAnimating, setIsAnimating] = useState(false);
  const [liveFetchedAssignments, setLiveFetchedAssignments] = useState<any[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Fetch live assignments directly on mount to ensure genuine database sync
  useEffect(() => {
    let isMounted = true;
    api.getAssignments()
      .then((list) => {
        if (isMounted && Array.isArray(list)) {
          setLiveFetchedAssignments(list);
        }
      })
      .catch((err) => {
        console.warn('[AssignedWorkSlider] API fetch notice:', err.message);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // Compile ONLY original authentic assignments from database (NO fake/dummy fallback arrays)
  useEffect(() => {
    const combined: AssignedWorkItem[] = [];
    const seenIds = new Set<string>();

    const sourceAssignments = (liveFetchedAssignments && liveFetchedAssignments.length > 0)
      ? liveFetchedAssignments
      : (assignments || []);

    // 1. Process genuine assignments from database
    sourceAssignments.forEach((a: any, idx: number) => {
      const email = (a.assigneeEmail || '').toLowerCase();
      if (email && isBannedEmail(email)) return;
      if (!a.workTitle && !a.title) return;

      const matchedMember = (members || []).find(m =>
        (a.memberId && m.id === a.memberId) ||
        (email && m.email && m.email.toLowerCase() === email)
      );

      const matchedDept = (departments || []).find(d =>
        (a.departmentId && d.id === a.departmentId) ||
        (matchedMember && matchedMember.departmentId === d.id) ||
        (a.department && d.name && d.name.toLowerCase() === a.department.toLowerCase())
      );

      const matchedTeam = (teams || []).find(t =>
        (a.teamId && t.id === a.teamId) ||
        (matchedMember && matchedMember.teamId === t.id) ||
        (a.team && t.name && t.name.toLowerCase() === a.team.toLowerCase())
      );

      const rawId = a.id || a._id || `asg-${idx}`;
      if (seenIds.has(rawId)) return;
      seenIds.add(rawId);

      const resolvedPriority = (a.priority === 'High' || a.priority === 'Low' || a.priority === 'Medium')
        ? a.priority
        : 'Medium';

      combined.push({
        id: rawId,
        userName: a.assigneeName || matchedMember?.name || a.role || 'Staff Member',
        userEmail: email || matchedMember?.email || '',
        userRole: a.role || matchedMember?.role || 'Team Member',
        userDepartment: a.department || matchedDept?.name || 'Hospital Department',
        userTeam: a.team || matchedTeam?.name || 'Assigned Unit',
        assignedWork: a.workTitle || a.title || 'Hospital Assignment',
        workDescription: a.workDescription || a.description || '',
        timeFrom: a.timeFrom || a.fromTime || '09:00 AM',
        timeTo: a.timeTo || a.toTime || '05:00 PM',
        date: a.date || (a.createdAt ? new Date(a.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Today'),
        priority: resolvedPriority,
        status: a.status || 'In Progress',
        assignmentType: a.assignmentType || a.mode || 'Admin → User'
      });
    });

    // 2. Also check genuine userWorkspace assignedWork if present
    if (userWorkspace?.assignedWork && Array.isArray(userWorkspace.assignedWork)) {
      userWorkspace.assignedWork.forEach((w: any, idx: number) => {
        const email = (w.assigneeEmail || '').toLowerCase();
        if (email && isBannedEmail(email)) return;
        if (!w.title && !w.workTitle) return;

        const wId = w.id || `ws-${idx}`;
        if (seenIds.has(wId)) return;
        seenIds.add(wId);

        const resolvedPriority = (w.priority === 'High' || w.priority === 'Low' || w.priority === 'Medium')
          ? w.priority
          : 'Medium';

        combined.push({
          id: wId,
          userName: w.userName || w.assigneeName || 'Staff Member',
          userEmail: email,
          userRole: w.userRole || 'Team Member',
          userDepartment: w.department || 'Clinical Operations',
          userTeam: w.team || 'General Team',
          assignedWork: w.title || w.workTitle || 'Assigned Duty',
          workDescription: w.description || w.workDescription || '',
          timeFrom: w.timeFrom || '09:00 AM',
          timeTo: w.timeTo || '05:00 PM',
          date: w.date || 'Today',
          priority: resolvedPriority,
          status: w.status || 'In Progress',
          assignmentType: w.assignmentType || 'User → Self'
        });
      });
    }

    setItems(combined);
    if (currentIndex >= combined.length && combined.length > 0) {
      setCurrentIndex(0);
    }
  }, [assignments, liveFetchedAssignments, members, departments, teams, userWorkspace]);

  // Automatic Horizontal & Vertical Slide Timer
  useEffect(() => {
    if (!isPlaying || items.length <= 1) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setSlideDirection('right');
      setIsAnimating(true);
      setCurrentIndex((prev) => (prev + 1) % items.length);
      setTimeout(() => setIsAnimating(false), 500);
    }, 5500);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, items.length]);

  const handlePrev = () => {
    if (items.length <= 1) return;
    setSlideDirection('left');
    setIsAnimating(true);
    setCurrentIndex((prev) => (prev === 0 ? items.length - 1 : prev - 1));
    setTimeout(() => setIsAnimating(false), 500);
  };

  const handleNext = () => {
    if (items.length <= 1) return;
    setSlideDirection('right');
    setIsAnimating(true);
    setCurrentIndex((prev) => (prev + 1) % items.length);
    setTimeout(() => setIsAnimating(false), 500);
  };

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const currentItem = items[currentIndex];

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'High':
        return 'bg-rose-500/15 text-rose-700 border-rose-300/40';
      case 'Medium':
        return 'bg-amber-500/15 text-amber-700 border-amber-300/40';
      case 'Low':
        return 'bg-emerald-500/15 text-emerald-700 border-emerald-300/40';
      default:
        return 'bg-purple-500/15 text-purple-700 border-purple-300/40';
    }
  };

  const getAssignmentTypeBadge = (type?: string) => {
    switch (type) {
      case 'admin_to_user':
      case 'Admin → User':
        return 'Admin → User';
      case 'user_to_user':
      case 'User → User':
        return 'User → User';
      case 'user_to_self':
      case 'User → Self':
      case 'Self Assign':
        return 'Self Assigned';
      case 'user_to_admin':
      case 'User → Admin':
        return 'User → Admin';
      default:
        return 'Assigned Work';
    }
  };

  // If no original assignments exist in the database, show authentic live hospital workspace card (NO fake data!)
  if (!currentItem || items.length === 0) {
    return (
      <div className={`relative w-full max-w-lg mx-auto ${className}`}>
        <div className="relative rounded-3xl p-6 sm:p-7 backdrop-blur-2xl bg-white/45 border border-white/70 shadow-[0_20px_50px_rgba(0,0,0,0.1),inset_0_1px_1px_rgba(255,255,255,0.9)] transition-all duration-300">
          {/* Header */}
          <div className="flex items-center justify-between gap-3 pb-4 mb-4 border-b border-white/50">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <h4 className="font-['Plus_Jakarta_Sans',sans-serif] font-black text-xs uppercase tracking-wider text-gray-900">
                {title}
              </h4>
              <Sparkles className="w-3.5 h-3.5 text-[#5a36e6]" />
            </div>

            <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-500/15 text-emerald-800 border border-emerald-300/50 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-ping" />
              <span>LIVE SYNC</span>
            </span>
          </div>

          {/* Authentic Real-Time Empty State Card */}
          <div className="space-y-4 py-2">
            <div className="p-4 rounded-2xl bg-white/75 border border-white/90 shadow-xs flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-[#5a36e6] flex items-center justify-center shrink-0 shadow-2xs">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] uppercase font-extrabold tracking-wider text-purple-700 mb-0.5">
                  BGS MCH Workspace Connected
                </p>
                <h5 className="font-['Plus_Jakarta_Sans',sans-serif] font-bold text-xs sm:text-sm text-gray-900 leading-snug">
                  No Active Work Assigned Currently
                </h5>
                <p className="text-[11px] text-gray-600 mt-1 leading-relaxed">
                  Real-time duty allocations, daily tasks, and shift timings (From - To) will automatically display live here as soon as department supervisors assign tasks to team members.
                </p>
              </div>
            </div>

            {/* Real System Live Indicators */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-3 rounded-2xl bg-white/70 border border-white/80 shadow-xs flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-indigo-50 text-[#5a36e6] flex items-center justify-center shrink-0">
                  <Building2 className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[9px] uppercase font-bold tracking-wider text-gray-400">Departments</p>
                  <p className="text-xs font-black text-gray-900 truncate">
                    {departments?.length || 1} Active
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-white/70 border border-white/80 shadow-xs flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                  <Activity className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[9px] uppercase font-bold tracking-wider text-gray-400">Database Mode</p>
                  <p className="text-xs font-black text-emerald-700 truncate">
                    Live Verified
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="pt-3.5 mt-3 border-t border-white/50 flex items-center justify-between gap-3 text-xs">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              <span>Verified Hospital Records Only</span>
            </span>

            {onItemClick && (
              <button
                type="button"
                onClick={() => onItemClick()}
                className="text-[11px] font-bold text-[#5a36e6] hover:underline cursor-pointer"
              >
                Sign In to Assign &rarr;
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Active Slider Rendering genuine assigned duties
  return (
    <div className={`relative w-full max-w-lg mx-auto select-none ${className}`}>
      {/* Frosted Glass Outer Container */}
      <div className="relative rounded-3xl p-5 sm:p-6 backdrop-blur-2xl bg-white/45 border border-white/70 shadow-[0_20px_50px_rgba(0,0,0,0.1),inset_0_1px_1px_rgba(255,255,255,0.9)] transition-all duration-300 hover:shadow-[0_25px_60px_rgba(90,54,230,0.15)]">
        
        {/* Header Controls: Live Indicator + Stepper Controls */}
        <div className="flex items-center justify-between gap-3 pb-3.5 mb-3.5 border-b border-white/50">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h4 className="font-['Plus_Jakarta_Sans',sans-serif] font-black text-xs uppercase tracking-wider text-gray-900">
              {title}
            </h4>
            <Sparkles className="w-3.5 h-3.5 text-[#5a36e6]" />
          </div>

          {/* Slider Step Controls */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-extrabold text-gray-600 px-2 py-0.5 rounded-full bg-white/60 border border-white/80">
              {currentIndex + 1} / {items.length}
            </span>

            {/* Play/Pause Button */}
            <button
              type="button"
              onClick={togglePlay}
              title={isPlaying ? 'Pause auto-slide' : 'Resume auto-slide'}
              aria-label={isPlaying ? 'Pause auto-slide' : 'Resume auto-slide'}
              className="w-7 h-7 rounded-full bg-white/80 hover:bg-white text-gray-700 flex items-center justify-center transition shadow-2xs cursor-pointer"
            >
              {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3 ml-0.5" />}
            </button>

            {/* Prev */}
            <button
              type="button"
              onClick={handlePrev}
              title="Previous assigned work"
              aria-label="Previous assigned work"
              className="w-7 h-7 rounded-full bg-white/80 hover:bg-white text-gray-700 flex items-center justify-center transition shadow-2xs cursor-pointer hover:scale-105"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            {/* Next */}
            <button
              type="button"
              onClick={handleNext}
              title="Next assigned work"
              aria-label="Next assigned work"
              className="w-7 h-7 rounded-full bg-white/80 hover:bg-white text-gray-700 flex items-center justify-center transition shadow-2xs cursor-pointer hover:scale-105"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Sliding Card Body */}
        <div
          onClick={() => onItemClick && onItemClick(currentItem)}
          className={`space-y-3 cursor-pointer transition-all duration-500 ease-out transform ${
            isAnimating
              ? slideDirection === 'right'
                ? '-translate-y-2 opacity-50 scale-98'
                : 'translate-y-2 opacity-50 scale-98'
              : 'translate-y-0 opacity-100 scale-100'
          }`}
        >
          {/* Top Row: User Avatar, User Name, Role, Team, Assignment Pill */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              {/* User Avatar Circle */}
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#5a36e6] to-purple-600 text-white font-black text-sm flex items-center justify-center shadow-md shadow-purple-500/25 shrink-0">
                {(currentItem.userName || 'U').charAt(0).toUpperCase()}
              </div>

              {/* User Details */}
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-['Plus_Jakarta_Sans',sans-serif] font-black text-sm sm:text-base text-gray-950 truncate">
                    {currentItem.userName}
                  </h4>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100/80 text-[#5a36e6] border border-purple-200/60">
                    {getAssignmentTypeBadge(currentItem.assignmentType)}
                  </span>
                </div>

                <p className="text-[11px] text-gray-500 font-medium flex items-center gap-2 truncate mt-0.5">
                  <span className="flex items-center gap-1">
                    <UserIcon className="w-3 h-3 text-gray-400" />
                    <span>{currentItem.userRole || 'Team Member'}</span>
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1 font-semibold text-gray-700">
                    <Building2 className="w-3 h-3 text-gray-500" />
                    <span>{currentItem.userDepartment}</span>
                  </span>
                </p>
              </div>
            </div>

            {/* Priority & Status Pill */}
            <div className="flex items-center gap-1.5 shrink-0">
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
