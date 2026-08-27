import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { toast } from 'react-hot-toast';

const NOTIFICATION_TYPES = [
  { value: 'exam', label: '🎓 New Exam', placeholder: 'JavaScript Advanced Test is now available.' },
  { value: 'announcement', label: '📢 Announcement', placeholder: 'Welcome to the new academic term on PADIKKUVEEN!' },
  { value: 'reminder', label: '⏰ Exam Reminder', placeholder: 'Your scheduled test starts in 30 minutes.' },
  { value: 'announcement', label: '⚠️ Important Notice', placeholder: 'System maintenance scheduled for tonight.' },
];

const AdminNotifications = () => {
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'announcement',
    audience: 'all',
    studentId: '',
    link: '',
  });
  const [students, setStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    // Optionally fetch student users for specific targeting
    const fetchStudents = async () => {
      setLoadingStudents(true);
      try {
        const res = await api.get('/auth/users').catch(() => null);
        if (res?.data?.users) {
          setStudents(res.data.users.filter((u) => u.role === 'student'));
        }
      } catch (err) {
        console.warn('Could not load user list for targeting:', err);
      } finally {
        setLoadingStudents(false);
      }
    };
    fetchStudents();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.message.trim()) {
      toast.error('Title and message are required');
      return;
    }

    if (formData.audience === 'specific' && !formData.studentId) {
      toast.error('Please select or specify a student');
      return;
    }

    setSending(true);
    try {
      const res = await api.post('/notifications', formData);
      toast.success(res.data.message || 'Notification sent successfully!');
      setFormData({
        title: '',
        message: '',
        type: 'announcement',
        audience: 'all',
        studentId: '',
        link: '',
      });
    } catch (err) {
      console.error('Failed to send notification:', err);
      toast.error(err.response?.data?.message || 'Failed to send notification');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 bg-[#EEF3FB] min-h-[calc(100vh-4rem)] space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-gray-200">
        <div>
          <h1 className="text-3xl font-extrabold text-[#0A1628] flex items-center gap-2">
            <span>📢</span> Send Notifications & Announcements
          </h1>
          <p className="text-gray-600 mt-1 text-sm">
            Broadcast notifications or send targeted reminders to students
          </p>
        </div>
        <Link
          to="/admin-dashboard"
          className="px-4 py-2 bg-white hover:bg-[#EEF3FB] text-[#0A1628] text-xs font-bold rounded-xl border border-[#1B3A6B]/20 transition-colors"
        >
          ← Admin Dashboard
        </Link>
      </div>

      {/* Main Creation Card */}
      <div className="bg-white border border-[#1B3A6B]/20 rounded-3xl p-6 sm:p-8 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Notification Type Selector */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              Notification Category
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {NOTIFICATION_TYPES.map((t, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      type: t.value,
                      title: prev.title || t.label.replace(/^[^\w]+/, ''),
                    }))
                  }
                  className={`p-3 rounded-2xl text-xs font-bold text-left border transition-all ${
                    formData.type === t.value
                      ? 'bg-[#D6E4F7] border-[#1B3A6B] text-[#0A1628] shadow-xs ring-1 ring-[#1B3A6B]'
                      : 'bg-white border-gray-200 text-gray-700 hover:bg-[#EEF3FB]'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              Notification Title *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g. New Exam Available"
              required
              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#4A9EE8] text-[#0A1628]"
            />
          </div>

          {/* Message */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              Message Content *
            </label>
            <textarea
              name="message"
              value={formData.message}
              onChange={handleChange}
              rows="4"
              placeholder="Write the announcement or reminder message here..."
              required
              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#4A9EE8] text-[#0A1628]"
            ></textarea>
          </div>

          {/* Audience Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                Target Audience
              </label>
              <select
                name="audience"
                value={formData.audience}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#4A9EE8] text-[#0A1628]"
              >
                <option value="all">👥 All Students (Broadcast)</option>
                <option value="specific">👤 Specific Student</option>
              </select>
            </div>

            {formData.audience === 'specific' ? (
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Select Student
                </label>
                {students.length > 0 ? (
                  <select
                    name="studentId"
                    value={formData.studentId}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#4A9EE8] text-[#0A1628]"
                  >
                    <option value="">-- Choose Student --</option>
                    {students.map((s) => (
                      <option key={s._id} value={s._id}>
                        {s.name || s.email} ({s.email})
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    name="studentId"
                    value={formData.studentId}
                    onChange={handleChange}
                    placeholder="Enter Student User ObjectId"
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#4A9EE8] text-[#0A1628]"
                  />
                )}
              </div>
            ) : (
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Action Link (Optional)
                </label>
                <input
                  type="text"
                  name="link"
                  value={formData.link}
                  onChange={handleChange}
                  placeholder="e.g. /student-dashboard or /my-results"
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#4A9EE8] text-[#0A1628]"
                />
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
            <button
              type="submit"
              disabled={sending}
              className="px-6 py-3 bg-[#1B3A6B] hover:bg-[#0F2044] text-white font-bold rounded-2xl shadow transition-colors text-sm disabled:opacity-50 flex items-center gap-2"
            >
              <span>🚀</span> {sending ? 'Sending Notification...' : 'Send Notification'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminNotifications;
