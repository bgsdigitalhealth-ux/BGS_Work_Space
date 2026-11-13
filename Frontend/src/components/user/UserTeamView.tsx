import React, { useState } from 'react';
import { 
  Users, 
  Building2, 
  Mail, 
  Phone, 
  Send, 
  MessageSquare, 
  Search, 
  ShieldCheck,
  Briefcase
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const UserTeamView: React.FC = () => {
  const { currentUser, members, allUsers, setUserNav } = useApp();
  const [searchQuery, setSearchQuery] = useState('');

  const myEmail = (currentUser?.email || '').trim().toLowerCase();
  const myTeam = (currentUser?.team || '').trim();
  const myDept = (currentUser?.department || '').trim();

  // Find member record for currentUser if exists
  const myMember = members.find(m => 
    (currentUser?.id && (m.id === currentUser.id || (m as any).userId === currentUser.id)) ||
    (myEmail && m.email && m.email.toLowerCase() === myEmail)
  );
  const myTeamId = myMember ? myMember.teamId : (currentUser as any)?.teamId;
  const myDeptId = myMember ? myMember.departmentId : (currentUser as any)?.departmentId;

  // Filter members who belong to the SAME team as currentUser
  const sameTeamMembers = members.filter(m => {
    // 1. Match by teamId if present
    if (myTeamId && m.teamId && m.teamId === myTeamId) return true;

    // 2. Match by user record team name
    const correspondingUser = allUsers.find(u => 
      u.id === m.id || (m.email && u.email && u.email.toLowerCase() === m.email.toLowerCase())
    );
    if (myTeam && correspondingUser?.team && correspondingUser.team.toLowerCase() === myTeam.toLowerCase()) {
      return true;
    }

    // 3. Match by department if team isn't specifically defined
    if (!myTeam && !myTeamId && myDeptId && m.departmentId === myDeptId) {
      return true;
    }

    // If currentUser is this member
    if (m.email && m.email.toLowerCase() === myEmail) {
      return true;
    }

    return false;
  });

  // If no members in members table match, check allUsers for users in same team
  let displayList: any[] = sameTeamMembers;
  if (displayList.length === 0) {
    displayList = allUsers.filter(u => {
      if (u.role !== 'user') return false;
      if (myTeam && u.team && u.team.toLowerCase() === myTeam.toLowerCase()) return true;
      if (myDept && u.department && u.department.toLowerCase() === myDept.toLowerCase()) return true;
      if (u.email && u.email.toLowerCase() === myEmail) return true;
      return false;
    });
  }

  // Filter by search query
  const filteredTeammates = displayList.filter(item => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const matchName = (item.name || '').toLowerCase().includes(q);
    const matchEmail = (item.email || '').toLowerCase().includes(q);
    const matchRole = (item.role || item.teamRole || '').toLowerCase().includes(q);
    return matchName || matchEmail || matchRole;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-gray-100">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-[#5a36e6] flex items-center justify-center font-bold shadow-sm">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                  My Team & Division
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-50 text-[#5a36e6] border border-purple-200">
                  {displayList.length} {displayList.length === 1 ? 'Member' : 'Members'}
                </span>
              </div>
              <p className="text-xs text-gray-500 font-medium mt-0.5">
                Connected team members working together in your division.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700">
              <Building2 className="w-3.5 h-3.5 text-[#5a36e6]" />
              <span>Dept: <strong>{myDept || 'Digital Health'}</strong></span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 border border-purple-200 text-xs font-semibold text-[#5a36e6]">
              <Users className="w-3.5 h-3.5 text-[#5a36e6]" />
              <span>Team: <strong>{myTeam || 'General Team'}</strong></span>
            </span>
          </div>
        </div>

        {/* Search bar */}
        <div className="pt-4 flex items-center justify-between gap-4">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              placeholder="Search teammates by name or role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5a36e6]"
            />
          </div>

          <button
            type="button"
            onClick={() => setUserNav('assign-work')}
            className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#5a36e6] hover:bg-[#4828c4] text-white font-bold text-xs transition shadow-sm cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>+ Delegate Work</span>
          </button>
        </div>
      </div>

      {/* Teammates Cards Grid */}
      {filteredTeammates.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center max-w-md mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-[#5a36e6] flex items-center justify-center mx-auto mb-4 shadow-sm">
            <Users className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-gray-900 mb-1">
            {searchQuery ? 'No Teammates Match Search' : 'Sole Registered Member'}
          </h3>
          <p className="text-xs text-gray-500 mb-5 leading-relaxed font-medium">
            {searchQuery 
              ? 'Try modifying your search term to find members in your team.'
              : `You are currently the registered member in ${myTeam || 'your team'} under ${myDept || 'your department'}. When administrators assign teammates to this team, they will automatically appear here.`}
          </p>
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold transition cursor-pointer"
            >
              Clear Search
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredTeammates.map((teammate) => {
            const isMe = (teammate.email && teammate.email.toLowerCase() === myEmail) || teammate.id === currentUser?.id;
            const roleName = teammate.role || teammate.teamRole || 'Team Member';
            const avatarChar = (teammate.name || 'U').charAt(0).toUpperCase();

            return (
              <div
                key={teammate.id || teammate.email}
                className="bg-white rounded-2xl border border-gray-100 shadow-xs hover:shadow-lg hover:border-[#5a36e6]/40 transition-all duration-300 p-5 flex flex-col justify-between"
              >
                <div>
                  {/* Top card row */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#5a36e6] to-[#7c3aed] text-white flex items-center justify-center font-bold text-base shadow-sm shrink-0">
                        {teammate.avatar && teammate.avatar.length <= 2 ? teammate.avatar : avatarChar}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h3 className="font-bold text-gray-900 text-sm">{teammate.name}</h3>
                          {isMe && (
                            <span className="px-2 py-0.2 rounded-full text-[10px] font-extrabold bg-indigo-50 text-[#5a36e6] border border-indigo-200">
                              You
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-semibold text-purple-700 mt-0.5">{roleName}</p>
                      </div>
                    </div>

                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                      <ShieldCheck className="w-3 h-3 text-emerald-600" />
                      Active
                    </span>
                  </div>

                  {/* Team & Department badge */}
                  <div className="mb-3.5 space-y-1">
                    <div className="flex items-center gap-1.5 text-[11px] text-gray-600">
                      <Building2 className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <span className="truncate">{myDept || 'Digital Health'}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-gray-600">
                      <Users className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <span className="truncate font-semibold text-gray-800">{myTeam || 'General Team'}</span>
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="space-y-1.5 p-3 rounded-xl bg-gray-50/70 border border-gray-100 text-xs">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Mail className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <span className="truncate font-medium">{teammate.email || 'No email registered'}</span>
                    </div>
                    {teammate.phone && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span className="truncate font-medium">{teammate.phone}</span>
                      </div>
                    )}
                  </div>

                  {/* Assigned Work info */}
                  {teammate.assignedWork && (
                    <div className="mt-3 text-xs">
                      <div className="flex items-center gap-1 text-[11px] text-gray-400 font-semibold mb-1">
                        <Briefcase className="w-3 h-3 text-[#5a36e6]" />
                        <span>Assigned Responsibilities</span>
                      </div>
                      <p className="text-gray-700 text-xs bg-purple-50/40 p-2 rounded-lg border border-purple-100/60 line-clamp-2">
                        {teammate.assignedWork}
                      </p>
                    </div>
                  )}
                </div>

                {/* Card Actions */}
                <div className="pt-4 mt-4 border-t border-gray-100 flex items-center justify-end gap-2">
                  {!isMe ? (
                    <>
                      <button
                        type="button"
                        onClick={() => setUserNav('messages')}
                        className="px-3 py-1.5 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-gray-500" />
                        <span>Message</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setUserNav('assign-work')}
                        className="px-3 py-1.5 rounded-xl bg-[#5a36e6] hover:bg-[#4828c4] text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Assign</span>
                      </button>
                    </>
                  ) : (
                    <span className="text-[11px] text-gray-400 italic">Your active profile</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
