import React, { useState } from 'react';
import {
  Clock,
  Lock,
  Unlock,
  Play,
  CheckCircle,
  XCircle,
  RotateCcw,
  Trash2,
  HelpCircle,
  BookOpen,
  ChevronDown,
  ChevronUp,
  AlertCircle
} from 'lucide-react';

/**
 * PlannerSessionCard
 * Interactive card representing a single study session with time window,
 * lock state toggle, status transitions, explanation dropdown, and direct study room launch.
 */
export const PlannerSessionCard = ({
  session,
  onStart,
  onComplete,
  onSkip,
  onToggleLock,
  onReschedule,
  onDelete,
  isProcessing = false
}) => {
  const [showExplanation, setShowExplanation] = useState(false);

  // Time format helper (HH:MM)
  const formatTime = (isoString) => {
    if (!isoString) return '--:--';
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    } catch {
      return isoString;
    }
  };

  const startTime = session.start_time ? formatTime(session.start_time) : '--:--';
  const endTime = session.end_time ? formatTime(session.end_time) : '--:--';
  const duration = session.planned_minutes || 0;

  const isLocked = Boolean(session.is_locked);
  const isCompleted = session.status === 'COMPLETED';
  const isMissed = session.status === 'MISSED';
  const isInProgress = session.status === 'IN_PROGRESS';
  const isSkipped = session.status === 'SKIPPED';
  const isPending = session.status === 'PENDING';

  // Status badge config
  const statusConfig = {
    PENDING: { label: 'Scheduled', bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200' },
    IN_PROGRESS: { label: 'In Progress', bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-200' },
    COMPLETED: { label: 'Completed', bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-200' },
    MISSED: { label: 'Missed', bg: 'bg-rose-100', text: 'text-rose-800', border: 'border-rose-200' },
    SKIPPED: { label: 'Skipped', bg: 'bg-slate-100', text: 'text-slate-500', border: 'border-slate-200' }
  }[session.status] || { label: session.status, bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200' };

  const subjectName = session.subject_name || 'General Study';
  const subjectColor = session.subject_color || '#4f46e5';
  const topicName = session.topic_name || session.custom_title || 'Study Session';

  return (
    <div
      className={`rounded-xl border transition-all ${
        isCompleted
          ? 'bg-slate-50/70 border-slate-200 opacity-80'
          : isMissed
          ? 'bg-rose-50/30 border-rose-200'
          : isInProgress
          ? 'bg-indigo-50/20 border-indigo-300 ring-1 ring-indigo-200'
          : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
      }`}
    >
      <div className="p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Left: Time & Subject Info */}
          <div className="flex items-start gap-3.5">
            {/* Time Slot Badge */}
            <div className="flex flex-col items-center justify-center rounded-lg bg-slate-50 border border-slate-200 px-3 py-2 shrink-0 min-w-[76px] text-center">
              <span className="text-xs font-bold text-slate-800">{startTime}</span>
              <span className="text-[10px] text-slate-400 font-medium">to {endTime}</span>
              <span className="mt-1 inline-flex items-center gap-0.5 text-[10px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.2 rounded">
                <Clock className="w-2.5 h-2.5" />
                {duration}m
              </span>
            </div>

            {/* Subject & Topic Details */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className="inline-flex items-center gap-1.5 text-xs font-bold px-2 py-0.5 rounded-full text-white"
                  style={{ backgroundColor: subjectColor }}
                >
                  <BookOpen className="w-3 h-3" />
                  {subjectName}
                </span>

                <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold border ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}>
                  {statusConfig.label}
                </span>

                {session.task_source === 'RECOMMENDATION' && (
                  <span className="text-[10px] font-semibold bg-violet-50 text-violet-700 border border-violet-200 px-1.5 py-0.5 rounded">
                    Smart Rec
                  </span>
                )}
                {session.task_source === 'MANUAL' && (
                  <span className="text-[10px] font-semibold bg-sky-50 text-sky-700 border border-sky-200 px-1.5 py-0.5 rounded">
                    Manual
                  </span>
                )}
              </div>

              <h4 className="text-sm font-bold text-slate-900 leading-snug">
                {topicName}
              </h4>

              {session.reason && (
                <p className="text-xs text-slate-500 line-clamp-1">
                  {session.reason}
                </p>
              )}
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-1.5 self-end sm:self-center flex-wrap">
            {/* Lock / Unlock Toggle Button */}
            <button
              onClick={() => onToggleLock && onToggleLock(session.id)}
              disabled={isProcessing}
              title={isLocked ? 'Session locked against auto-rescheduling (Click to unlock)' : 'Click to lock session at this time'}
              className={`p-1.5 rounded-lg border text-xs font-medium transition-colors ${
                isLocked
                  ? 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100'
                  : 'bg-slate-50 border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-100'
              }`}
            >
              {isLocked ? <Lock className="w-4 h-4 text-amber-600" /> : <Unlock className="w-4 h-4" />}
            </button>

            {/* Why Scheduled Explanation Toggle */}
            <button
              onClick={() => setShowExplanation(!showExplanation)}
              title="View why this session was scheduled"
              className={`p-1.5 rounded-lg border text-xs font-medium transition-colors ${
                showExplanation
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                  : 'bg-slate-50 border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-100'
              }`}
            >
              <HelpCircle className="w-4 h-4" />
            </button>

            {/* Action buttons depending on state */}
            {isMissed && (
              <button
                onClick={() => onReschedule && onReschedule(session.id)}
                disabled={isProcessing}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 shadow-sm transition-all"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reschedule
              </button>
            )}

            {(isPending || isInProgress) && (
              <>
                <button
                  onClick={() => onStart && onStart(session)}
                  disabled={isProcessing}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 shadow-sm transition-all"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  Study
                </button>

                <button
                  onClick={() => onComplete && onComplete(session.id)}
                  disabled={isProcessing}
                  title="Mark Completed"
                  className="p-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 text-xs font-medium transition-colors"
                >
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                </button>

                <button
                  onClick={() => onSkip && onSkip(session.id)}
                  disabled={isProcessing}
                  title="Skip Task"
                  className="p-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-500 hover:bg-slate-100 text-xs font-medium transition-colors"
                >
                  <XCircle className="w-4 h-4" />
                </button>
              </>
            )}

            {/* Delete button (if manual or not completed) */}
            {!isCompleted && onDelete && (
              <button
                onClick={() => onDelete(session.id)}
                disabled={isProcessing}
                title="Remove Session"
                className="p-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200 text-xs font-medium transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Expandable Explanation Drawer */}
        {showExplanation && (
          <div className="mt-3 pt-3 border-t border-slate-100 bg-slate-50/50 rounded-lg p-3 text-xs text-slate-700 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-indigo-600" />
                Scheduling Factors:
              </span>
              <button
                onClick={() => setShowExplanation(false)}
                className="text-[11px] text-slate-400 hover:text-slate-600"
              >
                Close
              </button>
            </div>
            <ul className="space-y-1 text-slate-600">
              <li className="flex items-start gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                <span>
                  <strong>Time Window:</strong> Allocated {startTime} – {endTime} ({duration} mins) based on your configured availability window.
                </span>
              </li>
              {session.reason && (
                <li className="flex items-start gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                  <span>
                    <strong>Academic Rationale:</strong> {session.reason}
                  </span>
                </li>
              )}
              {isLocked && (
                <li className="flex items-start gap-1.5 text-amber-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                  <span>
                    <strong>Locked:</strong> This session will remain untouched during automated schedule regenerations.
                  </span>
                </li>
              )}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default PlannerSessionCard;
