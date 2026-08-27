import React, { useEffect, useState, useContext } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import AnimatedCounter from '../components/AnimatedCounter';

const MOTIVATIONAL_THOUGHTS = [
  "Small progress is still progress. Keep going!",
  "Don't study to finish. Study to understand.",
  "One question today is better than zero questions.",
  "Learn today. Become better tomorrow.",
  "Mistakes are proof that you are learning.",
  "Your future self will thank you for studying today.",
  "Consistency beats last-minute preparation.",
  "Every exam is an opportunity to learn something new.",
  "Believe in your preparation and give your best.",
  "Keep learning. Keep growing. Keep going.",
  "Success starts with showing up.",
  "Today's effort becomes tomorrow's confidence.",
  "Don't compare your progress with others. Improve yourself.",
  "Every difficult question makes you stronger.",
  "Learn Today. Play After You Pass! 🎮",
];

const StudentDashboard = () => {
  const { user } = useContext(AuthContext);
  const [searchParams, setSearchParams] = useSearchParams();
  const [exams, setExams] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(
    searchParams.get('category') || 'all'
  );
  const [searchQuery, setSearchQuery] = useState(
    searchParams.get('search') || searchParams.get('q') || ''
  );
  const [thoughtIndex, setThoughtIndex] = useState(0);
  const [thoughtFade, setThoughtFade] = useState(true);

  // Rotating thought every 6 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setThoughtFade(false);
      setTimeout(() => {
        setThoughtIndex((prev) => (prev + 1) % MOTIVATIONAL_THOUGHTS.length);
        setThoughtFade(true);
      }, 300);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  // Sync state if URL query params change (e.g. from Navbar search or category click)
  useEffect(() => {
    const catParam = searchParams.get('category');
    const searchParam = searchParams.get('search') || searchParams.get('q');
    if (catParam) {
      setSelectedCategory(catParam);
    }
    if (searchParam !== null) {
      setSearchQuery(searchParam);
    }
  }, [searchParams]);
  const [performance, setPerformance] = useState({
    totalExams: 0,
    passedExams: 0,
    averageScore: 0,
    bestScore: 0,
    currentStreak: 0,
    bestStreak: 0,
    history: [],
    recentExams: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [examsRes, categoriesRes, perfRes] = await Promise.all([
          api.get('/exams'),
          api.get('/categories').catch(() => ({ data: { categories: [] } })),
          api.get('/results/my-performance').catch(() => ({ data: null })),
        ]);

        const examsData = Array.isArray(examsRes.data)
          ? examsRes.data
          : examsRes.data.exams || [];

        // Ensure questionCount is populated dynamically for every exam
        const examsWithCounts = await Promise.all(
          examsData.map(async (exam) => {
            if (typeof exam.questionCount === 'number') {
              return exam;
            }
            if (typeof exam.totalQuestions === 'number') {
              return { ...exam, questionCount: exam.totalQuestions };
            }
            try {
              const qRes = await api.get(`/exams/${exam._id}/questions`);
              const qList = qRes.data?.questions || qRes.data || [];
              const count = Array.isArray(qList) ? qList.length : 0;
              return { ...exam, questionCount: count, totalQuestions: count };
            } catch {
              return { ...exam, questionCount: 0, totalQuestions: 0 };
            }
          })
        );
        setExams(examsWithCounts);

        const catsData = categoriesRes.data?.categories || [];
        setCategories(catsData);

        if (perfRes?.data) {
          setPerformance(perfRes.data);
        }
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
        setError(err.response?.data?.message || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const studentName =
    user?.name ||
    (user?.email ? user.email.split('@')[0] : '') ||
    'Student';

  // Filter exams based on Category & Search (case-insensitive across title, description, and category name)
  const filteredExams = exams.filter((exam) => {
    // 1. Category Filter
    let matchesCategory = true;
    if (selectedCategory !== 'all') {
      const examCatId = exam.category?._id || exam.category;
      const examCatName = exam.category?.name || '';
      matchesCategory =
        (examCatId && examCatId.toString() === selectedCategory.toString()) ||
        examCatName.toLowerCase() === selectedCategory.toLowerCase();
    }

    // 2. Search Query Filter (case-insensitive across title, description, and category name)
    let matchesSearch = true;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const title = (exam.title || exam.name || '').toLowerCase();
      const desc = (exam.description || '').toLowerCase();
      const catName = (exam.category?.name || '').toLowerCase();
      matchesSearch = title.includes(q) || desc.includes(q) || catName.includes(q);
    }

    return matchesCategory && matchesSearch;
  });

  const isFiltered = selectedCategory !== 'all' || searchQuery.trim() !== '';

  const handleClearFilters = () => {
    setSelectedCategory('all');
    setSearchQuery('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 bg-[#EEF3FB] min-h-[calc(100vh-4rem)] space-y-8 text-[#0A1628]">
      {/* 1. WELCOME / PORTAL BOX (🔵 ROYAL BLUE → ELECTRIC BLUE GRADIENT WITH ROTATING THOUGHT) */}
      <div className="bg-gradient-to-r from-[#0A1628] via-[#0F2044] to-[#1B3A6B] rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 border border-[#2D5DA6]/30">
        <div className="max-w-2xl">
          <span className="inline-block px-3.5 py-1 bg-white/15 backdrop-blur text-blue-100 rounded-full text-xs font-bold uppercase tracking-wider mb-2.5 border border-white/20">
            PADIKKUVEEN Student Portal
          </span>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
            Welcome, {studentName}
          </h1>
          <p
            className={`text-blue-100 mt-1.5 text-sm sm:text-base font-medium transition-all duration-300 transform ${
              thoughtFade ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1'
            }`}
          >
            "{MOTIVATIONAL_THOUGHTS[thoughtIndex]}"
          </p>
        </div>

        {/* Action Links inside the Portal Box */}
        <div className="flex items-center gap-3 shrink-0">
          <Link
            to="/my-results"
            className="px-6 py-3 bg-white hover:bg-[#EEF3FB] text-[#1B3A6B] font-extrabold rounded-2xl shadow-xl transition-all text-sm flex items-center gap-2"
          >
            <span>📊</span> My Results
          </Link>
        </div>
      </div>

      {/* 2. COMPACT PERFORMANCE METRIC CARDS (ANIMATED GRADIENTS & COUNT-UP) */}
      {!loading && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Card 1: 📚 Exams Completed (Warm Cream → Light Brown) */}
          <div className="border rounded-2xl p-3 sm:p-4 shadow-xs stat-card-animate stat-card-delay-0 stat-card-gradient-warm flex items-center justify-between gap-3">
            <div className="min-w-0">
              <span className="block text-[11px] font-bold text-[#78350F]/80 uppercase tracking-wider truncate">
                Completed
              </span>
              <div className="text-xl sm:text-2xl font-black text-[#451A03] tracking-tight leading-tight mt-0.5">
                <AnimatedCounter value={performance.totalExams} duration={900} />
              </div>
            </div>
            <div className="w-9 h-9 rounded-xl bg-[#F5DEC5] text-[#78350F] border border-[#E8C9A5] flex items-center justify-center text-base shrink-0 shadow-2xs">
              📚
            </div>
          </div>

          {/* Card 2: 🎯 Exams Passed (Light Green → Cream) */}
          <div className="border rounded-2xl p-3 sm:p-4 shadow-xs stat-card-animate stat-card-delay-1 stat-card-gradient-success flex items-center justify-between gap-3">
            <div className="min-w-0">
              <span className="block text-[11px] font-bold text-[#166534]/80 uppercase tracking-wider truncate">
                Passed
              </span>
              <div className="text-xl sm:text-2xl font-black text-[#14532D] tracking-tight leading-tight mt-0.5">
                <AnimatedCounter value={performance.passedExams} duration={900} />
              </div>
            </div>
            <div className="w-9 h-9 rounded-xl bg-[#D1FADF] text-[#166534] border border-[#A6E6C2] flex items-center justify-center text-base shrink-0 shadow-2xs">
              🎯
            </div>
          </div>

          {/* Card 3: 📊 Average Score (Light Orange → Cream) */}
          <div className="border rounded-2xl p-3 sm:p-4 shadow-xs stat-card-animate stat-card-delay-2 stat-card-gradient-orange flex items-center justify-between gap-3">
            <div className="min-w-0">
              <span className="block text-[11px] font-bold text-[#9A3412]/80 uppercase tracking-wider truncate">
                Average
              </span>
              <div className="text-xl sm:text-2xl font-black text-[#7C2D12] tracking-tight leading-tight mt-0.5">
                <AnimatedCounter value={performance.averageScore} suffix="%" duration={1100} />
              </div>
            </div>
            <div className="w-9 h-9 rounded-xl bg-[#FED7AA] text-[#9A3412] border border-[#FDBA74] flex items-center justify-center text-base shrink-0 shadow-2xs">
              📊
            </div>
          </div>

          {/* Card 4: 🏆 Best Score (Light Yellow → Cream) */}
          <div className="border rounded-2xl p-3 sm:p-4 shadow-xs stat-card-animate stat-card-delay-3 stat-card-gradient-yellow flex items-center justify-between gap-3">
            <div className="min-w-0">
              <span className="block text-[11px] font-bold text-[#854D0E]/80 uppercase tracking-wider truncate">
                Best Score
              </span>
              <div className="text-xl sm:text-2xl font-black text-[#713F12] tracking-tight leading-tight mt-0.5">
                <AnimatedCounter value={performance.bestScore} suffix="%" duration={1100} />
              </div>
            </div>
            <div className="w-9 h-9 rounded-xl bg-[#FEF08A] text-[#854D0E] border border-[#FACC15] flex items-center justify-center text-base shrink-0 shadow-2xs">
              🏆
            </div>
          </div>
        </div>
      )}

      {/* 3. CHOOSE YOUR SUBJECT (CATEGORY FILTER & SEARCH BAR) */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-extrabold text-[#0A1628]">
              Choose Your Subject
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 mt-0.5">
              Select a category to filter your examination topics
            </p>
          </div>

          {/* Search Box with Clear Button */}
          <div className="flex items-center gap-2 max-w-sm w-full">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search exams..."
                className="w-full pl-4 pr-9 py-2.5 bg-white border border-[#1B3A6B]/30 rounded-2xl text-xs sm:text-sm text-[#0A1628] focus:outline-none focus:ring-2 focus:ring-[#4A9EE8] shadow-xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  title="Clear search"
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-700 font-bold text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            {isFiltered && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="px-3 py-2.5 bg-white hover:bg-[#EEF3FB] text-[#1B3A6B] border border-[#1B3A6B]/30 rounded-2xl text-xs font-bold shrink-0 transition-colors shadow-xs"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* Category Filter Chips (Horizontal Scrollable on Mobile) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
          {/* All Option */}
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all shrink-0 shadow-xs ${
              selectedCategory === 'all'
                ? 'bg-gradient-to-r from-[#1D4ED8] to-[#2563EB] text-white shadow-md'
                : 'bg-white text-gray-700 hover:bg-blue-50/80 border border-slate-200'
            }`}
          >
            All
          </button>

          {/* Category Items */}
          {categories.map((cat) => (
            <button
              key={cat._id}
              type="button"
              onClick={() => setSelectedCategory(cat._id)}
              className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all shrink-0 shadow-xs ${
                selectedCategory === cat._id
                  ? 'bg-gradient-to-r from-[#0F2044] to-[#1B3A6B] text-white shadow-md'
                  : 'bg-white text-gray-700 hover:bg-[#EEF3FB] border border-[#1B3A6B]/20'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* 4. AVAILABLE EXAMS GRID */}
      <div>
        <div className="mb-4 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-gray-700">
              Showing {filteredExams.length} of {exams.length} Exams
            </span>
            {isFiltered && (
              <span className="text-xs text-[#1D4ED8] font-semibold">
                (Filtered results)
              </span>
            )}
          </div>
        </div>

        {loading && (
          <div className="py-16 text-center space-y-4">
            <div className="w-12 h-12 border-4 border-[#1B3A6B] border-t-[#4A9EE8] rounded-full animate-spin mx-auto"></div>
            <p className="text-sm font-bold text-[#1B3A6B]">Loading exams...</p>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 text-[#C62828] font-semibold rounded-2xl text-sm">
            {error}
          </div>
        )}

        {!loading && !error && (
          <div>
            {filteredExams.length === 0 ? (
              /* EMPTY STATE */
              <div className="text-center py-16 bg-white rounded-3xl border border-[#1B3A6B]/20 p-8 shadow-sm max-w-lg mx-auto space-y-3">
                <h3 className="text-lg font-bold text-[#0A1628]">No Exams Found</h3>
                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                  Try another search or choose a different subject.
                </p>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleClearFilters}
                    className="px-5 py-2.5 bg-gradient-to-r from-[#0F2044] to-[#1B3A6B] hover:from-[#0A1628] hover:to-[#0F2044] text-white font-bold rounded-xl text-xs shadow transition-all"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            ) : (
              /* EXAM CARDS GRID */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredExams.map((exam) => {
                  const catName = exam.category?.name || 'General Programming';
                  const passingScore = exam.passingPercentage ?? 50;
                  const questionCount = exam.questionCount !== undefined ? exam.questionCount : (exam.totalQuestions !== undefined ? exam.totalQuestions : 0);

                  return (
                    <div
                      key={exam._id}
                      className="bg-white border border-[#1B3A6B]/20 rounded-3xl p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between"
                    >
                      <div>
                        {/* Title */}
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h3 className="text-lg font-extrabold text-[#0A1628] line-clamp-1">
                            {exam.title || exam.name || 'Untitled Exam'}
                          </h3>
                        </div>

                        {/* Category Tag */}
                        <div className="mb-3">
                          <span className="inline-block px-2.5 py-0.5 bg-[#D6E4F7] text-[#1B3A6B] text-xs font-bold rounded-lg border border-[#1B3A6B]/20">
                            {catName}
                          </span>
                        </div>

                        <p className="text-gray-600 text-xs sm:text-sm mb-4 line-clamp-2 leading-relaxed">
                          {exam.description || 'No description provided.'}
                        </p>

                        {/* Metadata breakdown */}
                        <div className="space-y-1.5 pt-3 border-t border-[#1B3A6B]/10 text-xs text-gray-600 mb-6 font-medium">
                          <div className="flex items-center justify-between">
                            <span>Questions:</span>
                            <span className="font-bold text-[#0A1628]">
                              {questionCount} {questionCount === 1 ? 'Question' : 'Questions'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>Duration:</span>
                            <span className="font-bold text-[#0A1628]">{exam.duration} Minutes</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>Passing Score:</span>
                            <span className="font-bold text-[#16A34A]">{passingScore}%</span>
                          </div>
                        </div>
                      </div>

                      {/* Start Exam Button -> Routes to Exam Instructions */}
                      <Link
                        to={`/student/exams/${exam._id}/instructions`}
                        className="w-full text-center py-3 bg-gradient-to-r from-[#0F2044] to-[#1B3A6B] hover:from-[#0A1628] hover:to-[#0F2044] text-white font-extrabold rounded-xl shadow hover:shadow-md transition-all text-sm"
                      >
                        Start Exam →
                      </Link>
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

export default StudentDashboard;
