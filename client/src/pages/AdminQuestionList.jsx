import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';

const AdminQuestionList = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [exam, setExam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchExamAndQuestions = async () => {
    setLoading(true);
    setError('');
    try {
      const [examRes, quesRes] = await Promise.all([
        api.get(`/exams/${examId}`).catch(() => null),
        api.get(`/exams/${examId}/questions`),
      ]);
      if (examRes) {
        setExam(examRes.data.exam || examRes.data);
      }
      const data = quesRes.data.questions ? quesRes.data.questions : quesRes.data;
      setQuestions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch questions', err);
      setError(err.response?.data?.message || 'Failed to load questions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExamAndQuestions();
  }, [examId]);

  const handleDelete = async (questionId) => {
    if (!window.confirm('Are you sure you want to delete this question?')) return;
    try {
      await api.delete(`/questions/${questionId}`);
      fetchExamAndQuestions();
    } catch (err) {
      console.error('Delete failed', err);
      setError(err.response?.data?.message || 'Failed to delete question');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 bg-[#EEF3FB] min-h-[calc(100vh-4rem)]">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-[#1B3A6B]/30">
        <div>
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
            <Link to="/admin/exams" className="hover:underline font-bold text-[#1B3A6B]">Exams</Link>
            <span>/</span>
            <span>Questions</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0A1628]">
            Questions: {exam?.title || 'Exam'}
          </h1>
          <p className="text-gray-600 text-sm mt-0.5">Manage question pool, options, and marking scheme.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/admin/exams"
            className="px-4 py-2 bg-white hover:bg-[#EEF3FB] text-[#0A1628] text-sm font-semibold rounded-xl border border-[#1B3A6B]/20 transition-colors"
          >
            ← Back to Exams
          </Link>
          <button
            className="px-4 py-2 bg-[#1B3A6B] hover:bg-[#0F2044] text-white text-sm font-bold rounded-xl shadow transition-colors flex items-center gap-1.5"
            onClick={() => navigate(`/admin/exams/${examId}/questions/new`)}
          >
            <span>➕</span> Add Question
          </button>
        </div>
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
          {questions.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-[#1B3A6B]/20 p-8 shadow-sm">
              <span className="text-5xl">❓</span>
              <h3 className="mt-4 text-xl font-bold text-[#0A1628]">No Questions Added Yet</h3>
              <p className="mt-2 text-gray-600 text-sm">Add multiple-choice questions to populate this examination.</p>
              <button
                onClick={() => navigate(`/admin/exams/${examId}/questions/new`)}
                className="mt-6 px-6 py-2.5 bg-[#1B3A6B] text-white font-bold rounded-xl hover:bg-[#0F2044] transition-colors shadow"
              >
                Add First Question
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {questions.map((q, index) => (
                <div
                  key={q._id}
                  className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col md:flex-row md:items-start justify-between gap-4"
                >
                  <div className="space-y-3 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 bg-[#D6E4F7] text-[#1B3A6B] text-xs font-bold rounded-full">
                        Question {index + 1}
                      </span>
                      <span className="text-xs text-gray-500 font-semibold">
                        Marks: {q.marks ?? 1}
                      </span>
                    </div>
                    <p className="font-bold text-[#0A1628] text-base">{q.questionText}</p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                      {q.options && q.options.map((opt, idx) => {
                        const isCorrect = opt === q.correctAnswer;
                        return (
                          <div
                            key={idx}
                            className={`px-3.5 py-2 rounded-xl text-sm border flex items-center justify-between ${
                              isCorrect
                                ? 'bg-green-50 border-green-300 text-[#16A34A] font-bold'
                                : 'bg-gray-50 border-gray-200 text-gray-700'
                            }`}
                          >
                            <span>
                              <span className="font-bold mr-2">{String.fromCharCode(65 + idx)}.</span>
                              {opt}
                            </span>
                            {isCorrect && (
                              <span className="text-xs bg-green-200 text-[#16A34A] px-2 py-0.5 rounded-full font-bold">
                                Correct Answer
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex md:flex-col gap-2 shrink-0 self-end md:self-start">
                    <Link
                      className="px-3 py-1.5 bg-[#D6E4F7] text-[#1B3A6B] hover:bg-[#1B3A6B] hover:text-white text-xs font-bold rounded-lg transition-colors text-center"
                      to={`/admin/exams/${examId}/questions/edit/${q._id}`}
                    >
                      Edit
                    </Link>
                    <button
                      className="px-3 py-1.5 bg-red-50 text-[#DC2626] hover:bg-red-100 text-xs font-bold rounded-lg transition-colors"
                      onClick={() => handleDelete(q._id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AdminQuestionList;
