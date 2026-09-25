import React from 'react';
import { Calendar } from 'lucide-react';

/**
 * AnalyticsRangeSelector
 * Light-theme segmented control for toggling between 7, 14, 30, and 90 day lookback ranges.
 */
export const AnalyticsRangeSelector = ({ days = 30, onDaysChange, disabled = false }) => {
  const options = [
    { value: 7, label: '7 Days' },
    { value: 14, label: '14 Days' },
    { value: 30, label: '30 Days' },
    { value: 90, label: '90 Days' }
  ];

  return (
    <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 border border-slate-200">
      <div className="px-2.5 py-1 flex items-center gap-1.5 text-xs font-semibold text-slate-500">
        <Calendar className="w-3.5 h-3.5 text-indigo-600" />
        <span className="hidden sm:inline">Time Range:</span>
      </div>
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          disabled={disabled}
          onClick={() => onDaysChange(opt.value)}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            days === opt.value
              ? 'bg-white text-indigo-700 shadow-xs border border-slate-200/80'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
};

export default AnalyticsRangeSelector;
