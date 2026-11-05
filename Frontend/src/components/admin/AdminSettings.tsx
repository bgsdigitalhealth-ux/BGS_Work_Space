import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  KeyRound, 
  UserPlus, 
  Trash2, 
  Eye, 
  EyeOff, 
  Save, 
  Mail, 
  User as UserIcon, 
  CheckCircle2, 
  AlertCircle,
  ShieldCheck,
  Plus,
  X
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import { User } from '../../types';

export const AdminSettings: React.FC = () => {
  const { currentUser, setCurrentUser } = useApp();

  // Admin Profile State
  const [name, setName] = useState(currentUser?.name || 'Admin');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');

  // Admin Personnel State
  const [admins, setAdmins] = useState<User[]>([]);
  const [loadingAdmins, setLoadingAdmins] = useState(false);
  const [isAddAdminOpen, setIsAddAdminOpen] = useState(false);
  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [showNewAdminPassword, setShowNewAdminPassword] = useState(false);
  const [creatingAdmin, setCreatingAdmin] = useState(false);
  const [adminActionMsg, setAdminActionMsg] = useState('');
  const [adminActionError, setAdminActionError] = useState('');

  // Fetch all admins
  const fetchAdmins = async () => {
    try {
      setLoadingAdmins(true);
      const list = await api.getAdmins();
      setAdmins(list);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingAdmins(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  // Sync state if currentUser changes
  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name);
      setEmail(currentUser.email);
    }
  }, [currentUser]);

  // Handle Save Profile & Credentials
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSuccess('');
    setProfileError('');

    if (!name.trim()) {
      setProfileError('Admin name cannot be empty.');
      return;
    }

    if (!email.trim()) {
      setProfileError('Email address cannot be empty.');
      return;
    }

    if (newPassword) {
      if (newPassword.length < 6) {
        setProfileError('New password must be at least 6 characters long.');
        return;
      }
      if (newPassword !== confirmPassword) {
        setProfileError('New passwords do not match.');
        return;
      }
    }

    setSavingProfile(true);
    try {
      const payload: { identifier: string; name: string; email: string; newPassword?: string } = {
        identifier: currentUser?.id || currentUser?.email || email,
        name: name.trim(),
        email: email.trim().toLowerCase()
      };

      if (newPassword) {
        payload.newPassword = newPassword;
      }

      const res = await api.updateAdminProfile(payload);
      if (res.success && res.user) {
        setCurrentUser(res.user);
        try {
          localStorage.setItem('workhub_user', JSON.stringify(res.user));
        } catch (e) {}

        setProfileSuccess('Admin credentials updated successfully!');
        setNewPassword('');
        setConfirmPassword('');
        fetchAdmins();
      }
    } catch (err: any) {
      setProfileError(err.message || 'Failed to update admin profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  // Handle Create New Administrator
  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminActionMsg('');
    setAdminActionError('');

    if (!newAdminName.trim() || !newAdminEmail.trim() || !newAdminPassword) {
      setAdminActionError('Please fill out all fields.');
      return;
    }

    if (newAdminPassword.length < 6) {
      setAdminActionError('Password must be at least 6 characters long.');
      return;
    }

    setCreatingAdmin(true);
    try {
      const res = await api.createAdmin({
        name: newAdminName.trim(),
        email: newAdminEmail.trim().toLowerCase(),
        password: newAdminPassword
      });

      if (res.success) {
        setAdminActionMsg(`New Administrator "${res.user.name}" created successfully!`);
        setNewAdminName('');
        setNewAdminEmail('');
        setNewAdminPassword('');
        setIsAddAdminOpen(false);
        fetchAdmins();
      }
    } catch (err: any) {
      setAdminActionError(err.message || 'Failed to create administrator.');
    } finally {
      setCreatingAdmin(false);
    }
  };

  // Handle Delete Administrator
  const handleDeleteAdmin = async (adminId: string, adminEmail: string) => {
    if (adminEmail.toLowerCase() === currentUser?.email.toLowerCase()) {
      alert('You cannot delete your own currently logged-in administrator account.');
      return;
    }

    if (!window.confirm(`Are you sure you want to remove administrator access for ${adminEmail}?`)) {
      return;
    }

    try {
      await api.deleteAdmin(adminId);
      setAdminActionMsg(`Administrator ${adminEmail} removed successfully.`);
      fetchAdmins();
    } catch (err: any) {
      setAdminActionError(err.message || 'Failed to remove administrator.');
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Admin Settings & Access Control</h2>
          </div>
          <p className="text-xs text-slate-500">
            Manage your personal administrator credentials, change your email ID and password, and authorize additional administrator personnel.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* --- SECTION 1: EDIT ADMIN PROFILE & CREDENTIALS --- */}
        <div className="lg:col-span-6 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <KeyRound className="w-4 h-4 text-indigo-600" />
            <h3 className="font-bold text-slate-900 text-sm">Change Email ID & Password</h3>
          </div>

          {profileSuccess && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{profileSuccess}</span>
            </div>
          )}

          {profileError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{profileError}</span>
            </div>
          )}

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Administrator Name</label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Admin / Full Name"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-3 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Admin Email ID (Login Username)</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@company.com"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-3 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">This email ID will be used to log into the Admin Dashboard.</p>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                New Password <span className="text-slate-400 font-normal">(Leave blank to keep current)</span>
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-10 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 transition cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {newPassword && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Confirm New Password</label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={savingProfile}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center justify-center gap-2 transition shadow-sm cursor-pointer disabled:opacity-50 mt-4"
            >
              <Save className="w-4 h-4" />
              <span>{savingProfile ? 'Updating Credentials...' : 'Save Admin Credentials'}</span>
            </button>
          </form>
        </div>

        {/* --- SECTION 2: MANAGE OTHER ADMINISTRATOR PERSONNEL --- */}
        <div className="lg:col-span-6 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-indigo-600" />
              <h3 className="font-bold text-slate-900 text-sm">Administrator Personnel</h3>
            </div>
            <button
              onClick={() => {
                setAdminActionMsg('');
                setAdminActionError('');
                setIsAddAdminOpen(true);
              }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Admin</span>
            </button>
          </div>

          {adminActionMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{adminActionMsg}</span>
            </div>
          )}

          {adminActionError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{adminActionError}</span>
            </div>
          )}

          <p className="text-xs text-slate-500">
            All personnel listed here have full administrative permissions to manage departments, assign work, and approve deliverables.
          </p>

          <div className="divide-y divide-slate-100">
            {loadingAdmins ? (
              <div className="py-6 text-center text-xs text-slate-400">Loading administrators...</div>
            ) : admins.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">No administrators found.</div>
            ) : (
              admins.map((adm) => {
                const isCurrent = adm.email.toLowerCase() === currentUser?.email.toLowerCase();
                return (
                  <div key={adm.id} className="py-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 truncate">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                        {adm.avatar || (adm.name || 'A').charAt(0).toUpperCase()}
                      </div>
                      <div className="truncate">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-bold text-slate-900 truncate">{adm.name}</p>
                          {isCurrent && (
                            <span className="text-[10px] font-bold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
                              You
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 truncate">{adm.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200/60">
                        Admin
                      </span>
                      {!isCurrent && (
                        <button
                          onClick={() => handleDeleteAdmin(adm.id, adm.email)}
                          title="Remove Administrator"
                          className="p-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* --- MODAL: ADD NEW ADMINISTRATOR --- */}
      {isAddAdminOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-slate-200 shadow-2xl relative">
            <button
              onClick={() => setIsAddAdminOpen(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <UserPlus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">Add New Administrator</h3>
                <p className="text-xs text-slate-500">Grant administrator access to another person.</p>
              </div>
            </div>

            {adminActionError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold">
                {adminActionError}
              </div>
            )}

            <form onSubmit={handleCreateAdmin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Full Name *</label>
                <input
                  type="text"
                  required
                  value={newAdminName}
                  onChange={(e) => setNewAdminName(e.target.value)}
                  placeholder="e.g. Operations Director"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Admin Email Address *</label>
                <input
                  type="email"
                  required
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Admin Password *</label>
                <div className="relative">
                  <input
                    type={showNewAdminPassword ? 'text' : 'password'}
                    required
                    value={newAdminPassword}
                    onChange={(e) => setNewAdminPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-3 pr-10 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewAdminPassword(!showNewAdminPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 transition cursor-pointer"
                  >
                    {showNewAdminPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-purple-50/70 border border-purple-100 text-purple-900 text-xs">
                <p className="font-semibold">Security Role: Admin</p>
                <p className="text-[11px] text-purple-700 mt-0.5">This person will be able to log in with these credentials and manage all departments, teams, and work.</p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddAdminOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingAdmin}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {creatingAdmin ? 'Creating...' : 'Create Admin Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
