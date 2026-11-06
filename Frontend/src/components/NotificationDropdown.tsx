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
    setAdminNav,
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
    await handleMarkNotificationRead(notif.id);
    if (notif.link && notif.link.startsWith('/meet/')) {
      window.location.href = notif.link;
      return;
    }
    if (notif.link === 'appointments') {
      if (portalMode === 'admin') setAdminNav('appointments');
      else setUserNav('appointments');
    } else if (notif.link === 'my-work' || notif.link === 'assigned-work') {
      setUserNav('my-work');
    } else if (notif.link === 'work-history') {
      setUserNav('work-history');
    }
    onClose();
  };

  return (
    <div
      ref={dropdownRef}
      className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150"
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
            className="text-[11px] font-bold text-gray-500 hover:text-[#5a36e6] flex items-center gap-1 transition"
            title="Mark all as read"
          >
            <CheckCheck className="w-3.5 h-3.5" /> Mark all read
          </button>
          <button onClick={onClose} className="p-1 rounded-lg text-gray-400 hover:text-gray-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* List */}
      <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
        {notifications.length === 0 ? (
          <div className="py-8 text-center text-xs text-gray-400">
            No new notifications
          </div>
        ) : (
          notifications.map(notif => (
            <div
              key={notif.id}
              onClick={() => handleNotificationClick(notif)}
              className={`p-3.5 hover:bg-purple-50/50 transition cursor-pointer flex items-start gap-3 ${!notif.read ? 'bg-indigo-50/30' : ''
                }`}
            >
              <div className="mt-1">
                <span className={`block w-2 h-2 rounded-full ${!notif.read ? 'bg-[#5a36e6]' : 'bg-gray-300'}`} />
              </div>

              <div className="flex-1 min-w-0">
                <h5 className="text-xs font-bold text-gray-900 leading-snug line-clamp-1">
                  {notif.title}
                </h5>
                <p className="text-[11px] text-gray-600 mt-0.5 leading-relaxed">
                  {notif.message}
                </p>
                <div className="flex items-center gap-1 text-[10px] text-gray-400 font-medium mt-1">
                  <Clock className="w-3 h-3" />
                  <span>{notif.timestamp}</span>
                </div>
              </div>

              {notif.link && (
                <ExternalLink className="w-3.5 h-3.5 text-gray-300 shrink-0 mt-1" />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

