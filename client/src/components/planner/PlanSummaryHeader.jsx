import React from 'react';
import { Clock, CheckCircle2, AlertCircle, BookOpen } from 'lucide-react';

/**
 * PlanSummaryHeader
 * Light-themed daily statistics widget showing total planned hours,
 * completed hours, remaining hours, and available daily budget.
 */
export const PlanSummaryHeader = ({
  totalPlannedMinutes = 0,
  completedMinutes = 0,
  pendingMinutes = 0,
  availableMinutes = 180
}) => {
  const formatHours = (mins) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h === 0) return `${m}m`;
    if (m === 0) return `${h}h`;
    return `${h}h ${m}m`;
  };

  const progressPercent = totalPlannedMinutes > 0
    ? Math.min(100, Math.round((completedMinutes / totalPlannedMinutes) * 100))
    : 0;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 divide-y md:divide-y-0 md:divide-x divide-slate-100">
        {/* Available Capacity */}
        <div className="flex items-center gap-3.5 pt-2 md:pt-0">
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5 text-slate-700" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Available Today</p>
            <p className="text-lg font-bold text-slate-900">{formatHours(availableMinutes)}</p>
          </div>
        </div>

        {/* Planned Duration */}
        <div className="flex items-center gap-3.5 pt-2 md:pt-0 md:pl-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
            <BookOpen className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Planned Duration</p>
            <p className="text-lg font-bold text-indigo-900">{formatHours(totalPlannedMinutes)}</p>
          </div>
        </div>

        {/* Completed Duration */}
        <div className="flex items-center gap-3.5 pt-2 md:pt-0 md:pl-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Completed</p>
            <p className="text-lg font-bold text-emerald-700">{formatHours(completedMinutes)}</p>
          </div>
        </div>

        {/* Remaining Duration */}
        <div className="flex items-center gap-3.5 pt-2 md:pt-0 md:pl-4">
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
            <AlertCircle className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Remaining</p>
            <p className="text-lg font-bold text-amber-700">{formatHours(pendingMinutes)}</p>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      {totalPlannedMinutes > 0 && (
        <div className="mt-4 pt-4 border-t border-slate-100">
          <div className="flex justify-between items-center text-xs text-slate-600 mb-1.5 font-medium">
            <span>Daily Schedule Completion</span>
            <span>{progressPercent}%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default PlanSummaryHeader;
