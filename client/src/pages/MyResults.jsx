import React, { useEffect, useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import AnimatedCounter from '../components/AnimatedCounter';

const MyResults = () => {
  const { user } = useContext(AuthContext);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const response = await api.get('/results/my');
        setResults(response.data.results || []);
      } catch (err) {
        console.error('Failed to load results:', err);
        setError(err.response?.data?.message || 'Failed to load your results');
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, []);

  const handleDeleteResult = async (resultId) => {
    if (!window.confirm('Are you sure you want to delete this result?')) {
      return;
    }
    setDeletingId(resultId);
    try {
      await api.delete(`/results/${resultId}`);
      toast.success('Result deleted successfully');
      setResults((prev) => prev.filter((r) => r._id !== resultId));
    } catch (err) {
      console.error('Failed to delete result:', err);
      const msg = err.response?.data?.message || 'Failed to delete result';
      toast.error(msg);
    } finally {
      setDeletingId(null);
    }
  };

  // Performance calculations
  const totalExams = results.length;
  const passedExams = results.filter((r) => (r.percentage ?? 0) >= (r.exam?.passingPercentage ?? 50)).length;
  const averageScore = totalExams > 0
    ? Math.round(results.reduce((acc, r) => acc + (r.percentage ?? 0), 0) / totalExams)
    : 0;
  const bestScore = totalExams > 0
    ? Math.max(...results.map((r) => r.percentage ?? 0))
    : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 bg-[#EEF3FB] min-h-[calc(100vh-4rem)] space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-gray-200">
        <div>
          <h1 className="text-3xl font-extrabold text-[#0A1628]">
            My Exam Results
          </h1>
          <p className="text-[#1B3A6B]/70 mt-1 text-sm">
            Review your completed exams and test history
          </p>
        </div>
        <Link
          to="/student-dashboard"
          className="px-5 py-2.5 bg-[#1B3A6B] hover:bg-[#0F2044] text-white text-sm font-bold rounded-xl shadow transition-colors"
        >
          ← Available Exams
        </Link>
      </div>

      {loading && (
        <div className="flex justify-center items-center py-16">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#1B3A6B]"></div>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-[#DC2626] font-semibold rounded-2xl text-sm">
          {error}
        </div>
      )}

      {!loading && !error && (
        <>
          {results.length === 0 ? (
            /* EMPTY STATE */
            <div className="text-center py-16 bg-white rounded-3xl border border-[#1B3A6B]/20 shadow-sm p-8 max-w-2xl mx-auto space-y-3">
              <span className="text-5xl">📚</span>
              <h3 className="text-2xl font-extrabold text-[#0A1628]">
                Your learning journey starts here!
              </h3>
              <p className="text-[#1B3A6B]/70 text-sm max-w-md mx-auto">
                You haven't completed any exams yet. Take your first exam and start tracking your progress.
              </p>
              <div className="pt-3">
                <Link
                  to="/student-dashboard"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-[#1B3A6B] text-white font-bold rounded-xl hover:bg-[#0F2044] transition-colors shadow"
                >
                  <span>📋</span> Browse Available Exams
                </Link>
              </div>
            </div>
          ) : (
            /* EXAM SUBMISSIONS WITH COMPACT RIGHT-SIDE PERFORMANCE BOX */
            <div className="bg-white shadow-sm rounded-3xl border border-[#1B3A6B]/20 overflow-hidden">
              {/* Header with Title on Left and Compact Performance Box on Right */}
              <div className="p-5 sm:p-6 border-b border-gray-100 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 bg-gradient-to-r from-white via-white to-[#EEF3FB]/60">
                <div>
                  <h3 className="text-xl font-bold text-[#0A1628] flex items-center gap-2">
                    <span>📋</span> All Exam Submissions ({results.length})
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Your complete test submission history and score records
                  </p>
                </div>

                {/* Compact Right-Side Performance Box */}
                <div className="flex flex-wrap items-center gap-2 p-2 bg-[#EEF3FB]/80 border border-[#1B3A6B]/20 rounded-2xl shadow-xs">
                  {/* Completed */}
                  <div className="px-3 py-1.5 bg-white border border-[#1B3A6B]/10 rounded-xl flex items-center gap-2 shadow-xs">
                    <span className="text-xs">📝</span>
                    <span className="text-xs text-gray-500 font-semibold">Total:</span>
                    <span className="text-xs font-extrabold text-[#0A1628]">
                      <AnimatedCounter value={totalExams} duration={800} />
                    </span>
                  </div>

                  {/* Passed */}
                  <div className="px-3 py-1.5 bg-white border border-green-100 rounded-xl flex items-center gap-2 shadow-xs">
                    <span className="text-xs">🟢</span>
                    <span className="text-xs text-gray-500 font-semibold">Passed:</span>
                    <span className="text-xs font-extrabold text-[#16A34A]">
                      <AnimatedCounter value={passedExams} duration={800} />
                    </span>
                  </div>

                  {/* Avg Score */}
                  <div className="px-3 py-1.5 bg-white border border-[#1B3A6B]/10 rounded-xl flex items-center gap-2 shadow-xs">
                    <span className="text-xs">📊</span>
                    <span className="text-xs text-gray-500 font-semibold">Avg:</span>
                    <span className="text-xs font-extrabold text-[#2D5DA6]">
                      <AnimatedCounter value={averageScore} suffix="%" duration={1000} />
                    </span>
                  </div>

                  {/* Best Score */}
                  <div className="px-3 py-1.5 bg-white border border-[#1B3A6B]/10 rounded-xl flex items-center gap-2 shadow-xs">
                    <span className="text-xs">🏆</span>
                    <span className="text-xs text-gray-500 font-semibold">Best:</span>
                    <span className="text-xs font-extrabold text-[#1B3A6B]">
                      <AnimatedCounter value={bestScore} suffix="%" duration={1000} />
                    </span>
                  </div>
                </div>
              </div>

              {/* Submissions Table */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
                  <thead className="bg-[#EEF3FB] text-[#0A1628] font-bold uppercase tracking-wider text-xs">
                    <tr>
                      <th className="px-6 py-4">Exam Title</th>
                      <th className="px-6 py-4">Score</th>
                      <th className="px-6 py-4">Percentage</th>
                      <th className="px-6 py-4">Submitted Date</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1B3A6B]/10 text-[#0A1628]">
                    {results.map((r) => {
                      const passingThreshold = r.exam?.passingPercentage ?? 50;
                      const isPassed = (r.percentage ?? 0) >= passingThreshold;
                      return (
                        <tr key={r._id} className="hover:bg-[#EEF3FB]/50 transition-colors">
                          <td className="px-6 py-4 font-bold text-[#0A1628]">
                            {r.exam?.title || 'Exam'}
                          </td>
                          <td className="px-6 py-4 font-semibold text-gray-800">
                            {r.score} / {r.totalMarks}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                                isPassed
                                  ? 'bg-green-100 text-[#16A34A] border border-green-200'
                                  : 'bg-red-100 text-[#DC2626] border border-red-200'
                              }`}
                            >
                              <span className={`h-1.5 w-1.5 rounded-full ${isPassed ? 'bg-[#16A34A]' : 'bg-[#DC2626]'}`}></span>
                              {r.percentage}% {isPassed ? 'PASSED' : 'FAILED'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-gray-500 text-xs font-mono">
                            {r.submittedAt
                              ? new Date(r.submittedAt).toLocaleString('en-GB', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  hour12: true,
                                })
                              : 'N/A'}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Link
                                to={`/result/${r._id}`}
                                className="inline-flex items-center px-3 py-1.5 bg-[#D6E4F7] text-[#1B3A6B] hover:bg-[#1B3A6B] hover:text-white font-bold rounded-lg text-xs transition-colors"
                              >
                                View Result
                              </Link>
                              <button
                                onClick={() => handleDeleteResult(r._id)}
                                disabled={deletingId === r._id}
                                className="inline-flex items-center px-3 py-1.5 bg-red-50 text-[#DC2626] hover:bg-red-100 font-bold rounded-lg text-xs transition-colors disabled:opacity-50"
                              >
                                {deletingId === r._id ? 'Deleting...' : 'Delete'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default MyResults;
