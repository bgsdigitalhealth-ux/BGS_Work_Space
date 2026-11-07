import React, { useState } from 'react';
import { Lock, Mail, ArrowRight, Eye, EyeOff, KeyRound, CheckCircle2, ArrowLeft, ShieldCheck, Video, Users } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const LoginPage: React.FC<{ onBack?: () => void }> = ({ onBack }) => {
  const { login, createPassword } = useApp();
  const [mode, setMode] = useState<'login' | 'create_password'>('login');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [infoMessage, setInfoMessage] = useState('');

  // Handle standard login
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setInfoMessage('');
    setLoading(true);

    const res = await login(email, password);
    setLoading(false);

    if (res.requiresPasswordSetup) {
      setMode('create_password');
      setInfoMessage(`Welcome! Please create a secure password to activate your team member account.`);
      return;
    }

    if (!res.success) {
      setErrorMessage(res.error || 'Your email is invalid or not registered by Admin.');
    }
  };

  // Handle create password
  const handleCreatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setInfoMessage('');

    if (!newPassword || newPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please re-enter.');
      return;
    }

    setLoading(true);
    const success = await createPassword(email, newPassword);
    setLoading(false);

    if (!success) {
      setErrorMessage('Failed to create password. Please ensure your email was registered by Admin.');
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col lg:flex-row font-sans selection:bg-[#5a36e6] selection:text-white">
      
      {/* ---------------- LEFT PANEL: ARCHITECTURAL BRAND SHOWCASE (Desktop) ---------------- */}
      <div 
        className="hidden lg:flex lg:w-1/2 xl:w-[52%] relative bg-cover bg-center overflow-hidden flex-col justify-between p-12 xl:p-16 text-white"
        style={{ backgroundImage: `url('/landing-bg.jpg')` }}
      >
        {/* Ambient Dark-to-Translucent Overlay for rich contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0e0c24]/90 via-[#0e0c24]/50 to-[#0e0c24]/30 pointer-events-none" />

        {/* Top Tag */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-xs font-semibold text-white tracking-wide">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>BGS MCH • WorkHub Portal</span>
          </div>

          <span className="text-xs text-white/70 font-medium">Enterprise Edition</span>
        </div>

        {/* Center / Bottom Hero Messaging */}
        <div className="relative z-10 max-w-lg space-y-6 my-auto pt-16">
          <div className="space-y-2">
            <span className="text-xs font-bold tracking-[0.2em] uppercase text-purple-300">
              SECURE WORKSPACE PLATFORM
            </span>
            <h2 className="text-3xl xl:text-4xl font-extrabold text-white tracking-tight leading-tight drop-shadow-sm">
              Coordinated Hospital & Healthcare Operations
            </h2>
            <p className="text-sm xl:text-base text-gray-200 leading-relaxed font-normal">
              A unified system for multi-department workflows, instant task requests, administrative coordination, and private WebRTC video meetings.
            </p>
          </div>

          {/* 3 Value Pillars */}
          <div className="grid grid-cols-1 gap-3 pt-2">
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15">
              <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">Role-Based Access Control</p>
                <p className="text-[11px] text-gray-300">Admin, department coordinators & staff member authentication</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15">
              <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center shrink-0">
                <Video className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">Private HD Video Meetings</p>
                <p className="text-[11px] text-gray-300">One-to-one and multi-party authenticated WebRTC rooms</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15">
              <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center shrink-0">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">Real-Time Team Coordination</p>
                <p className="text-[11px] text-gray-300">Instant notifications, live status dispatch & work logs</p>
              </div>
            </div>
          </div>
        </div>

        {/* Left Bottom Footer */}
        <div className="relative z-10 pt-8 border-t border-white/10 flex items-center justify-between text-xs text-gray-300">
          <p>© 2026 BGS MCH Digital Health</p>
          <span className="flex items-center gap-1.5 text-emerald-300">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            256-Bit SSL Encrypted
          </span>
        </div>
      </div>

      {/* ---------------- RIGHT PANEL: MODERN ENTERPRISE AUTH FORM ---------------- */}
      <div className="w-full lg:w-1/2 xl:w-[48%] flex flex-col justify-between p-6 sm:p-10 lg:p-14 xl:p-16 bg-[#fbfbfe]">
        
        {/* Top Bar with Back Button */}
        <div className="flex items-center justify-between w-full">
          {onBack ? (
            <button
              onClick={onBack}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-gray-200/80 text-xs font-semibold text-gray-600 hover:text-gray-900 hover:border-gray-300 transition-all cursor-pointer shadow-2xs"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Home</span>
            </button>
          ) : <div />}

          <div className="flex items-center gap-2 text-[11px] font-medium text-gray-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Secure Connection</span>
          </div>
        </div>

        {/* Center Form Container */}
        <div className="max-w-md w-full mx-auto my-auto py-8">
          
          {/* Brand Logo Header (matching landing page leaf icon) */}
          <div className="mb-8">
            <div className="flex items-center gap-3.5 mb-6">
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
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-gray-950 tracking-tight">
              {mode === 'login' ? 'Sign In to Dashboard' : 'Set Account Password'}
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-1.5 font-normal">
              {mode === 'login'
                ? 'Enter your registered email and password to access your workspace'
                : 'Welcome! Create a secure password to activate your team member account'}
            </p>
          </div>

          {/* Info Alert */}
          {infoMessage && (
            <div className="mb-5 p-3.5 rounded-xl bg-purple-50 border border-purple-200 text-[#5a36e6] text-xs font-medium flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#5a36e6] shrink-0" />
              <span>{infoMessage}</span>
            </div>
          )}

          {/* Error Alert */}
          {errorMessage && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
              {errorMessage}
            </div>
          )}

          {/* --- MODE 1: STANDARD SIGN IN --- */}
          {mode === 'login' && (
            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@bgs.edu"
                    className="w-full bg-white border border-gray-200 rounded-xl py-3 pl-10 pr-4 text-xs sm:text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#5a36e6]/20 focus:border-[#5a36e6] transition shadow-2xs"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-gray-700">Password</label>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-white border border-gray-200 rounded-xl py-3 pl-10 pr-10 text-xs sm:text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#5a36e6]/20 focus:border-[#5a36e6] transition shadow-2xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3.5 text-gray-400 hover:text-gray-700 transition cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-[#5a36e6] hover:bg-[#4b2ac9] text-white text-xs sm:text-sm font-semibold tracking-wide flex items-center justify-center gap-2 transition shadow-lg shadow-purple-600/25 mt-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? 'Verifying with Database...' : 'Sign In to Dashboard'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* --- MODE 2: CREATE PASSWORD FOR TEAM MEMBER --- */}
          {mode === 'create_password' && (
            <form onSubmit={handleCreatePassword} className="space-y-4">
              <div className="mb-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-purple-50 text-[#5a36e6] border border-purple-200">
                  <KeyRound className="w-3.5 h-3.5" /> Set Account Password
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Registered Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@bgs.edu"
                    className="w-full bg-white border border-gray-200 rounded-xl py-3 pl-10 pr-4 text-xs sm:text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#5a36e6]/20 focus:border-[#5a36e6] transition shadow-2xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Create New Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full bg-white border border-gray-200 rounded-xl py-3 pl-10 pr-10 text-xs sm:text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#5a36e6]/20 focus:border-[#5a36e6] transition shadow-2xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3.5 top-3.5 text-gray-400 hover:text-gray-700 transition cursor-pointer"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Confirm Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter your password"
                    className="w-full bg-white border border-gray-200 rounded-xl py-3 pl-10 pr-4 text-xs sm:text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#5a36e6]/20 focus:border-[#5a36e6] transition shadow-2xs"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-[#5a36e6] hover:bg-[#4b2ac9] text-white text-xs sm:text-sm font-semibold tracking-wide flex items-center justify-center gap-2 transition shadow-lg shadow-purple-600/25 mt-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? 'Saving Password...' : 'Create Password & Sign In'}
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setErrorMessage('');
                    setInfoMessage('');
                    setMode('login');
                  }}
                  className="text-xs font-medium text-gray-500 hover:text-gray-900 transition cursor-pointer"
                >
                  Already have a password? <span className="text-[#5a36e6] font-semibold underline">Back to Sign In</span>
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Bottom Subtext */}
        <div className="pt-6 border-t border-gray-200/60 flex items-center justify-between text-xs text-gray-400">
          <p>© 2026 WorkHub Team Workspace</p>
          <span className="hover:text-gray-600 transition-colors">BGS Digital Health</span>
        </div>
      </div>
    </div>
  );
};
