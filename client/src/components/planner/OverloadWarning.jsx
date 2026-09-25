import React from 'react';
import { AlertTriangle, Clock, ArrowUpRight, CheckCircle2 } from 'lucide-react';

/**
 * OverloadWarning
 * Displays transparent capacity shortfall alert when workload exceeds available time windows.
 */
export const OverloadWarning = ({ overloadInfo }) => {
  if (!overloadInfo || !overloadInfo.is_overloaded) {
    return null;
  }

  const {
    required_minutes = 0,
    available_minutes = 0,
    shortfall_minutes = 0,
    unscheduled_count = 0,
    actionable_suggestions = []
  } = overloadInfo;

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="rounded-lg bg-amber-100 p-2 text-amber-700">
          <AlertTriangle className="h-5 w-5 shrink-0" />
        </div>
        <div className="flex-1 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h4 className="text-sm font-bold text-amber-900">
              Study Workload Exceeds Available Capacity
            </h4>
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-200/80 px-2.5 py-0.5 text-xs font-semibold text-amber-900">
              <Clock className="h-3.5 w-3.5" />
              {shortfall_minutes}m Shortfall
            </span>
          </div>

          <p className="text-xs text-amber-800 leading-relaxed">
            Your high-priority exam revisions and pending tasks require{' '}
            <strong className="font-bold">{required_minutes} minutes</strong>, but you only have{' '}
            <strong className="font-bold">{available_minutes} minutes</strong> of available study window this period.
            {unscheduled_count > 0 && ` ${unscheduled_count} task(s) could not be scheduled.`}
          </p>

          {/* Actionable Suggestions */}
          {actionable_suggestions && actionable_suggestions.length > 0 && (
            <div className="mt-2.5 pt-2 border-t border-amber-200/70">
              <p className="text-xs font-bold text-amber-900 mb-1.5 flex items-center gap-1.5">
                <ArrowUpRight className="h-3.5 w-3.5 text-amber-700" />
                Recommended Next Steps:
              </p>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs text-amber-800">
                {actionable_suggestions.map((sug, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-amber-600 mt-0.5 shrink-0" />
                    <span>{sug}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OverloadWarning;
