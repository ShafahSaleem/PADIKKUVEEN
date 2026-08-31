import React, { useState, useEffect, useContext, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import {
  MagnifyingGlassIcon,
  ArrowPathIcon,
  XMarkIcon,
  UserIcon,
  AcademicCapIcon,
  ClipboardDocumentCheckIcon,
  CheckCircleIcon,
  ChartBarIcon,
  EyeIcon,
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  UsersIcon,
  DocumentCheckIcon,
} from '@heroicons/react/24/outline';

const MentorDashboard = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  // Active Tab: 'overview' | 'students' | 'exams' | 'results'
  const [activeTab, setActiveTab] = useState('overview');

  // 1. Stats State
  const [stats, setStats] = useState({
    studentsCount: 0,
    totalAttempts: 0,
    averageScore: 0,
    passRate: 0,
    totalExamsCreated: 0,
    totalActiveExams: 0,
    topPerformers: [],
    studentsNeedingAttention: [],
  });
  const [statsLoading, setStatsLoading] = useState(true);

  // 2. Students List State
  const [students, setStudents] = useState([]);
  const [studentsLoading, setStudentsLoading] = useState(true);
  const [studentSearch, setStudentSearch] = useState('');

  // 3. Mentor Exams List State
  const [exams, setExams] = useState([]);
  const [examsLoading, setExamsLoading] = useState(true);
  const [examSearch, setExamSearch] = useState('');
  const [examStatusFilter, setExamStatusFilter] = useState('all');

  // 4. Results List State
  const [results, setResults] = useState([]);
  const [resultsLoading, setResultsLoading] = useState(true);
  const [resultSearch, setResultSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categories, setCategories] = useState([]);

  // 5. Student Detail Modal State
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [studentDetail, setStudentDetail] = useState(null);
  const [studentDetailLoading, setStudentDetailLoading] = useState(false);

  // 6. Create / Edit Exam Modal State
  const [examModalOpen, setExamModalOpen] = useState(false);
  const [editingExam, setEditingExam] = useState(null);
  const [examForm, setExamForm] = useState({
    title: '',
    description: '',
    duration: 30,
    totalMarks: 100,
    passingPercentage: 50,
    numberOfQuestions: '',
    category: '',
    isActive: true,
  });
  const [examSaving, setExamSaving] = useState(false);

  // 7. Manage Questions Modal State
  const [questionsModalOpen, setQuestionsModalOpen] = useState(false);
  const [selectedExamForQuestions, setSelectedExamForQuestions] = useState(null);
  const [questionsList, setQuestionsList] = useState([]);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [showAddQuestionForm, setShowAddQuestionForm] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState(null);
  const [questionForm, setQuestionForm] = useState({
    questionText: '',
    optionA: '',
    optionB: '',
    optionC: '',
    optionD: '',
    correctAnswer: 'A',
    marks: 1,
  });
  const [questionSaving, setQuestionSaving] = useState(false);

  // 8. Assign Students Modal State
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedExamForAssign, setSelectedExamForAssign] = useState(null);
  const [assignStudentsList, setAssignStudentsList] = useState([]);
  const [selectedStudentIdsForAssign, setSelectedStudentIdsForAssign] = useState([]);
  const [assignLoading, setAssignLoading] = useState(false);
  const [assignSaving, setAssignSaving] = useState(false);
  const [assignSearch, setAssignSearch] = useState('');

  // 9. Exam Results Modal State
  const [examResultsModalOpen, setExamResultsModalOpen] = useState(false);
  const [selectedExamForResults, setSelectedExamForResults] = useState(null);
  const [examResultsList, setExamResultsList] = useState([]);
  const [examResultsLoading, setExamResultsLoading] = useState(false);

  // Security Check: Redirect non-mentors
  useEffect(() => {
    if (user && user.role !== 'mentor') {
      if (user.role === 'admin') {
        navigate('/admin-dashboard');
      } else {
        navigate('/student-dashboard');
      }
    }
  }, [user, navigate]);

  // Fetch Statistics
  const fetchStats = useCallback(async () => {
    try {
      setStatsLoading(true);
      const res = await api.get('/mentor/stats');
      if (res.data) {
        setStats(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch mentor stats:', err);
      toast.error(err.response?.data?.message || 'Failed to load mentor statistics');
    } finally {
      setStatsLoading(false);
    }
  }, []);

  // Fetch Assigned Students
  const fetchStudents = useCallback(async () => {
    try {
      setStudentsLoading(true);
      const res = await api.get('/mentor/students');
      const data = res.data?.students || [];
      setStudents(data);
    } catch (err) {
      console.error('Failed to fetch mentor students:', err);
      toast.error(err.response?.data?.message || 'Failed to load assigned students');
    } finally {
      setStudentsLoading(false);
    }
  }, []);

  // Fetch Mentor Exams
  const fetchExams = useCallback(async () => {
    try {
      setExamsLoading(true);
      const res = await api.get('/mentor/exams');
      const data = res.data?.exams || [];
      setExams(data);
    } catch (err) {
      console.error('Failed to fetch mentor exams:', err);
      toast.error(err.response?.data?.message || 'Failed to load exams');
    } finally {
      setExamsLoading(false);
    }
  }, []);

  // Fetch Exam Results
  const fetchResults = useCallback(async () => {
    try {
      setResultsLoading(true);
      const res = await api.get('/mentor/results');
      const data = res.data?.results || [];
      setResults(data);
    } catch (err) {
      console.error('Failed to fetch mentor results:', err);
      toast.error(err.response?.data?.message || 'Failed to load student results');
    } finally {
      setResultsLoading(false);
    }
  }, []);

  // Fetch Available Categories for filters
  const fetchCategories = useCallback(async () => {
    try {
      const res = await api.get('/categories');
      const cats = res.data?.categories || [];
      setCategories(cats);
    } catch {
      // Ignore category load error if empty
    }
  }, []);

  useEffect(() => {
    fetchStats();
    fetchStudents();
    fetchExams();
    fetchResults();
    fetchCategories();
  }, [fetchStats, fetchStudents, fetchExams, fetchResults, fetchCategories]);

  // Refresh all data
  const handleRefreshAll = () => {
    fetchStats();
    fetchStudents();
    fetchExams();
    fetchResults();
  };

  // ==========================================
  // STUDENT DETAILS MODAL HANDLERS
  // ==========================================
  const openStudentDetails = async (studentId) => {
    try {
      setSelectedStudentId(studentId);
      setStudentDetailLoading(true);
      const res = await api.get(`/mentor/students/${studentId}`);
      setStudentDetail(res.data);
    } catch (err) {
      console.error('Failed to load student details:', err);
      toast.error(err.response?.data?.message || 'Failed to load student details');
      setSelectedStudentId(null);
      setStudentDetail(null);
    } finally {
      setStudentDetailLoading(false);
    }
  };

  const closeStudentDetails = () => {
    setSelectedStudentId(null);
    setStudentDetail(null);
  };

  // ==========================================
  // EXAM CREATE / EDIT / DELETE HANDLERS
  // ==========================================
  const openCreateExamModal = () => {
    setEditingExam(null);
    setExamForm({
      title: '',
      description: '',
      duration: 30,
      totalMarks: 100,
      passingPercentage: 50,
      numberOfQuestions: '',
      category: categories.length > 0 ? categories[0]._id : '',
      isActive: true,
    });
    setExamModalOpen(true);
  };

  const openEditExamModal = (exam) => {
    setEditingExam(exam);
    setExamForm({
      title: exam.title || '',
      description: exam.description || '',
      duration: exam.duration || 30,
      totalMarks: exam.totalMarks || 100,
      passingPercentage: exam.passingPercentage ?? 50,
      numberOfQuestions: exam.numberOfQuestions ? String(exam.numberOfQuestions) : '',
      category: exam.category?._id || exam.category || '',
      isActive: exam.isActive !== undefined ? exam.isActive : true,
    });
    setExamModalOpen(true);
  };

  const handleSaveExam = async (e) => {
    e.preventDefault();
    if (!examForm.title.trim()) {
      toast.error('Exam title is required');
      return;
    }

    setExamSaving(true);
    try {
      const payload = {
        title: examForm.title.trim(),
        description: examForm.description.trim(),
        duration: Number(examForm.duration) || 30,
        totalMarks: Number(examForm.totalMarks) || 100,
        passingPercentage: Number(examForm.passingPercentage) || 50,
        numberOfQuestions: examForm.numberOfQuestions ? Number(examForm.numberOfQuestions) : null,
        category: examForm.category || null,
        isActive: Boolean(examForm.isActive),
      };

      if (editingExam) {
        await api.put(`/mentor/exams/${editingExam._id}`, payload);
        toast.success('Exam updated successfully');
      } else {
        await api.post('/mentor/exams', payload);
        toast.success('Exam created successfully');
      }

      setExamModalOpen(false);
      fetchExams();
      fetchStats();
    } catch (err) {
      console.error('Failed to save exam:', err);
      toast.error(err.response?.data?.message || 'Failed to save exam');
    } finally {
      setExamSaving(false);
    }
  };

  const handleDeleteExam = async (examId, title) => {
    if (!window.confirm(`Are you sure you want to delete the exam "${title}"? This cannot be undone.`)) {
      return;
    }
    try {
      await api.delete(`/mentor/exams/${examId}`);
      toast.success('Exam deleted successfully');
      fetchExams();
      fetchStats();
    } catch (err) {
      console.error('Failed to delete exam:', err);
      toast.error(err.response?.data?.message || 'Failed to delete exam');
    }
  };

  const handleToggleExamStatus = async (examId) => {
    try {
      const res = await api.patch(`/mentor/exams/${examId}/status`);
      toast.success(res.data?.message || 'Exam status updated');
      fetchExams();
      fetchStats();
    } catch (err) {
      console.error('Failed to toggle status:', err);
      toast.error(err.response?.data?.message || 'Failed to update exam status');
    }
  };

  // ==========================================
  // QUESTION MANAGEMENT HANDLERS
  // ==========================================
  const openQuestionsModal = async (exam) => {
    setSelectedExamForQuestions(exam);
    setQuestionsModalOpen(true);
    setShowAddQuestionForm(false);
    setEditingQuestionId(null);
    try {
      setQuestionsLoading(true);
      const res = await api.get(`/mentor/exams/${exam._id}/questions`);
      setQuestionsList(res.data?.questions || []);
    } catch (err) {
      console.error('Failed to fetch questions:', err);
      toast.error(err.response?.data?.message || 'Failed to load questions');
    } finally {
      setQuestionsLoading(false);
    }
  };

  const openAddQuestion = () => {
    setEditingQuestionId(null);
    setQuestionForm({
      questionText: '',
      optionA: '',
      optionB: '',
      optionC: '',
      optionD: '',
      correctAnswer: 'A',
      marks: 1,
    });
    setShowAddQuestionForm(true);
  };

  const openEditQuestion = (q) => {
    setEditingQuestionId(q._id);
    const opts = q.options || [];
    let cAns = 'A';
    if (q.correctAnswer === opts[1]) cAns = 'B';
    else if (q.correctAnswer === opts[2]) cAns = 'C';
    else if (q.correctAnswer === opts[3]) cAns = 'D';
    else if (['A', 'B', 'C', 'D'].includes(q.correctAnswer)) cAns = q.correctAnswer;

    setQuestionForm({
      questionText: q.questionText || '',
      optionA: opts[0] || '',
      optionB: opts[1] || '',
      optionC: opts[2] || '',
      optionD: opts[3] || '',
      correctAnswer: cAns,
      marks: q.marks || 1,
    });
    setShowAddQuestionForm(true);
  };

  const handleSaveQuestion = async (e) => {
    e.preventDefault();
    if (!questionForm.questionText.trim()) {
      toast.error('Question text is required');
      return;
    }
    if (!questionForm.optionA.trim() || !questionForm.optionB.trim() || !questionForm.optionC.trim() || !questionForm.optionD.trim()) {
      toast.error('All 4 options are required');
      return;
    }

    const options = [
      questionForm.optionA.trim(),
      questionForm.optionB.trim(),
      questionForm.optionC.trim(),
      questionForm.optionD.trim(),
    ];

    let finalCorrectAnswer = options[0];
    if (questionForm.correctAnswer === 'B') finalCorrectAnswer = options[1];
    if (questionForm.correctAnswer === 'C') finalCorrectAnswer = options[2];
    if (questionForm.correctAnswer === 'D') finalCorrectAnswer = options[3];

    setQuestionSaving(true);
    try {
      const examId = selectedExamForQuestions._id;
      const payload = {
        questionText: questionForm.questionText.trim(),
        options,
        correctAnswer: finalCorrectAnswer,
        marks: Number(questionForm.marks) || 1,
      };

      if (editingQuestionId) {
        await api.put(`/mentor/exams/${examId}/questions/${editingQuestionId}`, payload);
        toast.success('Question updated');
      } else {
        await api.post(`/mentor/exams/${examId}/questions`, payload);
        toast.success('Question added');
      }

      setShowAddQuestionForm(false);
      setEditingQuestionId(null);
      // Reload questions
      const res = await api.get(`/mentor/exams/${examId}/questions`);
      setQuestionsList(res.data?.questions || []);
      fetchExams();
    } catch (err) {
      console.error('Failed to save question:', err);
      toast.error(err.response?.data?.message || 'Failed to save question');
    } finally {
      setQuestionSaving(false);
    }
  };

  const handleDeleteQuestion = async (questionId) => {
    if (!window.confirm('Delete this question?')) return;
    try {
      const examId = selectedExamForQuestions._id;
      await api.delete(`/mentor/exams/${examId}/questions/${questionId}`);
      toast.success('Question deleted');
      setQuestionsList(questionsList.filter((q) => q._id !== questionId));
      fetchExams();
    } catch (err) {
      console.error('Failed to delete question:', err);
      toast.error(err.response?.data?.message || 'Failed to delete question');
    }
  };

  // ==========================================
  // STUDENT ASSIGNMENT HANDLERS
  // ==========================================
  const openAssignModal = async (exam) => {
    setSelectedExamForAssign(exam);
    setAssignModalOpen(true);
    setAssignSearch('');
    try {
      setAssignLoading(true);
      const res = await api.get(`/mentor/exams/${exam._id}/students`);
      const stuList = res.data?.students || [];
      setAssignStudentsList(stuList);
      setSelectedStudentIdsForAssign(
        stuList.filter((s) => s.isAssigned).map((s) => s._id)
      );
    } catch (err) {
      console.error('Failed to load students for assignment:', err);
      toast.error(err.response?.data?.message || 'Failed to load students');
    } finally {
      setAssignLoading(false);
    }
  };

  const handleToggleStudentSelect = (studentId) => {
    setSelectedStudentIdsForAssign((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleSelectAllStudents = () => {
    setSelectedStudentIdsForAssign(assignStudentsList.map((s) => s._id));
  };

  const handleUnselectAllStudents = () => {
    setSelectedStudentIdsForAssign([]);
  };

  const handleSaveAssignments = async () => {
    setAssignSaving(true);
    try {
      const examId = selectedExamForAssign._id;
      await api.post(`/mentor/exams/${examId}/assign`, {
        studentIds: selectedStudentIdsForAssign,
      });
      toast.success('Exam assignments updated successfully');
      setAssignModalOpen(false);
      fetchExams();
      fetchStudents();
    } catch (err) {
      console.error('Failed to update assignments:', err);
      toast.error(err.response?.data?.message || 'Failed to update assignments');
    } finally {
      setAssignSaving(false);
    }
  };

  // ==========================================
  // EXAM RESULTS MODAL HANDLER
  // ==========================================
  const openExamResultsModal = async (exam) => {
    setSelectedExamForResults(exam);
    setExamResultsModalOpen(true);
    try {
      setExamResultsLoading(true);
      const res = await api.get(`/mentor/exams/${exam._id}/results`);
      setExamResultsList(res.data?.results || []);
    } catch (err) {
      console.error('Failed to load exam results:', err);
      toast.error(err.response?.data?.message || 'Failed to load results');
    } finally {
      setExamResultsLoading(false);
    }
  };

  // ==========================================
  // MEMOIZED FILTERED LISTS
  // ==========================================
  const filteredStudents = useMemo(() => {
    if (!studentSearch.trim()) return students;
    const term = studentSearch.toLowerCase().trim();
    return students.filter(
      (s) =>
        s.name?.toLowerCase().includes(term) ||
        s.email?.toLowerCase().includes(term)
    );
  }, [students, studentSearch]);

  const filteredExams = useMemo(() => {
    return exams.filter((e) => {
      const term = examSearch.toLowerCase().trim();
      const matchSearch =
        !term ||
        e.title?.toLowerCase().includes(term) ||
        e.description?.toLowerCase().includes(term);

      const matchStatus =
        examStatusFilter === 'all' ||
        (examStatusFilter === 'active' && e.isActive) ||
        (examStatusFilter === 'inactive' && !e.isActive);

      return matchSearch && matchStatus;
    });
  }, [exams, examSearch, examStatusFilter]);

  const filteredResults = useMemo(() => {
    return results.filter((r) => {
      const term = resultSearch.toLowerCase().trim();
      const matchSearch =
        !term ||
        r.student?.name?.toLowerCase().includes(term) ||
        r.student?.email?.toLowerCase().includes(term) ||
        r.exam?.title?.toLowerCase().includes(term);

      const matchCategory =
        categoryFilter === 'all' ||
        r.exam?.categoryName?.toLowerCase() === categoryFilter.toLowerCase() ||
        r.exam?.categoryId === categoryFilter;

      const matchStatus =
        statusFilter === 'all' ||
        (statusFilter === 'passed' && r.isPassed) ||
        (statusFilter === 'failed' && !r.isPassed);

      return matchSearch && matchCategory && matchStatus;
    });
  }, [results, resultSearch, categoryFilter, statusFilter]);

  const filteredAssignStudents = useMemo(() => {
    if (!assignSearch.trim()) return assignStudentsList;
    const term = assignSearch.toLowerCase().trim();
    return assignStudentsList.filter(
      (s) =>
        s.name?.toLowerCase().includes(term) ||
        s.email?.toLowerCase().includes(term)
    );
  }, [assignStudentsList, assignSearch]);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return 'N/A';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 bg-[#EEF3FB] min-h-[calc(100vh-4rem)]">
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-r from-[#0A1628] via-[#0F2044] to-[#1B3A6B] rounded-3xl p-6 sm:p-8 text-white shadow-lg mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-[#2D5DA6]/40">
        <div>
          <div className="inline-block px-3 py-1 bg-[#4A9EE8]/20 text-[#6BB5F0] border border-[#4A9EE8]/30 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
            Mentor Portal
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome, Mentor!
          </h1>
          <p className="text-blue-100/80 mt-1 text-sm sm:text-base">
            Create custom exams, assign tests to your students, and monitor their mastery in real-time.
          </p>
        </div>
        <button
          onClick={handleRefreshAll}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#1B3A6B] hover:bg-[#0F2044] text-white font-semibold rounded-xl text-sm border border-[#4A9EE8]/30 shadow transition-colors cursor-pointer shrink-0"
        >
          <ArrowPathIcon
            className={`w-4 h-4 ${statsLoading || studentsLoading || examsLoading || resultsLoading ? 'animate-spin' : ''}`}
          />
          <span>Refresh</span>
        </button>
      </div>

      {/* 2. Navigation Tabs */}
      <div className="flex border-b border-gray-200 mb-6 gap-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-3 px-4 text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer shrink-0 ${
            activeTab === 'overview'
              ? 'border-[#1B3A6B] text-[#1B3A6B]'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <ChartBarIcon className="w-4 h-4" />
          <span>Dashboard Overview</span>
        </button>
        <button
          onClick={() => setActiveTab('students')}
          className={`pb-3 px-4 text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer shrink-0 ${
            activeTab === 'students'
              ? 'border-[#1B3A6B] text-[#1B3A6B]'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <UserIcon className="w-4 h-4" />
          <span>My Students ({students.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('exams')}
          className={`pb-3 px-4 text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer shrink-0 ${
            activeTab === 'exams'
              ? 'border-[#1B3A6B] text-[#1B3A6B]'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <AcademicCapIcon className="w-4 h-4" />
          <span>My Exams ({exams.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('results')}
          className={`pb-3 px-4 text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer shrink-0 ${
            activeTab === 'results'
              ? 'border-[#1B3A6B] text-[#1B3A6B]'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <ClipboardDocumentCheckIcon className="w-4 h-4" />
          <span>Exam Results ({results.length})</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: OVERVIEW */}
      {/* ========================================================================= */}
      {activeTab === 'overview' && (
        <div className="space-y-8 animate-fadeIn">
          {/* Stats Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {/* Students Card */}
            <div className="bg-white border border-[#1B3A6B]/20 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all">
              <span className="text-gray-500 font-bold text-xs uppercase tracking-wider block mb-1">
                Assigned Students
              </span>
              <div className="text-2xl font-extrabold text-[#0A1628]">
                {statsLoading ? '...' : stats.studentsCount}
              </div>
              <p className="text-[11px] text-gray-400 mt-1">Under your mentorship</p>
            </div>

            {/* Exams Created Card */}
            <div className="bg-white border border-[#1B3A6B]/20 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all">
              <span className="text-gray-500 font-bold text-xs uppercase tracking-wider block mb-1">
                Exams Created
              </span>
              <div className="text-2xl font-extrabold text-[#1B3A6B]">
                {statsLoading ? '...' : stats.totalExamsCreated ?? exams.length}
              </div>
              <p className="text-[11px] text-gray-400 mt-1">Authored by you</p>
            </div>

            {/* Active Exams Card */}
            <div className="bg-white border border-[#1B3A6B]/20 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all">
              <span className="text-gray-500 font-bold text-xs uppercase tracking-wider block mb-1">
                Active Exams
              </span>
              <div className="text-2xl font-extrabold text-emerald-600">
                {statsLoading ? '...' : stats.totalActiveExams ?? exams.filter(e => e.isActive).length}
              </div>
              <p className="text-[11px] text-gray-400 mt-1">Available for testing</p>
            </div>

            {/* Total Attempts Card */}
            <div className="bg-white border border-[#1B3A6B]/20 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all">
              <span className="text-gray-500 font-bold text-xs uppercase tracking-wider block mb-1">
                Total Attempts
              </span>
              <div className="text-2xl font-extrabold text-[#0A1628]">
                {statsLoading ? '...' : stats.totalAttempts}
              </div>
              <p className="text-[11px] text-gray-400 mt-1">Completed tests</p>
            </div>

            {/* Avg Score Card */}
            <div className="bg-white border border-[#1B3A6B]/20 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all">
              <span className="text-gray-500 font-bold text-xs uppercase tracking-wider block mb-1">
                Avg Score
              </span>
              <div className="text-2xl font-extrabold text-blue-600">
                {statsLoading ? '...' : `${stats.averageScore}%`}
              </div>
              <p className="text-[11px] text-gray-400 mt-1">Across all submissions</p>
            </div>

            {/* Pass Rate Card */}
            <div className="bg-white border border-[#1B3A6B]/20 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all">
              <span className="text-gray-500 font-bold text-xs uppercase tracking-wider block mb-1">
                Pass Rate
              </span>
              <div className="text-2xl font-extrabold text-emerald-600">
                {statsLoading ? '...' : `${stats.passRate}%`}
              </div>
              <p className="text-[11px] text-gray-400 mt-1">Passed test percentage</p>
            </div>
          </div>

          {/* Highlights Row: Top Performers & Students Needing Attention */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Performers */}
            <div className="bg-white border border-[#1B3A6B]/20 rounded-3xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-extrabold text-[#0A1628]">Top Performers</h2>
                <span className="text-xs font-semibold px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-full">
                  Highest Avg Score
                </span>
              </div>

              {statsLoading ? (
                <div className="space-y-3">
                  <div className="animate-pulse h-12 bg-gray-100 rounded-xl"></div>
                  <div className="animate-pulse h-12 bg-gray-100 rounded-xl"></div>
                </div>
              ) : stats.topPerformers.length === 0 ? (
                <div className="py-8 text-center text-gray-500 text-sm">
                  No student exam submissions recorded yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {stats.topPerformers.map((performer, idx) => (
                    <div
                      key={performer.studentId || idx}
                      className="flex items-center justify-between p-3 rounded-2xl bg-[#F8FAFC] border border-gray-100 hover:border-[#1B3A6B]/30 hover:bg-white transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0">
                          #{idx + 1}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-[#0A1628]">{performer.name}</p>
                          <p className="text-xs text-gray-500">{performer.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <span className="text-sm font-extrabold text-emerald-600">
                            {performer.averageScore}%
                          </span>
                          <p className="text-[11px] text-gray-400">{performer.examsCount} exams</p>
                        </div>
                        <button
                          onClick={() => openStudentDetails(performer.studentId)}
                          className="p-1.5 text-gray-400 hover:text-[#1B3A6B] hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          title="View Student Performance"
                        >
                          <EyeIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Students Needing Attention */}
            <div className="bg-white border border-[#1B3A6B]/20 rounded-3xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-extrabold text-[#0A1628]">Students Needing Attention</h2>
                <span className="text-xs font-semibold px-2.5 py-1 bg-red-50 text-red-800 border border-red-200 rounded-full">
                  Failed latest or Avg &lt; 50%
                </span>
              </div>

              {statsLoading ? (
                <div className="space-y-3">
                  <div className="animate-pulse h-12 bg-gray-100 rounded-xl"></div>
                  <div className="animate-pulse h-12 bg-gray-100 rounded-xl"></div>
                </div>
              ) : stats.studentsNeedingAttention.length === 0 ? (
                <div className="py-8 text-center text-emerald-600 font-medium text-sm flex flex-col items-center gap-2">
                  <CheckCircleIcon className="w-8 h-8 text-emerald-500" />
                  <span>Great news! All assigned students are performing well.</span>
                </div>
              ) : (
                <div className="space-y-3 max-h-[260px] overflow-y-auto pr-1">
                  {stats.studentsNeedingAttention.map((item, idx) => (
                    <div
                      key={item.studentId || idx}
                      className="flex items-center justify-between p-3 rounded-2xl bg-red-50/50 border border-red-100 hover:bg-red-50 transition-all"
                    >
                      <div>
                        <p className="text-sm font-bold text-[#0A1628]">{item.name}</p>
                        <p className="text-xs text-red-700 font-medium">{item.reason}</p>
                      </div>
                      <button
                        onClick={() => openStudentDetails(item.studentId)}
                        className="px-3 py-1 bg-white hover:bg-red-100 text-red-700 border border-red-200 rounded-lg text-xs font-bold shadow-2xs transition-colors cursor-pointer"
                      >
                        View Details
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: MY STUDENTS */}
      {/* ========================================================================= */}
      {activeTab === 'students' && (
        <div className="bg-white border border-[#1B3A6B]/20 rounded-3xl p-6 shadow-sm animate-fadeIn">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl font-bold text-[#0A1628]">Assigned Students</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Students assigned to your mentorship with comprehensive exam metrics
              </p>
            </div>
            <div className="relative w-full sm:w-72">
              <MagnifyingGlassIcon className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                placeholder="Search students..."
                className="w-full pl-10 pr-4 py-2 bg-[#F8FAFC] border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]"
              />
            </div>
          </div>

          {studentsLoading ? (
            <div className="py-16 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1B3A6B] mx-auto"></div>
              <p className="text-xs text-gray-500 mt-2">Loading students...</p>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="py-16 text-center text-gray-500 text-sm">
              {students.length === 0
                ? 'No students currently assigned to your mentorship.'
                : 'No students matching your search criteria.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-100 text-gray-500 font-bold uppercase tracking-wider">
                    <th className="py-3 px-4">Student</th>
                    <th className="py-3 px-4">Exams Assigned</th>
                    <th className="py-3 px-4">Exams Attempted</th>
                    <th className="py-3 px-4">Passed</th>
                    <th className="py-3 px-4">Avg Score</th>
                    <th className="py-3 px-4">Best Score</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredStudents.map((stu) => (
                    <tr key={stu._id} className="hover:bg-[#F8FAFC] transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#1B3A6B] text-white flex items-center justify-center font-bold text-xs shrink-0">
                            {stu.name?.charAt(0).toUpperCase() || 'S'}
                          </div>
                          <div>
                            <p className="font-bold text-[#0A1628] text-sm">{stu.name}</p>
                            <p className="text-[11px] text-gray-500">{stu.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold px-2.5 py-1 bg-blue-50 text-blue-800 rounded-lg border border-blue-100">
                          {stu.examsAssigned ?? 0} assigned
                        </span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-gray-700">
                        {stu.totalExamsTaken} tests
                      </td>
                      <td className="py-3 px-4 font-semibold text-emerald-700">
                        {stu.passedCount} passed
                      </td>
                      <td className="py-3 px-4 font-extrabold text-[#0A1628]">
                        {stu.averageScore}%
                      </td>
                      <td className="py-3 px-4 font-bold text-gray-700">
                        {stu.bestPercentage}%
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            stu.performanceStatus === 'Excellent'
                              ? 'bg-emerald-100 text-emerald-800'
                              : stu.performanceStatus === 'Good'
                              ? 'bg-blue-100 text-blue-800'
                              : stu.performanceStatus === 'Needs Attention'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {stu.performanceStatus}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => openStudentDetails(stu._id)}
                          className="px-3 py-1.5 bg-[#1B3A6B] hover:bg-[#0F2044] text-white rounded-xl text-xs font-bold shadow-2xs transition-colors cursor-pointer"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: MY EXAMS */}
      {/* ========================================================================= */}
      {activeTab === 'exams' && (
        <div className="bg-white border border-[#1B3A6B]/20 rounded-3xl p-6 shadow-sm animate-fadeIn">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-gray-100">
            <div>
              <h2 className="text-xl font-bold text-[#0A1628]">My Created Exams</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Create and manage tests, configure question pools, and assign to your students
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-60">
                <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={examSearch}
                  onChange={(e) => setExamSearch(e.target.value)}
                  placeholder="Search exams..."
                  className="w-full pl-9 pr-3 py-2 bg-[#F8FAFC] border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]"
                />
              </div>
              <select
                value={examStatusFilter}
                onChange={(e) => setExamStatusFilter(e.target.value)}
                className="px-3 py-2 bg-[#F8FAFC] border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#1B3A6B] cursor-pointer"
              >
                <option value="all">All Status</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
              </select>
              <button
                onClick={openCreateExamModal}
                className="px-4 py-2 bg-[#1B3A6B] hover:bg-[#0F2044] text-white font-bold rounded-xl text-xs shadow flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <PlusIcon className="w-3.5 h-3.5" />
                <span>New Exam</span>
              </button>
            </div>
          </div>

          {examsLoading ? (
            <div className="py-16 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1B3A6B] mx-auto"></div>
              <p className="text-xs text-gray-500 mt-2">Loading your exams...</p>
            </div>
          ) : filteredExams.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <AcademicCapIcon className="w-12 h-12 text-gray-300 mx-auto" />
              <p className="text-gray-500 text-sm font-semibold">
                {exams.length === 0
                  ? "You haven't created any exams yet."
                  : 'No exams matching your search filters.'}
              </p>
              {exams.length === 0 && (
                <button
                  onClick={openCreateExamModal}
                  className="px-5 py-2.5 bg-[#1B3A6B] text-white font-bold rounded-xl text-xs shadow hover:bg-[#0F2044] transition-colors cursor-pointer"
                >
                  + Create Your First Exam
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredExams.map((exam) => (
                <div
                  key={exam._id}
                  className="bg-[#F8FAFC] border border-gray-200 hover:border-[#1B3A6B]/40 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-[11px] font-bold px-2.5 py-0.5 bg-blue-100/70 text-blue-900 rounded-md">
                        {exam.category?.name || 'General'}
                      </span>
                      <button
                        onClick={() => handleToggleExamStatus(exam._id)}
                        className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border transition-colors cursor-pointer ${
                          exam.isActive
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                            : 'bg-red-50 text-red-700 border-red-300 hover:bg-red-100'
                        }`}
                        title="Click to toggle active status"
                      >
                        {exam.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </div>

                    <h3 className="text-base font-extrabold text-[#0A1628] leading-snug line-clamp-1">
                      {exam.title}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2 min-h-[32px]">
                      {exam.description || 'No description provided.'}
                    </p>

                    <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-gray-200/80 text-[11px] text-gray-600">
                      <div>
                        <span className="text-gray-400 block text-[10px] uppercase font-bold">Duration</span>
                        <span className="font-bold text-gray-800">{exam.duration} mins</span>
                      </div>
                      <div>
                        <span className="text-gray-400 block text-[10px] uppercase font-bold">Total Marks</span>
                        <span className="font-bold text-gray-800">{exam.totalMarks} pts</span>
                      </div>
                      <div>
                        <span className="text-gray-400 block text-[10px] uppercase font-bold">Question Bank</span>
                        <span className="font-bold text-[#1B3A6B]">{exam.questionCount || 0} questions</span>
                      </div>
                      <div>
                        <span className="text-gray-400 block text-[10px] uppercase font-bold">Per Attempt</span>
                        <span className="font-bold text-gray-800">
                          {exam.numberOfQuestions ? `${exam.numberOfQuestions} random` : 'All'}
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 p-2.5 rounded-xl bg-white border border-gray-200/80 flex items-center justify-between text-xs font-semibold">
                      <span className="text-gray-500 flex items-center gap-1.5">
                        <UsersIcon className="w-4 h-4 text-blue-600" />
                        Assigned Students
                      </span>
                      <span className="font-bold text-[#0A1628]">
                        {exam.assignedStudentsCount || 0} students
                      </span>
                    </div>
                  </div>

                  {/* Actions Row */}
                  <div className="mt-5 pt-3 border-t border-gray-200/80 flex flex-wrap items-center gap-2 justify-between">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => openQuestionsModal(exam)}
                        className="px-2.5 py-1.5 bg-[#1B3A6B] hover:bg-[#0F2044] text-white rounded-lg text-[11px] font-bold shadow-2xs transition-colors cursor-pointer"
                        title="Add and manage questions"
                      >
                        Questions ({exam.questionCount || 0})
                      </button>
                      <button
                        onClick={() => openAssignModal(exam)}
                        className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 rounded-lg text-[11px] font-bold transition-colors cursor-pointer"
                        title="Assign to your students"
                      >
                        Assign
                      </button>
                      <button
                        onClick={() => openExamResultsModal(exam)}
                        className="px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-[11px] font-bold transition-colors cursor-pointer"
                        title="View student results"
                      >
                        Results ({exam.totalAttempts || 0})
                      </button>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditExamModal(exam)}
                        className="p-1.5 text-gray-400 hover:text-[#1B3A6B] hover:bg-white rounded-lg transition-colors cursor-pointer"
                        title="Edit Exam"
                      >
                        <PencilSquareIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteExam(exam._id, exam.title)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        title="Delete Exam"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: EXAM RESULTS */}
      {/* ========================================================================= */}
      {activeTab === 'results' && (
        <div className="bg-white border border-[#1B3A6B]/20 rounded-3xl p-6 shadow-sm animate-fadeIn">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-gray-100">
            <div>
              <h2 className="text-xl font-bold text-[#0A1628]">Student Exam Results</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                All test submissions by your assigned students and on your created exams
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-56">
                <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={resultSearch}
                  onChange={(e) => setResultSearch(e.target.value)}
                  placeholder="Search student / exam..."
                  className="w-full pl-9 pr-3 py-2 bg-[#F8FAFC] border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 bg-[#F8FAFC] border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#1B3A6B] cursor-pointer"
              >
                <option value="all">All Status</option>
                <option value="passed">Passed</option>
                <option value="failed">Failed</option>
              </select>
            </div>
          </div>

          {resultsLoading ? (
            <div className="py-16 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1B3A6B] mx-auto"></div>
              <p className="text-xs text-gray-500 mt-2">Loading exam results...</p>
            </div>
          ) : filteredResults.length === 0 ? (
            <div className="py-16 text-center text-gray-500 text-sm">
              No exam results found matching your filters.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-100 text-gray-500 font-bold uppercase tracking-wider">
                    <th className="py-3 px-4">Student</th>
                    <th className="py-3 px-4">Exam Title</th>
                    <th className="py-3 px-4">Score</th>
                    <th className="py-3 px-4">Percentage</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Submitted At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredResults.map((res) => (
                    <tr key={res._id} className="hover:bg-[#F8FAFC] transition-colors">
                      <td className="py-3 px-4 font-bold text-[#0A1628]">
                        <p>{res.student?.name}</p>
                        <p className="text-[11px] font-normal text-gray-400">{res.student?.email}</p>
                      </td>
                      <td className="py-3 px-4 font-semibold text-gray-800">
                        {res.exam?.title}
                      </td>
                      <td className="py-3 px-4 font-semibold text-gray-700">
                        {res.score} / {res.totalMarks}
                      </td>
                      <td className="py-3 px-4 font-extrabold text-[#0A1628]">
                        {res.percentage}%
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            res.isPassed
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {res.isPassed ? 'Passed' : 'Failed'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-500">
                        {formatDate(res.submittedAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: CREATE / EDIT EXAM MODAL */}
      {/* ========================================================================= */}
      {examModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-200 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setExamModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="h-12 w-12 rounded-2xl bg-blue-100 text-[#1B3A6B] flex items-center justify-center font-extrabold text-xl shadow-xs">
                📝
              </div>
              <div>
                <h3 className="text-xl font-bold text-[#0A1628]">
                  {editingExam ? 'Edit Exam' : 'Create New Exam'}
                </h3>
                <p className="text-xs text-gray-500">
                  {editingExam ? 'Update exam parameters' : 'Author a new examination for your students'}
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveExam} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Exam Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. JavaScript Fundamentals"
                  value={examForm.title}
                  onChange={(e) => setExamForm({ ...examForm, title: e.target.value })}
                  className="w-full px-4 py-2.5 bg-[#F8FAFC] border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Brief overview of topics covered..."
                  value={examForm.description}
                  onChange={(e) => setExamForm({ ...examForm, description: e.target.value })}
                  className="w-full px-4 py-2 bg-[#F8FAFC] border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Duration (Minutes) *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={examForm.duration}
                    onChange={(e) => setExamForm({ ...examForm, duration: e.target.value })}
                    className="w-full px-4 py-2 bg-[#F8FAFC] border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Total Marks *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={examForm.totalMarks}
                    onChange={(e) => setExamForm({ ...examForm, totalMarks: e.target.value })}
                    className="w-full px-4 py-2 bg-[#F8FAFC] border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Passing Percentage (%)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={examForm.passingPercentage}
                    onChange={(e) => setExamForm({ ...examForm, passingPercentage: e.target.value })}
                    className="w-full px-4 py-2 bg-[#F8FAFC] border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Category
                  </label>
                  <select
                    value={examForm.category}
                    onChange={(e) => setExamForm({ ...examForm, category: e.target.value })}
                    className="w-full px-4 py-2 bg-[#F8FAFC] border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B] cursor-pointer"
                  >
                    <option value="">-- Select Category --</option>
                    {categories.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Questions Per Attempt (Random Sampling)
                </label>
                <input
                  type="number"
                  min="1"
                  placeholder="Leave empty to use all questions in question bank"
                  value={examForm.numberOfQuestions}
                  onChange={(e) => setExamForm({ ...examForm, numberOfQuestions: e.target.value })}
                  className="w-full px-4 py-2 bg-[#F8FAFC] border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]"
                />
                <p className="text-[11px] text-gray-400 mt-1">
                  If set, each student attempt randomly selects this many questions from the bank.
                </p>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isActiveToggle"
                  checked={examForm.isActive}
                  onChange={(e) => setExamForm({ ...examForm, isActive: e.target.checked })}
                  className="w-4 h-4 text-[#1B3A6B] rounded border-gray-300 cursor-pointer"
                />
                <label htmlFor="isActiveToggle" className="text-xs font-bold text-gray-700 cursor-pointer">
                  Activate Exam (Visible to assigned students)
                </label>
              </div>

              <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setExamModalOpen(false)}
                  className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={examSaving}
                  className="px-5 py-2.5 bg-[#1B3A6B] hover:bg-[#0F2044] text-white font-bold rounded-xl text-xs shadow transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {examSaving ? 'Saving...' : editingExam ? 'Update Exam' : 'Create Exam'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: MANAGE QUESTIONS MODAL */}
      {/* ========================================================================= */}
      {questionsModalOpen && selectedExamForQuestions && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-4xl w-full shadow-2xl border border-slate-200 relative max-h-[88vh] flex flex-col">
            <button
              onClick={() => setQuestionsModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>

            <div className="flex items-center justify-between pb-4 border-b border-gray-100 shrink-0">
              <div>
                <h3 className="text-xl font-bold text-[#0A1628]">
                  Question Bank: {selectedExamForQuestions.title}
                </h3>
                <p className="text-xs text-gray-500">
                  {questionsList.length} questions in bank
                  {selectedExamForQuestions.numberOfQuestions
                    ? ` • ${selectedExamForQuestions.numberOfQuestions} questions per attempt`
                    : ''}
                </p>
              </div>
              {!showAddQuestionForm && (
                <button
                  onClick={openAddQuestion}
                  className="px-4 py-2 bg-[#1B3A6B] hover:bg-[#0F2044] text-white font-bold rounded-xl text-xs shadow flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <PlusIcon className="w-4 h-4" />
                  <span>Add Question</span>
                </button>
              )}
            </div>

            <div className="overflow-y-auto flex-1 py-4 pr-1">
              {showAddQuestionForm ? (
                <form onSubmit={handleSaveQuestion} className="bg-[#F8FAFC] border border-gray-200 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-bold text-[#0A1628]">
                      {editingQuestionId ? 'Edit Question' : 'New Question'}
                    </h4>
                    <button
                      type="button"
                      onClick={() => setShowAddQuestionForm(false)}
                      className="text-xs text-gray-500 hover:text-gray-800 font-bold"
                    >
                      Cancel
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                      Question Text *
                    </label>
                    <textarea
                      rows={2}
                      required
                      placeholder="Enter question text..."
                      value={questionForm.questionText}
                      onChange={(e) => setQuestionForm({ ...questionForm, questionText: e.target.value })}
                      className="w-full px-4 py-2 bg-white border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                        Option A *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Option A"
                        value={questionForm.optionA}
                        onChange={(e) => setQuestionForm({ ...questionForm, optionA: e.target.value })}
                        className="w-full px-4 py-2 bg-white border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                        Option B *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Option B"
                        value={questionForm.optionB}
                        onChange={(e) => setQuestionForm({ ...questionForm, optionB: e.target.value })}
                        className="w-full px-4 py-2 bg-white border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                        Option C *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Option C"
                        value={questionForm.optionC}
                        onChange={(e) => setQuestionForm({ ...questionForm, optionC: e.target.value })}
                        className="w-full px-4 py-2 bg-white border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                        Option D *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Option D"
                        value={questionForm.optionD}
                        onChange={(e) => setQuestionForm({ ...questionForm, optionD: e.target.value })}
                        className="w-full px-4 py-2 bg-white border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                        Correct Option *
                      </label>
                      <select
                        value={questionForm.correctAnswer}
                        onChange={(e) => setQuestionForm({ ...questionForm, correctAnswer: e.target.value })}
                        className="w-full px-4 py-2 bg-white border border-gray-300 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#1B3A6B] cursor-pointer"
                      >
                        <option value="A">Option A</option>
                        <option value="B">Option B</option>
                        <option value="C">Option C</option>
                        <option value="D">Option D</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                        Marks
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={questionForm.marks}
                        onChange={(e) => setQuestionForm({ ...questionForm, marks: e.target.value })}
                        className="w-full px-4 py-2 bg-white border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]"
                      />
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setShowAddQuestionForm(false)}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={questionSaving}
                      className="px-5 py-2 bg-[#1B3A6B] hover:bg-[#0F2044] text-white font-bold rounded-xl text-xs shadow transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {questionSaving ? 'Saving...' : editingQuestionId ? 'Update Question' : 'Add Question'}
                    </button>
                  </div>
                </form>
              ) : questionsLoading ? (
                <div className="py-12 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1B3A6B] mx-auto"></div>
                  <p className="text-xs text-gray-500 mt-2">Loading questions...</p>
                </div>
              ) : questionsList.length === 0 ? (
                <div className="py-12 text-center space-y-3">
                  <DocumentCheckIcon className="w-12 h-12 text-gray-300 mx-auto" />
                  <p className="text-gray-500 text-sm font-semibold">No questions in this exam bank yet.</p>
                  <button
                    onClick={openAddQuestion}
                    className="px-4 py-2 bg-[#1B3A6B] text-white font-bold rounded-xl text-xs shadow hover:bg-[#0F2044] transition-colors cursor-pointer"
                  >
                    + Add First Question
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {questionsList.map((q, idx) => (
                    <div
                      key={q._id}
                      className="bg-[#F8FAFC] border border-gray-200 rounded-2xl p-4 hover:border-[#1B3A6B]/30 transition-all"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2.5">
                          <span className="w-6 h-6 rounded-lg bg-[#1B3A6B] text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                            {idx + 1}
                          </span>
                          <div>
                            <p className="text-sm font-bold text-[#0A1628] leading-snug">
                              {q.questionText}
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 mt-2 text-xs text-gray-600">
                              {q.options?.map((opt, oIdx) => {
                                const isCorrect = opt === q.correctAnswer;
                                const letter = ['A', 'B', 'C', 'D'][oIdx];
                                return (
                                  <div
                                    key={oIdx}
                                    className={`flex items-center gap-1.5 ${
                                      isCorrect ? 'text-emerald-700 font-bold' : ''
                                    }`}
                                  >
                                    <span className="text-gray-400 font-semibold">{letter}.</span>
                                    <span>{opt}</span>
                                    {isCorrect && (
                                      <CheckCircleIcon className="w-3.5 h-3.5 text-emerald-600 inline" />
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => openEditQuestion(q)}
                            className="p-1.5 text-gray-400 hover:text-[#1B3A6B] hover:bg-white rounded-lg transition-colors cursor-pointer"
                            title="Edit Question"
                          >
                            <PencilSquareIcon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteQuestion(q._id)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete Question"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-gray-100 flex justify-end shrink-0">
              <button
                onClick={() => setQuestionsModalOpen(false)}
                className="px-5 py-2.5 bg-[#1B3A6B] hover:bg-[#0F2044] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: ASSIGN STUDENTS MODAL */}
      {/* ========================================================================= */}
      {assignModalOpen && selectedExamForAssign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl border border-slate-200 relative max-h-[85vh] flex flex-col">
            <button
              onClick={() => setAssignModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>

            <div className="flex items-center justify-between pb-4 border-b border-gray-100 shrink-0">
              <div>
                <h3 className="text-xl font-bold text-[#0A1628]">
                  Assign Students to Exam
                </h3>
                <p className="text-xs text-gray-500">
                  Select which of your assigned students can take: <strong className="text-gray-800">{selectedExamForAssign.title}</strong>
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 my-3 shrink-0">
              <div className="relative flex-1">
                <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={assignSearch}
                  onChange={(e) => setAssignSearch(e.target.value)}
                  placeholder="Search students..."
                  className="w-full pl-9 pr-3 py-1.5 bg-[#F8FAFC] border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]"
                />
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSelectAllStudents}
                  className="text-xs font-bold text-[#1B3A6B] hover:underline cursor-pointer"
                >
                  Select All
                </button>
                <span className="text-gray-300">|</span>
                <button
                  type="button"
                  onClick={handleUnselectAllStudents}
                  className="text-xs font-bold text-gray-500 hover:underline cursor-pointer"
                >
                  Clear
                </button>
              </div>
            </div>

            <div className="overflow-y-auto flex-1 py-1 space-y-2">
              {assignLoading ? (
                <div className="py-12 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1B3A6B] mx-auto"></div>
                  <p className="text-xs text-gray-500 mt-2">Loading students...</p>
                </div>
              ) : filteredAssignStudents.length === 0 ? (
                <div className="py-12 text-center text-gray-500 text-sm">
                  No students found in your mentorship.
                </div>
              ) : (
                filteredAssignStudents.map((student) => {
                  const isSelected = selectedStudentIdsForAssign.includes(student._id);
                  return (
                    <div
                      key={student._id}
                      onClick={() => handleToggleStudentSelect(student._id)}
                      className={`p-3 rounded-2xl border flex items-center justify-between transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-blue-50/70 border-blue-300'
                          : 'bg-[#F8FAFC] border-gray-200 hover:bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          className="w-4 h-4 text-[#1B3A6B] rounded border-gray-300 cursor-pointer"
                        />
                        <div className="w-8 h-8 rounded-full bg-[#1B3A6B] text-white flex items-center justify-center font-bold text-xs shrink-0">
                          {student.name?.charAt(0).toUpperCase() || 'S'}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-[#0A1628]">{student.name}</p>
                          <p className="text-xs text-gray-500">{student.email}</p>
                        </div>
                      </div>
                      <span
                        className={`text-xs font-bold px-2.5 py-0.5 rounded-md ${
                          isSelected
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {isSelected ? 'Assigned' : 'Unassigned'}
                      </span>
                    </div>
                  );
                })
              )}
            </div>

            <div className="pt-4 border-t border-gray-100 flex items-center justify-between shrink-0">
              <span className="text-xs text-gray-500 font-semibold">
                {selectedStudentIdsForAssign.length} students selected
              </span>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setAssignModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveAssignments}
                  disabled={assignSaving}
                  className="px-5 py-2 bg-[#1B3A6B] hover:bg-[#0F2044] text-white rounded-xl text-xs font-bold shadow transition-colors cursor-pointer disabled:opacity-50"
                >
                  {assignSaving ? 'Saving...' : 'Save Assignments'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: EXAM RESULTS MODAL */}
      {/* ========================================================================= */}
      {examResultsModalOpen && selectedExamForResults && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-3xl w-full shadow-2xl border border-slate-200 relative max-h-[85vh] flex flex-col">
            <button
              onClick={() => setExamResultsModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>

            <div className="pb-4 border-b border-gray-100 shrink-0">
              <h3 className="text-xl font-bold text-[#0A1628]">
                Results: {selectedExamForResults.title}
              </h3>
              <p className="text-xs text-gray-500">
                {examResultsList.length} total student submissions recorded
              </p>
            </div>

            <div className="overflow-y-auto flex-1 py-4 pr-1">
              {examResultsLoading ? (
                <div className="py-12 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1B3A6B] mx-auto"></div>
                  <p className="text-xs text-gray-500 mt-2">Loading submissions...</p>
                </div>
              ) : examResultsList.length === 0 ? (
                <div className="py-12 text-center text-gray-500 text-sm">
                  No submissions recorded yet for this exam.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-gray-100 text-gray-500 font-bold uppercase tracking-wider">
                        <th className="py-2.5 px-3">Student</th>
                        <th className="py-2.5 px-3">Score</th>
                        <th className="py-2.5 px-3">Percentage</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3">Submitted</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {examResultsList.map((res) => (
                        <tr key={res._id} className="hover:bg-[#F8FAFC]">
                          <td className="py-2.5 px-3 font-bold text-[#0A1628]">
                            <p>{res.student?.name}</p>
                            <p className="text-[10px] font-normal text-gray-400">{res.student?.email}</p>
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-gray-700">
                            {res.score} / {res.totalMarks}
                          </td>
                          <td className="py-2.5 px-3 font-extrabold text-[#0A1628]">
                            {res.percentage}%
                          </td>
                          <td className="py-2.5 px-3">
                            <span
                              className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                res.isPassed
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {res.isPassed ? 'Passed' : 'Failed'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-gray-500">
                            {formatDate(res.submittedAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-gray-100 flex justify-end shrink-0">
              <button
                onClick={() => setExamResultsModalOpen(false)}
                className="px-5 py-2.5 bg-[#1B3A6B] hover:bg-[#0F2044] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: STUDENT PERFORMANCE DETAILS MODAL */}
      {/* ========================================================================= */}
      {selectedStudentId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl border border-slate-200 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={closeStudentDetails}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>

            {studentDetailLoading || !studentDetail ? (
              <div className="py-16 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1B3A6B] mx-auto"></div>
                <p className="text-xs text-gray-500 mt-2">Loading performance details...</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center gap-4 pb-4 border-b border-gray-100">
                  <div className="w-14 h-14 rounded-2xl bg-[#1B3A6B] text-white flex items-center justify-center font-extrabold text-xl shadow-xs">
                    {studentDetail.student?.name?.charAt(0).toUpperCase() || 'S'}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-[#0A1628]">{studentDetail.student?.name}</h3>
                    <p className="text-xs text-gray-500">{studentDetail.student?.email}</p>
                    <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full">
                      Active Student
                    </span>
                  </div>
                </div>

                {/* Summary Row */}
                <div className="grid grid-cols-4 gap-3 bg-[#F8FAFC] p-4 rounded-2xl border border-gray-100 text-center">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-gray-400">Total Exams</span>
                    <p className="text-lg font-extrabold text-[#0A1628]">
                      {studentDetail.summary?.totalExams}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase text-gray-400">Passed</span>
                    <p className="text-lg font-extrabold text-emerald-600">
                      {studentDetail.summary?.passedExams}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase text-gray-400">Average</span>
                    <p className="text-lg font-extrabold text-[#0A1628]">
                      {studentDetail.summary?.averageScore}%
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase text-gray-400">Best Score</span>
                    <p className="text-lg font-extrabold text-[#1B3A6B]">
                      {studentDetail.summary?.bestScore}%
                    </p>
                  </div>
                </div>

                {/* Category Performance */}
                {studentDetail.categoryPerformance?.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">
                      Category Mastery
                    </h4>
                    <div className="space-y-2.5">
                      {studentDetail.categoryPerformance.map((cat, idx) => (
                        <div key={idx} className="bg-[#F8FAFC] p-3 rounded-xl border border-gray-100">
                          <div className="flex items-center justify-between text-xs font-bold mb-1">
                            <span className="text-[#0A1628]">{cat.category}</span>
                            <span className="text-emerald-700">{cat.averageScore}%</span>
                          </div>
                          <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                            <div
                              className="bg-[#1B3A6B] h-full rounded-full transition-all duration-500"
                              style={{ width: `${Math.min(100, Math.max(0, cat.averageScore))}%` }}
                            ></div>
                          </div>
                          <p className="text-[10px] text-gray-400 mt-1">
                            {cat.examsPassed} of {cat.examsAttempted} exams passed
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Exam History */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">
                    Recent Test History
                  </h4>
                  {studentDetail.history?.length === 0 ? (
                    <p className="text-xs text-gray-400 text-center py-4">No tests taken yet.</p>
                  ) : (
                    <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                      {studentDetail.history?.map((h, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2.5 rounded-xl bg-[#F8FAFC] border border-gray-100 text-xs"
                        >
                          <div>
                            <p className="font-bold text-[#0A1628]">{h.examTitle}</p>
                            <p className="text-[10px] text-gray-400">{formatDate(h.submittedAt)}</p>
                          </div>
                          <div className="text-right">
                            <span
                              className={`font-extrabold ${
                                h.isPassed ? 'text-emerald-600' : 'text-red-600'
                              }`}
                            >
                              {h.percentage}%
                            </span>
                            <p className="text-[10px] text-gray-400">{h.isPassed ? 'Passed' : 'Failed'}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    onClick={closeStudentDetails}
                    className="px-5 py-2.5 bg-[#1B3A6B] hover:bg-[#0F2044] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MentorDashboard;
