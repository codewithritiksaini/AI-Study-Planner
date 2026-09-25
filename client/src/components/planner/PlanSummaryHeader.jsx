import React from 'react';
import { Clock, CheckCircle2, AlertCircle, BookOpen, Activity } from 'lucide-react';

/**
 * PlanSummaryHeader
 * Light-themed daily statistics widget showing total planned hours,
 * completed hours, remaining hours, and available daily budget with adaptive capacity indicator.
 */
export const PlanSummaryHeader = ({
  totalPlannedMinutes = 0,
  completedMinutes = 0,
  pendingMinutes = 0,
  availableMinutes = 120,
  isCapacityAdjusted = false,
  observedAverage = null
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

  const capacityUtilizationPercent = availableMinutes > 0
    ? Math.min(100, Math.round((totalPlannedMinutes / availableMinutes) * 100))
    : 0;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 divide-y md:divide-y-0 md:divide-x divide-slate-100">
        {/* Effective Daily Capacity */}
        <div className="flex items-center gap-3.5 pt-2 md:pt-0">
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5 text-slate-700" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <p className="text-xs font-medium text-slate-500">Daily Capacity</p>
              {isCapacityAdjusted && (
                <span title={`Adjusted from recent study pace (${observedAverage}m/day)`} className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                  <Activity className="w-2.5 h-2.5" /> Pace-calibrated
                </span>
              )}
            </div>
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

      {/* Progress Bars */}
      {totalPlannedMinutes > 0 && (
        <div className="mt-4 pt-4 border-t border-slate-100 space-y-3">
          <div>
            <div className="flex justify-between items-center text-xs text-slate-600 mb-1.5 font-medium">
              <span>Daily Completion</span>
              <span className="font-semibold text-slate-900">{progressPercent}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlanSummaryHeader;
