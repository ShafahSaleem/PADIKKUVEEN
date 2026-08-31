import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import NotificationDropdown from './NotificationDropdown';
import NavbarSearch from './NavbarSearch';

export default function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const isStudent = user?.role === 'student';
  const isAdmin = user?.role === 'admin';
  const isMentor = user?.role === 'mentor';

  const handleLogout = () => {
    logout();
    navigate('/login');
    setOpen(false);
  };

  return (
    <nav className="bg-[#0A1628] text-white sticky top-0 z-50 shadow-lg border-b border-[#1E3A6B]/70">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Logo */}
          <div className="flex items-center space-x-3 shrink-0">
            <Link
              to="/"
              className="text-xl font-extrabold tracking-tight text-white hover:opacity-90 transition-opacity flex items-center gap-2"
            >
              <span className="text-2xl">🎓</span>
              <span className="text-white tracking-wide">
                PADIKKUVEEN
              </span>
            </Link>
          </div>

          {/* Center Search Bar (Desktop) */}
          <div className="hidden md:flex flex-1 items-center justify-center max-w-sm lg:max-w-md mx-2">
            <NavbarSearch />
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:space-x-3 shrink-0">
            <Link
              to="/"
              className="px-3 py-2 rounded-lg text-sm font-medium text-blue-100 hover:text-white hover:bg-[#1B3A6B] transition-colors"
            >
              Home
            </Link>

            {/* Student Navigation */}
            {isStudent && (
              <>
                <Link
                  to="/student-dashboard"
                  className="px-3 py-2 rounded-lg text-sm font-medium text-blue-100 hover:text-white hover:bg-[#1B3A6B] transition-colors"
                >
                  Dashboard
                </Link>
                <Link
                  to="/my-results"
                  className="px-3 py-2 rounded-lg text-sm font-medium text-blue-100 hover:text-white hover:bg-[#1B3A6B] transition-colors"
                >
                  My Results
                </Link>
              </>
            )}

            {/* Mentor Navigation */}
            {isMentor && (
              <>
                <Link
                  to="/mentor-dashboard"
                  className="px-3 py-2 rounded-lg text-sm font-medium text-blue-100 hover:text-white hover:bg-[#1B3A6B] transition-colors"
                >
                  Mentor Dashboard
                </Link>
              </>
            )}

            {/* Admin Navigation */}
            {isAdmin && (
              <>
                <Link
                  to="/admin-dashboard"
                  className="px-3 py-2 rounded-lg text-sm font-medium text-blue-100 hover:text-white hover:bg-[#1B3A6B] transition-colors"
                >
                  Dashboard
                </Link>
                <Link
                  to="/admin/exams"
                  className="px-3 py-2 rounded-lg text-sm font-medium text-blue-100 hover:text-white hover:bg-[#1B3A6B] transition-colors"
                >
                  Manage Exams
                </Link>
                <Link
                  to="/admin/categories"
                  className="px-3 py-2 rounded-lg text-sm font-medium text-blue-100 hover:text-white hover:bg-[#1B3A6B] transition-colors"
                >
                  Categories
                </Link>
              </>
            )}

            {/* Notifications Bell Dropdown */}
            {user && <NotificationDropdown />}

            {/* Auth Actions */}
            {user ? (
              <div className="flex items-center pl-4 space-x-3 border-l border-[#1E3A6B]">
                <span className="text-xs font-semibold text-blue-100 bg-[#1B3A6B]/80 border border-[#2D5DA6]/60 px-3 py-1 rounded-full">
                  {user.name} ({user.role})
                </span>
                <button
                  onClick={handleLogout}
                  className="px-3.5 py-1.5 rounded-lg text-sm font-semibold bg-[#DC2626] hover:bg-red-700 text-white transition-colors shadow-sm cursor-pointer"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center pl-4 space-x-2 border-l border-[#1E3A6B]">
                <Link
                  to="/login"
                  className="px-3.5 py-1.5 rounded-lg text-sm font-medium text-blue-100 hover:text-white hover:bg-[#1B3A6B] transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-1.5 rounded-lg text-sm font-semibold bg-[#1B3A6B] hover:bg-[#0F2044] text-white shadow transition-colors"
                >
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile search, notification bell & hamburger */}
          <div className="flex items-center gap-1.5 sm:gap-2 md:hidden">
            <NavbarSearch isMobile={true} />
            {user && <NotificationDropdown />}
            <button
              onClick={() => setOpen(!open)}
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-lg text-gray-300 hover:text-white hover:bg-gray-800 focus:outline-none shrink-0"
              aria-controls="mobile-menu"
              aria-expanded={open}
            >
              <span className="sr-only">Open main menu</span>
              {open ? (
                <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
              ) : (
                <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {open && (
        <div className="md:hidden border-t border-[#1E3A6B] bg-[#0F2044] px-4 pt-2 pb-4 space-y-1" id="mobile-menu">
          <Link
            to="/"
            onClick={() => setOpen(false)}
            className="block px-3 py-2 rounded-lg text-base font-medium text-blue-100 hover:text-white hover:bg-[#1B3A6B]"
          >
            Home
          </Link>

          {isStudent && (
            <>
              <Link
                to="/student-dashboard"
                onClick={() => setOpen(false)}
                className="block px-3 py-2 rounded-lg text-base font-medium text-blue-100 hover:text-white hover:bg-[#1B3A6B]"
              >
                Dashboard
              </Link>
              <Link
                to="/my-results"
                onClick={() => setOpen(false)}
                className="block px-3 py-2 rounded-lg text-base font-medium text-blue-100 hover:text-white hover:bg-[#1B3A6B]"
              >
                My Results
              </Link>
              <Link
                to="/notifications"
                onClick={() => setOpen(false)}
                className="block px-3 py-2 rounded-lg text-base font-medium text-blue-100 hover:text-white hover:bg-[#1B3A6B]"
              >
                Notifications
              </Link>
            </>
          )}

          {isMentor && (
            <>
              <Link
                to="/mentor-dashboard"
                onClick={() => setOpen(false)}
                className="block px-3 py-2 rounded-lg text-base font-medium text-blue-100 hover:text-white hover:bg-[#1B3A6B]"
              >
                Mentor Dashboard
              </Link>
              <Link
                to="/notifications"
                onClick={() => setOpen(false)}
                className="block px-3 py-2 rounded-lg text-base font-medium text-blue-100 hover:text-white hover:bg-[#1B3A6B]"
              >
                Notifications
              </Link>
            </>
          )}

          {isAdmin && (
            <>
              <Link
                to="/admin-dashboard"
                onClick={() => setOpen(false)}
                className="block px-3 py-2 rounded-lg text-base font-medium text-blue-100 hover:text-white hover:bg-[#1B3A6B]"
              >
                Dashboard
              </Link>
              <Link
                to="/admin/exams"
                onClick={() => setOpen(false)}
                className="block px-3 py-2 rounded-lg text-base font-medium text-blue-100 hover:text-white hover:bg-[#1B3A6B]"
              >
                Manage Exams
              </Link>
              <Link
                to="/admin/categories"
                onClick={() => setOpen(false)}
                className="block px-3 py-2 rounded-lg text-base font-medium text-blue-100 hover:text-white hover:bg-[#1B3A6B]"
              >
                Manage Categories
              </Link>
              <Link
                to="/notifications"
                onClick={() => setOpen(false)}
                className="block px-3 py-2 rounded-lg text-base font-medium text-blue-100 hover:text-white hover:bg-[#1B3A6B]"
              >
                My Notifications
              </Link>
            </>
          )}

          <div className="pt-4 border-t border-[#1E3A6B]">
            {user ? (
              <div className="space-y-3">
                <div className="px-3 py-1.5 text-sm text-blue-100 bg-[#1B3A6B]/70 rounded-lg">
                  Logged in as <span className="font-bold">{user.name}</span> ({user.role})
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-3 py-2 rounded-lg text-base font-semibold bg-[#DC2626] text-white"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <Link
                  to="/login"
                  onClick={() => setOpen(false)}
                  className="block px-3 py-2 rounded-lg text-base font-medium text-blue-100 hover:bg-[#1B3A6B]"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  onClick={() => setOpen(false)}
                  className="block px-3 py-2 rounded-lg text-base font-semibold bg-[#1B3A6B] text-white text-center"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
