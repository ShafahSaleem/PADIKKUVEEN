import React, { useState, useEffect, useContext, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import {
  MagnifyingGlassIcon,
  TrashIcon,
  EyeIcon,
  ArrowPathIcon,
  XMarkIcon,
  UserIcon,
  UserPlusIcon,
  ShieldCheckIcon,
  AcademicCapIcon,
  FunnelIcon,
  DocumentPlusIcon,
  DocumentTextIcon,
  ClipboardDocumentCheckIcon,
  CheckCircleIcon,
  ClockIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';

const AdminDashboard = () => {
  const { user: currentUser } = useContext(AuthContext);

  // 1. Statistics State
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalStudents: 0,
    totalExams: 0,
    totalAttempts: 0,
  });
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState('');

  // 2. Users Management State
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [usersError, setUsersError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  // 3. Recent Activity State
  const [activities, setActivities] = useState([]);
  const [activitiesLoading, setActivitiesLoading] = useState(true);
  const [activitiesError, setActivitiesError] = useState('');

  // Fetch real-time statistics from MongoDB
  const fetchStats = useCallback(async () => {
    try {
      setStatsLoading(true);
      const response = await api.get('/admin/stats');
      if (response.data) {
        setStats(response.data);
      }
    } catch (err) {
      console.error('Failed to fetch admin stats:', err);
      setStatsError(err.response?.data?.message || 'Failed to load statistics');
    } finally {
      setStatsLoading(false);
    }
  }, []);

  // Fetch all registered users from MongoDB
  const fetchUsers = useCallback(async () => {
    try {
      setUsersLoading(true);
      setUsersError('');
      const response = await api.get('/admin/users');
      const data = response.data.users ? response.data.users : response.data;
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch registered users:', err);
      setUsersError(err.response?.data?.message || 'Failed to load registered users');
    } finally {
      setUsersLoading(false);
    }
  }, []);

  // Fetch recent platform activities from MongoDB
  const fetchActivities = useCallback(async () => {
    try {
      setActivitiesLoading(true);
      setActivitiesError('');
      const response = await api.get('/admin/recent-activity');
      const data = response.data?.activities ? response.data.activities : response.data;
      setActivities(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch recent activities:', err);
      setActivitiesError(err.response?.data?.message || 'Failed to load recent activities');
    } finally {
      setActivitiesLoading(false);
    }
  }, []);

  // Refresh all dashboard data
  const handleRefreshAll = () => {
    fetchStats();
    fetchUsers();
    fetchActivities();
  };

  useEffect(() => {
    fetchStats();
    fetchUsers();
    fetchActivities();
  }, [fetchStats, fetchUsers, fetchActivities]);

  // Filter users based on search term (name or email) and role
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const nameMatch = u.name?.toLowerCase().includes(searchTerm.toLowerCase());
      const emailMatch = u.email?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSearch = nameMatch || emailMatch;

      const matchesRole =
        roleFilter === 'all' || u.role?.toLowerCase() === roleFilter.toLowerCase();

      return matchesSearch && matchesRole;
    });
  }, [users, searchTerm, roleFilter]);

  // Handle user deletion with confirmation and safety check
  const handleDeleteUser = async (userToDelete) => {
    const currentUserId = currentUser?._id || currentUser?.id;
    const targetUserId = userToDelete._id || userToDelete.id;

    if (currentUserId && String(currentUserId) === String(targetUserId)) {
      toast.error('You cannot delete your own admin account.');
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete user "${userToDelete.name}" (${userToDelete.email})?\nThis action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      setDeletingId(targetUserId);
      const response = await api.delete(`/admin/users/${targetUserId}`);
      toast.success(response.data?.message || 'User deleted successfully');

      // Refresh users, stats, and activities
      fetchUsers();
      fetchStats();
      fetchActivities();
    } catch (err) {
      console.error('Failed to delete user:', err);
      toast.error(err.response?.data?.message || 'Failed to delete user');
    } finally {
      setDeletingId(null);
    }
  };

  // Format date helper
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return 'N/A';
    }
  };

  // Format full date for modal view
  const formatFullDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'N/A';
    }
  };

  // Friendly relative time helper
  const getRelativeTime = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const now = new Date();
      const date = new Date(dateString);
      const diffSeconds = Math.floor((now - date) / 1000);

      if (diffSeconds < 60) return 'Just now';
      const diffMinutes = Math.floor(diffSeconds / 60);
      if (diffMinutes < 60) return `${diffMinutes}m ago`;
      const diffHours = Math.floor(diffMinutes / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      const diffDays = Math.floor(diffHours / 24);
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays}d ago`;
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      return 'N/A';
    }
  };

  // Helper to render icon and colors per activity type
  const getActivityMeta = (type) => {
    switch (type) {
      case 'registration':
        return {
          emoji: '👤',
          icon: UserPlusIcon,
          badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
          iconBg: 'bg-blue-500/10 text-blue-600 border-blue-200/60',
          label: 'User Registered',
        };
      case 'exam_created':
        return {
          emoji: '📝',
          icon: DocumentPlusIcon,
          badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
          iconBg: 'bg-amber-500/10 text-amber-600 border-amber-200/60',
          label: 'Exam Created',
        };
      case 'submission':
        return {
          emoji: '📊',
          icon: ClipboardDocumentCheckIcon,
          badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          iconBg: 'bg-emerald-500/10 text-emerald-600 border-emerald-200/60',
          label: 'Exam Submitted',
        };
      case 'completion':
        return {
          emoji: '🎓',
          icon: CheckCircleIcon,
          badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
          iconBg: 'bg-purple-500/10 text-purple-600 border-purple-200/60',
          label: 'Exam Completed',
        };
      default:
        return {
          emoji: '⚡',
          icon: SparklesIcon,
          badgeColor: 'bg-gray-50 text-gray-700 border-gray-200',
          iconBg: 'bg-gray-500/10 text-gray-600 border-gray-200/60',
          label: 'Activity',
        };
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 bg-[#EEF3FB] min-h-[calc(100vh-4rem)]">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-[#0A1628] via-[#0F2044] to-[#1B3A6B] rounded-3xl p-6 sm:p-8 text-white shadow-lg mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-[#2D5DA6]/40">
        <div>
          <div className="inline-block px-3 py-1 bg-[#4A9EE8]/20 text-[#6BB5F0] border border-[#4A9EE8]/30 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
            Administrator Portal
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome, {currentUser?.name || 'Admin'}! ⚙️
          </h1>
          <p className="text-blue-100/80 mt-1 text-sm sm:text-base">
            Manage online exams, questions, scoring rules, registered users, and recent activities.
          </p>
        </div>
        <Link
          to="/admin/exams/new"
          className="px-5 py-2.5 bg-[#1B3A6B] hover:bg-[#0F2044] text-white font-bold rounded-xl shadow transition-colors text-sm border border-[#4A9EE8]/30 shrink-0"
        >
          + Create New Exam
        </Link>
      </div>

      {/* 1. Real-Time Statistics Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between gap-4 mb-4">
          <h2 className="text-2xl font-bold text-[#0A1628]">Platform Overview</h2>
          <button
            onClick={handleRefreshAll}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-[#1B3A6B] border border-[#1B3A6B]/20 rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            title="Refresh statistics, users, and activities from database"
          >
            <ArrowPathIcon
              className={`w-4 h-4 ${
                statsLoading || usersLoading || activitiesLoading ? 'animate-spin' : ''
              }`}
            />
            <span>Refresh</span>
          </button>
        </div>

        {statsError && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
            {statsError}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Users Card */}
          <div className="bg-white border border-[#1B3A6B]/20 rounded-2xl p-6 shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-200">
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-600 font-bold text-sm">👥 Total Users</span>
              <div className="h-10 w-10 bg-[#D6E4F7] text-[#1B3A6B] rounded-xl flex items-center justify-center text-xl">
                👥
              </div>
            </div>
            {statsLoading ? (
              <div className="animate-pulse h-9 bg-gray-200 rounded w-16"></div>
            ) : (
              <div className="text-3xl font-extrabold text-[#0A1628]">
                {stats.totalUsers}
              </div>
            )}
            <p className="text-xs text-gray-500 mt-2">Registered platform accounts</p>
          </div>

          {/* Total Students Card */}
          <div className="bg-white border border-[#1B3A6B]/20 rounded-2xl p-6 shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-200">
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-600 font-bold text-sm">🎓 Total Students</span>
              <div className="h-10 w-10 bg-[#D6E4F7] text-[#1B3A6B] rounded-xl flex items-center justify-center text-xl">
                🎓
              </div>
            </div>
            {statsLoading ? (
              <div className="animate-pulse h-9 bg-gray-200 rounded w-16"></div>
            ) : (
              <div className="text-3xl font-extrabold text-[#0A1628]">
                {stats.totalStudents}
              </div>
            )}
            <p className="text-xs text-gray-500 mt-2">Active student candidates</p>
          </div>

          {/* Total Exams Card */}
          <div className="bg-white border border-[#1B3A6B]/20 rounded-2xl p-6 shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-200">
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-600 font-bold text-sm">📝 Total Exams</span>
              <div className="h-10 w-10 bg-[#D6E4F7] text-[#1B3A6B] rounded-xl flex items-center justify-center text-xl">
                📝
              </div>
            </div>
            {statsLoading ? (
              <div className="animate-pulse h-9 bg-gray-200 rounded w-16"></div>
            ) : (
              <div className="text-3xl font-extrabold text-[#0A1628]">
                {stats.totalExams}
              </div>
            )}
            <p className="text-xs text-gray-500 mt-2">Configured examinations</p>
          </div>

          {/* Total Attempts Card */}
          <div className="bg-white border border-[#1B3A6B]/20 rounded-2xl p-6 shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-200">
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-600 font-bold text-sm">📊 Total Exam Attempts</span>
              <div className="h-10 w-10 bg-[#D6E4F7] text-[#1B3A6B] rounded-xl flex items-center justify-center text-xl">
                📊
              </div>
            </div>
            {statsLoading ? (
              <div className="animate-pulse h-9 bg-gray-200 rounded w-16"></div>
            ) : (
              <div className="text-3xl font-extrabold text-[#0A1628]">
                {stats.totalAttempts}
              </div>
            )}
            <p className="text-xs text-gray-500 mt-2">Submitted student attempts</p>
          </div>
        </div>
      </div>

      {/* 2. Registered Users Management Section */}
      <div className="mb-10 bg-white border border-[#1B3A6B]/20 rounded-3xl p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold text-[#0A1628]">
                Registered Users Management
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-[#1B3A6B]">
                {users.length} Total
              </span>
            </div>
            <p className="text-gray-600 text-xs sm:text-sm mt-1">
              View, search, filter, and manage all accounts stored in MongoDB.
            </p>
          </div>

          {/* Search and Role Filter Controls */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Search Input */}
            <div className="relative min-w-[240px]">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <MagnifyingGlassIcon className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name or email..."
                className="w-full pl-9 pr-8 py-2 bg-[#F8FAFC] border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B] focus:border-transparent transition-all"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Role Filter Dropdown */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <FunnelIcon className="w-4 h-4" />
              </div>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full sm:w-auto pl-9 pr-8 py-2 bg-[#F8FAFC] border border-gray-300 rounded-xl text-sm text-[#0A1628] font-medium focus:outline-none focus:ring-2 focus:ring-[#1B3A6B] focus:border-transparent transition-all cursor-pointer"
              >
                <option value="all">All Roles</option>
                <option value="student">🎓 Students</option>
                <option value="admin">⚙️ Admins</option>
              </select>
            </div>
          </div>
        </div>

        {/* Users Table Error State */}
        {usersError && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm flex items-center justify-between">
            <span>{usersError}</span>
            <button
              onClick={fetchUsers}
              className="text-xs font-bold underline hover:no-underline ml-2"
            >
              Retry
            </button>
          </div>
        )}

        {/* Users Table Container */}
        <div className="overflow-x-auto rounded-2xl border border-gray-200/80">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#0F2044] text-white text-xs uppercase tracking-wider font-semibold">
                <th className="py-3.5 px-4 sm:px-6">Name</th>
                <th className="py-3.5 px-4 sm:px-6">Email</th>
                <th className="py-3.5 px-4 sm:px-6">Role</th>
                <th className="py-3.5 px-4 sm:px-6">Registered Date</th>
                <th className="py-3.5 px-4 sm:px-6">Status</th>
                <th className="py-3.5 px-4 sm:px-6 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-sm bg-white">
              {usersLoading ? (
                // Loading Skeleton Rows
                Array.from({ length: 4 }).map((_, index) => (
                  <tr key={index} className="animate-pulse">
                    <td className="py-4 px-4 sm:px-6">
                      <div className="h-4 bg-gray-200 rounded w-28"></div>
                    </td>
                    <td className="py-4 px-4 sm:px-6">
                      <div className="h-4 bg-gray-200 rounded w-40"></div>
                    </td>
                    <td className="py-4 px-4 sm:px-6">
                      <div className="h-5 bg-gray-200 rounded-full w-16"></div>
                    </td>
                    <td className="py-4 px-4 sm:px-6">
                      <div className="h-4 bg-gray-200 rounded w-24"></div>
                    </td>
                    <td className="py-4 px-4 sm:px-6">
                      <div className="h-5 bg-gray-200 rounded-full w-14"></div>
                    </td>
                    <td className="py-4 px-4 sm:px-6 text-center">
                      <div className="h-7 bg-gray-200 rounded w-20 mx-auto"></div>
                    </td>
                  </tr>
                ))
              ) : filteredUsers.length === 0 ? (
                // Empty State
                <tr>
                  <td colSpan="6" className="py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center">
                      <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 mb-2">
                        <UserIcon className="w-6 h-6" />
                      </div>
                      <p className="text-base font-semibold text-gray-700">
                        No users found
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {searchTerm || roleFilter !== 'all'
                          ? 'Try adjusting your search query or role filter.'
                          : 'No registered users currently found in database.'}
                      </p>
                      {(searchTerm || roleFilter !== 'all') && (
                        <button
                          onClick={() => {
                            setSearchTerm('');
                            setRoleFilter('all');
                          }}
                          className="mt-3 px-3 py-1 bg-[#1B3A6B] text-white rounded-lg text-xs font-semibold hover:bg-[#0F2044] transition-colors"
                        >
                          Clear Filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                // Data Rows
                filteredUsers.map((userItem) => {
                  const isCurrentAdmin =
                    (currentUser?._id && String(currentUser._id) === String(userItem._id)) ||
                    (currentUser?.id && String(currentUser.id) === String(userItem._id));

                  const isStudent = userItem.role === 'student';
                  const isActive = (userItem.status || 'active') === 'active';

                  return (
                    <tr
                      key={userItem._id}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      {/* Name */}
                      <td className="py-3.5 px-4 sm:px-6 font-semibold text-[#0A1628]">
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-full bg-[#D6E4F7] text-[#1B3A6B] flex items-center justify-center font-bold text-xs shrink-0">
                            {userItem.name?.charAt(0)?.toUpperCase() || 'U'}
                          </div>
                          <div>
                            <div>{userItem.name}</div>
                            {isCurrentAdmin && (
                              <span className="text-[10px] text-amber-600 font-bold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                                You
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="py-3.5 px-4 sm:px-6 text-gray-600 font-mono text-xs sm:text-sm">
                        {userItem.email}
                      </td>

                      {/* Role */}
                      <td className="py-3.5 px-4 sm:px-6">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                            isStudent
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : 'bg-purple-50 text-purple-700 border-purple-200'
                          }`}
                        >
                          {isStudent ? '🎓 Student' : '⚙️ Admin'}
                        </span>
                      </td>

                      {/* Registered Date */}
                      <td className="py-3.5 px-4 sm:px-6 text-gray-600 text-xs sm:text-sm">
                        {formatDate(userItem.createdAt)}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 sm:px-6">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                            isActive
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-red-50 text-red-700 border-red-200'
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              isActive ? 'bg-emerald-500' : 'bg-red-500'
                            }`}
                          ></span>
                          {isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 sm:px-6 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {/* View Button */}
                          <button
                            onClick={() => setSelectedUser(userItem)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-[#EEF3FB] hover:bg-[#D6E4F7] text-[#1B3A6B] rounded-lg text-xs font-bold transition-colors cursor-pointer"
                            title="View User Details"
                          >
                            <EyeIcon className="w-3.5 h-3.5" />
                            <span>View</span>
                          </button>

                          {/* Delete Button */}
                          {isCurrentAdmin ? (
                            <button
                              disabled
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-gray-100 text-gray-400 rounded-lg text-xs font-medium cursor-not-allowed"
                              title="You cannot delete your own account"
                            >
                              <TrashIcon className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Delete</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => handleDeleteUser(userItem)}
                              disabled={deletingId === userItem._id}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs font-bold transition-colors disabled:opacity-50 cursor-pointer"
                              title={`Delete ${userItem.name}`}
                            >
                              <TrashIcon className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">
                                {deletingId === userItem._id ? '...' : 'Delete'}
                              </span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. Recent Activity Section */}
      <div className="mb-10 bg-white border border-[#1B3A6B]/20 rounded-3xl p-6 sm:p-8 shadow-sm">
        <div className="flex items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-2xl font-bold text-[#0A1628]">Recent Activity</h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                Live Feed
              </span>
            </div>
            <p className="text-gray-600 text-xs sm:text-sm mt-1">
              Latest registrations, exam creations, and student exam submissions from MongoDB.
            </p>
          </div>

          <button
            onClick={fetchActivities}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#EEF3FB] hover:bg-[#D6E4F7] text-[#1B3A6B] rounded-xl text-xs font-bold transition-colors cursor-pointer"
            title="Refresh Recent Activity"
          >
            <ArrowPathIcon
              className={`w-3.5 h-3.5 ${activitiesLoading ? 'animate-spin' : ''}`}
            />
            <span>Refresh Feed</span>
          </button>
        </div>

        {activitiesError && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm flex items-center justify-between">
            <span>{activitiesError}</span>
            <button
              onClick={fetchActivities}
              className="text-xs font-bold underline hover:no-underline ml-2"
            >
              Retry
            </button>
          </div>
        )}

        {/* Activities List */}
        <div className="space-y-3">
          {activitiesLoading ? (
            // Loading Skeletons
            Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="animate-pulse p-4 rounded-2xl border border-gray-100 bg-slate-50 flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3.5 flex-1">
                  <div className="h-10 w-10 bg-gray-200 rounded-xl shrink-0"></div>
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                    <div className="h-3 bg-gray-100 rounded w-1/4"></div>
                  </div>
                </div>
                <div className="h-4 bg-gray-100 rounded w-16"></div>
              </div>
            ))
          ) : activities.length === 0 ? (
            // Empty State
            <div className="py-12 text-center text-gray-500 bg-slate-50 rounded-2xl border border-gray-100">
              <div className="h-12 w-12 rounded-full bg-white border border-gray-200 mx-auto flex items-center justify-center text-gray-400 mb-2">
                <ClockIcon className="w-6 h-6" />
              </div>
              <p className="text-base font-semibold text-gray-700">
                No recent activity recorded
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                New user registrations, exam creations, and submissions will show up here automatically.
              </p>
            </div>
          ) : (
            // Activity Items
            activities.map((activity, index) => {
              const meta = getActivityMeta(activity.type);
              const Icon = meta.icon;

              return (
                <div
                  key={activity.id || index}
                  className="p-4 rounded-2xl border border-gray-200/70 hover:border-[#1B3A6B]/30 hover:bg-slate-50/60 bg-white transition-all duration-150 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
                >
                  <div className="flex items-center gap-3.5">
                    {/* Activity Icon Box */}
                    <div
                      className={`h-10 w-10 rounded-xl flex items-center justify-center border shrink-0 ${meta.iconBg}`}
                    >
                      <span className="text-lg">{meta.emoji}</span>
                    </div>

                    <div>
                      <div className="text-sm font-bold text-[#0A1628]">
                        {activity.message}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${meta.badgeColor}`}
                        >
                          {meta.label}
                        </span>
                        <span className="text-xs text-gray-400">•</span>
                        <span className="text-xs text-gray-500">
                          {formatFullDate(activity.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Relative Time Badge */}
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 shrink-0 self-start sm:self-auto pl-13 sm:pl-0">
                    <ClockIcon className="w-3.5 h-3.5 text-gray-400" />
                    <span>{getRelativeTime(activity.createdAt)}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 4. View User Details Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-200 relative">
            <button
              onClick={() => setSelectedUser(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
              title="Close modal"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="flex items-center gap-3.5 mb-6">
              <div className="h-12 w-12 rounded-2xl bg-[#D6E4F7] text-[#1B3A6B] flex items-center justify-center font-extrabold text-xl shadow-xs">
                {selectedUser.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div>
                <h3 className="text-xl font-bold text-[#0A1628]">
                  {selectedUser.name}
                </h3>
                <p className="text-xs text-gray-500">Registered User Details</p>
              </div>
            </div>

            {/* User Information Grid */}
            <div className="bg-[#EEF3FB] rounded-2xl p-5 space-y-3.5 border border-[#1B3A6B]/15 text-sm">
              <div className="flex items-center justify-between border-b border-gray-200/80 pb-2">
                <span className="text-gray-500 font-medium">Name</span>
                <span className="font-bold text-[#0A1628]">{selectedUser.name}</span>
              </div>

              <div className="flex items-center justify-between border-b border-gray-200/80 pb-2">
                <span className="text-gray-500 font-medium">Email</span>
                <span className="font-mono text-xs sm:text-sm font-semibold text-[#0A1628]">
                  {selectedUser.email}
                </span>
              </div>

              <div className="flex items-center justify-between border-b border-gray-200/80 pb-2">
                <span className="text-gray-500 font-medium">Role</span>
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                    selectedUser.role === 'student'
                      ? 'bg-blue-50 text-blue-700 border-blue-200'
                      : 'bg-purple-50 text-purple-700 border-purple-200'
                  }`}
                >
                  {selectedUser.role === 'student' ? '🎓 Student' : '⚙️ Administrator'}
                </span>
              </div>

              <div className="flex items-center justify-between border-b border-gray-200/80 pb-2">
                <span className="text-gray-500 font-medium">Account Status</span>
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold border ${
                    (selectedUser.status || 'active') === 'active'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-red-50 text-red-700 border-red-200'
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      (selectedUser.status || 'active') === 'active'
                        ? 'bg-emerald-500'
                        : 'bg-red-500'
                    }`}
                  ></span>
                  {(selectedUser.status || 'active') === 'active' ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-500 font-medium">Registered Date</span>
                <span className="font-semibold text-gray-700 text-xs sm:text-sm">
                  {formatFullDate(selectedUser.createdAt)}
                </span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="mt-6 flex items-center justify-end">
              <button
                onClick={() => setSelectedUser(null)}
                className="w-full py-2.5 bg-[#1B3A6B] hover:bg-[#0F2044] text-white font-bold rounded-xl text-sm transition-colors shadow cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Admin Quick Actions */}
      <h2 className="text-2xl font-bold text-[#0A1628] mb-6">Admin Quick Actions</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Manage Exams Card */}
        <div className="bg-white border border-[#1B3A6B]/20 rounded-2xl p-6 shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between">
          <div>
            <div className="h-12 w-12 bg-[#D6E4F7] text-[#1B3A6B] rounded-2xl flex items-center justify-center text-2xl mb-4">
              📋
            </div>
            <h3 className="text-lg font-bold text-[#0A1628] mb-2">Manage Exams</h3>
            <p className="text-gray-600 text-xs mb-6">
              View, edit, or delete existing exams. Check exam duration, marks, and status.
            </p>
          </div>
          <Link
            to="/admin/exams"
            className="w-full text-center px-4 py-2.5 bg-[#1B3A6B] hover:bg-[#0F2044] text-white font-bold rounded-xl text-xs transition-colors shadow-xs"
          >
            Go to Exams List
          </Link>
        </div>

        {/* Create Exam Card */}
        <div className="bg-white border border-[#1B3A6B]/20 rounded-2xl p-6 shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between">
          <div>
            <div className="h-12 w-12 bg-[#D6E4F7] text-[#2D5DA6] rounded-2xl flex items-center justify-center text-2xl mb-4">
              ➕
            </div>
            <h3 className="text-lg font-bold text-[#0A1628] mb-2">Create New Exam</h3>
            <p className="text-gray-600 text-xs mb-6">
              Configure a new examination with a title, description, time limit, and total marks.
            </p>
          </div>
          <Link
            to="/admin/exams/new"
            className="w-full text-center px-4 py-2.5 bg-[#1B3A6B] hover:bg-[#0F2044] text-white font-bold rounded-xl text-xs transition-colors shadow-xs"
          >
            Create Exam
          </Link>
        </div>

        {/* Manage Questions Card */}
        <div className="bg-white border border-[#1B3A6B]/20 rounded-2xl p-6 shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between">
          <div>
            <div className="h-12 w-12 bg-[#D6E4F7] text-[#1B3A6B] rounded-2xl flex items-center justify-center text-2xl mb-4">
              ❓
            </div>
            <h3 className="text-lg font-bold text-[#0A1628] mb-2">Manage Questions</h3>
            <p className="text-gray-600 text-xs mb-6">
              Add multiple-choice questions, set correct options, and adjust marks per question for each exam.
            </p>
          </div>
          <Link
            to="/admin/exams"
            className="w-full text-center px-4 py-2.5 bg-[#1B3A6B] hover:bg-[#0F2044] text-white font-bold rounded-xl text-xs transition-colors shadow-xs"
          >
            Manage via Exams
          </Link>
        </div>

        {/* Manage Categories Card */}
        <div className="bg-white border border-[#1B3A6B]/20 rounded-2xl p-6 shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between">
          <div>
            <div className="h-12 w-12 bg-[#D6E4F7] text-[#1B3A6B] rounded-2xl flex items-center justify-center text-2xl mb-4">
              📚
            </div>
            <h3 className="text-lg font-bold text-[#0A1628] mb-2">Manage Categories</h3>
            <p className="text-gray-600 text-xs mb-6">
              Create and manage subject categories (JavaScript, React, Node.js, MongoDB, etc.).
            </p>
          </div>
          <Link
            to="/admin/categories"
            className="w-full text-center px-4 py-2.5 bg-[#1B3A6B] hover:bg-[#0F2044] text-white font-bold rounded-xl text-xs transition-colors shadow-xs"
          >
            Manage Categories
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
