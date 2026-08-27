import React, { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';

const normalizeAnswer = (val) => {
  if (val === null || val === undefined) return '';
  let str = String(val).trim().toLowerCase();
  if ((str.startsWith('"') && str.endsWith('"')) || (str.startsWith("'") && str.endsWith("'"))) {
    str = str.slice(1, -1).trim();
  }
  return str;
};

const checkAnswerCorrectness = (studentAnswer, correctAnswer, options = []) => {
  if (!studentAnswer || !correctAnswer) return false;

  const sTrim = String(studentAnswer).trim();
  const cTrim = String(correctAnswer).trim();

  if (sTrim === cTrim) return true;
  if (sTrim.toLowerCase() === cTrim.toLowerCase()) return true;

  const sNorm = normalizeAnswer(sTrim);
  const cNorm = normalizeAnswer(cTrim);
  if (sNorm && cNorm && sNorm === cNorm) return true;

  // Check letter / index (A, B, C, D)
  const letters = ['a', 'b', 'c', 'd'];
  const sLetterIdx = letters.indexOf(sNorm);
  if (sLetterIdx !== -1 && options[sLetterIdx] && normalizeAnswer(options[sLetterIdx]) === cNorm) {
    return true;
  }
  const cLetterIdx = letters.indexOf(cNorm);
  if (cLetterIdx !== -1 && options[cLetterIdx] && normalizeAnswer(options[cLetterIdx]) === sNorm) {
    return true;
  }

  return false;
};

const ResultPage = () => {
  const { resultId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useContext(AuthContext);

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAnswerSheet, setShowAnswerSheet] = useState(false);

  useEffect(() => {
    if (!resultId || resultId === 'undefined') {
      setError('Result ID is missing. Please select an exam from your results history or take an exam.');
      setLoading(false);
      return;
    }
    const fetchResult = async () => {
      try {
        const response = await api.get(`/results/${resultId}`);
        console.log("Result API data:", response.data);
        const loadedResult = response.data.result || response.data;
        setResult(loadedResult);
      } catch (err) {
        console.error('Failed to load result:', err);
        setError(err.response?.data?.message || 'Failed to load result');
      } finally {
        setLoading(false);
      }
    };
    fetchResult();
  }, [resultId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#1B3A6B]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-xl mx-auto my-12 p-8 bg-white border border-gray-200 rounded-2xl text-center shadow-sm">
        <span className="text-4xl">📋</span>
        <h2 className="text-xl font-bold text-gray-900 mt-3">Result Not Found</h2>
        <p className="text-gray-600 text-sm mt-1 mb-6">{error || 'This exam result may have been deleted or does not exist.'}</p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/my-results"
            className="w-full sm:w-auto px-5 py-2.5 bg-[#1B3A6B] hover:bg-[#0F2044] text-white rounded-xl text-sm font-bold transition-colors"
          >
            Back to Result History
          </Link>
          <Link
            to="/student-dashboard"
            className="w-full sm:w-auto px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-semibold transition-colors"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="max-w-xl mx-auto my-12 p-8 bg-white border border-gray-200 rounded-2xl text-center shadow-sm">
        <span className="text-4xl">📋</span>
        <h2 className="text-xl font-bold text-gray-900 mt-3">Result Not Found</h2>
        <p className="text-gray-600 text-sm mt-1 mb-6">No result data is available for this exam attempt.</p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/my-results"
            className="w-full sm:w-auto px-5 py-2.5 bg-[#1B3A6B] hover:bg-[#0F2044] text-white rounded-xl text-sm font-bold transition-colors"
          >
            Back to Result History
          </Link>
          <Link
            to="/student-dashboard"
            className="w-full sm:w-auto px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-semibold transition-colors"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const totalQuestions = result.totalQuestions ?? result.answers?.length ?? 0;
  const correctAnswersCount =
    result.correctAnswers ?? result.answers?.filter((a) => a.isCorrect).length ?? 0;
  const wrongAnswersCount =
    result.wrongAnswers ??
    result.answers?.filter((a) => !a.isCorrect && a.selectedAnswer).length ??
    0;
  const unansweredCount =
    result.unanswered ?? Math.max(0, totalQuestions - correctAnswersCount - wrongAnswersCount);

  const isPassed = (result.percentage ?? 0) >= 50;
  const submittedDate = result.submittedAt
    ? new Date(result.submittedAt).toLocaleString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      })
    : 'N/A';
  const answersList = result.answers || [];
  const examId =
    result.exam?._id ||
    (typeof result.exam === 'string' ? result.exam : null) ||
    result.examId ||
    null;

  const studentName =
    result.student?.name ||
    user?.name ||
    (typeof result.student === 'object' && result.student?.email ? result.student.email.split('@')[0] : '') ||
    (user?.email ? user.email.split('@')[0] : '') ||
    'Student';

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 bg-[#EEF3FB] min-h-[calc(100vh-4rem)]">
      {/* Main Container */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        {/* Header Banner */}
        <div
          className={`p-6 sm:p-8 text-center text-white ${
            isPassed
              ? 'bg-gradient-to-r from-[#0F2044] to-[#1B3A6B]'
              : 'bg-gradient-to-r from-rose-600 to-red-700'
          }`}
        >
          <span className="text-4xl sm:text-5xl">{isPassed ? '🎉' : '📊'}</span>
          <h1 className="text-2xl sm:text-3xl font-extrabold mt-3">
            {isPassed ? 'Examination Passed!' : 'Test Assessment Summary'}
          </h1>
          <p className="text-white/90 text-sm sm:text-base mt-1 font-medium">
            {result.exam?.title || 'Exam Assessment'}
          </p>
          {!isPassed && (
            <div className="mt-3 inline-block px-3.5 py-1 bg-white/20 backdrop-blur rounded-full text-xs font-semibold">
              Keep learning and try again! 💪
            </div>
          )}
        </div>

        {/* View Toggle Tabs */}
        <div className="flex border-b border-gray-200 bg-gray-50/50">
          <button
            onClick={() => setShowAnswerSheet(false)}
            className={`flex-1 py-3.5 text-center text-sm font-bold transition-all border-b-2 ${
              !showAnswerSheet
                ? 'border-[#1B3A6B] text-[#1B3A6B] bg-white'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100/50'
            }`}
          >
            Result Summary
          </button>
          <button
            onClick={() => setShowAnswerSheet(true)}
            className={`flex-1 py-3.5 text-center text-sm font-bold transition-all border-b-2 ${
              showAnswerSheet
                ? 'border-[#1B3A6B] text-[#1B3A6B] bg-white'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100/50'
            }`}
          >
            View Answer Sheet ({answersList.length})
          </button>
        </div>

        {/* VIEW 1: SUMMARY VIEW */}
        {!showAnswerSheet && (
          <div className="p-6 sm:p-8 space-y-6">
            {/* Main Score Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Your Score
                </span>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {result.score}{' '}
                  <span className="text-sm font-normal text-gray-500">/ {result.totalMarks}</span>
                </p>
              </div>

              <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Percentage
                </span>
                <p
                  className={`text-2xl font-bold mt-1 ${
                    isPassed ? 'text-emerald-600' : 'text-rose-600'
                  }`}
                >
                  {result.percentage}%
                </p>
              </div>

              <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Status
                </span>
                <p
                  className={`text-2xl font-bold mt-1 ${
                    isPassed ? 'text-emerald-600' : 'text-rose-600'
                  }`}
                >
                  {isPassed ? 'PASSED' : 'FAILED'}
                </p>
              </div>

              <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Total Questions
                </span>
                <p className="text-2xl font-bold text-gray-800 mt-1">{totalQuestions}</p>
              </div>
            </div>

            {/* Performance Breakdown Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-2xl">
                <span className="text-xs font-bold text-[#16A34A] uppercase tracking-wider">Correct</span>
                <p className="text-2xl font-extrabold text-[#16A34A] mt-0.5">{correctAnswersCount}</p>
              </div>

              <div className="p-4 bg-red-50 border border-red-200 rounded-2xl">
                <span className="text-xs font-bold text-[#DC2626] uppercase tracking-wider">Incorrect</span>
                <p className="text-2xl font-extrabold text-[#DC2626] mt-0.5">{wrongAnswersCount}</p>
              </div>

              <div className="p-4 bg-[#EEF3FB] border border-[#1B3A6B]/20 rounded-2xl">
                <span className="text-xs font-bold text-[#1B3A6B] uppercase tracking-wider">Unanswered</span>
                <p className="text-2xl font-extrabold text-[#1B3A6B] mt-0.5">{unansweredCount}</p>
              </div>
            </div>

            {/* Details Table */}
            <div className="border-t border-gray-100 pt-6 space-y-3 text-sm text-gray-600">
              <div className="flex justify-between py-1.5 border-b border-gray-50">
                <span className="font-medium text-gray-700">Student Name:</span>
                <span className="text-gray-900 font-semibold">{studentName}</span>
              </div>
              {result.exam?.description && (
                <div className="flex justify-between py-1.5 border-b border-gray-50">
                  <span className="font-medium text-gray-700">Exam Details:</span>
                  <span className="text-gray-900 text-right max-w-sm">{result.exam.description}</span>
                </div>
              )}
              <div className="flex justify-between py-1.5 border-b border-gray-50">
                <span className="font-medium text-gray-700">Submitted On:</span>
                <span className="text-gray-900">{submittedDate}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={() => setShowAnswerSheet(true)}
                className="w-full sm:w-auto px-6 py-2.5 bg-[#D6E4F7] hover:bg-[#1B3A6B] hover:text-white text-[#1B3A6B] font-bold border border-[#1B3A6B]/30 rounded-xl shadow-sm transition-colors text-sm flex items-center justify-center"
              >
                View Answer Sheet
              </button>
              {examId && (
                <button
                  onClick={() => navigate(`/exam/${examId}`, { state: { retry: true } })}
                  className="w-full sm:w-auto px-6 py-2.5 bg-[#16A34A] hover:bg-green-700 text-white font-bold rounded-xl shadow-sm transition-colors text-sm flex items-center justify-center"
                >
                  Retry Exam
                </button>
              )}
              <button
                onClick={() => navigate('/student-dashboard')}
                className="w-full sm:w-auto px-6 py-2.5 bg-[#1B3A6B] hover:bg-[#0F2044] text-white font-bold rounded-xl shadow-sm transition-colors text-sm flex items-center justify-center"
              >
                Dashboard
              </button>
              <Link
                to="/my-results"
                className="w-full sm:w-auto px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-[#1F2937] font-semibold rounded-xl transition-colors text-sm text-center flex items-center justify-center"
              >
                My Results
              </Link>
            </div>
          </div>
        )}

        {/* VIEW 2: ANSWER SHEET VIEW */}
        {showAnswerSheet && (
          <div className="p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-gray-200">
              <div>
                <h2 className="text-xl font-bold text-[#0A1628]">Detailed Answer Sheet</h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  Review each question, your selected option, and the correct answers.
                </p>
              </div>
              <button
                onClick={() => setShowAnswerSheet(false)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors"
              >
                ← Back to Result Summary
              </button>
            </div>

            {answersList.length === 0 ? (
              <div className="p-8 text-center bg-gray-50 rounded-xl text-gray-500">
                No answer sheet details available for this submission.
              </div>
            ) : (
              <div className="space-y-4">
                {answersList.map((item, index) => {
                  const qObj = item.question || {};
                  const qText = item.questionText || qObj.questionText || `Question ${index + 1}`;
                  const options = item.options || qObj.options || [];
                  const selectedAnswer = item.selectedAnswer;
                  const correctAnswer = item.correctAnswer || qObj.correctAnswer;
                  const isCorrect =
                    item.isCorrect !== undefined
                      ? item.isCorrect
                      : checkAnswerCorrectness(selectedAnswer, correctAnswer, options);

                  return (
                    <div
                      key={item._id || index}
                      className={`p-5 rounded-xl border ${
                        !selectedAnswer
                          ? 'border-[#1B3A6B]/20 bg-[#EEF3FB]/30'
                          : isCorrect
                          ? 'border-emerald-200 bg-emerald-50/20'
                          : 'border-rose-200 bg-rose-50/20'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div className="flex items-center gap-2">
                          <span className="h-6 w-6 rounded-md bg-gray-800 text-white text-xs font-bold flex items-center justify-center">
                            {index + 1}
                          </span>
                          <h4 className="font-semibold text-gray-900">{qText}</h4>
                        </div>
                        <span
                          className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                            !selectedAnswer
                              ? 'bg-[#D6E4F7] text-[#1B3A6B]'
                              : isCorrect
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {!selectedAnswer
                            ? 'Unanswered (0 Marks)'
                            : isCorrect
                            ? `Correct (+${item.marksAwarded ?? item.marks ?? qObj.marks ?? 1} Marks)`
                            : 'Incorrect (0 Marks)'}
                        </span>
                      </div>

                      {/* Options List */}
                      {options.length > 0 && (
                        <div className="space-y-2 pl-8 my-3">
                          {options.map((opt, optIdx) => {
                            const isSelected =
                              normalizeAnswer(selectedAnswer) === normalizeAnswer(opt) ||
                              selectedAnswer === opt;
                            const isAnswerCorrect =
                              normalizeAnswer(correctAnswer) === normalizeAnswer(opt) ||
                              correctAnswer === opt;

                            return (
                              <div
                                key={optIdx}
                                className={`px-4 py-2 rounded-lg text-sm border flex items-center justify-between ${
                                  isSelected && isAnswerCorrect
                                    ? 'bg-emerald-100 border-emerald-400 text-emerald-950 font-medium'
                                    : isSelected && !isAnswerCorrect
                                    ? 'bg-rose-100 border-rose-400 text-rose-950 font-medium'
                                    : isAnswerCorrect
                                    ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-medium'
                                    : 'bg-white border-gray-200 text-gray-700'
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-xs text-gray-400">
                                    {String.fromCharCode(65 + optIdx)}.
                                  </span>
                                  <span>{opt}</span>
                                </div>
                                <div>
                                  {isSelected && isAnswerCorrect && (
                                    <span className="text-xs bg-emerald-200 text-emerald-800 font-bold px-2 py-0.5 rounded">
                                      Your Answer (Correct)
                                    </span>
                                  )}
                                  {isSelected && !isAnswerCorrect && (
                                    <span className="text-xs bg-rose-200 text-rose-800 font-bold px-2 py-0.5 rounded">
                                      Your Answer (Wrong)
                                    </span>
                                  )}
                                  {!isSelected && isAnswerCorrect && (
                                    <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">
                                      Correct Answer
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ResultPage;
