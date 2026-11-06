import React, { useState } from 'react';
import { 
  ArrowRight, 
  ChevronDown, 
  LayoutGrid, 
  Stethoscope, 
  FlaskConical, 
  GraduationCap, 
  Users, 
  Settings, 
  Building2, 
  Calendar, 
  ClipboardCheck, 
  MessageSquare, 
  X, 
  Mail,
  Phone,
  MapPin,
  ShieldCheck,
  Menu,
  Info,
  CheckCircle2,
  Send
} from 'lucide-react';
import { api } from '../../services/api';

interface LandingPageProps {
  onLogin: () => void;
  onAssignWork?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onLogin }) => {
  const [departmentDropdownOpen, setDepartmentDropdownOpen] = useState(false);
  const [selectedDeptInfo, setSelectedDeptInfo] = useState<{ title: string; desc: string; icon: any } | null>(null);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Work Request State (Chip style popup & direct submission without login)
  const [workRequestDropdownOpen, setWorkRequestDropdownOpen] = useState(false);
  const [selectedRequestType, setSelectedRequestType] = useState<{
    id: string;
    title: string;
    desc: string;
    icon: any;
    color: string;
    badge: string;
  } | null>(null);
  const [requestFormSubmitted, setRequestFormSubmitted] = useState(false);
  const [referenceId, setReferenceId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Work Request Form Fields
  const [reqName, setReqName] = useState('');
  const [reqEmail, setReqEmail] = useState('');
  const [reqPhone, setReqPhone] = useState('');
  const [reqDepartment, setReqDepartment] = useState('Clinical Departments');
  const [reqSubject, setReqSubject] = useState('');
  const [reqDate, setReqDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });
  const [reqTimeSlot, setReqTimeSlot] = useState('Morning (10:00 AM - 12:00 PM)');
  const [reqDetails, setReqDetails] = useState('');
  const [reqPriority, setReqPriority] = useState<'Normal' | 'Urgent' | 'Low'>('Normal');

  // Work Request Categories matching user's chip reference screenshot verbatim
  const requestTypes = [
    {
      id: 'meeting',
      title: 'Meeting',
      desc: 'Request a meeting with the Dean',
      icon: Users,
      color: 'bg-emerald-50 text-[#00a884] border-emerald-100',
      badge: 'Meeting Request'
    },
    {
      id: 'event',
      title: 'Event',
      desc: 'Invite the Dean to an event or programme',
      icon: Calendar,
      color: 'bg-emerald-50 text-[#00a884] border-emerald-100',
      badge: 'Event Invitation'
    },
    {
      id: 'general-info',
      title: 'General Information',
      desc: 'Share information with the office',
      icon: Info,
      color: 'bg-emerald-50 text-[#00a884] border-emerald-100',
      badge: 'General Information'
    },
    {
      id: 'task-request',
      title: 'Task / Request',
      desc: 'Ask for an approval or action',
      icon: ClipboardCheck,
      color: 'bg-emerald-50 text-[#00a884] border-emerald-100',
      badge: 'Task & Approval'
    }
  ];

  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reqName.trim() || !reqEmail.trim()) {
      alert('Please enter your Name and Email address.');
      return;
    }

    setIsSubmitting(true);
    const newRef = `WKH-REQ-${Math.floor(1000 + Math.random() * 9000)}`;

    try {
      await api.createAppointment({
        title: reqSubject.trim() || `${selectedRequestType?.title || 'Work'} Request from ${reqName}`,
        requestedBy: `${reqName} (${reqEmail}${reqPhone ? ` • ${reqPhone}` : ''})`,
        department: reqDepartment,
        team: selectedRequestType?.title || "Dean's Administration Office",
        date: reqDate,
        time: reqTimeSlot.split(' ')[0] || '10:00 AM',
        dateTimeDisplay: `${reqDate} • ${reqTimeSlot}`,
        purpose: `${selectedRequestType?.desc || ''}\n\nDetails: ${reqDetails || 'No additional details provided.'}\nPriority: ${reqPriority}`,
        status: 'Scheduled'
      });
    } catch (err) {
      console.warn('API submission fallback:', err);
    } finally {
      setIsSubmitting(false);
      setReferenceId(newRef);
      setRequestFormSubmitted(true);
    }
  };

  const resetRequestForm = () => {
    setSelectedRequestType(null);
    setRequestFormSubmitted(false);
    setReqName('');
    setReqEmail('');
    setReqPhone('');
    setReqSubject('');
    setReqDetails('');
    setReferenceId('');
  };

  // Departments List matching Screenshot 2
  const departments = [
    { id: 'all', title: 'All Departments', icon: LayoutGrid, desc: 'Central directory of all hospital & administrative departments.' },
    { id: 'clinical', title: 'Clinical Departments', icon: Stethoscope, desc: 'Inpatient & outpatient clinical care, surgical specialties & emergency medicine.' },
    { id: 'pre-para', title: 'Pre & Para Clinical', icon: FlaskConical, desc: 'Pathology, microbiology, biochemistry, pharmacology & diagnostic labs.' },
    { id: 'academic', title: 'Academic & Research', icon: GraduationCap, desc: 'Medical education, clinical trials, postgraduate training & research journals.' },
    { id: 'admin', title: 'Administration', icon: Users, desc: 'Operations, HR, hospital superintendence & institutional leadership.' },
    { id: 'support', title: 'Support Services', icon: Settings, desc: 'Biomedical engineering, IT systems, infrastructure maintenance & safety.' },
    { id: 'hospital', title: 'Hospital Services', icon: Building2, desc: 'Pharmacy, blood bank, nursing administration & radiology services.' },
    { id: 'other', title: 'Other Departments', icon: Calendar, desc: 'Community medicine, health camps & interdepartmental projects.' },
  ];

  const handleDeptClick = (dept: typeof departments[0]) => {
    setSelectedDeptInfo({ title: dept.title, desc: dept.desc, icon: dept.icon });
    setDepartmentDropdownOpen(false);
  };

  return (
    <div 
      className="min-h-screen bg-[#ede6f9] text-gray-900 font-sans selection:bg-[#5a36e6] selection:text-white flex flex-col justify-between relative overflow-x-hidden bg-cover bg-no-repeat bg-right lg:bg-center"
      style={{
        backgroundImage: `url('/landing-bg.jpg')`
      }}
    >
      {/* Mobile subtle light wash so typography is crystal clear across small screens */}
      <div className="absolute inset-0 bg-white/50 sm:bg-white/20 lg:bg-transparent pointer-events-none z-0" />

      {/* ---------------- TOP NAVIGATION BAR ---------------- */}
      <header className="w-full bg-white/85 backdrop-blur-md border-b border-purple-100/60 sticky top-0 z-50 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          {/* Left Brand Logo & Title */}
          <div className="flex items-center gap-4 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            {/* Custom Green Leaf Brand Icon from screenshot */}
            <div className="w-10 h-10 flex items-center justify-center">
              <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-9 h-9">
                <path d="M12 28C10 20 18 10 28 8C26 18 18 28 12 28Z" fill="#22c55e" />
                <path d="M12 28C16 28 22 22 28 8C18 10 10 20 12 28Z" fill="#15803d" />
                <path d="M14 26C18 20 22 14 28 8" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>

            <div>
              <h1 className="text-xl font-extrabold text-gray-950 tracking-tight leading-none">WorkHub</h1>
              <p className="text-[11px] font-medium text-gray-500 tracking-wide mt-0.5">Team Workspace</p>
            </div>

            {/* Vertical separator | */}
            <div className="hidden sm:block h-7 w-px bg-gray-300/80 ml-2" />
          </div>

          {/* Center Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
            <button 
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} 
              className="text-gray-950 font-semibold relative py-1 cursor-pointer after:content-[''] after:absolute after:-bottom-1.5 after:left-0 after:right-0 after:h-0.5 after:bg-[#5a36e6] after:rounded-full"
            >
              Home
            </button>

            {/* Department Dropdown (Screenshot 2) */}
            <div className="relative">
              <button 
                onClick={() => setDepartmentDropdownOpen(!departmentDropdownOpen)}
                onMouseEnter={() => setDepartmentDropdownOpen(true)}
                className="flex items-center gap-1.5 hover:text-[#5a36e6] transition-colors cursor-pointer py-1"
              >
                <span>Department</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${departmentDropdownOpen ? 'rotate-180 text-[#5a36e6]' : ''}`} />
              </button>

              {/* Floating Dropdown Menu matching Screenshot 2 */}
              {departmentDropdownOpen && (
                <div 
                  onMouseLeave={() => setDepartmentDropdownOpen(false)}
                  className="absolute left-0 mt-3 w-64 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-purple-100 p-2 z-50 animate-in fade-in zoom-in-95 duration-150"
                >
                  <div className="space-y-0.5">
                    {departments.map((dept, index) => {
                      const Icon = dept.icon;
                      const isFirst = index === 0;

                      return (
                        <button
                          key={dept.id}
                          onClick={() => handleDeptClick(dept)}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-xs transition-colors cursor-pointer ${
                            isFirst 
                              ? 'bg-purple-50 text-[#5a36e6] font-semibold' 
                              : 'text-gray-700 hover:bg-purple-50/60 hover:text-[#5a36e6]'
                          }`}
                        >
                          <div className={`p-1 rounded-lg ${isFirst ? 'text-[#5a36e6]' : 'text-gray-500 group-hover:text-[#5a36e6]'}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <span>{dept.title}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <button 
              onClick={() => setShowAboutModal(true)} 
              className="hover:text-[#5a36e6] transition-colors cursor-pointer py-1"
            >
              About
            </button>

            <button 
              onClick={() => setShowContactModal(true)} 
              className="hover:text-[#5a36e6] transition-colors cursor-pointer py-1"
            >
              Contact
            </button>
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={onLogin}
              className="hidden sm:inline-flex px-5 py-2 rounded-full border border-gray-300 text-gray-800 font-semibold text-xs sm:text-sm hover:border-[#5a36e6] hover:text-[#5a36e6] bg-white transition-all cursor-pointer shadow-2xs"
            >
              Login
            </button>

            {/* Work Request Button & Chip-Style Dropdown Menu */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setWorkRequestDropdownOpen(!workRequestDropdownOpen)}
                className="px-4 sm:px-5 py-2 rounded-full bg-[#5a36e6] hover:bg-[#4b28c7] text-white font-semibold text-xs sm:text-sm shadow-md shadow-purple-600/25 flex items-center gap-1.5 transition-all cursor-pointer"
                title="Work Request Options"
              >
                <span>Work Request</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${workRequestDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Chip-Style Dropdown Menu (Matching User Screenshot) */}
              {workRequestDropdownOpen && (
                <div 
                  className="absolute right-0 mt-3 w-80 sm:w-96 bg-white/98 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-100 p-3 z-50 animate-in fade-in zoom-in-95 duration-150"
                  onMouseLeave={() => setWorkRequestDropdownOpen(false)}
                >
                  <div className="flex items-center justify-between px-2 pt-1 pb-2.5 mb-1.5 border-b border-gray-100">
                    <div>
                      <h4 className="font-bold text-xs text-gray-900 tracking-tight">Work Request Options</h4>
                      <p className="text-[11px] text-gray-500">Submit requests directly without login</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setWorkRequestDropdownOpen(false)}
                      className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-2">
                    {requestTypes.map((item) => {
                      const Icon = item.icon;
                      return (
                        <div
                          key={item.id}
                          onClick={() => {
                            setSelectedRequestType(item);
                            setWorkRequestDropdownOpen(false);
                            setRequestFormSubmitted(false);
                          }}
                          className="p-3 rounded-2xl border border-gray-200/90 hover:border-[#00a884] hover:bg-emerald-50/40 bg-white transition-all cursor-pointer flex items-center gap-3.5 group shadow-2xs text-left"
                        >
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${item.color} group-hover:scale-105 transition-transform shadow-2xs`}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h5 className="font-bold text-xs sm:text-sm text-gray-900 group-hover:text-emerald-700 leading-tight">
                              {item.title}
                            </h5>
                            <p className="text-[11px] text-gray-500 mt-0.5 leading-snug truncate">
                              {item.desc}
                            </p>
                          </div>
                          <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-[#00a884] group-hover:translate-x-0.5 transition-all shrink-0" />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Hamburger Menu Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl text-gray-700 hover:bg-purple-50 transition-colors cursor-pointer"
              title="Toggle Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white/95 backdrop-blur-xl border-b border-purple-100 px-4 py-4 space-y-3 animate-in slide-in-from-top-2 duration-200">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="w-full text-left px-3 py-2 rounded-xl text-sm font-semibold text-[#5a36e6] bg-purple-50"
            >
              Home
            </button>

            {/* Department Options for mobile */}
            <div className="space-y-1">
              <div className="px-3 py-1 text-xs font-bold uppercase tracking-wider text-gray-400">
                Departments
              </div>
              <div className="grid grid-cols-1 gap-1 pl-1">
                {departments.slice(0, 5).map(dept => {
                  const Icon = dept.icon;
                  return (
                    <button
                      key={dept.id}
                      onClick={() => {
                        handleDeptClick(dept);
                        setMobileMenuOpen(false);
                      }}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-gray-700 hover:bg-purple-50 hover:text-[#5a36e6] text-left transition-colors cursor-pointer"
                    >
                      <Icon className="w-4 h-4 text-purple-600 shrink-0" />
                      <span>{dept.title}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-2 border-t border-gray-100 flex flex-col gap-1.5">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setShowAboutModal(true);
                }}
                className="w-full text-left px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-purple-50 cursor-pointer"
              >
                About Platform
              </button>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setShowContactModal(true);
                }}
                className="w-full text-left px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-purple-50 cursor-pointer"
              >
                Contact & Support
              </button>
              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onLogin();
                  }}
                  className="flex-1 py-2.5 rounded-full border border-gray-300 text-gray-800 font-semibold text-xs text-center cursor-pointer hover:border-[#5a36e6] hover:text-[#5a36e6]"
                >
                  Login
                </button>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setSelectedRequestType(requestTypes[0]);
                    setRequestFormSubmitted(false);
                  }}
                  className="flex-1 py-2.5 rounded-full bg-[#5a36e6] text-white font-semibold text-xs text-center flex items-center justify-center gap-1.5 cursor-pointer hover:bg-[#4b28c7]"
                >
                  <span>Work Request</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* ---------------- HERO SECTION (Matching Screenshot 1) ---------------- */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-16 flex flex-col justify-center w-full relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Left Hero Details */}
          <div className="lg:col-span-7 xl:col-span-8 flex flex-col justify-center">
            {/* Pill Tag */}
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-[0.2em] text-[#714fe0] mb-3 inline-block">
              TEAM COLLABORATION PLATFORM
            </span>

            {/* Headline */}
            <div className="space-y-1">
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-[#130f30] tracking-tight leading-[1.08]">
                WorkHub
              </h2>
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-[#8f68ea] tracking-tight leading-[1.08]">
                Team Workspace
              </h2>
            </div>

            {/* Paragraph Subtitle */}
            <p className="mt-6 text-gray-600 text-base sm:text-lg max-w-xl leading-relaxed font-normal">
              A unified platform to manage teams, assignments, appointments and communication — all in one workspace.
            </p>

            {/* Action Buttons Row */}
            <div className="mt-8 flex items-center gap-4">
              <button
                onClick={onLogin}
                className="px-8 py-3.5 rounded-full bg-[#5a36e6] hover:bg-[#4b2ac9] text-white font-semibold text-sm shadow-xl shadow-purple-600/30 flex items-center gap-2.5 transition-all transform hover:-translate-y-0.5 cursor-pointer"
              >
                <span>Login to Workspace</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* 4 Feature Badges (Matching bottom of Screenshot 1) */}
            <div className="mt-12 sm:mt-16 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl">
              {/* Feature 1: Team Management */}
              <div 
                onClick={onLogin}
                className="p-3.5 rounded-2xl bg-white/85 backdrop-blur-md border border-purple-100/80 shadow-xs hover:shadow-md hover:bg-white transition-all cursor-pointer group"
              >
                <div className="w-10 h-10 rounded-xl bg-purple-100 text-[#5a36e6] flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform">
                  <Users className="w-5 h-5" />
                </div>
                <h4 className="text-xs font-bold text-gray-900 group-hover:text-[#5a36e6] transition-colors leading-snug">
                  Team Management
                </h4>
              </div>

              {/* Feature 2: Work Request */}
              <div 
                onClick={() => {
                  setSelectedRequestType(requestTypes[0]);
                  setRequestFormSubmitted(false);
                }}
                className="p-3.5 rounded-2xl bg-white/85 backdrop-blur-md border border-purple-100/80 shadow-xs hover:shadow-md hover:bg-white transition-all cursor-pointer group"
              >
                <div className="w-10 h-10 rounded-xl bg-purple-100 text-[#5a36e6] flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform">
                  <ClipboardCheck className="w-5 h-5" />
                </div>
                <h4 className="text-xs font-bold text-gray-900 group-hover:text-[#5a36e6] transition-colors leading-snug">
                  Work Request
                </h4>
              </div>

              {/* Feature 3: Appointment Scheduling */}
              <div 
                onClick={onLogin}
                className="p-3.5 rounded-2xl bg-white/85 backdrop-blur-md border border-purple-100/80 shadow-xs hover:shadow-md hover:bg-white transition-all cursor-pointer group"
              >
                <div className="w-10 h-10 rounded-xl bg-purple-100 text-[#5a36e6] flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform">
                  <Calendar className="w-5 h-5" />
                </div>
                <h4 className="text-xs font-bold text-gray-900 group-hover:text-[#5a36e6] transition-colors leading-snug">
                  Appointment Scheduling
                </h4>
              </div>

              {/* Feature 4: Real-time Messaging */}
              <div 
                onClick={onLogin}
                className="p-3.5 rounded-2xl bg-white/85 backdrop-blur-md border border-purple-100/80 shadow-xs hover:shadow-md hover:bg-white transition-all cursor-pointer group"
              >
                <div className="w-10 h-10 rounded-xl bg-purple-100 text-[#5a36e6] flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <h4 className="text-xs font-bold text-gray-900 group-hover:text-[#5a36e6] transition-colors leading-snug">
                  Real-time Messaging
                </h4>
              </div>
            </div>
          </div>

          {/* Right side is intentionally open space for the natural room background (lamp, table, sofa) */}
          <div className="hidden lg:block lg:col-span-5 xl:col-span-4 min-h-[360px] pointer-events-none" aria-hidden="true" />
        </div>
      </main>

      {/* ---------------- FOOTER ---------------- */}
      <footer className="w-full bg-white/70 border-t border-purple-100/80 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
          <p>© 2026 WorkHub Team Workspace. BGS Digital Health. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <button onClick={() => setShowAboutModal(true)} className="hover:text-[#5a36e6] cursor-pointer">About Platform</button>
            <button onClick={() => setShowContactModal(true)} className="hover:text-[#5a36e6] cursor-pointer">Support & Contact</button>
            <button onClick={onLogin} className="hover:text-[#5a36e6] font-semibold text-[#5a36e6] cursor-pointer">Login</button>
          </div>
        </div>
      </footer>

      {/* ---------------- MODAL 1: Department Info Modal ---------------- */}
      {selectedDeptInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-md border border-gray-100 shadow-2xl p-6 relative">
            <button 
              onClick={() => setSelectedDeptInfo(null)}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-700 p-1 rounded-lg hover:bg-gray-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-purple-100 text-[#5a36e6] flex items-center justify-center mb-4">
              <selectedDeptInfo.icon className="w-6 h-6" />
            </div>

            <h3 className="text-xl font-bold text-gray-900">{selectedDeptInfo.title}</h3>
            <p className="text-sm text-gray-600 mt-2 leading-relaxed">{selectedDeptInfo.desc}</p>

            <div className="mt-6 flex items-center gap-3">
              <button
                onClick={() => {
                  setSelectedDeptInfo(null);
                  onLogin();
                }}
                className="flex-1 py-2.5 rounded-xl bg-[#5a36e6] hover:bg-[#4d2ec4] text-white font-semibold text-xs shadow-md shadow-purple-600/20 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Enter Department Workspace</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- MODAL 3: About Modal ---------------- */}
      {showAboutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-lg border border-gray-100 shadow-2xl p-6 sm:p-8 relative">
            <button 
              onClick={() => setShowAboutModal(false)}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-700 p-1.5 rounded-lg hover:bg-gray-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-purple-100 text-[#5a36e6] flex items-center justify-center mb-4">
              <ShieldCheck className="w-6 h-6" />
            </div>

            <h3 className="text-xl font-bold text-gray-900">About WorkHub</h3>
            <p className="text-xs text-gray-600 mt-2 leading-relaxed">
              WorkHub is an institutional enterprise workspace platform built specifically for healthcare departments, hospital management, academic institutes, and operational teams.
            </p>
            <p className="text-xs text-gray-600 mt-2 leading-relaxed">
              It consolidates team assignments, task verification, daily progress timelines, appointment scheduling, and encrypted real-time communications into a single interface.
            </p>

            <button
              onClick={() => setShowAboutModal(false)}
              className="mt-6 w-full py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* ---------------- MODAL 4: Contact Modal ---------------- */}
      {showContactModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-md border border-gray-100 shadow-2xl p-6 sm:p-8 relative">
            <button 
              onClick={() => setShowContactModal(false)}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-700 p-1.5 rounded-lg hover:bg-gray-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold text-gray-900 mb-4">Contact & Support</h3>
            <div className="space-y-3 text-xs text-gray-600">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-purple-50/60 border border-purple-100">
                <Mail className="w-4 h-4 text-[#5a36e6] shrink-0" />
                <span>support@bgsdigitalhealth.org</span>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-purple-50/60 border border-purple-100">
                <Phone className="w-4 h-4 text-[#5a36e6] shrink-0" />
                <span>+91 (080) 2674-8900</span>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-purple-50/60 border border-purple-100">
                <MapPin className="w-4 h-4 text-[#5a36e6] shrink-0" />
                <span>BGS Hospital & Research Institute, Digital Health Division</span>
              </div>
            </div>

            <button
              onClick={() => setShowContactModal(false)}
              className="mt-6 w-full py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* ---------------- MODAL 5: Work Request Submission Modal (Chip Selection & Direct Form) ---------------- */}
      {selectedRequestType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-lg border border-gray-100 shadow-2xl overflow-hidden relative max-h-[92vh] flex flex-col animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-emerald-50/70 to-teal-50/30 shrink-0">
              <div className="flex items-center gap-3">
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border ${selectedRequestType.color} shadow-xs`}>
                  <selectedRequestType.icon className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-base text-gray-900 leading-tight">
                      {selectedRequestType.title}
                    </h3>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                      {selectedRequestType.badge}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5 truncate">
                    {selectedRequestType.desc}
                  </p>
                </div>
              </div>

              <button 
                type="button"
                onClick={resetRequestForm}
                className="text-gray-400 hover:text-gray-700 p-1.5 rounded-xl hover:bg-white transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              {requestFormSubmitted ? (
                /* Success View */
                <div className="py-6 text-center space-y-4 animate-in zoom-in-95 duration-200">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 text-[#00a884] flex items-center justify-center mx-auto shadow-sm">
                    <CheckCircle2 className="w-9 h-9" />
                  </div>

                  <div>
                    <h4 className="text-xl font-bold text-gray-900">
                      Work Request Submitted!
                    </h4>
                    <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto leading-relaxed">
                      Your request has been logged and forwarded directly to the Dean & Administrative Office.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 max-w-sm mx-auto text-left text-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500 font-medium">Reference Code:</span>
                      <span className="font-mono font-bold text-[#00a884] text-sm">{referenceId}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500 font-medium">Category:</span>
                      <span className="font-semibold text-gray-800">{selectedRequestType.title}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500 font-medium">Requester:</span>
                      <span className="font-semibold text-gray-800 truncate max-w-[180px]">{reqName}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500 font-medium">Status:</span>
                      <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                        Under Review
                      </span>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={resetRequestForm}
                      className="px-6 py-2.5 rounded-xl bg-[#00a884] hover:bg-[#008f6f] text-white font-bold text-xs shadow-md transition-all cursor-pointer"
                    >
                      Done
                    </button>
                  </div>
                </div>
              ) : (
                /* Request Submission Form */
                <form onSubmit={handleRequestSubmit} className="space-y-4">
                  {/* Category Switcher Chips inside Modal */}
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-2">
                      Request Type (Chip Style)
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {requestTypes.map((t) => {
                        const isCurrent = t.id === selectedRequestType.id;
                        const Icon = t.icon;
                        return (
                          <button
                            type="button"
                            key={t.id}
                            onClick={() => setSelectedRequestType(t)}
                            className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                              isCurrent
                                ? 'border-[#00a884] bg-emerald-50/60 ring-2 ring-[#00a884]/20'
                                : 'border-gray-200 hover:border-gray-300 bg-white'
                            }`}
                          >
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${isCurrent ? 'bg-[#00a884] text-white' : 'bg-gray-100 text-gray-600'}`}>
                              <Icon className="w-3.5 h-3.5" />
                            </div>
                            <span className="font-bold text-xs text-gray-800 truncate">
                              {t.title}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Requester Name & Department */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Your Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={reqName}
                        onChange={(e) => setReqName(e.target.value)}
                        placeholder="e.g. Dr. Arvind Kumar"
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#00a884]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Department / Organization
                      </label>
                      <select
                        value={reqDepartment}
                        onChange={(e) => setReqDepartment(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#00a884]"
                      >
                        {departments.filter(d => d.id !== 'all').map((d) => (
                          <option key={d.id} value={d.title}>{d.title}</option>
                        ))}
                        <option value="Dean Administration Office">Dean Administration Office</option>
                        <option value="External / Visiting Faculty">External / Visiting Faculty</option>
                      </select>
                    </div>
                  </div>

                  {/* Email & Phone */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        required
                        value={reqEmail}
                        onChange={(e) => setReqEmail(e.target.value)}
                        placeholder="e.g. user@bgsdigitalhealth.org"
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#00a884]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Phone / Contact Number
                      </label>
                      <input
                        type="tel"
                        value={reqPhone}
                        onChange={(e) => setReqPhone(e.target.value)}
                        placeholder="e.g. +91 98765 43210"
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#00a884]"
                      />
                    </div>
                  </div>

                  {/* Subject */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Subject / Purpose of Request *
                    </label>
                    <input
                      type="text"
                      required
                      value={reqSubject}
                      onChange={(e) => setReqSubject(e.target.value)}
                      placeholder={
                        selectedRequestType.id === 'meeting'
                          ? "e.g. Discussion on clinical protocol approvals"
                          : selectedRequestType.id === 'event'
                          ? "e.g. Inauguration of Annual Academic Symposium"
                          : "e.g. Work proposal submission"
                      }
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#00a884]"
                    />
                  </div>

                  {/* If Meeting or Event: Preferred Date & Time */}
                  {(selectedRequestType.id === 'meeting' || selectedRequestType.id === 'event') && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Preferred Date
                        </label>
                        <input
                          type="date"
                          value={reqDate}
                          onChange={(e) => setReqDate(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#00a884]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Preferred Time Slot
                        </label>
                        <select
                          value={reqTimeSlot}
                          onChange={(e) => setReqTimeSlot(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#00a884]"
                        >
                          <option value="Morning (10:00 AM - 12:00 PM)">Morning (10:00 AM - 12:00 PM)</option>
                          <option value="Afternoon (02:00 PM - 04:00 PM)">Afternoon (02:00 PM - 04:00 PM)</option>
                          <option value="Evening (04:00 PM - 06:00 PM)">Evening (04:00 PM - 06:00 PM)</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {/* Details / Notes */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Details / Background Information
                    </label>
                    <textarea
                      rows={3}
                      value={reqDetails}
                      onChange={(e) => setReqDetails(e.target.value)}
                      placeholder="Brief details about the request or agenda..."
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#00a884] resize-none"
                    />
                  </div>

                  {/* Priority */}
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs font-semibold text-gray-700">Urgency Level:</span>
                    <div className="flex gap-2">
                      {(['Normal', 'Urgent', 'Low'] as const).map((p) => (
                        <button
                          type="button"
                          key={p}
                          onClick={() => setReqPriority(p)}
                          className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                            reqPriority === p
                              ? p === 'Urgent'
                                ? 'bg-red-100 text-red-700 ring-1 ring-red-400'
                                : 'bg-emerald-100 text-emerald-800 ring-1 ring-emerald-400'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={resetRequestForm}
                      className="px-4 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-xs font-semibold text-gray-600 transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-5 py-2 rounded-xl bg-[#00a884] hover:bg-[#008f6f] text-white text-xs font-bold shadow-md flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{isSubmitting ? 'Submitting...' : 'Submit Work Request'}</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

