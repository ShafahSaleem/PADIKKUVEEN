import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';

const ExamInstructions = () => {
  const { examId } = useParams();
  const navigate = useNavigate();

  const [exam, setExam] = useState(null);
  const [questionsCount, setQuestionsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  useEffect(() => {
    const fetchExamDetails = async () => {
      try {
        const [examRes, questionsRes, myResultsRes] = await Promise.all([
          api.get(`/exams/${examId}`),
          api.get(`/exams/${examId}/questions`).catch(() => ({ data: [] })),
          api.get('/results/my').catch(() => ({ data: { results: [] } })),
        ]);

        // Check if student already submitted this exam
        const userResults = myResultsRes.data?.results || [];
        const existing = userResults.find((r) => {
          const rExamId = r.exam?._id || r.exam;
          return rExamId && rExamId.toString() === examId.toString();
        });

        if (existing && existing._id) {
          navigate(`/result/${existing._id}`, { replace: true });
          return;
        }

        const examData = examRes.data?.exam || examRes.data;
        setExam(examData);

        const qList = Array.isArray(questionsRes.data)
          ? questionsRes.data
          : questionsRes.data?.questions || [];
        setQuestionsCount(qList.length);
      } catch (err) {
        console.error('Failed to load exam instructions:', err);
        setError(err.response?.data?.message || 'Failed to load exam details');
      } finally {
        setLoading(false);
      }
    };

    fetchExamDetails();
  }, [examId]);

  const handleStartExam = () => {
    setShowConfirmModal(false);
    navigate(`/exam/${examId}`);
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-[#EEF3FB] flex items-center justify-center p-4">
        <div className="w-16 h-16 border-4 border-[#1B3A6B] border-t-[#4A9EE8] rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !exam) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-[#EEF3FB] flex items-center justify-center p-4">
        <div className="bg-white border border-red-200 rounded-3xl p-8 max-w-md w-full text-center shadow-lg space-y-4">
          <span className="text-4xl">⚠️</span>
          <h2 className="text-xl font-bold text-[#C62828]">Exam Not Found</h2>
          <p className="text-sm text-gray-600">{error || 'Unable to retrieve exam instructions.'}</p>
          <Link
            to="/student-dashboard"
            className="inline-block px-5 py-2.5 bg-[#1B3A6B] text-white font-bold rounded-xl text-sm shadow hover:bg-[#0F2044] transition-colors"
          >
            ← Back to Exams
          </Link>
        </div>
      </div>
    );
  }

  const duration = exam.duration || 30;
  const passingScore = exam.passingPercentage ?? 50;
  const totalQuestions =
    exam.numberOfQuestions && exam.numberOfQuestions > 0
      ? exam.numberOfQuestions
      : questionsCount > 0
      ? questionsCount
      : (exam.questionCount ?? exam.totalQuestions ?? 0);
  const totalMarks = exam.totalMarks || (totalQuestions * 1);

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#EEF3FB] py-10 px-4 flex items-center justify-center text-[#0A1628]">
      {/* Centered Instructions Card */}
      <div className="bg-white border border-[#1B3A6B]/20 rounded-3xl p-6 sm:p-10 max-w-2xl w-full shadow-xl relative overflow-hidden">
        {/* Top Header Badge & Title */}
        <div className="text-center space-y-3 pb-6 border-b border-gray-100">
          <div className="w-16 h-16 bg-[#D6E4F7] text-[#1B3A6B] border border-[#1B3A6B]/20 rounded-2xl flex items-center justify-center text-3xl mx-auto shadow-sm">
            📋
          </div>
          <div>
            <span className="inline-block px-3 py-1 bg-[#D6E4F7] text-[#1B3A6B] font-bold text-xs uppercase tracking-wider rounded-full border border-[#1B3A6B]/20">
              Examination Guidelines
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0A1628] mt-2">
              Before You Begin
            </h1>
            <h2 className="text-lg font-bold text-[#1B3A6B] mt-0.5">
              {exam.title || exam.name || 'Examination'}
            </h2>
          </div>
          {exam.description && (
            <p className="text-xs sm:text-sm text-gray-600 max-w-lg mx-auto leading-relaxed">
              {exam.description}
            </p>
          )}
        </div>

        {/* Dynamic Exam Overview Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 my-6">
          {/* Card 1: Duration */}
          <div className="bg-[#EEF3FB] border border-[#1B3A6B]/20 rounded-2xl p-4 text-center shadow-xs flex flex-col items-center justify-center">
            <span className="text-xl mb-1">⏱️</span>
            <p className="text-lg sm:text-xl font-extrabold text-[#0F172A]">
              {duration} <span className="text-xs font-semibold text-gray-500">mins</span>
            </p>
            <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mt-0.5">Duration</p>
          </div>

          {/* Card 2: Questions */}
          <div className="bg-[#EEF3FB] border border-[#1B3A6B]/20 rounded-2xl p-4 text-center shadow-xs flex flex-col items-center justify-center">
            <span className="text-xl mb-1">❓</span>
            <p className="text-lg sm:text-xl font-extrabold text-[#0F172A]">
              {totalQuestions}
            </p>
            <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mt-0.5">Questions</p>
          </div>

          {/* Card 3: Passing Score */}
          <div className="bg-[#EEF3FB] border border-[#1B3A6B]/20 rounded-2xl p-4 text-center shadow-xs flex flex-col items-center justify-center">
            <span className="text-xl mb-1">🎯</span>
            <p className="text-lg sm:text-xl font-extrabold text-[#16A34A]">
              {passingScore}%
            </p>
            <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mt-0.5">Passing Score</p>
          </div>

          {/* Card 4: Total Marks */}
          <div className="bg-[#EEF3FB] border border-[#1B3A6B]/20 rounded-2xl p-4 text-center shadow-xs flex flex-col items-center justify-center">
            <span className="text-xl mb-1">🏆</span>
            <p className="text-lg sm:text-xl font-extrabold text-[#1B3A6B]">
              {totalMarks}
            </p>
            <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mt-0.5">Total Marks</p>
          </div>
        </div>

        {/* Important Rules Section */}
        <div className="bg-[#D6E4F7]/50 border border-[#1B3A6B]/30 rounded-2xl p-5 mb-8">
          <h3 className="text-xs font-extrabold text-[#1B3A6B] uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <span>⚠️</span> Important Examination Rules
          </h3>
          <ul className="space-y-2.5 text-xs sm:text-sm text-gray-700 leading-relaxed font-medium">
            <li className="flex items-start gap-2">
              <span className="text-[#1B3A6B] font-bold shrink-0 mt-0.5">⚠️</span>
              <span><strong>Do not leave the exam window</strong> during the examination.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#1B3A6B] font-bold shrink-0 mt-0.5">⚠️</span>
              <span><strong>Switching tabs or leaving the exam</strong> may trigger the exam-security system.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#1B3A6B] font-bold shrink-0 mt-0.5">⚠️</span>
              <span>Your exam will be <strong>automatically submitted</strong> when the timer reaches zero.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#1B3A6B] font-bold shrink-0 mt-0.5">⚠️</span>
              <span>Make sure you have a <strong>stable internet connection</strong> before starting.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#1B3A6B] font-bold shrink-0 mt-0.5">⚠️</span>
              <span>Once the exam starts, the <strong>timer cannot be paused</strong>.</span>
            </li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 pt-2">
          <button
            onClick={() => setShowConfirmModal(true)}
            className="w-full py-4 bg-gradient-to-r from-[#0F2044] to-[#1B3A6B] hover:from-[#0A1628] hover:to-[#0F2044] text-white font-extrabold text-base rounded-2xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2"
          >
            <span>🚀</span> Start Exam
          </button>

          <div className="text-center pt-2">
            <Link
              to="/student-dashboard"
              className="text-xs font-bold text-gray-500 hover:text-[#1B3A6B] transition-colors"
            >
              ← Back to Exams
            </Link>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl border border-[#1B3A6B]/20 max-w-sm w-full p-6 text-center shadow-2xl space-y-4">
            <h3 className="text-xl font-extrabold text-[#0A1628] pt-2">Ready to begin?</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Once you start, the timer cannot be paused and exam security monitoring will become active.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleStartExam}
                className="flex-1 py-2.5 px-4 bg-[#1B3A6B] hover:bg-[#0F2044] text-white font-bold rounded-xl text-xs transition-colors shadow-md"
              >
                Start Exam
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExamInstructions;
