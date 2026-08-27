import React, { useState, useEffect, useRef } from 'react';

/**
 * AnimatedCounter component
 * Smoothly animates numbers from 0 to target value using requestAnimationFrame.
 * Features:
 * - Ease-out easing curve for natural deceleration
 * - Faster animation for smaller integers
 * - Prevents re-animation on unrelated parent re-renders
 * - Full prefers-reduced-motion accessibility support
 */
export default function AnimatedCounter({
  value = 0,
  duration = 1000,
  suffix = '',
  prefix = '',
  className = '',
}) {
  const [displayValue, setDisplayValue] = useState(0);
  const targetNum = typeof value === 'number' && !isNaN(value) ? value : Number(value) || 0;
  const prevTargetRef = useRef(null);
  const frameRef = useRef(null);

  useEffect(() => {
    // Respect prefers-reduced-motion immediately
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      setDisplayValue(targetNum);
      prevTargetRef.current = targetNum;
      return;
    }

    // If target value hasn't changed, don't restart animation
    if (prevTargetRef.current === targetNum) {
      return;
    }
    prevTargetRef.current = targetNum;

    if (targetNum === 0) {
      setDisplayValue(0);
      return;
    }

    const startVal = 0;
    const startTime = performance.now();
    // Faster animation for smaller numbers (e.g. 1-10)
    const effectiveDuration = targetNum <= 10 ? Math.min(650, duration) : duration;

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / effectiveDuration, 1);

      // Smooth ease-out cubic curve
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(startVal + (targetNum - startVal) * easeOut);

      setDisplayValue(current);

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      } else {
        setDisplayValue(targetNum);
      }
    };

    frameRef.current = requestAnimationFrame(animate);

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [targetNum, duration]);

  return (
    <span className={className}>
      {prefix}
      {displayValue}
      {suffix}
    </span>
  );
}
