import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import toast from 'react-hot-toast';
import { AuthContext } from '../context/AuthContext';
import { EyeIcon, EyeSlashIcon, EnvelopeIcon, LockClosedIcon } from '@heroicons/react/24/outline';

const Login = () => {
  const navigate = useNavigate();
  const { login, googleLogin } = useContext(AuthContext);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const isGoogleConfigured = Boolean(
    googleClientId &&
    !googleClientId.includes('your_google_client_id_here') &&
    googleClientId.trim() !== ''
  );

  const redirectByRole = (user) => {
    if (user?.role === 'admin') {
      navigate('/admin-dashboard');
    } else if (user?.role === 'mentor') {
      navigate('/mentor-dashboard');
    } else {
      navigate('/student-dashboard');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { user } = await login(email, password);
      toast.success(`Welcome back, ${user?.name || 'User'}!`);
      redirectByRole(user);
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed. Please check your credentials.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setError('');
    setGoogleLoading(true);
    try {
      if (!credentialResponse?.credential) {
        throw new Error('No Google credentials received');
      }
      const { user } = await googleLogin(credentialResponse.credential);
      toast.success(`Signed in with Google as ${user?.name || user?.email}!`);
      redirectByRole(user);
    } catch (err) {
      console.error('Google Login Error:', err);
      const msg =
        err.response?.data?.message ||
        'Google authentication failed. Please check backend connection or try again.';
      setError(msg);
      toast.error(msg);
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleGoogleError = () => {
    const msg = 'Google Sign-In failed or was blocked by browser. Please check popups/ad-blocker.';
    setError(msg);
    toast.error(msg);
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
        {/* Email Input */}
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

        {/* Password Input */}
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
            className="absolute right-3.5 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
          >
            {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
          </button>
        </div>

        {/* Normal Sign In Button */}
        <button
          type="submit"
          disabled={loading || googleLoading}
          className="w-full py-3 bg-[#1B3A6B] hover:bg-[#0F2044] text-white font-bold rounded-xl shadow transition-colors disabled:bg-[#6B7E99] flex items-center justify-center text-sm cursor-pointer"
        >
          {loading && (
            <svg className="animate-spin h-5 w-5 mr-2 text-white" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
          )}
          {loading ? 'Signing in...' : 'Sign In'}
        </button>

        {/* Error Alert */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-[#DC2626] text-xs font-semibold rounded-xl text-center">
            {error}
          </div>
        )}

        {/* OR Divider */}
        <div className="relative my-4 flex items-center justify-center">
          <div className="border-t border-gray-300 w-full"></div>
          <span className="bg-white px-3 text-xs uppercase font-bold text-gray-500 tracking-wider">
            OR
          </span>
          <div className="border-t border-gray-300 w-full"></div>
        </div>

        {/* Continue with Google */}
        <div className="flex flex-col items-center justify-center w-full min-h-[44px]">
          {googleLoading ? (
            <div className="flex items-center justify-center py-2 text-xs font-semibold text-gray-500">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#1B3A6B] mr-2"></div>
              Authenticating with Google...
            </div>
          ) : isGoogleConfigured ? (
            <div className="w-full flex justify-center">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                useOneTap={false}
                shape="rectangular"
                size="large"
                theme="outline"
                text="continue_with"
                width="360"
              />
            </div>
          ) : (
            <div className="w-full text-center p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600">
              <p className="font-semibold">Google Sign-In</p>
              <p className="text-[11px] text-gray-500 mt-0.5">
                Set <code className="font-mono bg-gray-100 px-1 py-0.5 rounded">VITE_GOOGLE_CLIENT_ID</code> in environment variables to enable.
              </p>
            </div>
          )}
        </div>

        {/* Register Link */}
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
