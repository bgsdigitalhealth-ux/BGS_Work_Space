import React, { useRef, useEffect } from 'react';
import { Bell, CheckCheck, Clock, ExternalLink, X } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationDropdown: React.FC<Props> = ({ isOpen, onClose }) => {
  const {
    notifications,
    handleMarkNotificationRead,
    handleMarkAllNotificationsRead,
    setUserNav,
    setManagerNav,
    setAdminNav,
    currentUser,
    portalMode
  } = useApp();

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleNotificationClick = async (notif: typeof notifications[0]) => {
    // 1. Mark this specific notification as read in database & state
    await handleMarkNotificationRead(notif.id);

    // 2. External links or meeting rooms
    if (notif.link && (notif.link.startsWith('/meet/') || notif.link.startsWith('http://') || notif.link.startsWith('https://'))) {
      window.location.href = notif.link;
      onClose();
      return;
    }

    // 3. Determine target destination from link or deduce from title/message
    const linkStr = (notif.link || '').toLowerCase().trim();
    const titleStr = (notif.title || '').toLowerCase().trim();
    const msgStr = (notif.message || '').toLowerCase().trim();
    const combined = `${linkStr} ${titleStr} ${msgStr}`;

    let target = 'dashboard';
    if (linkStr.includes('appointment') || combined.includes('appointment') || combined.includes('consultation') || combined.includes('schedule') || combined.includes('meeting')) {
      target = 'appointments';
    } else if (linkStr.includes('break') || combined.includes('break') || combined.includes('coffee') || combined.includes('tea')) {
      target = 'break-time';
    } else if (linkStr.includes('message') || combined.includes('message') || combined.includes('chat')) {
      target = 'messages';
    } else if (linkStr.includes('work-history') || combined.includes('work history') || combined.includes('past work')) {
      target = 'work-history';
    } else if (linkStr.includes('review') || linkStr.includes('manager-dashboard') || combined.includes('awaiting approval') || combined.includes('work request') || combined.includes('approval required')) {
      target = 'review-work';
    } else if (linkStr.includes('assign-work') || linkStr.includes('work-management') || combined.includes('delegate')) {
      target = 'assign-work';
    } else if (linkStr.includes('assigned-work') || linkStr.includes('my-work') || linkStr.includes('task') || combined.includes('assigned work') || combined.includes('task') || combined.includes('deliverable')) {
      target = 'my-work';
    } else if (linkStr.includes('timeline') || combined.includes('timeline') || combined.includes('audit trail')) {
      target = 'timeline';
    } else if (linkStr.includes('record') || combined.includes('attendance') || combined.includes('punch')) {
      target = 'record';
    } else if (linkStr.includes('report') || combined.includes('report')) {
      target = 'reports';
    } else if (linkStr.includes('setting')) {
      target = 'settings';
    } else if (linkStr.includes('team')) {
      target = 'team';
    }

    // 4. Role-aware redirection across Admin, Manager, and User dashboards
    const role = currentUser?.role;
    if (role === 'admin' || portalMode === 'admin') {
      if (target === 'appointments') setAdminNav('appointments');
      else if (target === 'break-time') setAdminNav('break-time');
      else if (target === 'messages') setAdminNav('messages');
      else if (target === 'timeline') setAdminNav('timeline');
      else if (target === 'reports') setAdminNav('reports');
      else if (target === 'settings') setAdminNav('settings');
      else if (target === 'record') setAdminNav('record');
      else setAdminNav('dashboard');
    } else if (role === 'manager') {
      if (target === 'appointments') setManagerNav('appointments');
      else if (target === 'break-time') setManagerNav('break-time');
      else if (target === 'messages') setManagerNav('messages');
      else if (target === 'timeline') setManagerNav('timeline');
      else if (target === 'reports') setManagerNav('reports');
      else if (target === 'settings') setManagerNav('settings');
      else if (target === 'record') setManagerNav('record');
      else if (target === 'team') setManagerNav('team');
      else if (target === 'assign-work') setManagerNav('assign-work');
      else if (target === 'review-work') setManagerNav('review-work');
      else if (target === 'work-history') setManagerNav('my-work');
      else if (target === 'my-work') setManagerNav('my-work');
      else setManagerNav('dashboard');
    } else {
      // role: 'user'
      if (target === 'appointments') setUserNav('appointments');
      else if (target === 'break-time') setUserNav('break-time');
      else if (target === 'messages') setUserNav('messages');
      else if (target === 'timeline') setUserNav('timeline');
      else if (target === 'reports') setUserNav('reports');
      else if (target === 'settings') setUserNav('settings');
      else if (target === 'record') setUserNav('record');
      else if (target === 'team') setUserNav('team');
      else if (target === 'assign-work') setUserNav('assign-work');
      else if (target === 'work-history') setUserNav('work-history');
      else if (target === 'review-work' || target === 'my-work') setUserNav('my-work');
      else setUserNav('dashboard');
    }

    onClose();
  };

  return (
    <div
      ref={dropdownRef}
      className="fixed sm:absolute right-3 sm:right-0 left-3 sm:left-auto top-16 sm:top-auto mt-2 max-w-[calc(100vw-1.5rem)] sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150"
    >
      {/* Header */}
      <div className="p-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-[#5a36e6]" />
          <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Notifications</h4>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-[#5a36e6]">
            {notifications.filter(n => !n.read).length} new
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleMarkAllNotificationsRead()}
            className="text-[11px] font-bold text-gray-500 hover:text-[#5a36e6] flex items-center gap-1 transition cursor-pointer"
            title="Mark all as read"
          >
            <CheckCheck className="w-3.5 h-3.5" /> Mark all read
          </button>
          <button onClick={onClose} className="p-1 rounded-lg text-gray-400 hover:text-gray-700 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* List */}
      <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
        {notifications.length === 0 ? (
          <div className="py-8 text-center text-xs text-gray-400">
            No notifications yet
          </div>
        ) : (
          notifications.map(notif => (
            <div
              key={notif.id}
              onClick={() => handleNotificationClick(notif)}
              className={`p-3.5 hover:bg-purple-50/50 transition cursor-pointer flex items-start gap-3 ${!notif.read ? 'bg-indigo-50/40' : 'opacity-85 hover:opacity-100'
                }`}
            >
              <div className="mt-1">
                <span className={`block w-2 h-2 rounded-full ${!notif.read ? 'bg-[#5a36e6]' : 'bg-gray-300'}`} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <h5 className={`text-xs leading-snug line-clamp-1 ${!notif.read ? 'font-bold text-gray-900' : 'font-semibold text-gray-700'}`}>
                    {notif.title}
                  </h5>
                  {!notif.read && (
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-[#5a36e6] text-white shrink-0">
                      NEW
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-gray-600 mt-0.5 leading-relaxed">
                  {notif.message}
                </p>
                <div className="flex items-center gap-1 text-[10px] text-gray-400 font-medium mt-1">
                  <Clock className="w-3 h-3" />
                  <span>{notif.timestamp}</span>
                </div>
              </div>

              <ExternalLink className="w-3.5 h-3.5 text-gray-400 hover:text-[#5a36e6] shrink-0 mt-1" />
            </div>
          ))
        )}
      </div>
    </div>
  );
};

