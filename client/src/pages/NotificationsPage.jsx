import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { NotificationContext } from '../context/NotificationContext';

export const getNotificationIcon = (type) => {
  switch (type) {
    case 'exam':
      return '🎓';
    case 'result':
      return '🎉';
    case 'reminder':
      return '⏰';
    case 'announcement':
    default:
      return '📢';
  }
};

export const formatTimeAgo = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min${diffMins === 1 ? '' : 's'} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

const NotificationsPage = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification } =
    useContext(NotificationContext);
  const [filter, setFilter] = useState('all'); // 'all' | 'unread'
  const navigate = useNavigate();

  const filteredNotifications =
    filter === 'unread' ? notifications.filter((n) => !n.read) : notifications;

  const handleNotificationClick = (n) => {
    if (!n.read) {
      markAsRead(n._id);
    }
    if (n.link) {
      navigate(n.link);
    }
  };

  const getActionButtonLabel = (type) => {
    switch (type) {
      case 'result':
        return 'View Result';
      case 'exam':
        return 'View Exam';
      default:
        return 'Open';
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 bg-[#EEF3FB] min-h-[calc(100vh-4rem)] space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-gray-200">
        <div>
          <h1 className="text-3xl font-extrabold text-[#0A1628] flex items-center gap-2">
            <span>🔔</span> Notifications
          </h1>
          <p className="text-gray-600 mt-1 text-sm">
            Stay updated with your exams, results, and rewards
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="px-4 py-2 bg-[#D6E4F7] hover:bg-[#1B3A6B] hover:text-white text-[#1B3A6B] text-xs font-bold rounded-xl border border-[#1B3A6B]/30 transition-colors shadow-xs"
          >
            Mark all as read
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200 pb-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
            filter === 'all'
              ? 'bg-[#0F2044] text-white shadow-xs'
              : 'bg-white text-gray-600 hover:bg-[#EEF3FB] border border-[#1B3A6B]/20'
          }`}
        >
          All ({notifications.length})
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 ${
            filter === 'unread'
              ? 'bg-[#0F2044] text-white shadow-xs'
              : 'bg-white text-gray-600 hover:bg-[#EEF3FB] border border-[#1B3A6B]/20'
          }`}
        >
          Unread
          {unreadCount > 0 && (
            <span className="px-1.5 py-0.2 bg-[#1B3A6B] text-white rounded-full text-[10px] font-extrabold">
              {unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* Notification List */}
      {filteredNotifications.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-[#1B3A6B]/20 shadow-sm p-8 max-w-lg mx-auto space-y-3">
          <span className="text-5xl">🔔</span>
          <h3 className="text-xl font-bold text-[#0A1628]">
            {filter === 'unread' ? 'No Unread Notifications' : 'No Notifications Yet'}
          </h3>
          <p className="text-gray-600 text-xs sm:text-sm">
            {filter === 'unread'
              ? "You're all caught up! There are no unread notifications right now."
              : 'You will receive updates here whenever new exams are released or results are ready.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map((n) => {
            const icon = getNotificationIcon(n.type);
            const timeAgo = formatTimeAgo(n.createdAt);

            return (
              <div
                key={n._id}
                className={`p-4 sm:p-5 rounded-2xl border transition-all duration-150 flex items-start gap-4 ${
                  !n.read
                    ? 'bg-[#D6E4F7]/50 border-[#1B3A6B]/40 shadow-sm'
                    : 'bg-white border-gray-200 hover:border-[#1B3A6B]/30'
                }`}
              >
                {/* Icon */}
                <div
                  className={`w-11 h-11 rounded-2xl flex items-center justify-center text-xl shrink-0 ${
                    !n.read ? 'bg-[#D6E4F7] border border-[#1B3A6B]/30' : 'bg-gray-100 border border-gray-200'
                  }`}
                >
                  {icon}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <h4
                        className={`text-sm sm:text-base ${
                          !n.read ? 'font-extrabold text-[#1F2937]' : 'font-semibold text-gray-800'
                        }`}
                      >
                        {n.title}
                      </h4>
                      {!n.read && (
                        <span className="h-2 w-2 rounded-full bg-[#1B3A6B] inline-block" title="Unread"></span>
                      )}
                    </div>
                    <span className="text-[11px] font-mono text-gray-400 shrink-0">{timeAgo}</span>
                  </div>

                  <p className="text-xs sm:text-sm text-gray-600 mt-1 leading-relaxed">{n.message}</p>

                  {/* Actions */}
                  <div className="flex items-center gap-3 mt-3">
                    {n.link && (
                      <button
                        onClick={() => handleNotificationClick(n)}
                        className="px-3.5 py-1.5 bg-[#1B3A6B] hover:bg-[#0F2044] text-white text-xs font-bold rounded-xl transition-colors shadow-xs"
                      >
                        {getActionButtonLabel(n.type)} →
                      </button>
                    )}

                    {!n.read && (
                      <button
                        onClick={() => markAsRead(n._id)}
                        className="text-xs font-semibold text-gray-500 hover:text-[#1B3A6B] transition-colors"
                      >
                        Mark as read
                      </button>
                    )}

                    <button
                      onClick={() => deleteNotification(n._id)}
                      className="text-xs font-semibold text-red-500 hover:text-red-700 transition-colors ml-auto"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
