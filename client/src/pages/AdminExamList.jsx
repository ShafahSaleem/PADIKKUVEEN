import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';

const AdminExamList = () => {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const fetchExams = async () => {
    try {
      const response = await api.get('/exams');
      const data = response.data.exams ? response.data.exams : response.data;
      setExams(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch exams:', err);
      setError(err.response?.data?.message || 'Failed to load exams');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExams();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this exam?')) return;
    try {
      await api.delete(`/exams/${id}`);
      fetchExams();
    } catch (err) {
      console.error('Delete failed:', err);
      setError(err.response?.data?.message || 'Failed to delete exam');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 bg-[#EEF3FB] min-h-[calc(100vh-4rem)]">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-[#1B3A6B]/30">
        <div>
          <h1 className="text-3xl font-extrabold text-[#0A1628]">Manage Examinations</h1>
          <p className="text-gray-600 mt-1 text-sm">Create, edit, and delete examinations</p>
        </div>
        <button
          className="px-5 py-2.5 bg-gradient-to-r from-[#0F2044] to-[#1B3A6B] hover:from-[#0A1628] hover:to-[#0F2044] text-white font-bold rounded-xl shadow transition-colors text-sm flex items-center gap-2"
          onClick={() => navigate('/admin/exams/new')}
        >
          <span>➕</span> Create New Exam
        </button>
      </div>

      {loading && (
        <div className="flex justify-center items-center py-16">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#1B3A6B]"></div>
        </div>
      )}

      {error && (
        <div className="p-4 mb-6 bg-red-50 border border-red-200 text-[#DC2626] font-semibold rounded-2xl text-sm">
          {error}
        </div>
      )}

      {!loading && !error && (
        <>
          {exams.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-[#1B3A6B]/20 p-8 shadow-sm">
              <span className="text-5xl">📋</span>
              <h3 className="mt-4 text-xl font-bold text-[#0A1628]">No Exams Found</h3>
              <p className="mt-2 text-gray-600 text-sm">Get started by creating your first online examination.</p>
              <button
                onClick={() => navigate('/admin/exams/new')}
                className="mt-6 px-6 py-2.5 bg-[#1B3A6B] text-white font-bold rounded-xl hover:bg-[#0F2044] transition-colors shadow"
              >
                Create Exam
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto bg-white shadow-sm rounded-2xl border border-[#1B3A6B]/20">
              <table className="min-w-full divide-y divide-gray-100 text-left text-sm">
                <thead className="bg-[#EEF3FB] text-[#0A1628] font-bold uppercase tracking-wider text-xs">
                  <tr>
                    <th className="px-6 py-4">Title</th>
                    <th className="px-6 py-4">Description</th>
                    <th className="px-6 py-4">Duration</th>
                    <th className="px-6 py-4">Total Marks</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-[#0A1628]">
                  {exams.map((exam) => (
                    <tr key={exam._id} className="hover:bg-[#EEF3FB]/60 transition-colors">
                      <td className="px-6 py-4 font-bold text-[#0A1628]">{exam.title}</td>
                      <td className="px-6 py-4 text-gray-600 max-w-xs truncate text-xs">{exam.description || '-'}</td>
                      <td className="px-6 py-4 text-xs font-semibold text-gray-700">{exam.duration} mins</td>
                      <td className="px-6 py-4 text-xs font-bold text-[#1B3A6B]">{exam.totalMarks} Marks</td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <Link
                          className="inline-flex items-center px-3 py-1.5 bg-[#D6E4F7] text-[#1B3A6B] hover:bg-[#1B3A6B] hover:text-white rounded-lg font-bold text-xs transition-colors"
                          to={`/admin/exams/${exam._id}/questions`}
                        >
                          Questions
                        </Link>
                        <Link
                          className="inline-flex items-center px-3 py-1.5 bg-emerald-50 text-[#16A34A] hover:bg-[#16A34A] hover:text-white rounded-lg font-bold text-xs transition-colors"
                          to={`/admin/exams/${exam._id}/questions/new`}
                        >
                          + Add Question
                        </Link>
                        <Link
                          className="inline-flex items-center px-3 py-1.5 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg font-bold text-xs transition-colors"
                          to={`/admin/exams/edit/${exam._id}`}
                        >
                          Edit
                        </Link>
                        <button
                          className="inline-flex items-center px-3 py-1.5 bg-red-50 text-[#DC2626] hover:bg-red-100 rounded-lg font-bold text-xs transition-colors"
                          onClick={() => handleDelete(exam._id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AdminExamList;
