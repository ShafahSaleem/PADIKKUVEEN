import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import api from '../services/api';

const AdminExamForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: '',
    description: '',
    category: '',
    duration: '',
    totalMarks: '',
    passingPercentage: 50,
  });
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const initData = async () => {
      setFetching(true);
      try {
        const [catRes, examRes] = await Promise.all([
          api.get('/categories?all=true'),
          id ? api.get(`/exams/${id}`) : Promise.resolve(null),
        ]);

        setCategories(catRes.data?.categories || []);

        if (examRes?.data) {
          const exam = examRes.data.exam ? examRes.data.exam : examRes.data;
          setForm({
            title: exam.title || '',
            description: exam.description || '',
            category: exam.category?._id || exam.category || '',
            duration: exam.duration || '',
            totalMarks: exam.totalMarks || '',
            passingPercentage: exam.passingPercentage ?? 50,
          });
        }
      } catch (err) {
        console.error('Failed to load form data:', err);
        setError(err.response?.data?.message || 'Failed to load data');
      } finally {
        setFetching(false);
      }
    };

    initData();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        duration: Number(form.duration),
        totalMarks: Number(form.totalMarks),
        passingPercentage: Number(form.passingPercentage) || 50,
      };

      if (form.category) {
        payload.category = form.category;
      }

      if (id) {
        await api.put(`/exams/${id}`, payload);
      } else {
        await api.post('/exams', payload);
      }
      navigate('/admin/exams');
    } catch (err) {
      console.error('Save exam failed:', err);
      setError(err.response?.data?.message || 'Failed to save exam');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex justify-center items-center py-16">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#1B3A6B]"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 bg-[#EEF3FB] min-h-[calc(100vh-4rem)]">
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#1B3A6B]/30">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0A1628]">
            {id ? 'Edit Exam' : 'Create New Exam'}
          </h1>
          <p className="text-gray-600 text-sm mt-1">Fill out the details below to configure the examination.</p>
        </div>
        <div className="flex items-center gap-2">
          {id && (
            <Link
              to={`/admin/exams/${id}/questions/new`}
              className="text-xs font-bold bg-emerald-50 text-[#16A34A] hover:bg-emerald-100 px-3 py-1.5 rounded-xl border border-emerald-200 transition-colors"
            >
              + Add Question
            </Link>
          )}
          {id && (
            <Link
              to={`/admin/exams/${id}/questions`}
              className="text-xs font-bold bg-[#D6E4F7] text-[#1B3A6B] hover:bg-[#1B3A6B] hover:text-white px-3 py-1.5 rounded-xl border border-[#1B3A6B]/30 transition-colors"
            >
              Manage Questions
            </Link>
          )}
          <Link
            to="/admin/exams"
            className="text-sm font-semibold text-[#1B3A6B] hover:text-[#0A1628] px-3 py-1.5 rounded-xl border border-[#1B3A6B]/30 hover:bg-[#EEF3FB]"
          >
            Cancel
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 mb-6 bg-red-50 border border-red-200 text-[#DC2626] rounded-2xl text-sm font-semibold">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-[#1B3A6B]/20 space-y-6">
        <div>
          <label className="block text-sm font-bold text-[#0A1628] mb-2">Exam Title *</label>
          <input
            type="text"
            name="title"
            value={form.title}
            onChange={handleChange}
            placeholder="e.g. JavaScript Fundamentals & ES6"
            required
            className="w-full px-4 py-2.5 border border-[#1B3A6B]/30 rounded-xl focus:ring-2 focus:ring-[#4A9EE8] focus:outline-none text-sm text-[#0A1628]"
          />
        </div>

        {/* Category Selector */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-bold text-[#0A1628]">Subject Category</label>
            <Link
              to="/admin/categories"
              target="_blank"
              className="text-xs text-[#1B3A6B] hover:underline font-semibold"
            >
              + Manage Categories
            </Link>
          </div>
          <select
            name="category"
            value={form.category}
            onChange={handleChange}
            className="w-full px-4 py-2.5 border border-[#1B3A6B]/30 rounded-xl focus:ring-2 focus:ring-[#4A9EE8] focus:outline-none text-sm text-[#0A1628] bg-white"
          >
            <option value="">-- Select Category (Optional) --</option>
            {categories.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name} {!c.enabled ? '(Disabled)' : ''}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-bold text-[#0A1628] mb-2">Description</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            rows={3}
            placeholder="Provide guidelines and topics covered in this exam..."
            className="w-full px-4 py-2.5 border border-[#1B3A6B]/30 rounded-xl focus:ring-2 focus:ring-[#4A9EE8] focus:outline-none text-sm text-[#0A1628]"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-bold text-[#0A1628] mb-2">Duration (mins) *</label>
            <input
              type="number"
              name="duration"
              value={form.duration}
              onChange={handleChange}
              placeholder="e.g. 30"
              required
              min="1"
              className="w-full px-4 py-2.5 border border-[#1B3A6B]/30 rounded-xl focus:ring-2 focus:ring-[#4A9EE8] focus:outline-none text-sm text-[#0A1628]"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-[#0A1628] mb-2">Total Marks *</label>
            <input
              type="number"
              name="totalMarks"
              value={form.totalMarks}
              onChange={handleChange}
              placeholder="e.g. 100"
              required
              min="1"
              className="w-full px-4 py-2.5 border border-[#1B3A6B]/30 rounded-xl focus:ring-2 focus:ring-[#4A9EE8] focus:outline-none text-sm text-[#0A1628]"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-[#0A1628] mb-2">Passing Score (%)</label>
            <input
              type="number"
              name="passingPercentage"
              value={form.passingPercentage}
              onChange={handleChange}
              placeholder="e.g. 50"
              min="1"
              max="100"
              className="w-full px-4 py-2.5 border border-[#1B3A6B]/30 rounded-xl focus:ring-2 focus:ring-[#4A9EE8] focus:outline-none text-sm text-[#0A1628]"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
          <Link
            to="/admin/exams"
            className="px-5 py-2.5 text-gray-700 hover:bg-gray-100 rounded-xl text-sm font-semibold transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 bg-[#1B3A6B] hover:bg-[#0F2044] text-white rounded-xl text-sm font-bold shadow transition-colors disabled:bg-gray-400"
          >
            {loading ? 'Saving Exam...' : id ? 'Update Exam' : 'Create Exam'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminExamForm;
