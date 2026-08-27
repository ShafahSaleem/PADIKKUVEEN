import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { EyeIcon, EyeSlashIcon, EnvelopeIcon, LockClosedIcon } from '@heroicons/react/24/outline';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { user } = await login(email, password);
      if (user?.role === 'student') {
        navigate('/student-dashboard');
      } else if (user?.role === 'admin') {
        navigate('/admin-dashboard');
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-16 p-8 bg-white rounded-2xl shadow-lg border border-[#1B3A6B]/20">
      <div className="text-center mb-6">
        <span className="inline-block px-3 py-1 bg-[#D6E4F7] text-[#0F2044] border border-[#1B3A6B]/30 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
          PADIKKUVEEN Account
        </span>
        <h2 className="text-2xl font-extrabold text-[#0A1628]">Sign In</h2>
        <p className="text-[#1B3A6B]/70 text-xs mt-1">Learn Today. Play After You Pass!</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <EnvelopeIcon className="absolute left-3.5 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full pl-11 pr-4 py-2.5 border border-[#1B3A6B]/40 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4A9EE8] text-sm text-[#0A1628]"
          />
        </div>
        <div className="relative">
          <LockClosedIcon className="absolute left-3.5 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type={showPassword ? 'text' : 'password'}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full pl-11 pr-11 py-2.5 border border-[#1B3A6B]/40 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4A9EE8] text-sm text-[#0A1628]"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3.5 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
          </button>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-[#1B3A6B] hover:bg-[#0F2044] text-white font-bold rounded-xl shadow transition-colors disabled:bg-[#6B7E99] flex items-center justify-center text-sm"
        >
          {loading && (
            <svg className="animate-spin h-5 w-5 mr-2 text-white" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
          )}
          {loading ? 'Signing in...' : 'Sign In'}
        </button>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-[#DC2626] text-xs font-semibold rounded-xl text-center">
            {error}
          </div>
        )}

        <div className="pt-2 text-center text-xs text-gray-600">
          Don't have an account?{' '}
          <Link to="/register" className="font-bold text-[#1B3A6B] hover:underline">
            Register as Student
          </Link>
        </div>
      </form>
    </div>
  );
};

export default Login;
