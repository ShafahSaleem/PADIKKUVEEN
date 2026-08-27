import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';

const AdminQuestionForm = () => {
  const { examId, questionId } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(questionId);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    questionText: '',
    option1: '',
    option2: '',
    option3: '',
    option4: '',
    correctAnswer: '',
    marks: 1,
  });

  useEffect(() => {
    if (isEdit) {
      const fetchQuestion = async () => {
        setLoading(true);
        try {
          const res = await api.get(`/questions/${questionId}`);
          const q = res.data.question || res.data;
          setForm({
            questionText: q.questionText || '',
            option1: q.options?.[0] || '',
            option2: q.options?.[1] || '',
            option3: q.options?.[2] || '',
            option4: q.options?.[3] || '',
            correctAnswer: q.correctAnswer || '',
            marks: q.marks ?? 1,
          });
        } catch (err) {
          console.error('Failed to load question', err);
          setError(err.response?.data?.message || 'Unable to load question');
        } finally {
          setLoading(false);
        }
      };
      fetchQuestion();
    }
  }, [isEdit, questionId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    const payload = {
      questionText: form.questionText,
      options: [form.option1, form.option2, form.option3, form.option4],
      correctAnswer: form.correctAnswer,
      marks: Number(form.marks),
    };
    try {
      if (isEdit) {
        await api.put(`/questions/${questionId}`, payload);
      } else {
        await api.post(`/exams/${examId}/questions`, payload);
      }
      navigate(`/admin/exams/${examId}/questions`);
    } catch (err) {
      console.error('Submit error', err);
      setError(err.response?.data?.message || 'Failed to save question');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
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
            {isEdit ? 'Edit Question' : 'Add New Question'}
          </h1>
          <p className="text-gray-600 text-sm mt-1">Configure question text, options, correct answer, and weightage.</p>
        </div>
        <Link
          to={`/admin/exams/${examId}/questions`}
          className="text-sm font-semibold text-[#1B3A6B] hover:text-[#0A1628] px-3 py-1.5 rounded-xl border border-[#1B3A6B]/30 hover:bg-[#EEF3FB]"
        >
          Cancel
        </Link>
      </div>

      {error && (
        <div className="p-4 mb-6 bg-red-50 border border-red-200 text-[#DC2626] rounded-2xl text-sm font-semibold">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-[#1B3A6B]/20 space-y-6">
        <div>
          <label className="block text-sm font-bold text-[#0A1628] mb-2">Question Text</label>
          <textarea
            name="questionText"
            value={form.questionText}
            onChange={handleChange}
            rows={3}
            placeholder="Type your question prompt here..."
            required
            className="w-full px-4 py-2.5 border border-[#1B3A6B]/30 rounded-xl focus:ring-2 focus:ring-[#4A9EE8] focus:outline-none text-sm text-[#0A1628]"
          />
        </div>

        <div className="space-y-4">
          <label className="block text-sm font-bold text-[#0A1628]">Answer Options</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <span className="text-xs text-gray-500 font-semibold mb-1 block">Option A</span>
              <input
                name="option1"
                value={form.option1}
                onChange={handleChange}
                placeholder="Option A content"
                required
                className="w-full px-4 py-2 border border-[#1B3A6B]/30 rounded-xl focus:ring-2 focus:ring-[#4A9EE8] focus:outline-none text-sm text-[#0A1628]"
              />
            </div>
            <div>
              <span className="text-xs text-gray-500 font-semibold mb-1 block">Option B</span>
              <input
                name="option2"
                value={form.option2}
                onChange={handleChange}
                placeholder="Option B content"
                required
                className="w-full px-4 py-2 border border-[#1B3A6B]/30 rounded-xl focus:ring-2 focus:ring-[#4A9EE8] focus:outline-none text-sm text-[#0A1628]"
              />
            </div>
            <div>
              <span className="text-xs text-gray-500 font-semibold mb-1 block">Option C</span>
              <input
                name="option3"
                value={form.option3}
                onChange={handleChange}
                placeholder="Option C content"
                required
                className="w-full px-4 py-2 border border-[#1B3A6B]/30 rounded-xl focus:ring-2 focus:ring-[#4A9EE8] focus:outline-none text-sm text-[#0A1628]"
              />
            </div>
            <div>
              <span className="text-xs text-gray-500 font-semibold mb-1 block">Option D</span>
              <input
                name="option4"
                value={form.option4}
                onChange={handleChange}
                placeholder="Option D content"
                required
                className="w-full px-4 py-2 border border-[#1B3A6B]/30 rounded-xl focus:ring-2 focus:ring-[#4A9EE8] focus:outline-none text-sm text-[#0A1628]"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-[#0A1628] mb-2">Select Correct Answer</label>
            <select
              name="correctAnswer"
              value={form.correctAnswer}
              onChange={handleChange}
              required
              className="w-full px-4 py-2.5 border border-[#1B3A6B]/30 rounded-xl focus:ring-2 focus:ring-[#4A9EE8] focus:outline-none text-sm bg-white text-[#0A1628]"
            >
              <option value="">-- Choose correct option --</option>
              {form.option1 && <option value={form.option1}>Option A: {form.option1}</option>}
              {form.option2 && <option value={form.option2}>Option B: {form.option2}</option>}
              {form.option3 && <option value={form.option3}>Option C: {form.option3}</option>}
              {form.option4 && <option value={form.option4}>Option D: {form.option4}</option>}
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-[#0A1628] mb-2">Marks</label>
            <input
              type="number"
              name="marks"
              min="1"
              value={form.marks}
              onChange={handleChange}
              required
              className="w-full px-4 py-2.5 border border-[#1B3A6B]/30 rounded-xl focus:ring-2 focus:ring-[#4A9EE8] focus:outline-none text-sm text-[#0A1628]"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
          <Link
            to={`/admin/exams/${examId}/questions`}
            className="px-5 py-2.5 text-gray-700 hover:bg-gray-100 rounded-xl text-sm font-semibold transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-[#1B3A6B] hover:bg-[#0F2044] text-white rounded-xl text-sm font-bold shadow transition-colors disabled:bg-gray-400"
          >
            {saving ? 'Saving...' : isEdit ? 'Update Question' : 'Add Question'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminQuestionForm;
