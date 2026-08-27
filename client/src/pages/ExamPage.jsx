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
  const violationsRef = useRef(0);
  const lastViolationTimeRef = useRef(0);

  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  useEffect(() => {
    questionsRef.current = questions;
  }, [questions]);

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
        const response = await api.post(`/exams/${examId}/submit`, { answers: preparedAnswers });
        console.log("FULL SUBMIT RESPONSE:", JSON.stringify(response.data, null, 2));

        const resultId =
          response.data?.resultId ||
          response.data?.result?._id ||
          response.data?.result?.id ||
          response.data?._id;

        console.log("PARSED RESULT ID:", resultId);

        if (!resultId) {
          console.error("Result ID missing from submit response:", response.data);
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
        console.error("SUBMIT ERROR STATUS:", err.response?.status);
        console.log(
          "SUBMIT ERROR DATA:",
          JSON.stringify(err.response?.data, null, 2)
        );
        console.error("SUBMIT ERROR MESSAGE:", err.message);
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

  // Fetch exam details and questions
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
        const [examRes, quesRes, myResultsRes] = await Promise.all([
          api.get(`/exams/${examId}`),
          api.get(`/exams/${examId}/questions`),
          api.get('/results/my').catch(() => ({ data: { results: [] } })),
        ]);

        const loadedExam = examRes.data.exam || examRes.data;
        setExam(loadedExam);
        const qList = quesRes.data.questions || quesRes.data || [];
        setQuestions(Array.isArray(qList) ? qList : []);

        // Check if student already submitted this exam previously (only for normal opens, not retries)
        if (!isRetry) {
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
        } else {
          setError(err.response?.data?.message || 'Failed to load exam questions');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [examId, token, isRetry]);

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
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#7C2D12]"></div>
      </div>
    );
  }

  if (error && !exam) {
    return (
      <div className="max-w-xl mx-auto my-12 p-6 bg-red-50 border border-red-200 rounded-2xl text-center">
        <p className="text-[#DC2626] font-semibold mb-4 text-sm">{error}</p>
        <Link
          to="/student-dashboard"
          className="px-5 py-2.5 bg-[#7C2D12] text-white rounded-xl hover:bg-[#5F220D] text-sm font-bold shadow transition-colors"
        >
          Back to Student Dashboard
        </Link>
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="max-w-xl mx-auto my-12 p-6 bg-white border border-gray-200 rounded-2xl text-center shadow-sm">
        <p className="text-gray-600 mb-4 text-sm">No exam data available.</p>
        <Link
          to="/student-dashboard"
          className="px-5 py-2.5 bg-[#7C2D12] text-white rounded-xl hover:bg-[#5F220D] text-sm font-bold shadow transition-colors"
        >
          Back to Student Dashboard
        </Link>
      </div>
    );
  }

  const answeredCount = Object.keys(answers).length;
  const isLastMinute = timeLeft !== null && timeLeft <= 60;
  const isLowTime = timeLeft !== null && timeLeft <= 300;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 select-none relative">
      {/* Security Warning Modal Overlay */}
      {showWarningModal && !hasSubmittedRef.current && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-red-200 text-center">
            <div className="w-16 h-16 bg-red-100 text-[#DC2626] rounded-full flex items-center justify-center mx-auto text-3xl mb-4">
              ⚠️
            </div>
            <h2 className="text-xl font-extrabold text-[#1F2937] mb-2">
              Exam Security Warning
            </h2>
            <p className="text-gray-600 text-sm mb-4 leading-relaxed">
              You left the exam window or switched tabs. Leaving the active examination is considered a proctoring violation.
            </p>

            <div className="p-3 bg-red-50 border border-red-200 rounded-xl mb-6 flex items-center justify-center gap-2">
              <span className="text-sm font-semibold text-[#DC2626]">
                Violation Count:
              </span>
              <span className="px-2.5 py-0.5 bg-[#DC2626] text-white text-xs font-bold rounded-full">
                {violations} / {MAX_ALLOWED_VIOLATIONS}
              </span>
            </div>

            <p className="text-xs text-[#DC2626] mb-6 font-medium">
              Note: Reaching {MAX_ALLOWED_VIOLATIONS} violations will automatically submit your exam.
            </p>

            <button
              onClick={() => setShowWarningModal(false)}
              className="w-full py-3 bg-[#DC2626] hover:bg-red-700 text-white font-bold rounded-xl shadow-md transition-colors text-sm"
            >
              Return to Exam
            </button>
          </div>
        </div>
      )}

      {/* Exam Header */}
      <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full ${isRetry ? 'bg-green-100 text-[#16A34A]' : 'bg-amber-100 text-[#7C2D12]'
              }`}>
              {isRetry ? '🔄 Practice Attempt' : 'Live Examination'}
            </span>
            <span className="text-xs text-gray-500 font-medium">
              {questions.length} {questions.length === 1 ? 'Question' : 'Questions'}
            </span>
            {violations > 0 && (
              <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-red-100 text-[#DC2626] flex items-center gap-1">
                <span>🛡️</span> Violations: {violations}/{MAX_ALLOWED_VIOLATIONS}
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1F2937]">{exam.title}</h1>
          {exam.description && <p className="text-gray-600 text-sm mt-1">{exam.description}</p>}
        </div>

        {/* Metrics & Countdown Timer */}
        <div className="flex items-center gap-3 bg-amber-50/40 p-2.5 rounded-2xl border border-amber-100 shrink-0 flex-wrap sm:flex-nowrap">
          {/* Countdown Timer Badge */}
          <div
            className={`px-4 py-2 rounded-xl font-bold flex items-center gap-2 text-sm border transition-all ${isLastMinute
                ? 'bg-red-50 text-[#DC2626] border-red-300 ring-2 ring-red-200 animate-pulse'
                : isLowTime
                  ? 'bg-amber-50 text-[#7C2D12] border-amber-300'
                  : 'bg-amber-50 text-[#7C2D12] border-amber-200'
              }`}
          >
            <span className="text-base">⏱️</span>
            <div>
              <span className="text-[10px] block uppercase font-semibold text-gray-500 leading-none">
                Time Left
              </span>
              <span className="text-base font-mono tracking-wider font-extrabold">
                {formatTime(timeLeft)}
              </span>
            </div>
          </div>

          <div className="h-8 w-px bg-purple-200 hidden sm:block"></div>

          <div className="text-center px-2">
            <span className="block text-[10px] text-gray-500 uppercase font-semibold">Answered</span>
            <span className="text-sm font-bold text-[#7C2D12]">
              {answeredCount} / {questions.length}
            </span>
          </div>

          <div className="h-8 w-px bg-purple-200 hidden sm:block"></div>

          <div className="text-center px-2">
            <span className="block text-[10px] text-gray-500 uppercase font-semibold">Marks</span>
            <span className="text-sm font-bold text-[#1F2937]">{exam.totalMarks}</span>
          </div>
        </div>
      </div>

      {timeExpired && (
        <div className="p-4 mb-6 bg-red-50 border border-red-300 text-[#DC2626] rounded-2xl text-sm font-semibold flex items-center gap-2">
          <span>⚠️</span>
          <span>Time has expired! Submitting your answers automatically...</span>
        </div>
      )}

      {error && (
        <div className="p-4 mb-6 bg-red-50 border border-red-200 text-[#DC2626] rounded-2xl text-sm font-semibold">
          {error}
        </div>
      )}

      {/* Questions Form */}
      <form onSubmit={handleSubmit} className="space-y-6 select-none">
        {questions.map((q, qIndex) => (
          <div
            key={q._id}
            className={`bg-white border rounded-2xl p-6 shadow-sm transition-all select-none ${answers[q._id] ? 'border-amber-300 ring-1 ring-amber-100' : 'border-gray-200'
              }`}
          >
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex items-center gap-2">
                <span className="h-7 px-2.5 rounded-lg bg-[#1F2937] text-white text-xs font-bold flex items-center justify-center select-none shrink-0">
                  Question {qIndex + 1} of {questions.length}
                </span>
                <h3 className="font-bold text-[#1F2937] text-base select-none">{q.questionText}</h3>
              </div>
              <span className="text-xs bg-amber-50 text-[#7C2D12] border border-amber-100 px-2.5 py-1 rounded-md font-bold shrink-0 select-none">
                {q.marks ?? 1} mark{(q.marks ?? 1) > 1 ? 's' : ''}
              </span>
            </div>

            <div className="space-y-2.5 pl-9">
              {q.options &&
                q.options.map((opt, optIndex) => {
                  const isSelected = answers[q._id] === opt;
                  return (
                    <label
                      key={optIndex}
                      className={`flex items-center px-4 py-3 rounded-xl border cursor-pointer text-sm transition-all select-none ${isSelected
                          ? 'bg-amber-50 border-[#7C2D12] text-[#7C2D12] font-semibold ring-1 ring-[#F97316]'
                          : 'bg-white border-gray-200 text-[#1F2937] hover:bg-amber-50/30'
                        }`}
                    >
                      <input
                        type="radio"
                        name={`question-${q._id}`}
                        value={opt}
                        checked={isSelected}
                        disabled={timeExpired || submitting}
                        onChange={() => handleOptionChange(q._id, opt)}
                        className="h-4 w-4 text-[#7C2D12] focus:ring-[#7C2D12] border-gray-300 disabled:opacity-50"
                      />
                      <span className="ml-3 font-bold text-gray-400 mr-2 select-none">
                        {String.fromCharCode(65 + optIndex)}.
                      </span>
                      <span className="flex-1 select-none">{opt}</span>
                    </label>
                  );
                })}
            </div>
          </div>
        ))}

        <div className="sticky bottom-4 bg-white/95 backdrop-blur border border-amber-100 p-4 rounded-2xl shadow-xl flex items-center justify-between gap-4">
          <div className="text-sm text-gray-600 select-none">
            <span className="font-bold text-[#1F2937]">{answeredCount}</span> of{' '}
            <span className="font-bold text-[#1F2937]">{questions.length}</span> questions answered
          </div>
          <button
            type="submit"
            disabled={submitting || timeExpired}
            className="px-8 py-3 bg-[#7C2D12] hover:bg-[#5F220D] text-white font-bold rounded-xl shadow-md transition-colors disabled:bg-gray-400 flex items-center gap-2 text-sm"
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
            <span>{submitting ? 'Submitting & Grading...' : 'Submit Exam'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default ExamPage;
