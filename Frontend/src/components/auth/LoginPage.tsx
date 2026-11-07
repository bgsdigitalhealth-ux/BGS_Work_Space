import React, { useState } from 'react';
import { Lock, Mail, ArrowRight, Eye, EyeOff, KeyRound, CheckCircle2, ArrowLeft } from 'lucide-react';
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
    <div 
      className="min-h-screen text-gray-900 font-sans selection:bg-[#5a36e6] selection:text-white flex items-center justify-center p-4 relative overflow-hidden bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url('/landing-bg.jpg')` }}
    >
      {/* Ambient background wash */}
      <div className="absolute inset-0 bg-slate-900/35 backdrop-blur-[2px] pointer-events-none z-0" />

      {/* Floating Top-Left Back Navigation */}
      {onBack && (
        <button
          onClick={onBack}
          className="absolute top-6 left-6 z-20 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/85 hover:bg-white backdrop-blur-md border border-white/60 text-xs font-semibold text-gray-700 hover:text-gray-950 transition-all cursor-pointer shadow-md"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </button>
      )}

      {/* ---------------- CENTERED MODERN ENTERPRISE LOGIN CARD ---------------- */}
      <div className="w-full max-w-[430px] bg-white/95 backdrop-blur-xl rounded-3xl p-8 sm:p-10 shadow-2xl border border-white/80 relative z-10 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Brand Logo Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-50 to-green-100 border border-green-200/60 flex items-center justify-center shadow-xs mb-3">
            <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-8 h-8">
              <path d="M12 28C10 20 18 10 28 8C26 18 18 28 12 28Z" fill="#22c55e" />
              <path d="M12 28C16 28 22 22 28 8C18 10 10 20 12 28Z" fill="#15803d" />
              <path d="M14 26C18 20 22 14 28 8" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>

          <h1 className="text-xl font-extrabold text-gray-950 tracking-tight leading-none">WorkHub</h1>
          <p className="text-[11px] font-medium text-gray-500 tracking-wide mt-1">Team Workspace</p>

          <h2 className="text-2xl font-black text-gray-900 tracking-tight mt-5">
            {mode === 'login' ? 'Welcome Back' : 'Set Account Password'}
          </h2>
          <p className="text-xs text-gray-500 mt-1 max-w-xs">
            {mode === 'login'
              ? 'Enter your registered credentials to sign in'
              : 'Create a secure password to activate your team account'}
          </p>
        </div>

        {/* Info Alert */}
        {infoMessage && (
          <div className="mb-4 p-3 rounded-xl bg-purple-50 border border-purple-200 text-[#5a36e6] text-xs font-medium flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#5a36e6] shrink-0" />
            <span>{infoMessage}</span>
          </div>
        )}

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold text-center">
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
                  placeholder="Enter your registered email"
                  className="w-full bg-gray-50/70 hover:bg-white focus:bg-white border border-gray-200 focus:border-[#5a36e6] focus:ring-4 focus:ring-purple-100 rounded-xl py-3 pl-10 pr-4 text-xs sm:text-sm text-gray-900 placeholder-gray-400 focus:outline-none transition shadow-2xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full bg-gray-50/70 hover:bg-white focus:bg-white border border-gray-200 focus:border-[#5a36e6] focus:ring-4 focus:ring-purple-100 rounded-xl py-3 pl-10 pr-10 text-xs sm:text-sm text-gray-900 placeholder-gray-400 focus:outline-none transition shadow-2xs"
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
              className="w-full py-3.5 rounded-xl bg-[#5a36e6] hover:bg-[#4b2ac9] text-white text-xs sm:text-sm font-semibold tracking-wide flex items-center justify-center gap-2 transition shadow-lg shadow-purple-600/30 mt-2 cursor-pointer disabled:opacity-50"
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
                  className="w-full bg-gray-50/70 hover:bg-white focus:bg-white border border-gray-200 focus:border-[#5a36e6] focus:ring-4 focus:ring-purple-100 rounded-xl py-3 pl-10 pr-4 text-xs sm:text-sm text-gray-900 placeholder-gray-400 focus:outline-none transition shadow-2xs"
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
                  className="w-full bg-gray-50/70 hover:bg-white focus:bg-white border border-gray-200 focus:border-[#5a36e6] focus:ring-4 focus:ring-purple-100 rounded-xl py-3 pl-10 pr-10 text-xs sm:text-sm text-gray-900 placeholder-gray-400 focus:outline-none transition shadow-2xs"
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
                  className="w-full bg-gray-50/70 hover:bg-white focus:bg-white border border-gray-200 focus:border-[#5a36e6] focus:ring-4 focus:ring-purple-100 rounded-xl py-3 pl-10 pr-4 text-xs sm:text-sm text-gray-900 placeholder-gray-400 focus:outline-none transition shadow-2xs"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-[#5a36e6] hover:bg-[#4b2ac9] text-white text-xs sm:text-sm font-semibold tracking-wide flex items-center justify-center gap-2 transition shadow-lg shadow-purple-600/30 mt-2 cursor-pointer disabled:opacity-50"
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

        {/* Reassurance Badge */}
        <div className="mt-6 pt-5 border-t border-gray-100 flex items-center justify-center gap-1.5 text-[11px] text-gray-400">
          <span>🔒 256-Bit SSL Encrypted • BGS MCH Portal</span>
        </div>
      </div>
    </div>
  );
};
