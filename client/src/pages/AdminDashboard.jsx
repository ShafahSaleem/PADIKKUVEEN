import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const AdminDashboard = () => {
  const { user } = useContext(AuthContext);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 bg-[#EEF3FB] min-h-[calc(100vh-4rem)]">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-[#0A1628] via-[#0F2044] to-[#1B3A6B] rounded-3xl p-6 sm:p-8 text-white shadow-lg mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-[#2D5DA6]/40">
        <div>
          <div className="inline-block px-3 py-1 bg-[#4A9EE8]/20 text-[#6BB5F0] border border-[#4A9EE8]/30 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
            Administrator Portal
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome, {user?.name || 'Admin'}! ⚙️
          </h1>
          <p className="text-blue-100/80 mt-1 text-sm sm:text-base">
            Manage online exams, questions, scoring rules, and student submissions.
          </p>
        </div>
        <Link
          to="/admin/exams/new"
          className="px-5 py-2.5 bg-[#1B3A6B] hover:bg-[#0F2044] text-white font-bold rounded-xl shadow transition-colors text-sm border border-[#4A9EE8]/30"
        >
          + Create New Exam
        </Link>
      </div>

      <h2 className="text-2xl font-bold text-[#0A1628] mb-6">Admin Quick Actions</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Manage Exams Card */}
        <div className="bg-white border border-[#1B3A6B]/20 rounded-2xl p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between">
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
            className="w-full text-center px-4 py-2.5 bg-[#1B3A6B] hover:bg-[#0F2044] text-white font-bold rounded-xl text-xs transition-colors shadow-sm"
          >
            Go to Exams List
          </Link>
        </div>

        {/* Create Exam Card */}
        <div className="bg-white border border-[#1B3A6B]/20 rounded-2xl p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between">
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
            className="w-full text-center px-4 py-2.5 bg-[#1B3A6B] hover:bg-[#0F2044] text-white font-bold rounded-xl text-xs transition-colors shadow-sm"
          >
            Create Exam
          </Link>
        </div>

        {/* Manage Questions Card */}
        <div className="bg-white border border-[#1B3A6B]/20 rounded-2xl p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between">
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
            className="w-full text-center px-4 py-2.5 bg-[#1B3A6B] hover:bg-[#0F2044] text-white font-bold rounded-xl text-xs transition-colors shadow-sm"
          >
            Manage via Exams
          </Link>
        </div>

        {/* Manage Categories Card */}
        <div className="bg-white border border-[#1B3A6B]/20 rounded-2xl p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between">
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
            className="w-full text-center px-4 py-2.5 bg-[#1B3A6B] hover:bg-[#0F2044] text-white font-bold rounded-xl text-xs transition-colors shadow-sm"
          >
            Manage Categories
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
