import React, { useEffect, useState, useContext, useRef, useCallback } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { toast } from 'react-hot-toast';

const MAX_ALLOWED_VIOLATIONS = 3;

const ExamPage = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { token } = useContext(AuthContext);

  const isRetry = location.state?.retry === true;

  const [exam, setExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [attemptId, setAttemptId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [answers, setAnswers] = useState({}); // {questionId: selectedOption}
  const [submitting, setSubmitting] = useState(false);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [existingResultId, setExistingResultId] = useState(null);

  // Timer State
  const [timeLeft, setTimeLeft] = useState(null); // in seconds
  const [timeExpired, setTimeExpired] = useState(false);

  // Proctoring / Security Violations State
  const [violations, setViolations] = useState(0);
  const [showWarningModal, setShowWarningModal] = useState(false);

  // Refs to prevent double submission and access latest values
  const hasSubmittedRef = useRef(false);
  const answersRef = useRef({});
  const questionsRef = useRef([]);
  const attemptIdRef = useRef(null);
  const violationsRef = useRef(0);
  const lastViolationTimeRef = useRef(0);

  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  useEffect(() => {
    questionsRef.current = questions;
  }, [questions]);

  useEffect(() => {
    attemptIdRef.current = attemptId;
  }, [attemptId]);

  useEffect(() => {
    violationsRef.current = violations;
  }, [violations]);

  // Execute Submission Handler
  const executeSubmission = useCallback(
    async (isAuto = false) => {
      if (hasSubmittedRef.current) return;
      hasSubmittedRef.current = true;

      setSubmitting(true);
      setError('');
      setShowWarningModal(false);

      const currentQuestions = questionsRef.current;
      const currentAnswers = answersRef.current;

      const preparedAnswers = currentQuestions.map((q) => ({
        question: q._id,
        selectedAnswer: currentAnswers[q._id] || '',
      }));

      // Clear session timer storage
      const timerKey = `exam_attempt_end_${examId}`;
      sessionStorage.removeItem(timerKey);

      try {
        const response = await api.post(`/exams/${examId}/submit`, {
          answers: preparedAnswers,
          attemptId: attemptIdRef.current,
        });

        const resultId =
          response.data?.resultId ||
          response.data?.result?._id ||
          response.data?.result?.id ||
          response.data?._id;

        if (!resultId) {
          toast.error('Could not retrieve result ID.');
          setError('Could not retrieve result ID');
          return;
        }

        if (isAuto) {
          toast.success('Exam automatically submitted!');
        } else {
          toast.success('Exam submitted and scored successfully!');
        }

        navigate(`/result/${resultId}`);
      } catch (err) {
        console.error('SUBMIT ERROR:', err);
        const msg = err.response?.data?.message || 'Failed to submit exam';
        toast.error(msg);
        setError(msg);
        hasSubmittedRef.current = false; // Allow retry on failure
      } finally {
        setSubmitting(false);
      }
    },
    [examId, navigate]
  );

  // Fetch exam details and randomized questions (or resume in-progress attempt)
  useEffect(() => {
    setAnswers({});
    setViolations(0);
    violationsRef.current = 0;
    setShowWarningModal(false);
    hasSubmittedRef.current = false;

    const fetchData = async () => {
      if (!token) {
        setError('Please login again.');
        setLoading(false);
        return;
      }
      try {
        const [startRes, myResultsRes] = await Promise.all([
          api.post(`/exams/${examId}/start`, { retry: isRetry }),
          api.get('/results/my').catch(() => ({ data: { results: [] } })),
        ]);

        const startData = startRes.data;
        const loadedExam = startData.exam;
        setExam(loadedExam);
        setAttemptId(startData.attemptId);
        const qList = startData.questions || [];
        setQuestions(Array.isArray(qList) ? qList : []);

        // Check if student already submitted this exam previously (only for normal opens, not retries)
        if (!isRetry && !startData.isResumed) {
          const userResults = myResultsRes.data?.results || [];
          const existing = userResults.find((r) => {
            const rExamId = r.exam?._id || r.exam;
            return rExamId && rExamId.toString() === examId.toString();
          });
          if (existing && existing._id) {
            navigate(`/result/${existing._id}`, { replace: true });
            return;
          }
        }
      } catch (err) {
        console.error('Failed to load exam or questions:', err);
        if (err.response?.status === 401) {
          setError('Please login again.');
        } else if (err.response?.status === 403) {
          setError('You are not assigned to take this exam.');
        } else {
          setError(err.response?.data?.message || 'Failed to load exam questions');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [examId, token, isRetry, navigate]);

  // Countdown Timer with Refresh Protection
  useEffect(() => {
    if (!exam || alreadySubmitted) return;

    const timerKey = `exam_attempt_end_${examId}`;
    const durationMinutes = Number(exam.duration) > 0 ? Number(exam.duration) : 30;
    const durationMs = durationMinutes * 60 * 1000;

    let storedEndTime = sessionStorage.getItem(timerKey);
    let targetEndTime = storedEndTime ? parseInt(storedEndTime, 10) : null;

    if (!targetEndTime || isNaN(targetEndTime) || isRetry) {
      targetEndTime = Date.now() + durationMs;
      sessionStorage.setItem(timerKey, targetEndTime.toString());
    }

    const updateTimer = () => {
      const remainingMs = targetEndTime - Date.now();
      const remainingSeconds = Math.max(0, Math.floor(remainingMs / 1000));
      setTimeLeft(remainingSeconds);

      if (remainingSeconds <= 0) {
        setTimeExpired(true);
        if (!hasSubmittedRef.current) {
          toast('Time is up! Your exam is being submitted automatically.', {
            icon: '⏱️',
            duration: 4000,
          });
          executeSubmission(true);
        }
      }
    };

    updateTimer();
    const intervalId = setInterval(updateTimer, 1000);

    return () => clearInterval(intervalId);
  }, [exam, examId, alreadySubmitted, isRetry, executeSubmission]);

  // Anti-Copy & Keyboard Shortcuts Protection
  useEffect(() => {
    if (!exam || alreadySubmitted) return;

    const handleCopy = (e) => {
      e.preventDefault();
      toast.error('Copying exam content is disabled.', { id: 'anti-copy-toast', duration: 2000 });
    };

    const handleCut = (e) => {
      e.preventDefault();
      toast.error('Cutting exam content is disabled.', { id: 'anti-cut-toast', duration: 2000 });
    };

    const handlePaste = (e) => {
      e.preventDefault();
      toast.error('Pasting is disabled during the examination.', { id: 'anti-paste-toast', duration: 2000 });
    };

    const handleContextMenu = (e) => {
      e.preventDefault();
    };

    const handleKeyDown = (e) => {
      const isCtrlOrCmd = e.ctrlKey || e.metaKey;
      if (isCtrlOrCmd) {
        const key = e.key.toLowerCase();
        // Block Ctrl+C (copy), Ctrl+X (cut), Ctrl+V (paste), Ctrl+A (select all), Ctrl+U (source), Ctrl+S (save), Ctrl+P (print)
        if (['c', 'x', 'v', 'a', 'u', 's', 'p'].includes(key)) {
          e.preventDefault();
          return false;
        }
      }
    };

    document.addEventListener('copy', handleCopy);
    document.addEventListener('cut', handleCut);
    document.addEventListener('paste', handlePaste);
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('cut', handleCut);
      document.removeEventListener('paste', handlePaste);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [exam, alreadySubmitted]);

  // Tab-Switch & Window Blur Proctoring Monitor
  useEffect(() => {
    if (!exam || alreadySubmitted) return;

    const handleViolationTrigger = () => {
      if (hasSubmittedRef.current) return;

      const now = Date.now();
      // Throttle violation events so blur + visibilitychange in quick succession count as 1 violation
      if (now - lastViolationTimeRef.current < 2000) return;
      lastViolationTimeRef.current = now;

      const newCount = violationsRef.current + 1;
      violationsRef.current = newCount;
      setViolations(newCount);

      if (newCount >= MAX_ALLOWED_VIOLATIONS) {
        toast.error('Maximum exam violations reached (3/3). Submitting exam automatically...', {
          duration: 5000,
        });
        executeSubmission(true);
      } else {
        setShowWarningModal(true);
        toast.error(`⚠️ Exam Warning: Window left (${newCount}/${MAX_ALLOWED_VIOLATIONS} violations).`, {
          duration: 4000,
        });
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        handleViolationTrigger();
      }
    };

    const handleWindowBlur = () => {
      handleViolationTrigger();
    };

    const handleBeforeUnload = (e) => {
      if (!hasSubmittedRef.current) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [exam, alreadySubmitted, executeSubmission]);

  const handleOptionChange = (questionId, option) => {
    if (timeExpired || submitting) return;
    setAnswers((prev) => ({ ...prev, [questionId]: option }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (questions.length === 0) {
      setError('No questions to submit.');
      return;
    }

    const unansweredCount = questions.filter((q) => !answers[q._id]).length;
    if (unansweredCount > 0) {
      const confirmSubmit = window.confirm(
        `You have ${unansweredCount} unanswered question(s). Are you sure you want to submit?`
      );
      if (!confirmSubmit) return;
    }

    executeSubmission(false);
  };

  // Format MM:SS
  const formatTime = (seconds) => {
    if (seconds === null || seconds === undefined) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-[#EEF3FB] flex items-center justify-center p-4">
        <div className="w-14 h-14 border-4 border-[#1B3A6B] border-t-[#4A9EE8] rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error && !exam) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-[#EEF3FB] flex items-center justify-center p-4">
        <div className="max-w-xl w-full p-8 bg-white border border-red-200 rounded-3xl text-center shadow-lg">
          <div className="w-12 h-12 bg-red-100 text-[#DC2626] rounded-2xl flex items-center justify-center mx-auto text-2xl mb-4">
            ⚠️
          </div>
          <p className="text-[#DC2626] font-bold mb-6 text-sm">{error}</p>
          <Link
            to="/student-dashboard"
            className="px-6 py-3 bg-[#1B3A6B] text-white rounded-xl hover:bg-[#0F2044] text-sm font-extrabold shadow-md transition-colors inline-block"
          >
            ← Back to Student Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-[#EEF3FB] flex items-center justify-center p-4">
        <div className="max-w-xl w-full p-8 bg-white border border-[#1B3A6B]/20 rounded-3xl text-center shadow-lg">
          <p className="text-gray-600 mb-6 text-sm font-semibold">No exam data available.</p>
          <Link
            to="/student-dashboard"
            className="px-6 py-3 bg-[#1B3A6B] text-white rounded-xl hover:bg-[#0F2044] text-sm font-extrabold shadow-md transition-colors inline-block"
          >
            ← Back to Student Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const answeredCount = Object.keys(answers).length;
  const isLastMinute = timeLeft !== null && timeLeft <= 60;
  const isLowTime = timeLeft !== null && timeLeft <= 300;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#EEF3FB] py-8 px-4 select-none relative">
      <div className="max-w-4xl mx-auto">
        {/* Security Warning Modal Overlay */}
        {showWarningModal && !hasSubmittedRef.current && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
            <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-red-200 text-center">
              <div className="w-16 h-16 bg-red-100 text-[#DC2626] rounded-2xl flex items-center justify-center mx-auto text-3xl mb-4 shadow-xs">
                ⚠️
              </div>
              <h2 className="text-xl font-extrabold text-[#0A1628] mb-2">
                Exam Security Warning
              </h2>
              <p className="text-gray-600 text-xs sm:text-sm mb-4 leading-relaxed">
                You left the exam window or switched tabs. Leaving the active examination is recorded as a proctoring violation.
              </p>

              <div className="p-3 bg-red-50 border border-red-200 rounded-xl mb-5 flex items-center justify-center gap-2">
                <span className="text-xs font-bold text-[#DC2626]">
                  Violation Count:
                </span>
                <span className="px-2.5 py-0.5 bg-[#DC2626] text-white text-xs font-extrabold rounded-full">
                  {violations} / {MAX_ALLOWED_VIOLATIONS}
                </span>
              </div>

              <p className="text-xs text-[#DC2626] mb-6 font-medium">
                Note: Reaching {MAX_ALLOWED_VIOLATIONS} violations will automatically submit your exam.
              </p>

              <button
                onClick={() => setShowWarningModal(false)}
                className="w-full py-3 bg-[#DC2626] hover:bg-red-700 text-white font-extrabold rounded-xl shadow-md transition-colors text-xs uppercase tracking-wider cursor-pointer"
              >
                Return to Exam
              </button>
            </div>
          </div>
        )}

        {/* Exam Header */}
        <div className="bg-white border border-[#1B3A6B]/20 rounded-3xl p-6 sm:p-8 shadow-md mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span
                className={`px-3 py-1 text-xs font-extrabold rounded-full ${
                  isRetry
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    : 'bg-[#D6E4F7] text-[#1B3A6B] border border-[#1B3A6B]/20'
                }`}
              >
                {isRetry ? '🔄 Practice Attempt' : 'Live Examination'}
              </span>
              <span className="text-xs text-[#1B3A6B] font-bold px-2.5 py-0.5 bg-blue-50 rounded-md border border-[#1B3A6B]/10">
                {questions.length} {questions.length === 1 ? 'Question' : 'Questions'}
              </span>
              {violations > 0 && (
                <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-red-100 text-[#DC2626] flex items-center gap-1 border border-red-200">
                  <span>🛡️</span> Violations: {violations}/{MAX_ALLOWED_VIOLATIONS}
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0A1628] tracking-tight">{exam.title}</h1>
            {exam.description && <p className="text-gray-600 text-xs sm:text-sm mt-1">{exam.description}</p>}
          </div>

          {/* Metrics & Countdown Timer */}
          <div className="flex items-center gap-3 bg-[#EEF3FB] p-3 rounded-2xl border border-[#1B3A6B]/20 shrink-0 flex-wrap sm:flex-nowrap shadow-xs">
            {/* Countdown Timer Badge */}
            <div
              className={`px-4 py-2 rounded-xl font-bold flex items-center gap-2 text-sm border transition-all ${
                isLastMinute
                  ? 'bg-red-50 text-[#DC2626] border-red-300 ring-2 ring-red-200 animate-pulse'
                  : isLowTime
                  ? 'bg-amber-50 text-amber-900 border-amber-300'
                  : 'bg-white text-[#1B3A6B] border-[#1B3A6B]/20 shadow-xs'
              }`}
            >
              <span className="text-base">⏱️</span>
              <div>
                <span className="text-[10px] block uppercase font-bold text-gray-500 leading-none">
                  Time Left
                </span>
                <span className="text-base font-mono tracking-wider font-extrabold">
                  {formatTime(timeLeft)}
                </span>
              </div>
            </div>

            <div className="h-8 w-px bg-[#1B3A6B]/20 hidden sm:block"></div>

            <div className="text-center px-3">
              <span className="block text-[10px] text-gray-500 uppercase font-bold">Answered</span>
              <span className="text-sm font-extrabold text-[#1B3A6B]">
                {answeredCount} / {questions.length}
              </span>
            </div>

            <div className="h-8 w-px bg-[#1B3A6B]/20 hidden sm:block"></div>

            <div className="text-center px-3">
              <span className="block text-[10px] text-gray-500 uppercase font-bold">Total Marks</span>
              <span className="text-sm font-extrabold text-[#0A1628]">{exam.totalMarks}</span>
            </div>
          </div>
        </div>

        {timeExpired && (
          <div className="p-4 mb-6 bg-red-50 border border-red-300 text-[#DC2626] rounded-2xl text-sm font-bold flex items-center gap-2 shadow-xs">
            <span>⚠️</span>
            <span>Time has expired! Submitting your examination automatically...</span>
          </div>
        )}

        {error && (
          <div className="p-4 mb-6 bg-red-50 border border-red-200 text-[#DC2626] rounded-2xl text-sm font-bold shadow-xs">
            {error}
          </div>
        )}

        {/* Questions Form */}
        <form onSubmit={handleSubmit} className="space-y-6 select-none">
          {questions.map((q, qIndex) => (
            <div
              key={q._id}
              className={`bg-white border rounded-3xl p-6 sm:p-7 shadow-xs transition-all select-none ${
                answers[q._id]
                  ? 'border-[#1B3A6B] ring-2 ring-[#4A9EE8]/30 shadow-md'
                  : 'border-[#1B3A6B]/20 hover:border-[#1B3A6B]/40'
              }`}
            >
              <div className="flex items-start justify-between gap-4 mb-5">
                <div className="flex items-start gap-3">
                  <span className="h-7 px-3 rounded-xl bg-gradient-to-r from-[#0F2044] to-[#1B3A6B] text-white text-xs font-extrabold flex items-center justify-center select-none shrink-0 shadow-xs mt-0.5">
                    Question {qIndex + 1} of {questions.length}
                  </span>
                  <h3 className="font-extrabold text-[#0A1628] text-base sm:text-lg select-none leading-snug">
                    {q.questionText}
                  </h3>
                </div>
                <span className="text-xs bg-[#D6E4F7] text-[#1B3A6B] border border-[#1B3A6B]/20 px-2.5 py-1 rounded-xl font-extrabold shrink-0 select-none shadow-2xs">
                  {q.marks ?? 1} mark{(q.marks ?? 1) > 1 ? 's' : ''}
                </span>
              </div>

              <div className="space-y-3 pl-0 sm:pl-10">
                {q.options &&
                  q.options.map((opt, optIndex) => {
                    const isSelected = answers[q._id] === opt;
                    const letter = String.fromCharCode(65 + optIndex);
                    return (
                      <label
                        key={optIndex}
                        className={`flex items-center px-4 py-3.5 rounded-2xl border cursor-pointer text-xs sm:text-sm transition-all select-none ${
                          isSelected
                            ? 'bg-[#D6E4F7]/40 border-[#1B3A6B] text-[#0A1628] font-bold ring-2 ring-[#4A9EE8]/40 shadow-xs'
                            : 'bg-white border-gray-200 text-[#0A1628] hover:bg-[#EEF3FB] hover:border-[#1B3A6B]/30'
                        }`}
                      >
                        <input
                          type="radio"
                          name={`question-${q._id}`}
                          value={opt}
                          checked={isSelected}
                          disabled={timeExpired || submitting}
                          onChange={() => handleOptionChange(q._id, opt)}
                          className="h-4 w-4 text-[#1B3A6B] focus:ring-[#1B3A6B] border-gray-300 disabled:opacity-50 cursor-pointer"
                        />
                        <span
                          className={`ml-3 mr-2.5 w-6 h-6 rounded-lg text-xs font-extrabold flex items-center justify-center select-none shrink-0 ${
                            isSelected
                              ? 'bg-[#1B3A6B] text-white shadow-2xs'
                              : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          {letter}
                        </span>
                        <span className="flex-1 select-none font-medium">{opt}</span>
                      </label>
                    );
                  })}
              </div>
            </div>
          ))}

          {/* Sticky Bottom Actions Bar */}
          <div className="sticky bottom-4 bg-white/95 backdrop-blur-md border border-[#1B3A6B]/20 p-4 sm:p-5 rounded-2xl shadow-xl flex items-center justify-between gap-4">
            <div className="text-xs sm:text-sm text-gray-600 select-none">
              <span className="font-extrabold text-[#1B3A6B]">{answeredCount}</span> of{' '}
              <span className="font-extrabold text-[#0A1628]">{questions.length}</span> questions answered
            </div>
            <button
              type="submit"
              disabled={submitting || timeExpired}
              className="px-8 py-3 bg-gradient-to-r from-[#0F2044] to-[#1B3A6B] hover:from-[#0A1628] hover:to-[#0F2044] text-white font-extrabold rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 flex items-center gap-2 text-xs sm:text-sm cursor-pointer"
            >
              {submitting && (
                <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8H4z"
                  />
                </svg>
              )}
              <span>{submitting ? 'Submitting & Scoring...' : 'Submit Exam'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ExamPage;
