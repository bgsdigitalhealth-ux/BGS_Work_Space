import React, { useState } from 'react';
import { Shield, Lock, Mail, ArrowRight, Eye, EyeOff, KeyRound, CheckCircle2, ArrowLeft } from 'lucide-react';
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
    <div className="min-h-screen bg-[#0f0e26] text-white flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Background Decorative Ambient Glows */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />

      {/* Main Card */}
      <div className="max-w-md w-full bg-[#181639]/90 border border-white/10 rounded-3xl p-8 shadow-2xl backdrop-blur-xl relative z-10">
        {onBack && (
          <button
            onClick={onBack}
            className="mb-4 inline-flex items-center gap-1.5 text-xs text-indigo-300 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Home</span>
          </button>
        )}

        {/* Brand Logo Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#704fe6] to-[#4f32c2] flex items-center justify-center shadow-lg shadow-indigo-600/40 mb-3">
            <Shield className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">WorkHub</h1>
          <p className="text-xs text-indigo-300 font-medium mt-1">Team & Work Management System</p>
        </div>

        {/* Info Alert */}
        {infoMessage && (
          <div className="mb-5 p-3 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-200 text-xs text-center font-medium flex items-center justify-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
            <span>{infoMessage}</span>
          </div>
        )}

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs text-center font-semibold">
            {errorMessage}
          </div>
        )}

        {/* --- MODE 1: STANDARD SIGN IN --- */}
        {mode === 'login' && (
          <form onSubmit={handleSignIn} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full bg-[#201d4a] border border-white/10 rounded-xl py-3 pl-10 pr-4 text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#704fe6] focus:border-transparent transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#201d4a] border border-white/10 rounded-xl py-3 pl-10 pr-10 text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#704fe6] focus:border-transparent transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-gray-400 hover:text-white transition cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#6340e4] to-[#4828c4] hover:from-[#704fe6] hover:to-[#5532d5] text-white text-xs font-black tracking-wide flex items-center justify-center gap-2 transition shadow-lg shadow-indigo-600/40 mt-2 cursor-pointer disabled:opacity-50"
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
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                <KeyRound className="w-3.5 h-3.5" /> Set Account Password
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1.5">Registered Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full bg-[#201d4a] border border-white/10 rounded-xl py-3 pl-10 pr-4 text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#704fe6] focus:border-transparent transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1.5">Create New Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full bg-[#201d4a] border border-white/10 rounded-xl py-3 pl-10 pr-10 text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#704fe6] focus:border-transparent transition"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3.5 top-3.5 text-gray-400 hover:text-white transition cursor-pointer"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1.5">Confirm Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your password"
                  className="w-full bg-[#201d4a] border border-white/10 rounded-xl py-3 pl-10 pr-4 text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#704fe6] focus:border-transparent transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#6340e4] to-[#4828c4] hover:from-[#704fe6] hover:to-[#5532d5] text-white text-xs font-black tracking-wide flex items-center justify-center gap-2 transition shadow-lg shadow-indigo-600/40 mt-2 cursor-pointer disabled:opacity-50"
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
                className="text-xs font-medium text-gray-400 hover:text-white transition cursor-pointer"
              >
                Already have a password? <span className="text-indigo-400 font-semibold underline">Back to Sign In</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
