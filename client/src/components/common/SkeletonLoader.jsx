import React from 'react';

/**
 * SkeletonLoader component for smooth loading states across the application.
 * Adheres strictly to the light color scheme (bg-slate-200 with animate-pulse).
 *
 * @param {Object} props
 * @param {'card'|'metric'|'timetable'|'text'|'table'|'custom'} [props.type='card']
 * @param {number} [props.count=1] - Number of skeleton items to render
 * @param {number} [props.lines=3] - Number of lines for text skeleton
 * @param {string} [props.className] - Custom container classes
 */
export const SkeletonLoader = ({
  type = 'card',
  count = 1,
  lines = 3,
  className = ''
}) => {
  const items = Array.from({ length: count });

  if (type === 'metric') {
    return (
      <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}>
        {items.map((_, i) => (
          <div
            key={i}
            className="p-5 bg-white rounded-xl border border-slate-200 animate-pulse flex items-center justify-between"
          >
            <div className="space-y-2 flex-1">
              <div className="h-3 w-20 bg-slate-200 rounded"></div>
              <div className="h-6 w-28 bg-slate-200 rounded"></div>
              <div className="h-2 w-16 bg-slate-100 rounded"></div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-slate-200 shrink-0"></div>
          </div>
        ))}
      </div>
    );
  }

  if (type === 'timetable') {
    return (
      <div className={`space-y-4 bg-white p-6 rounded-xl border border-slate-200 animate-pulse ${className}`}>
        <div className="flex justify-between items-center mb-6">
          <div className="h-5 w-40 bg-slate-200 rounded"></div>
          <div className="flex gap-2">
            <div className="h-8 w-20 bg-slate-200 rounded-lg"></div>
            <div className="h-8 w-24 bg-slate-200 rounded-lg"></div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
          {Array.from({ length: 7 }).map((_, dayIdx) => (
            <div key={dayIdx} className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
              <div className="h-4 w-16 bg-slate-200 rounded mx-auto"></div>
              <div className="h-20 bg-white rounded-lg border border-slate-200 p-2 space-y-2">
                <div className="h-3 w-full bg-slate-200 rounded"></div>
                <div className="h-2 w-2/3 bg-slate-100 rounded"></div>
              </div>
              <div className="h-16 bg-white rounded-lg border border-slate-200 p-2 space-y-2">
                <div className="h-3 w-4/5 bg-slate-200 rounded"></div>
                <div className="h-2 w-1/2 bg-slate-100 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (type === 'table') {
    return (
      <div className={`bg-white rounded-xl border border-slate-200 overflow-hidden animate-pulse ${className}`}>
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex gap-4">
          <div className="h-4 w-1/4 bg-slate-200 rounded"></div>
          <div className="h-4 w-1/4 bg-slate-200 rounded"></div>
          <div className="h-4 w-1/4 bg-slate-200 rounded"></div>
          <div className="h-4 w-1/4 bg-slate-200 rounded"></div>
        </div>
        <div className="divide-y divide-slate-100 p-4 space-y-4">
          {items.map((_, i) => (
            <div key={i} className="flex gap-4 pt-3 first:pt-0">
              <div className="h-4 w-1/4 bg-slate-200 rounded"></div>
              <div className="h-4 w-1/4 bg-slate-100 rounded"></div>
              <div className="h-4 w-1/4 bg-slate-200 rounded"></div>
              <div className="h-4 w-1/4 bg-slate-100 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (type === 'text') {
    return (
      <div className={`space-y-2.5 animate-pulse ${className}`}>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={`h-3 bg-slate-200 rounded ${i === lines - 1 ? 'w-3/5' : 'w-full'}`}
          ></div>
        ))}
      </div>
    );
  }

  // Default 'card' skeleton
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 ${className}`}>
      {items.map((_, i) => (
        <div
          key={i}
          className="p-5 bg-white rounded-xl border border-slate-200 shadow-sm space-y-4 animate-pulse"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-slate-200 shrink-0"></div>
            <div className="flex-1 space-y-1.5">
              <div className="h-4 w-3/4 bg-slate-200 rounded"></div>
              <div className="h-3 w-1/2 bg-slate-100 rounded"></div>
            </div>
          </div>
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <div className="h-3 w-full bg-slate-200 rounded"></div>
            <div className="h-3 w-5/6 bg-slate-100 rounded"></div>
          </div>
          <div className="flex justify-between items-center pt-2">
            <div className="h-6 w-16 bg-slate-200 rounded-full"></div>
            <div className="h-8 w-24 bg-slate-200 rounded-lg"></div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default SkeletonLoader;
