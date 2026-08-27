import React, { useState, useEffect, useMemo } from 'react';

const BASE_THOUGHTS = [
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

const ThoughtCard = ({ performance = null }) => {
  // Build personalized thought list dynamically based on student performance
  const thoughts = useMemo(() => {
    const list = [...BASE_THOUGHTS];
    if (performance) {
      if (performance.passedExams > 0) {
        list.unshift("🎉 Great job on your exams! Keep your momentum going!");
      }
      if (performance.currentStreak > 1) {
        list.unshift(`🔥 ${performance.currentStreak} Day Learning Streak! Keep the streak alive!`);
      }
      if (performance.totalExams > 0 && performance.passedExams === 0) {
        list.unshift("Don't worry about one result. Learn from it and try again!");
      }
    }
    return list;
  }, [performance]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [fadeState, setFadeState] = useState(true); // true = visible, false = fading

  // Rotate thought every 6 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setFadeState(false);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % thoughts.length);
        setFadeState(true);
      }, 250);
    }, 6000);

    return () => clearInterval(interval);
  }, [thoughts.length]);

  const handleSelect = (idx) => {
    if (idx === currentIndex) return;
    setFadeState(false);
    setTimeout(() => {
      setCurrentIndex(idx);
      setFadeState(true);
    }, 150);
  };

  // Determine a window of 5 dots centered around current index
  const totalDots = Math.min(5, thoughts.length);
  const dotIndices = Array.from({ length: totalDots }, (_, i) => {
    const offset = i - Math.floor(totalDots / 2);
    return (currentIndex + offset + thoughts.length) % thoughts.length;
  });

  return (
    <div className="bg-white/90 backdrop-blur-xs border border-[#EAD7C7] rounded-3xl p-4 sm:p-5 shadow-sm text-[#2D1B12] transition-all hover:shadow-md">
      <div className="flex items-center justify-between gap-3 mb-2">
        <span className="text-xs font-extrabold text-[#7C2D12] uppercase tracking-wider flex items-center gap-1.5">
          <span>💡</span> Thought of the Moment
        </span>

        {/* Small Progress Dots Indicator */}
        <div className="flex items-center gap-1.5">
          {dotIndices.map((idx) => {
            const isActive = idx === currentIndex;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelect(idx)}
                aria-label={`Go to thought ${idx + 1}`}
                className={`transition-all duration-300 rounded-full ${
                  isActive
                    ? 'w-5 h-1.5 bg-[#E76F2E]'
                    : 'w-1.5 h-1.5 bg-amber-200 hover:bg-amber-300'
                }`}
              />
            );
          })}
        </div>
      </div>

      {/* Animated Quote Content */}
      <div className="min-h-[44px] sm:min-h-[38px] flex items-center">
        <p
          className={`text-xs sm:text-sm font-semibold text-[#2D1B12] leading-relaxed transition-all duration-300 transform ${
            fadeState
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 translate-y-1'
          }`}
        >
          "{thoughts[currentIndex]}"
        </p>
      </div>
    </div>
  );
};

export default ThoughtCard;
