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
  Menu
} from 'lucide-react';

interface LandingPageProps {
  onLogin: () => void;
  onAssignWork: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onLogin, onAssignWork }) => {
  const [departmentDropdownOpen, setDepartmentDropdownOpen] = useState(false);
  const [selectedDeptInfo, setSelectedDeptInfo] = useState<{ title: string; desc: string; icon: any } | null>(null);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
    <div className="min-h-screen bg-gradient-to-br from-[#faf7fd] via-[#f4edfd] to-[#ede3fb] text-gray-900 font-sans selection:bg-[#5a36e6] selection:text-white flex flex-col justify-between overflow-x-hidden">
      {/* ---------------- TOP NAVIGATION BAR ---------------- */}
      <header className="w-full bg-white/90 backdrop-blur-md border-b border-gray-100/80 sticky top-0 z-50 transition-all">
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

            <button
              onClick={onAssignWork}
              className="px-4 sm:px-5 py-2 rounded-full bg-[#5a36e6] hover:bg-[#4b28c7] text-white font-semibold text-xs sm:text-sm shadow-md shadow-purple-600/25 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <span>Assign Work</span>
              <ArrowRight className="w-4 h-4" />
            </button>

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
                    onAssignWork();
                  }}
                  className="flex-1 py-2.5 rounded-full bg-[#5a36e6] text-white font-semibold text-xs text-center flex items-center justify-center gap-1.5 cursor-pointer hover:bg-[#4b28c7]"
                >
                  <span>Assign Work</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* ---------------- HERO SECTION (Matching Screenshot 1) ---------------- */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-16 flex flex-col justify-center w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Left Hero Details */}
          <div className="lg:col-span-7 flex flex-col justify-center">
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
                className="p-3.5 rounded-2xl bg-white/70 backdrop-blur-sm border border-purple-100/60 shadow-xs hover:shadow-md hover:bg-white transition-all cursor-pointer group"
              >
                <div className="w-10 h-10 rounded-xl bg-purple-100 text-[#5a36e6] flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform">
                  <Users className="w-5 h-5" />
                </div>
                <h4 className="text-xs font-bold text-gray-900 group-hover:text-[#5a36e6] transition-colors leading-snug">
                  Team Management
                </h4>
              </div>

              {/* Feature 2: Work Assignment */}
              <div 
                onClick={onAssignWork}
                className="p-3.5 rounded-2xl bg-white/70 backdrop-blur-sm border border-purple-100/60 shadow-xs hover:shadow-md hover:bg-white transition-all cursor-pointer group"
              >
                <div className="w-10 h-10 rounded-xl bg-purple-100 text-[#5a36e6] flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform">
                  <ClipboardCheck className="w-5 h-5" />
                </div>
                <h4 className="text-xs font-bold text-gray-900 group-hover:text-[#5a36e6] transition-colors leading-snug">
                  Work Assignment
                </h4>
              </div>

              {/* Feature 3: Appointment Scheduling */}
              <div 
                onClick={onLogin}
                className="p-3.5 rounded-2xl bg-white/70 backdrop-blur-sm border border-purple-100/60 shadow-xs hover:shadow-md hover:bg-white transition-all cursor-pointer group"
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
                className="p-3.5 rounded-2xl bg-white/70 backdrop-blur-sm border border-purple-100/60 shadow-xs hover:shadow-md hover:bg-white transition-all cursor-pointer group"
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

          {/* Right Hero Graphic: Modern Workspace Living Interior */}
          <div className="lg:col-span-5 relative flex items-center justify-center lg:justify-end">
            <div className="relative w-full max-w-lg lg:max-w-none h-[380px] sm:h-[480px] lg:h-[560px] rounded-3xl overflow-hidden shadow-xl border border-white/70 bg-[#ede4fa]/30 flex items-center justify-end">
              <img 
                src="/hero-interior.jpg" 
                alt="WorkHub Modern Team Workspace" 
                className="w-full h-full object-cover object-right"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-purple-950/5 via-transparent to-transparent pointer-events-none" />
            </div>
          </div>
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
    </div>
  );
};

