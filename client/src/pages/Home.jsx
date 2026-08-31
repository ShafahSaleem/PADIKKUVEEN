import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { toast } from 'react-hot-toast';

const Home = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLiveExamsClick = () => {
    if (!user) {
      navigate('/login');
    } else if (user.role === 'admin') {
      navigate('/admin/exams');
    } else {
      navigate('/student-dashboard');
    }
  };

  const handleInstantResultsClick = () => {
    if (!user) {
      navigate('/login');
    } else if (user.role === 'admin') {
      navigate('/admin-dashboard');
    } else {
      navigate('/my-results');
    }
  };

  const handleAdminControlsClick = () => {
    if (!user) {
      navigate('/login');
    } else if (user.role === 'admin') {
      navigate('/admin-dashboard');
    } else {
      toast.error('Admin access required. Please sign in with an admin account.');
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center px-4 py-12 home-warm-animated-bg relative overflow-hidden">
      {/* Subtle Ambient Blurred Light Orbs */}
      <div aria-hidden="true" className="ambient-light-orb-1" />
      <div aria-hidden="true" className="ambient-light-orb-2" />

      <div className="max-w-4xl text-center space-y-6 relative z-10">
        <div className="inline-block px-4 py-1.5 bg-[#D6E4F7] text-[#0F2044] border border-[#1B3A6B]/30 rounded-full text-xs font-bold tracking-wide uppercase shadow-2xs">
          Online Examination Platform
        </div>
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-[#0A1628] tracking-tight">
          Welcome to <span className="text-[#1B3A6B]">PADIKKUVEEN</span>
        </h1>
        <div className="py-1">
          <p className="animated-tagline-container text-xl sm:text-3xl font-extrabold text-[#1B3A6B] max-w-3xl mx-auto tracking-wide flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
            <span className="tagline-part-learn">Learn Today.</span>
            <span className="tagline-part-play">Play After You Pass!</span>
          </p>
        </div>
        <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
          A secure, fast, and interactive portal for online tests, student assessments, instant result analytics, and comprehensive academic growth.
        </p>

        {user ? (
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            {user.role === 'student' && (
              <>
                <Link
                  to="/student-dashboard"
                  className="w-full sm:w-auto px-8 py-3.5 bg-[#1B3A6B] hover:bg-[#0F2044] text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all"
                >
                  Go to Student Dashboard
                </Link>
                <Link
                  to="/my-results"
                  className="w-full sm:w-auto px-8 py-3.5 bg-white hover:bg-[#EEF3FB] text-[#0A1628] font-semibold rounded-xl border border-[#1B3A6B]/30 shadow-sm transition-all"
                >
                  View My Results
                </Link>
              </>
            )}
            {user.role === 'mentor' && (
              <>
                <Link
                  to="/mentor-dashboard"
                  className="w-full sm:w-auto px-8 py-3.5 bg-[#1B3A6B] hover:bg-[#0F2044] text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all"
                >
                  Go to Mentor Dashboard
                </Link>
              </>
            )}
            {user.role === 'admin' && (
              <>
                <Link
                  to="/admin-dashboard"
                  className="w-full sm:w-auto px-8 py-3.5 bg-[#1B3A6B] hover:bg-[#0F2044] text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all"
                >
                  Go to Admin Dashboard
                </Link>
                <Link
                  to="/admin/exams"
                  className="w-full sm:w-auto px-8 py-3.5 bg-white hover:bg-[#EEF3FB] text-[#0A1628] font-semibold rounded-xl border border-[#1B3A6B]/30 shadow-sm transition-all"
                >
                  Manage Exams
                </Link>
              </>
            )}
          </div>
        ) : (
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/login"
              className="w-full sm:w-auto px-8 py-3.5 bg-[#1B3A6B] hover:bg-[#0F2044] text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="w-full sm:w-auto px-8 py-3.5 bg-white hover:bg-[#EEF3FB] text-[#0A1628] font-semibold rounded-xl border border-[#1B3A6B]/30 shadow-sm transition-all"
            >
              Student Registration
            </Link>
          </div>
        )}

        {/* 3 Interactive Dashboard Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-10 text-left">
          {/* 1. Live Examinations */}
          <div
            onClick={handleLiveExamsClick}
            className="group p-6 bg-white rounded-2xl border border-[#1B3A6B]/20 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-200 cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="h-12 w-12 bg-[#D6E4F7] group-hover:bg-[#1B3A6B] group-hover:text-white text-[#1B3A6B] rounded-xl flex items-center justify-center font-bold text-2xl mb-4 transition-colors duration-200">
                📝
              </div>
              <h3 className="text-xl font-bold text-[#0A1628] group-hover:text-[#1B3A6B] transition-colors mb-2">
                Live Examinations
              </h3>
              <p className="text-[#1B3A6B]/70 text-sm leading-relaxed mb-4">
                Take timed online exams with instant question navigation and automated submission.
              </p>
            </div>
            <div className="pt-3 border-t border-[#1B3A6B]/10 flex items-center text-sm font-bold text-[#1B3A6B] group-hover:text-[#0F2044]">
              <span>{user?.role === 'admin' ? 'Manage Live Exams' : 'Start an Exam'}</span>
              <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
            </div>
          </div>

          {/* 2. Instant Results */}
          <div
            onClick={handleInstantResultsClick}
            className="group p-6 bg-white rounded-2xl border border-[#1B3A6B]/20 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-200 cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="h-12 w-12 bg-green-50 group-hover:bg-[#16A34A] group-hover:text-white text-[#16A34A] rounded-xl flex items-center justify-center font-bold text-2xl mb-4 transition-colors duration-200">
                📊
              </div>
              <h3 className="text-xl font-bold text-[#0F172A] group-hover:text-[#16A34A] transition-colors mb-2">
                Instant Results
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed mb-4">
                Get score breakdowns, correct answers percentage, and historical test reports immediately.
              </p>
            </div>
            <div className="pt-3 border-t border-gray-100 flex items-center text-sm font-bold text-[#16A34A] group-hover:text-green-700">
              <span>View Results</span>
              <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
            </div>
          </div>

          {/* 3. Subject Categories & Practice */}
          <div
            onClick={() => {
              if (user?.role === 'admin') {
                navigate('/admin/categories');
              } else if (user) {
                navigate('/student-dashboard');
              } else {
                navigate('/login');
              }
            }}
            className="group p-6 bg-white rounded-2xl border border-[#1B3A6B]/20 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-200 cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="h-12 w-12 bg-[#D6E4F7] group-hover:bg-[#1B3A6B] group-hover:text-white text-[#1B3A6B] rounded-xl flex items-center justify-center font-bold text-2xl mb-4 transition-colors duration-200">
                📚
              </div>
              <h3 className="text-xl font-bold text-[#0A1628] group-hover:text-[#1B3A6B] transition-colors mb-2">
                Subject Categories
              </h3>
              <p className="text-[#1B3A6B]/70 text-sm leading-relaxed mb-4">
                Explore examinations categorized by subjects including JavaScript, React, Database, and more.
              </p>
            </div>
            <div className="pt-3 border-t border-[#1B3A6B]/10 flex items-center text-sm font-bold text-[#1B3A6B] group-hover:text-[#0F2044]">
              <span>{user?.role === 'admin' ? 'Manage Categories' : 'Browse Categories'}</span>
              <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
