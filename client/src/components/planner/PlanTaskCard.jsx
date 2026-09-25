import React from 'react';
import { Clock, CheckCircle2, Play, SkipForward, AlertCircle } from 'lucide-react';
import Badge from '../common/Badge.jsx';
import Button from '../common/Button.jsx';

/**
 * PlanTaskCard
 * Clean, high-contrast light theme card representing a planned study block.
 * Shows subject, topic, time slot, planned minutes, priority score, explainable reason,
 * status badge, and action triggers.
 */
export const PlanTaskCard = ({
  plan,
  onStart,
  onComplete,
  onSkip,
  isProcessing = false
}) => {
  const {
    id,
    start_time,
    end_time,
    planned_minutes,
    priority_score,
    reason,
    status,
    subjects,
    topics
  } = plan;

  const subjectName = subjects?.name || 'Subject';
  const subjectColor = subjects?.color || '#4f46e5';
  const topicName = topics?.name || 'Study Topic';

  // Format time strings (e.g. 18:00 - 19:00)
  const formatTimeSlot = () => {
    if (!start_time || !end_time) return `${planned_minutes} mins`;
    const start = new Date(start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const end = new Date(end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return `${start} - ${end}`;
  };

  // Determine priority badge styling
  const scoreNum = Number(priority_score) || 0;
  const getPriorityBadge = () => {
    if (scoreNum >= 0.70) {
      return <Badge variant="danger" size="sm">High Priority ({(scoreNum * 100).toFixed(0)}%)</Badge>;
    }
    if (scoreNum >= 0.40) {
      return <Badge variant="warning" size="sm">Medium Priority ({(scoreNum * 100).toFixed(0)}%)</Badge>;
    }
    return <Badge variant="neutral" size="sm">Standard Priority ({(scoreNum * 100).toFixed(0)}%)</Badge>;
  };

  // Status badge
  const getStatusBadge = () => {
    switch (status) {
      case 'COMPLETED':
        return <Badge variant="success" size="sm">Completed</Badge>;
      case 'IN_PROGRESS':
        return <Badge variant="primary" size="sm">In Progress</Badge>;
      case 'SKIPPED':
        return <Badge variant="neutral" size="sm">Skipped</Badge>;
      case 'MISSED':
        return <Badge variant="danger" size="sm">Missed</Badge>;
      case 'PENDING':
      default:
        return <Badge variant="neutral" size="sm">Pending</Badge>;
    }
  };

  const isCompleted = status === 'COMPLETED';
  const isInProgress = status === 'IN_PROGRESS';
  const isSkipped = status === 'SKIPPED';

  return (
    <div className={`p-5 rounded-xl border transition-all ${
      isCompleted
        ? 'bg-slate-50/70 border-slate-200 opacity-80'
        : isInProgress
        ? 'bg-indigo-50/40 border-indigo-200 shadow-sm'
        : 'bg-white border-slate-200 shadow-sm hover:border-slate-300'
    }`}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left Column: Subject, Topic & Details */}
        <div className="flex items-start gap-3.5 flex-1 min-w-0">
          {/* Color Indicator */}
          <div
            className="w-2.5 h-12 rounded-full shrink-0 mt-0.5"
            style={{ backgroundColor: subjectColor }}
          />

          <div className="flex-1 min-w-0">
            {/* Subject name & Badges */}
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                {subjectName}
              </span>
              {getPriorityBadge()}
              {getStatusBadge()}
            </div>

            {/* Topic Title */}
            <h4 className="text-base font-semibold text-slate-900 truncate">
              {topicName}
            </h4>

            {/* Scheduled Time & Duration */}
            <div className="flex items-center gap-3 mt-1 text-xs text-slate-600 font-medium">
              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                {formatTimeSlot()}
              </span>
              <span>{planned_minutes} mins planned</span>
            </div>

            {/* Explainable Deterministic Reason */}
            {reason && (
              <p className="text-xs text-slate-500 mt-2 italic bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100">
                💡 {reason}
              </p>
            )}
          </div>
        </div>

        {/* Right Column: Actions */}
        <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
          {status === 'PENDING' && (
            <>
              <Button
                variant="primary"
                size="sm"
                icon={Play}
                onClick={() => onStart(plan)}
                disabled={isProcessing}
              >
                Start Study
              </Button>
              <Button
                variant="outline"
                size="sm"
                icon={CheckCircle2}
                onClick={() => onComplete(id)}
                disabled={isProcessing}
              >
                Complete
              </Button>
              <Button
                variant="ghost"
                size="sm"
                icon={SkipForward}
                onClick={() => onSkip(id)}
                disabled={isProcessing}
              >
                Skip
              </Button>
            </>
          )}

          {status === 'IN_PROGRESS' && (
            <>
              <Button
                variant="primary"
                size="sm"
                icon={Play}
                onClick={() => onStart(plan)}
                disabled={isProcessing}
              >
                Resume
              </Button>
              <Button
                variant="outline"
                size="sm"
                icon={CheckCircle2}
                onClick={() => onComplete(id)}
                disabled={isProcessing}
              >
                Finish
              </Button>
            </>
          )}

          {isCompleted && (
            <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Done
            </span>
          )}

          {isSkipped && (
            <span className="text-xs font-medium text-slate-400 italic">
              Task Skipped
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlanTaskCard;
