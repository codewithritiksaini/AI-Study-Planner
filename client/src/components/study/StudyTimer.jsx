import React, { useState, useEffect } from 'react';

export const StudyTimer = ({ startedAt, isActive = true, className = '' }) => {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    if (!startedAt) {
      setElapsedSeconds(0);
      return;
    }

    const startTimestamp = new Date(startedAt).getTime();

    // Immediate calculation to avoid initial delay
    const updateElapsed = () => {
      const now = Date.now();
      const diffSecs = Math.max(0, Math.floor((now - startTimestamp) / 1000));
      setElapsedSeconds(diffSecs);
    };

    updateElapsed();

    if (!isActive) return;

    // Periodic tick: time is always calculated from the absolute timestamp
    const interval = setInterval(updateElapsed, 500);

    return () => clearInterval(interval);
  }, [startedAt, isActive]);

  const hours = Math.floor(elapsedSeconds / 3600);
  const minutes = Math.floor((elapsedSeconds % 3600) / 60);
  const seconds = elapsedSeconds % 60;

  const pad = (num) => String(num).padStart(2, '0');

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      {/* Live Session Status Pill */}
      {isActive && (
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-700 text-xs font-semibold mb-3 shadow-xs">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          Live Focus Session
        </div>
      )}

      {/* Monospace Digits Display */}
      <div className="font-mono text-5xl sm:text-6xl font-extrabold text-slate-900 tracking-wider tabular-nums select-none flex items-center justify-center">
        {hours > 0 && (
          <>
            <span>{pad(hours)}</span>
            <span className="text-slate-300 mx-1">:</span>
          </>
        )}
        <span>{pad(minutes)}</span>
        <span className="text-slate-300 mx-1">:</span>
        <span>{pad(seconds)}</span>
      </div>

      <div className="flex gap-12 mt-2 text-[11px] font-bold uppercase tracking-widest text-slate-400">
        {hours > 0 && <span>Hours</span>}
        <span>Minutes</span>
        <span>Seconds</span>
      </div>
    </div>
  );
};

export default StudyTimer;
