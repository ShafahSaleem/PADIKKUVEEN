import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../services/api';
import { UserIcon, EnvelopeIcon, LockClosedIcon } from '@heroicons/react/24/outline';

const Register = () => {
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!name || !email || !password || !confirmPassword) {
      setError('All fields are required');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      const payload = { name, email, password };
      const res = await api.post('/auth/register', payload);
      setSuccess(res.data.message || 'Registration successful! Redirecting to login...');
      toast.success('Account created successfully!');
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-12 p-8 bg-white rounded-2xl shadow-lg border border-[#1B3A6B]/20">
      <div className="text-center mb-6">
        <span className="inline-block px-3 py-1 bg-[#D6E4F7] text-[#0F2044] border border-[#1B3A6B]/30 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
          New Student
        </span>
        <h2 className="text-2xl font-extrabold text-[#0A1628]">Create an Account</h2>
        <p className="text-[#1B3A6B]/70 text-xs mt-1">Register to take exams and track your progress</p>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="relative">
          <UserIcon className="absolute left-3.5 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full pl-11 pr-4 py-2.5 border border-[#1B3A6B]/40 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4A9EE8] text-sm text-[#0A1628]"
          />
        </div>

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
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full pl-11 pr-4 py-2.5 border border-[#1B3A6B]/40 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4A9EE8] text-sm text-[#0A1628]"
          />
        </div>

        <div className="relative">
          <LockClosedIcon className="absolute left-3.5 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="password"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className="w-full pl-11 pr-4 py-2.5 border border-[#1B3A6B]/40 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4A9EE8] text-sm text-[#0A1628]"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-[#1B3A6B] hover:bg-[#0F2044] text-white font-bold rounded-xl shadow transition-colors disabled:bg-[#6B7E99] flex items-center justify-center text-sm cursor-pointer"
        >
          {loading ? 'Creating Account...' : 'Register as Student'}
        </button>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-[#DC2626] text-xs font-semibold rounded-xl text-center">
            {error}
          </div>
        )}

        {success && (
          <div className="p-3 bg-green-50 border border-green-200 text-[#16A34A] text-xs font-semibold rounded-xl text-center">
            {success}
          </div>
        )}

        <div className="pt-2 text-center text-xs text-gray-600">
          Already have an account?{' '}
          <Link to="/login" className="font-bold text-[#1B3A6B] hover:underline">
            Sign In here
          </Link>
        </div>
      </form>
    </div>
  );
};

export default Register;
