import React, { useState, useRef } from 'react';
import { 
  User, 
  Camera, 
  Lock, 
  Eye, 
  EyeOff, 
  Check, 
  AlertCircle, 
  Save, 
  ShieldCheck, 
  Building2, 
  Users, 
  Mail, 
  Trash2,
  Sparkles
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const UserSettings: React.FC = () => {
  const { currentUser, updateUserProfile, departments = [], teams = [] } = useApp();

  // Profile info state
  const [name, setName] = useState(currentUser?.name || '');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(currentUser?.avatar || null);
  const [avatarChanged, setAvatarChanged] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Status and feedback
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Resolve human-readable department and team
  const resolvedDept = (() => {
    if (!currentUser?.department) return 'General Department';
    if (!currentUser.department.startsWith('dept-')) return currentUser.department;
    const match = departments.find(d => d.id === currentUser.department);
    return match ? match.name : 'General Department';
  })();

  const resolvedTeam = (() => {
    if (!currentUser?.team) return 'Team Member';
    if (!currentUser.team.startsWith('team-')) return currentUser.team;
    const match = teams.find(t => t.id === currentUser.team);
    return match ? match.name : 'Team Member';
  })();

  // Handle Photo File Upload
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setProfileError('Please upload a valid image file (PNG, JPG, WEBP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setProfileError('Image size exceeds 5MB. Please choose a smaller photo.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setAvatarPreview(reader.result as string);
      setAvatarChanged(true);
      setProfileError(null);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleRemovePhoto = () => {
    setAvatarPreview('');
    setAvatarChanged(true);
  };

  // Submit Profile Information (Name + Photo)
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSuccess(null);
    setProfileError(null);

    if (!name.trim()) {
      setProfileError('Full name cannot be empty.');
      return;
    }

    setSavingProfile(true);
    try {
      const payload: { name: string; avatar?: string } = {
        name: name.trim()
      };
      if (avatarChanged) {
        payload.avatar = avatarPreview || '';
      }

      const res = await updateUserProfile(payload);
      if (res.success) {
        setProfileSuccess('Profile updated successfully!');
        setAvatarChanged(false);
        setTimeout(() => setProfileSuccess(null), 4000);
      } else {
        setProfileError(res.error || 'Failed to update profile.');
      }
    } catch (err: any) {
      setProfileError(err.message || 'An unexpected error occurred.');
    } finally {
      setSavingProfile(false);
    }
  };

  // Submit Password Change
  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordSuccess(null);
    setPasswordError(null);

    if (!newPassword) {
      setPasswordError('Please enter a new password.');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    setSavingPassword(true);
    try {
      const res = await updateUserProfile({
        currentPassword: currentPassword || undefined,
        newPassword
      });

      if (res.success) {
        setPasswordSuccess('Password changed successfully!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => setPasswordSuccess(null), 4000);
      } else {
        setPasswordError(res.error || 'Failed to update password.');
      }
    } catch (err: any) {
      setPasswordError(err.message || 'An error occurred while updating password.');
    } finally {
      setSavingPassword(false);
    }
  };

  const userInitial = name.trim() ? name.trim().charAt(0).toUpperCase() : 'U';

  return (
    <div className="space-y-6 max-w-4xl mx-auto py-2">
      {/* Top Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-950 tracking-tight flex items-center gap-2.5">
            <span>Account Settings</span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-[#5a36e6]">
              User Portal
            </span>
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Manage your personal profile, uploaded photo, and account security.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column (8 cols): Profile Info & Photo */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-2xl p-6 sm:p-7 border border-gray-100 shadow-sm relative overflow-hidden">
            {/* Top Accent Strip */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#5a36e6] to-[#8b5cf6]" />

            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 rounded-lg bg-purple-50 text-[#5a36e6] flex items-center justify-center">
                <User className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-gray-900">Personal Profile</h3>
            </div>

            {profileSuccess && (
              <div className="mb-5 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{profileSuccess}</span>
              </div>
            )}

            {profileError && (
              <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{profileError}</span>
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-6">
              {/* Profile Photo Uploader */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-3">
                  Profile Picture
                </label>
                
                <div className="flex items-center gap-5">
                  {/* Photo Avatar Bubble */}
                  <div className="relative group">
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handlePhotoSelect} 
                      accept="image/*" 
                      className="hidden" 
                    />

                    {avatarPreview ? (
                      <img 
                        src={avatarPreview} 
                        alt="Profile Preview" 
                        className="w-20 h-20 rounded-full object-cover ring-4 ring-purple-100 shadow-md"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-[#5a36e6] to-[#8b5cf6] text-white flex items-center justify-center font-black text-2xl shadow-md ring-4 ring-purple-100">
                        {userInitial}
                      </div>
                    )}

                    {/* Camera Button Badge */}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute bottom-0 right-0 p-2 rounded-full bg-[#5a36e6] hover:bg-[#4b28c7] text-white shadow-lg transition-transform hover:scale-110 cursor-pointer"
                      title="Upload new picture"
                    >
                      <Camera className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3.5 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-[#5a36e6] font-semibold text-xs transition-colors cursor-pointer"
                      >
                        Upload Photo
                      </button>

                      {avatarPreview && (
                        <button
                          type="button"
                          onClick={handleRemovePhoto}
                          className="px-3 py-1.5 rounded-xl text-gray-500 hover:text-red-600 hover:bg-red-50 font-medium text-xs transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Remove</span>
                        </button>
                      )}
                    </div>
                    <p className="text-[11px] text-gray-400">
                      Recommended: JPG, PNG, or WEBP under 5MB.
                    </p>
                  </div>
                </div>
              </div>

              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="Enter your name"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-xs sm:text-sm text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-[#5a36e6]/30 focus:border-[#5a36e6] transition-all bg-white"
                  />
                </div>
              </div>

              {/* Email Address (Read-only) */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Email Address
                  </label>
                  <span className="text-[10px] font-semibold text-[#00a884] bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    Verified
                  </span>
                </div>
                <div className="relative">
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    value={currentUser?.email || ''}
                    disabled
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-xs sm:text-sm text-gray-500 font-medium bg-gray-50 cursor-not-allowed select-none"
                  />
                </div>
                <p className="text-[11px] text-gray-400 mt-1">
                  Email is locked to your organization's registered credentials.
                </p>
              </div>

              {/* Save Profile Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="px-6 py-2.5 rounded-xl bg-[#5a36e6] hover:bg-[#4b28c7] text-white font-semibold text-xs sm:text-sm shadow-md shadow-purple-600/25 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{savingProfile ? 'Saving...' : 'Save Profile Changes'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Department & Team Assignment Info */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#5a36e6]" />
              <span>Workspace Membership</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="p-3.5 rounded-xl bg-purple-50/50 border border-purple-100/70 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-white text-[#5a36e6] flex items-center justify-center shadow-2xs shrink-0">
                  <Building2 className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Department</p>
                  <p className="text-xs font-bold text-gray-900 truncate mt-0.5">{resolvedDept}</p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-blue-50/50 border border-blue-100/70 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-white text-blue-600 flex items-center justify-center shadow-2xs shrink-0">
                  <Users className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Assigned Team</p>
                  <p className="text-xs font-bold text-gray-900 truncate mt-0.5">{resolvedTeam}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (5 cols): Change Password */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-2xl p-6 sm:p-7 border border-gray-100 shadow-sm relative overflow-hidden">
            {/* Top Accent Strip */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-orange-500" />

            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <Lock className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-gray-900">Change Password</h3>
            </div>

            {passwordSuccess && (
              <div className="mb-5 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{passwordSuccess}</span>
              </div>
            )}

            {passwordError && (
              <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{passwordError}</span>
              </div>
            )}

            <form onSubmit={handleSavePassword} className="space-y-4">
              {/* Current Password */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-gray-200 text-xs sm:text-sm text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-[#5a36e6]/30 focus:border-[#5a36e6] transition-all bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 cursor-pointer"
                  >
                    {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={6}
                    placeholder="Minimum 6 characters"
                    className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-gray-200 text-xs sm:text-sm text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-[#5a36e6]/30 focus:border-[#5a36e6] transition-all bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 cursor-pointer"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm New Password */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                    placeholder="Repeat new password"
                    className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-gray-200 text-xs sm:text-sm text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-[#5a36e6]/30 focus:border-[#5a36e6] transition-all bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 cursor-pointer"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={savingPassword}
                  className="w-full py-2.5 rounded-xl bg-gray-900 hover:bg-black text-white font-semibold text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  <Lock className="w-4 h-4" />
                  <span>{savingPassword ? 'Updating...' : 'Update Password'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
};
