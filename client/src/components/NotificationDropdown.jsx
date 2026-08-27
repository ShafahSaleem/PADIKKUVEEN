import React, { useState, useRef, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { NotificationContext } from '../context/NotificationContext';
import { getNotificationIcon, formatTimeAgo } from '../pages/NotificationsPage';

const NotificationDropdown = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useContext(NotificationContext);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleItemClick = (n) => {
    if (!n.read) {
      markAsRead(n._id);
    }
    setIsOpen(false);
    if (n.link) {
      navigate(n.link);
    } else {
      navigate('/notifications');
    }
  };

  const recentList = notifications.slice(0, 5);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button with Unread Badge (Transparent Outline Bell) */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative p-2 rounded-xl bg-transparent hover:bg-white/10 text-gray-200 hover:text-white transition-all flex items-center justify-center font-bold"
        aria-label="Notifications"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.8}
          stroke="currentColor"
          className="w-5 h-5 transition-transform hover:scale-105"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
          />
        </svg>

        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-[#1B3A6B] text-white text-[10px] font-extrabold rounded-full flex items-center justify-center shadow-md border border-[#0A1628]">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-3xl shadow-2xl border border-[#1B3A6B]/20 py-3 z-50 animate-fade-in text-[#0A1628]">
          {/* Panel Header */}
          <div className="px-4 py-2 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-sm text-[#0A1628]">Notifications</h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 bg-[#D6E4F7] text-[#1B3A6B] text-[10px] font-bold rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-[11px] font-bold text-[#1B3A6B] hover:underline"
              >
                Mark all as read
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-gray-100">
            {recentList.length === 0 ? (
              <div className="text-center py-8 px-4 text-gray-500">
                <span className="text-3xl block mb-1">🔔</span>
                <p className="text-xs font-semibold">No notifications right now</p>
                <p className="text-[10px] text-gray-400 mt-0.5">We'll alert you when updates arrive.</p>
              </div>
            ) : (
              recentList.map((n) => {
                const icon = getNotificationIcon(n.type);
                const timeAgo = formatTimeAgo(n.createdAt);

                return (
                  <div
                    key={n._id}
                    onClick={() => handleItemClick(n)}
                    className={`px-4 py-3 cursor-pointer transition-colors flex items-start gap-3 ${
                      !n.read ? 'bg-[#D6E4F7]/60 hover:bg-[#D6E4F7]' : 'hover:bg-gray-50'
                    }`}
                  >
                    <span className="text-xl shrink-0 mt-0.5">{icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <p
                          className={`text-xs truncate ${
                            !n.read ? 'font-extrabold text-[#1F2937]' : 'font-semibold text-gray-700'
                          }`}
                        >
                          {n.title}
                        </p>
                        <span className="text-[10px] text-gray-400 shrink-0 font-mono">{timeAgo}</span>
                      </div>
                      <p className="text-[11px] text-gray-600 line-clamp-2 mt-0.5 leading-snug">
                        {n.message}
                      </p>
                    </div>
                    {!n.read && (
                      <span className="h-2 w-2 rounded-full bg-[#1B3A6B] shrink-0 mt-1.5"></span>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Panel Footer */}
          <div className="px-4 pt-2 border-t border-gray-100 text-center">
            <Link
              to="/notifications"
              onClick={() => setIsOpen(false)}
              className="text-xs font-bold text-[#1B3A6B] hover:underline block py-1"
            >
              View all notifications ({notifications.length}) →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
