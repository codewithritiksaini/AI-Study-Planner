import React from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import Button from '../common/Button.jsx';

/**
 * DaySelector
 * Light-theme navigation bar for stepping across days or jumping directly to "Today".
 */
export const DaySelector = ({ selectedDate, onDateChange, viewMode, onViewModeChange }) => {
  const currentDateObj = new Date(selectedDate + 'T00:00:00');

  const handlePrevDay = () => {
    const prev = new Date(currentDateObj);
    prev.setDate(prev.getDate() - 1);
    onDateChange(prev.toISOString().split('T')[0]);
  };

  const handleNextDay = () => {
    const next = new Date(currentDateObj);
    next.setDate(next.getDate() + 1);
    onDateChange(next.toISOString().split('T')[0]);
  };

  const handleToday = () => {
    const today = new Date().toISOString().split('T')[0];
    onDateChange(today);
  };

  const formattedDate = currentDateObj.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  const isToday = selectedDate === new Date().toISOString().split('T')[0];

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
      {/* Date Navigation */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          icon={ChevronLeft}
          onClick={handlePrevDay}
          title="Previous Day"
        />
        <Button
          variant="outline"
          size="sm"
          icon={ChevronRight}
          onClick={handleNextDay}
          title="Next Day"
        />
        <div className="flex items-center gap-2 ml-2">
          <CalendarIcon className="w-4 h-4 text-indigo-600 shrink-0" />
          <span className="text-sm font-semibold text-slate-900">{formattedDate}</span>
          {isToday && (
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
              Today
            </span>
          )}
        </div>
      </div>

      {/* Controls: Jump to Today & View Mode Toggle */}
      <div className="flex items-center gap-2 self-end sm:self-center">
        {!isToday && (
          <Button variant="ghost" size="sm" onClick={handleToday}>
            Jump to Today
          </Button>
        )}

        <div className="flex items-center rounded-lg bg-slate-100 p-0.5 border border-slate-200">
          <button
            type="button"
            onClick={() => onViewModeChange('daily')}
            className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
              viewMode === 'daily'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Daily View
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange('weekly')}
            className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
              viewMode === 'weekly'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Weekly View
          </button>
        </div>
      </div>
    </div>
  );
};

export default DaySelector;
