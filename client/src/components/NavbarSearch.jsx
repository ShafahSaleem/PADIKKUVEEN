import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const NavbarSearch = ({ isMobile = false, onCloseMobile = () => {} }) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [exams, setExams] = useState([]);
  const [dataLoaded, setDataLoaded] = useState(false);
  const searchContainerRef = useRef(null);
  const navigate = useNavigate();

  // Load active categories and exams for fast, client-side responsive search
  const loadSearchData = async () => {
    if (dataLoaded) return;
    try {
      const [catRes, examRes] = await Promise.all([
        api.get('/categories').catch(() => ({ data: { categories: [] } })),
        api.get('/exams').catch(() => ({ data: { exams: [] } })),
      ]);

      const catList = catRes.data?.categories || [];
      const examList = Array.isArray(examRes.data)
        ? examRes.data
        : examRes.data?.exams || [];

      setCategories(catList);
      setExams(examList);
      setDataLoaded(true);
    } catch (err) {
      console.error('Failed to pre-load search data:', err);
    }
  };

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter categories & exams based on query
  const trimmed = query.trim().toLowerCase();

  const matchingCategories = trimmed
    ? categories
        .filter(
          (c) =>
            c.enabled !== false &&
            (c.name.toLowerCase().includes(trimmed) ||
              (c.description && c.description.toLowerCase().includes(trimmed)))
        )
        .slice(0, 4)
    : [];

  const matchingExams = trimmed
    ? exams
        .filter((e) => {
          const title = (e.title || e.name || '').toLowerCase();
          const desc = (e.description || '').toLowerCase();
          const catName = (e.category?.name || '').toLowerCase();
          return (
            title.includes(trimmed) ||
            desc.includes(trimmed) ||
            catName.includes(trimmed)
          );
        })
        .slice(0, 5)
    : [];

  const hasMatches =
    matchingCategories.length > 0 || matchingExams.length > 0;

  const handleFocus = () => {
    loadSearchData();
    if (query.trim()) {
      setIsOpen(true);
    }
  };

  const handleChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    if (!isOpen && val.trim()) {
      setIsOpen(true);
    }
    if (!val.trim()) {
      setIsOpen(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (query.trim()) {
        handleViewAll();
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const handleClear = () => {
    setQuery('');
    setIsOpen(false);
  };

  const handleSelectCategory = (cat) => {
    setIsOpen(false);
    onCloseMobile();
    navigate(`/student-dashboard?category=${cat._id}`);
  };

  const handleSelectExam = (exam) => {
    setIsOpen(false);
    onCloseMobile();
    navigate(`/student/exams/${exam._id}/instructions`);
  };

  const handleViewAll = () => {
    if (!query.trim()) return;
    setIsOpen(false);
    onCloseMobile();
    navigate(`/student-dashboard?search=${encodeURIComponent(query.trim())}`);
  };

  return (
    <div
      ref={searchContainerRef}
      className={`relative ${
        isMobile ? 'w-36 xs:w-44 sm:w-56' : 'w-64 lg:w-80'
      }`}
    >
      {/* Input Search Box */}
      <div className="relative flex items-center">
        <input
          type="text"
          value={query}
          onFocus={handleFocus}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={isMobile ? "Search..." : "Search exams, subjects..."}
          className="w-full pl-3.5 pr-8 py-1.5 sm:py-2 bg-[#0F2044]/80 hover:bg-[#0F2044] focus:bg-[#0A1628] border border-[#1E3A6B] focus:border-[#4A9EE8] rounded-2xl text-xs sm:text-sm text-gray-100 placeholder-blue-300/60 focus:outline-none focus:ring-2 focus:ring-[#4A9EE8]/40 transition-all shadow-inner"
        />

        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2 text-gray-400 hover:text-white font-bold text-xs p-1"
            title="Clear search"
          >
            ✕
          </button>
        )}
      </div>

      {/* Search Dropdown Panel */}
      {isOpen && trimmed && (
        <div
          className="absolute right-0 sm:left-0 sm:right-auto mt-2 w-72 xs:w-80 sm:w-96 bg-white border border-[#1B3A6B]/20 rounded-3xl shadow-2xl z-50 text-[#0A1628] overflow-hidden animate-fade-in divide-y divide-[#1B3A6B]/10"
        >
          {hasMatches ? (
            <>
              {/* 1. CATEGORIES SECTION */}
              {matchingCategories.length > 0 && (
                <div className="p-3 bg-[#EEF3FB]">
                  <p className="text-[11px] font-extrabold text-[#1B3A6B] uppercase tracking-wider px-2 mb-1.5">
                    Categories
                  </p>
                  <div className="space-y-1">
                    {matchingCategories.map((cat) => (
                      <button
                        key={cat._id}
                        type="button"
                        onClick={() => handleSelectCategory(cat)}
                        className="w-full text-left px-3 py-2 rounded-xl hover:bg-[#D6E4F7] transition-colors flex items-center justify-between text-xs font-bold text-[#0A1628]"
                      >
                        <span className="truncate">{cat.name}</span>
                        <span className="text-[10px] text-[#1B3A6B] font-semibold uppercase">
                          Subject →
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 2. EXAMS SECTION */}
              {matchingExams.length > 0 && (
                <div className="p-3 bg-white">
                  <p className="text-[11px] font-extrabold text-[#1B3A6B] uppercase tracking-wider px-2 mb-1.5">
                    Exams
                  </p>
                  <div className="space-y-1">
                    {matchingExams.map((exam) => {
                      const catName =
                        exam.category?.name || 'General Programming';
                      return (
                        <button
                          key={exam._id}
                          type="button"
                          onClick={() => handleSelectExam(exam)}
                          className="w-full text-left px-3 py-2 rounded-xl hover:bg-[#D6E4F7]/50 transition-colors group"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-xs font-extrabold text-[#0A1628] group-hover:text-[#1B3A6B] truncate">
                              {exam.title || exam.name}
                            </p>
                            <span className="text-[10px] text-gray-500 font-medium shrink-0">
                              {exam.duration}m
                            </span>
                          </div>
                          <p className="text-[11px] text-gray-500 truncate mt-0.5">
                            {catName}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 3. VIEW ALL RESULTS FOOTER */}
              <div className="p-2.5 bg-[#EEF3FB] text-center border-t border-[#1B3A6B]/10">
                <button
                  type="button"
                  onClick={handleViewAll}
                  className="w-full py-1.5 text-xs font-extrabold text-[#1B3A6B] hover:text-[#0F2044] transition-colors flex items-center justify-center gap-1"
                >
                  View all results for "{query}" →
                </button>
              </div>
            </>
          ) : (
            /* EMPTY NO MATCHES STATE */
            <div className="p-6 text-center space-y-1.5 bg-[#EEF3FB]/50">
              <h4 className="text-sm font-bold text-[#0A1628]">
                No results found
              </h4>
              <p className="text-xs text-gray-500 max-w-xs mx-auto leading-relaxed">
                Try searching for an exam name or subject category.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NavbarSearch;
